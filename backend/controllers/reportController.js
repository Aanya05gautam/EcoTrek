import crypto from "crypto";
import Report from "../models/Report.js";
import User from "../models/User.js";
import { memoryStore } from "../services/store.js";
import { classifyImage } from "../services/mlService.js";

const mongo = () => Report.db?.readyState === 1;

// ============================================================
// CONFIG
// ============================================================

const HOTSPOT_RADIUS_KM = 0.5;
const MIN_HOTSPOT_REPORTS = 3;

const severityWeight = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

const quantityWeight = {
  Low: 1,
  Medium: 2,
  High: 3,
};

// ============================================================
// PRIORITY
// ============================================================

function calculatePriority({
  quantity,
  severity,
  reportCount = 1,
}) {
  const score =
    (severityWeight[severity] || 1) * 2 +
    (quantityWeight[quantity] || 1) +
    Math.min(reportCount, 5);

  if (score >= 12) return "Critical";
  if (score >= 9) return "High";
  if (score >= 6) return "Medium";

  return "Low";
}

// ============================================================
// DISTANCE
// ============================================================

function distanceKm(first, second) {
  const earthRadiusKm = 6371;

  const latDelta =
    ((second[1] - first[1]) * Math.PI) / 180;

  const lngDelta =
    ((second[0] - first[0]) * Math.PI) / 180;

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos((first[1] * Math.PI) / 180) *
      Math.cos((second[1] * Math.PI) / 180) *
      Math.sin(lngDelta / 2) ** 2;

  return (
    2 *
    earthRadiusKm *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    )
  );
}

// ============================================================
// CREATE REPORT
// ============================================================

export async function createReport(req, res) {
  try {
    const {
      title,
      description,
      aiCategory = "Unknown",
      aiConfidence = 0,
      address,
      lat,
      lng,
      reportType = "Outdoor/Public",
      quantity = "Medium",
      density = "Medium",
      hazard = "None",
      severity = "Medium",
    } = req.body;

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        message:
          "Valid latitude and longitude are required.",
      });
    }

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : "";

    let aiResult = {
      category: aiCategory,
      confidence:
        Number(aiConfidence) || 0,
    };

    if (req.file) {
      try {
        aiResult = await classifyImage(
          req.file.path,
          req.file.originalname,
          req.file.mimetype,
        );
      } catch (error) {
        console.error(
          "Image classification failed:",
          error,
        );
      }
    }

    const data = {
      reporter: req.user?.id || null,

      title:
        title ||
        `${aiResult.category || "Waste"} hotspot`,

      description:
        description ||
        aiResult.guidance ||
        "Waste report submitted through EcoTrek.",

      imageUrl,

      aiCategory:
        aiResult.category || aiCategory,

      aiConfidence:
        Number(
          aiResult.confidence ??
            aiConfidence,
        ) || 0,

      reportType,
      quantity,
      density,
      hazard,
      severity,

      priority: calculatePriority({
        quantity,
        severity,
      }),

      address,

      location: {
        type: "Point",
        coordinates: [
          longitude,
          latitude,
        ],
      },

      status: "Pending",
    };

    // ========================================================
    // MONGODB
    // ========================================================

    if (mongo()) {
      const report = await Report.create(data);

      if (req.user?.id) {
        await User.findByIdAndUpdate(
          req.user.id,
          {
            $inc: {
              ecoPoints: 10,
            },
          },
        );
      }

      return res.status(201).json(report);
    }

    // ========================================================
    // MEMORY STORE
    // ========================================================

    const report = {
      ...data,
      id: crypto.randomUUID(),
      createdAt:
        new Date().toISOString(),
    };

    memoryStore.reports.push(report);

    const user =
      req.user &&
      memoryStore.users.find(
        (item) =>
          item.id === req.user.id,
      );

    if (user) {
      user.ecoPoints += 10;
    }

    return res.status(201).json(report);
  } catch (error) {
    console.error(
      "Create report error:",
      error,
    );

    return res.status(500).json({
      message:
        error.message ||
        "Failed to create report.",
    });
  }
}

// ============================================================
// HOTSPOT GENERATION
// ============================================================

async function getHotspots(
  radiusKm = HOTSPOT_RADIUS_KM,
) {
  const reports = mongo()
    ? await Report.find({
        status: {
          $ne: "Resolved",
        },
        reportType: "Outdoor/Public",
      }).lean()
    : memoryStore.reports.filter(
        (report) =>
          report.status !==
            "Resolved" &&
          report.reportType ===
            "Outdoor/Public",
      );

  const validReports = reports.filter(
    (report) => {
      const coordinates =
        report.location?.coordinates;

      return (
        Array.isArray(coordinates) &&
        coordinates.length >= 2 &&
        Number.isFinite(
          Number(coordinates[0]),
        ) &&
        Number.isFinite(
          Number(coordinates[1]),
        )
      );
    },
  );

  const clusters = [];

  // ==========================================================
  // BUILD CLUSTERS
  // ==========================================================

  for (const report of validReports) {
    const coordinates = [
      Number(
        report.location
          .coordinates[0],
      ),
      Number(
        report.location
          .coordinates[1],
      ),
    ];

    let nearestCluster = null;
    let nearestDistance = Infinity;

    for (const cluster of clusters) {
      const distance = distanceKm(
        cluster.center,
        coordinates,
      );

      if (
        distance <= radiusKm &&
        distance < nearestDistance
      ) {
        nearestCluster = cluster;
        nearestDistance = distance;
      }
    }

    if (!nearestCluster) {
      nearestCluster = {
        center: coordinates,
        reports: [],
      };

      clusters.push(nearestCluster);
    }

    nearestCluster.reports.push(
      report,
    );

    // Recalculate cluster center
    const total =
      nearestCluster.reports.length;

    nearestCluster.center = [
      nearestCluster.reports.reduce(
        (sum, item) =>
          sum +
          Number(
            item.location
              .coordinates[0],
          ),
        0,
      ) / total,

      nearestCluster.reports.reduce(
        (sum, item) =>
          sum +
          Number(
            item.location
              .coordinates[1],
          ),
        0,
      ) / total,
    ];
  }

  // ==========================================================
  // ONLY 4+ REPORTS = HOTSPOT
  // ==========================================================

  const hotspots = clusters
    .filter(
      (cluster) =>
        cluster.reports.length >=
        MIN_HOTSPOT_REPORTS,
    )
    .map((cluster) => {
      const highestSeverity =
        cluster.reports.reduce(
          (highest, report) =>
            (severityWeight[
              report.severity
            ] || 1) >
            (severityWeight[
              highest
            ] || 1)
              ? report.severity
              : highest,
          "Low",
        );

      const highestQuantity =
        cluster.reports.reduce(
          (highest, report) =>
            (quantityWeight[
              report.quantity
            ] || 1) >
            (quantityWeight[
              highest
            ] || 1)
              ? report.quantity
              : highest,
          "Low",
        );

      const reportCount =
        cluster.reports.length;

      return {
        center: {
          lat:
            cluster.center[1],
          lng:
            cluster.center[0],
        },

        reportCount,

        priority:
          calculatePriority({
            quantity:
              highestQuantity,
            severity:
              highestSeverity,
            reportCount,
          }),

        severity:
          highestSeverity,

        quantity:
          highestQuantity,

        reports:
          cluster.reports,
      };
    });

  return hotspots.sort(
    (first, second) =>
      (severityWeight[
        second.priority
      ] || 0) -
      (severityWeight[
        first.priority
      ] || 0),
  );
}

// ============================================================
// LIST HOTSPOTS
// ============================================================

export async function listHotspots(
  req,
  res,
) {
  try {
    const radiusKm = Math.max(
      0.05,
      Math.min(
        Number(
          req.query.radiusKm,
        ) ||
          HOTSPOT_RADIUS_KM,
        10,
      ),
    );

    const hotspots =
      await getHotspots(
        radiusKm,
      );

    return res.json(
      hotspots,
    );
  } catch (error) {
    console.error(
      "Hotspot error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to generate hotspots.",
    });
  }
}

// ============================================================
// ROUTE PLANNING
// ============================================================

export async function planRoute(
  req,
  res,
) {
  const depot = [
    Number(req.query.lng),
    Number(req.query.lat),
  ];

  if (
    !Number.isFinite(depot[0]) ||
    !Number.isFinite(depot[1])
  ) {
    return res.status(400).json({
      message:
        "Provide valid depot lat and lng query parameters.",
    });
  }

  const capacity = Math.max(
    1,
    Math.min(
      Number(
        req.query.capacity,
      ) || 20,
      1000,
    ),
  );

  const radiusKm = Math.max(
    0.05,
    Math.min(
      Number(
        req.query.radiusKm,
      ) || HOTSPOT_RADIUS_KM,
      10,
    ),
  );

  const priorityWeight = {
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4,
  };

  const remaining =
    (
      await getHotspots(
        radiusKm,
      )
    ).map((hotspot) => ({
      ...hotspot,

      distanceFromCurrent:
        distanceKm(
          depot,
          [
            hotspot.center
              .lng,
            hotspot.center
              .lat,
          ],
        ),
    }));

  const stops = [];

  let current = depot;
  let capacityUsed = 0;

  while (remaining.length) {
    const available =
      remaining.filter(
        (hotspot) =>
          capacityUsed +
            hotspot.reportCount <=
          capacity,
      );

    if (!available.length)
      break;

    available.sort(
      (first, second) => {
        const priorityDifference =
          (priorityWeight[
            second.priority
          ] || 0) -
          (priorityWeight[
            first.priority
          ] || 0);

        return (
          priorityDifference ||
          distanceKm(
            current,
            [
              first.center
                .lng,
              first.center
                .lat,
            ],
          ) -
          distanceKm(
            current,
            [
              second.center
                .lng,
              second.center
                .lat,
            ],
          )
        );
      },
    );

    const next =
      available[0];

    const index =
      remaining.indexOf(
        next,
      );

    remaining.splice(
      index,
      1,
    );

    const stopDistance =
      distanceKm(
        current,
        [
          next.center.lng,
          next.center.lat,
        ],
      );

    stops.push({
      sequence:
        stops.length + 1,

      ...next,

      distanceFromPreviousKm:
        Number(
          stopDistance.toFixed(
            2,
          ),
        ),
    });

    capacityUsed +=
      next.reportCount;

    current = [
      next.center.lng,
      next.center.lat,
    ];
  }

  const returnDistance =
    stops.length
      ? distanceKm(
          current,
          depot,
        )
      : 0;

  return res.json({
    depot: {
      lat: depot[1],
      lng: depot[0],
    },

    capacity,

    capacityUsed,

    totalDistanceKm:
      Number(
        (
          stops.reduce(
            (sum, stop) =>
              sum +
              stop.distanceFromPreviousKm,
            0,
          ) +
          returnDistance
        ).toFixed(2),
      ),

    returnToDepotKm:
      Number(
        returnDistance.toFixed(
          2,
        ),
      ),

    unassignedHotspots:
      remaining.length,

    stops,
  });
}

// ============================================================
// LIST REPORTS
// ============================================================

export async function listReports(
  req,
  res,
) {
  const query =
    !req.user ||
    req.user.role === "Admin"
      ? {}
      : {
          reporter:
            req.user.id,
        };

  if (mongo()) {
    return res.json(
      await Report.find(
        query,
      )
        .populate(
          "reporter",
          "name email",
        )
        .sort({
          createdAt: -1,
        }),
    );
  }

  const reports =
    !req.user ||
    req.user.role === "Admin"
      ? memoryStore.reports
      : memoryStore.reports.filter(
          (report) =>
            report.reporter ===
            req.user.id,
        );

  return res.json(
    [...reports].reverse(),
  );
}

// ============================================================
// UPDATE REPORT STATUS
// ============================================================

export async function updateReport(
  req,
  res,
) {
  try {
    const { status } =
      req.body;

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Resolved",
    ];

    if (
      !allowedStatuses.includes(
        status,
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid status.",
        allowedStatuses,
      });
    }

    if (mongo()) {
      const report =
        await Report.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              status,
            },
          },
          {
            new: true,
            runValidators: true,
          },
        );

      if (!report) {
        return res.status(404).json({
          message:
            "Report not found.",
        });
      }

      return res.json(
        report,
      );
    }

    const report =
      memoryStore.reports.find(
        (item) =>
          item.id ===
          req.params.id,
      );

    if (!report) {
      return res.status(404).json({
        message:
          "Report not found.",
      });
    }

    report.status = status;

    return res.json(
      report,
    );
  } catch (error) {
    console.error(
      "Update report error:",
      error,
    );

    return res.status(500).json({
      message:
        error.message ||
        "Failed to update report.",
    });
  }
}
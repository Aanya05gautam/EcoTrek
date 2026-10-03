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

function calculatePriorityScore({
  severity,
  quantity,
  reportCount = 1,
  density = "Medium",
  hazard = "None",
  createdAt,
}) {
  const severityScore =
    (severityWeight[severity] || 1) / 4;

  const quantityScore =
    (quantityWeight[quantity] || 1) / 3;

  const reportFrequencyScore =
    Math.min(reportCount, 5) / 5;

  const densityWeight = {
    Low: 1,
    Medium: 2,
    High: 3,
  };

  const densityScore =
    (densityWeight[density] || 2) / 3;

  const hazardWeight = {
    None: 0,
    Possible: 0.5,
    Confirmed: 1,
  };

  const hazardScore =
    hazardWeight[hazard] || 0;

  // Older unresolved reports gradually receive more priority.
  const ageHours = createdAt
    ? Math.max(
        0,
        (Date.now() - new Date(createdAt).getTime()) /
          (1000 * 60 * 60)
      )
    : 0;

  const ageScore =
    Math.min(ageHours / 72, 1);

  const score =
    severityScore * 0.30 +
    quantityScore * 0.20 +
    reportFrequencyScore * 0.20 +
    ageScore * 0.15 +
    densityScore * 0.10 +
    hazardScore * 0.05;

  return Number(score.toFixed(4));
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
    const endpoint =
      reportType === "Outdoor/Public"
        ? "/predict-outdoor"
        : "/predict";

    aiResult = await classifyImage(
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      endpoint
    );
  } catch (error) {
    console.error(
      "Image classification failed:",
      error
    );
  }
}

const existingReports = mongo()
  ? await Report.find({
      reportType,
      status: { $ne: "Resolved" },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: 500,
        },
      },
    }).limit(5)
  : [];

const reportCount = existingReports.length + 1;

let calculatedDensity = density;

if (reportCount >= 5) {
  calculatedDensity = "High";
} else if (reportCount >= 3) {
  calculatedDensity = "Medium";
} else {
  calculatedDensity = "Low";
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
  reportType === "Outdoor/Public"
    ? aiResult.material || aiCategory
    : aiResult.category || aiCategory,

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

      priority: (() => {
  const score = calculatePriorityScore({
    severity,
    quantity,
    reportCount,
    density: calculatedDensity,
    hazard,
    createdAt: new Date(),
  });

  if (score >= 0.75) return "Critical";
  if (score >= 0.50) return "High";
  if (score >= 0.25) return "Medium";
  return "Low";
})(),

priorityScore: calculatePriorityScore({
  severity,
  quantity,
  reportCount,
  density: calculatedDensity,
  hazard,
  createdAt: new Date(),
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
          report.status !== "Resolved" &&
          report.reportType === "Outdoor/Public",
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
        report.location.coordinates[0],
      ),
      Number(
        report.location.coordinates[1],
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

    nearestCluster.reports.push(report);

    // Recalculate cluster center
    const total =
      nearestCluster.reports.length;

    nearestCluster.center = [
      nearestCluster.reports.reduce(
        (sum, item) =>
          sum +
          Number(
            item.location.coordinates[0],
          ),
        0,
      ) / total,

      nearestCluster.reports.reduce(
        (sum, item) =>
          sum +
          Number(
            item.location.coordinates[1],
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

      // Average priority score of reports
      const averagePriorityScore =
        cluster.reports.reduce(
          (sum, report) =>
            sum +
            (Number(
              report.priorityScore,
            ) || 0),
          0,
        ) / reportCount;

      // Total estimated quantity
      const totalQuantity =
        cluster.reports.reduce(
          (sum, report) =>
            sum +
            (quantityWeight[
              report.quantity
            ] || 1),
          0,
        );

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

        priorityScore: Number(
          averagePriorityScore.toFixed(4),
        ),

        severity:
          highestSeverity,

        quantity:
          highestQuantity,

        totalQuantity,

        reports:
          cluster.reports,
      };
    });

  return hotspots.sort(
    (first, second) =>
      (second.priorityScore || 0) -
      (first.priorityScore || 0),
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

export async function planRoute(req, res) {
  try {
    const depotLng = Number(req.query.lng);
    const depotLat = Number(req.query.lat);

    if (
      !Number.isFinite(depotLng) ||
      !Number.isFinite(depotLat)
    ) {
      return res.status(400).json({
        message:
          "Provide valid depot lat and lng query parameters.",
      });
    }

    const capacity = Math.max(
      1,
      Math.min(
        Number(req.query.capacity) || 100,
        1000
      )
    );

    const radiusKm = Math.max(
      0.05,
      Math.min(
        Number(req.query.radiusKm) ||
          HOTSPOT_RADIUS_KM,
        10
      )
    );

    // ========================================================
    // GET CURRENT UNRESOLVED OUTDOOR/PUBLIC HOTSPOTS
    // ========================================================

    const hotspots =
      await getHotspots(radiusKm);

    if (!hotspots.length) {
      return res.json({
        depot: {
          lat: depotLat,
          lng: depotLng,
        },
        capacity,
        capacityUsed: 0,
        totalDistanceKm: 0,
        returnToDepotKm: 0,
        unassignedHotspots: 0,
        stops: [],
        method: "EcoTrek-Learned",
      });
    }

    // ========================================================
    // CONVERT REPORTS INTO ML MODEL INPUT
    // ========================================================

    const reports = [];

    // Keep original report information.
    // This allows us to use the actual saved address
    // instead of guessing the location from coordinates.
    const originalReports = new Map();

    hotspots.forEach((hotspot) => {
      if (!Array.isArray(hotspot.reports)) {
        return;
      }

      hotspot.reports.forEach((report) => {
        // ----------------------------------------------------
        // IMPORTANT:
        // MongoDB GeoJSON = [longitude, latitude]
        // ----------------------------------------------------

        const lat = Number(
          report.latitude ??
          report.lat ??
          report.location?.coordinates?.[1]
        );

        const lng = Number(
          report.longitude ??
          report.lng ??
          report.location?.coordinates?.[0]
        );

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          return;
        }

        const reportId = String(
          report._id ||
          report.id ||
          `${lat}-${lng}-${reports.length}`
        );

        // ----------------------------------------------------
        // SAVE ORIGINAL REPORT INFORMATION
        // ----------------------------------------------------

        originalReports.set(
          reportId,
          {
            address:
              report.address ||
              report.locationName ||
              "",

            latitude: lat,
            longitude: lng,

            title:
              report.title || "",

            description:
              report.description || "",
          }
        );

        // ----------------------------------------------------
        // AGE
        // ----------------------------------------------------

        const createdAt =
          report.createdAt
            ? new Date(
                report.createdAt
              ).getTime()
            : Date.now();

        const ageHours = Math.max(
          0,
          (Date.now() - createdAt) /
            (1000 * 60 * 60)
        );

        // ----------------------------------------------------
        // QUANTITY → APPROXIMATE KG
        // ----------------------------------------------------

        const quantity =
          report.quantity ||
          hotspot.quantity ||
          "Medium";

        const volumeMap = {
          Low: 10,
          Medium: 20,
          High: 30,
        };

        const volumeKg =
          Number(report.volume_kg) ||
          Number(report.volumeKg) ||
          volumeMap[quantity] ||
          20;

        // ----------------------------------------------------
        // HAZARD → TOXICITY PROXY
        // ----------------------------------------------------

        const hazard =
          report.hazard ||
          hotspot.hazard ||
          "None";

        const toxicityMap = {
          None: 0,
          Possible: 0.5,
          Confirmed: 1,
        };

        // ----------------------------------------------------
        // ML REPORT
        // ----------------------------------------------------

        reports.push({
          id: reportId,

          lat,
          lng,

          severity:
            report.severity ||
            hotspot.severity ||
            "Medium",

          quantity,

          density:
            report.density ||
            hotspot.density ||
            "Medium",

          hazard,

          report_count:
            Number(report.reportCount) ||
            Number(hotspot.reportCount) ||
            1,

          age_hours: ageHours,

          volume_kg: volumeKg,

          toxicity:
            Number(report.toxicity) ||
            toxicityMap[hazard] ||
            0,

          priority_score:
            Number(report.priorityScore) ||
            Number(hotspot.priorityScore) ||
            0.5,
        });
      });
    });

    // ========================================================
    // FALLBACK: IF HOTSPOT REPORTS ARE NOT AVAILABLE
    // ========================================================

    if (!reports.length) {
      hotspots.forEach(
        (hotspot, index) => {
          if (
            !hotspot.center ||
            !Number.isFinite(
              Number(
                hotspot.center.lat
              )
            ) ||
            !Number.isFinite(
              Number(
                hotspot.center.lng
              )
            )
          ) {
            return;
          }

          const quantity =
            hotspot.quantity ||
            "Medium";

          const volumeMap = {
            Low: 10,
            Medium: 20,
            High: 30,
          };

          const hazard =
            hotspot.hazard ||
            "None";

          const toxicityMap = {
            None: 0,
            Possible: 0.5,
            Confirmed: 1,
          };

          const reportId =
            String(
              hotspot.id ||
              `hotspot-${index + 1}`
            );

          originalReports.set(
            reportId,
            {
              address:
                hotspot.address ||
                hotspot.locationName ||
                "",

              latitude:
                Number(
                  hotspot.center.lat
                ),

              longitude:
                Number(
                  hotspot.center.lng
                ),
            }
          );

          reports.push({
            id: reportId,

            lat:
              Number(
                hotspot.center.lat
              ),

            lng:
              Number(
                hotspot.center.lng
              ),

            severity:
              hotspot.severity ||
              "Medium",

            quantity,

            density:
              hotspot.density ||
              "Medium",

            hazard,

            report_count:
              Number(
                hotspot.reportCount
              ) || 1,

            age_hours: 0,

            volume_kg:
              Number(
                hotspot.totalQuantity
              ) ||
              volumeMap[quantity] ||
              20,

            toxicity:
              toxicityMap[hazard] ||
              0,

            priority_score:
              Number(
                hotspot.priorityScore
              ) || 0.5,
          });
        }
      );
    }

    if (!reports.length) {
      return res.json({
        depot: {
          lat: depotLat,
          lng: depotLng,
        },

        capacity,

        capacityUsed: 0,

        totalDistanceKm: 0,

        returnToDepotKm: 0,

        unassignedHotspots:
          hotspots.length,

        stops: [],

        method:
          "EcoTrek-Learned",
      });
    }

    // ========================================================
    // CALL TRAINED ECO-TREK ML ROUTE MODEL
    // ========================================================

    const ML_SERVICE_URL =
      process.env.ML_SERVICE_URL ||
      "http://127.0.0.1:8080";

    const mlResponse =
      await fetch(
        `${ML_SERVICE_URL}/predict-route`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            depot: [
              depotLat,
              depotLng,
            ],

            vehicleCapacityKg:
              capacity,

            reports,
          }),
        }
      );

    if (!mlResponse.ok) {
      const errorText =
        await mlResponse.text();

      throw new Error(
        `ML route service failed: ${errorText}`
      );
    }

    const mlResult =
      await mlResponse.json();

    if (!mlResult.success) {
      throw new Error(
        mlResult.message ||
        "ML route optimization failed."
      );
    }

    // ========================================================
    // CONVERT ML ROUTE INTO ADMIN RESPONSE
    // ========================================================

    const stops =
      await Promise.all(
        (mlResult.route || []).map(
          async (stop) => {
            const reportId =
              String(
                stop.reportId || ""
              );

            const original =
              originalReports.get(
                reportId
              );

            // ------------------------------------------------
            // USE ORIGINAL REPORT COORDINATES
            // ------------------------------------------------

            const latitude =
              Number(
                original?.latitude ??
                stop.latitude
              );

            const longitude =
              Number(
                original?.longitude ??
                stop.longitude
              );

            // ------------------------------------------------
            // USE SAVED ADDRESS FIRST
            // ------------------------------------------------

            let locationName =
              original?.address ||
              "";

            // If no address was stored,
            // fall back to reverse geocoding.
            if (
              !locationName
            ) {
              locationName =
                await reverseGeocode(
                  latitude,
                  longitude
                );
            }

            // ------------------------------------------------
            // RETURN ADMIN STOP
            // ------------------------------------------------

            return {
              sequence:
                stop.sequence,

              reportId,

              center: {
                lat: latitude,
                lng: longitude,
              },

              locationName,

              reportCount: 1,

              priority:
                Number(
                  stop.priorityScore ||
                    0
                ) >= 0.75
                  ? "Critical"
                  : Number(
                      stop.priorityScore ||
                        0
                    ) >= 0.50
                  ? "High"
                  : Number(
                      stop.priorityScore ||
                        0
                    ) >= 0.25
                  ? "Medium"
                  : "Low",

              priorityScore:
                Number(
                  stop.priorityScore ||
                    0
                ),

              severity:
                stop.severity ||
                "Medium",

              quantity:
                stop.quantity ||
                "Medium",

              density:
                stop.density ||
                "Medium",

              hazard:
                stop.hazard ||
                "None",

              totalQuantity:
                Number(
                  stop.wasteKg || 0
                ),

              routeScore:
                Number(
                  stop.mlUtility || 0
                ),

              mlUtility:
                Number(
                  stop.mlUtility || 0
                ),

              reports: [
                {
                  id: reportId,

                  lat: latitude,

                  lng: longitude,

                  locationName,

                  wasteKg:
                    Number(
                      stop.wasteKg ||
                        0
                    ),
                },
              ],
            };
          }
        )
      );

    // ========================================================
    // CALCULATE DISTANCE BETWEEN STOPS
    // ========================================================

    let previousPoint = [
      depotLng,
      depotLat,
    ];

    stops.forEach((stop) => {
      const currentPoint = [
        Number(
          stop.center.lng
        ),

        Number(
          stop.center.lat
        ),
      ];

      const distance =
        distanceKm(
          previousPoint,
          currentPoint
        );

      stop.distanceFromPreviousKm =
        Number(
          distance.toFixed(2)
        );

      previousPoint =
        currentPoint;
    });

    // ========================================================
    // FINAL RESPONSE
    // ========================================================

    return res.json({
      depot: {
        lat: depotLat,
        lng: depotLng,
      },

      capacity,

      capacityUsed:
        Number(
          mlResult.capacity_used_kg ||
            0
        ),

      totalDistanceKm:
        Number(
          mlResult.total_distance_km ||
            0
        ),

      returnToDepotKm:
        Number(
          mlResult.return_distance_km ||
            0
        ),

      unassignedHotspots:
        Math.max(
          0,
          hotspots.length -
            stops.length
        ),

      stops,

      method:
        "EcoTrek-Learned",

      mlModel: {
        name:
          "ecotrek_route_utility_model",

        version:
          "synthetic-training-v1",
      },
    });
  } catch (error) {
    console.error(
      "Route planning error:",
      error
    );

    console.error(
      "Error cause:",
      error.cause
    );

    console.error(
      "Error stack:",
      error.stack
    );

    return res.status(500).json({
      message:
        error.message ||
        "Failed to generate route.",
    });
  }
}

// ============================================================
// REVERSE GEOCODING
// ============================================================

const reverseGeocode = async (lat, lng) => {
  try {
    if (
      !Number.isFinite(Number(lat)) ||
      !Number.isFinite(Number(lng))
    ) {
      return "Location unavailable";
    }

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}` +
      `&zoom=18&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "EcoTrek-Waste-Management/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return "Location unavailable";
    }

    const data = await response.json();

    return (
      data?.display_name ||
      "Location unavailable"
    );
  } catch (error) {
    console.error(
      "Reverse geocoding failed:",
      error.message
    );

    return "Location unavailable";
  }
};

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
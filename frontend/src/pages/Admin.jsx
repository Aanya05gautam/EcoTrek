import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import Map from "../components/Map";
import { useAuth } from "../context/AuthContext";

import {
  Activity,
  Send,
  CheckCircle2,
  X,
  ClipboardList,
  MapPin,
  ShieldAlert,
  RefreshCw,
  Users,
  Truck,
  Navigation,
  Clock,
  Layers,
} from "lucide-react";

// Demo-only drivers for testing route assignment before real driver accounts exist.
const DUMMY_DRIVERS = [
  { id: "demo-driver-001", name: "Rajesh Kumar", phone: "+91 98765 43210", vehicle: "Truck 01", capacity: "2 tonnes" },
  { id: "demo-driver-002", name: "Amit Sharma", phone: "+91 98765 12340", vehicle: "Truck 02", capacity: "1.5 tonnes" },
  { id: "demo-driver-003", name: "Rahul Verma", phone: "+91 98765 67890", vehicle: "Mini Truck 03", capacity: "1 tonne" },
  { id: "demo-driver-004", name: "Suresh Yadav", phone: "+91 98765 24680", vehicle: "Truck 04", capacity: "2.5 tonnes" },
];

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [users, setUsers] = useState([]);

  // ML ROUTE
  const [routeData, setRouteData] = useState(null);
  const [activeRouteAssigned, setActiveRouteAssigned] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  // ROUTE ASSIGNMENT
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [successAssignment, setSuccessAssignment] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  // Demo assignments are stored in this browser only; no driver records or backend API are needed.
  const [assignments, setAssignments] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("ecotrek-demo-assignments") || "[]");
    } catch {
      return [];
    }
  });

  const [reportFilter, setReportFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // ============================================================
  // HELPERS
  // ============================================================

  const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const formatCondition = (value) => {
    if (!value) return "Unknown";

    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const normalizeReport = (report) => {
    const lat = toNumber(report?.lat);
    const lng = toNumber(report?.lng);

    return {
      ...report,
      lat,
      lng,
      title: report?.title || "Waste Report",
      status: report?.status || "Pending",
      reportType: report?.reportType || "Outdoor/Public",
      aiCategory: report?.aiCategory || "Unknown",
      severity: report?.severity || "Medium",
      quantity: report?.quantity || "Medium",
      density: report?.density || "Medium",
      hazard: report?.hazard || "None",
    };
  };

  const normalizeHotspot = (hotspot) => {
    const lat = toNumber(hotspot?.center?.lat);
    const lng = toNumber(hotspot?.center?.lng);

    return {
      ...hotspot,
      center: {
        lat,
        lng,
      },
      reportCount: Number(hotspot?.reportCount) || 0,
      priority: hotspot?.priority || "Low",
      priorityScore: Number(hotspot?.priorityScore) || 0,
      severity: hotspot?.severity || "Medium",
      quantity: hotspot?.quantity || "Medium",
    };
  };


  // Resolve report IDs from the different shapes returned by the ML API.
  const getStopReportId = (stop) => {
    const candidates = [
      stop?.reportId,
      stop?.wasteReportId,
      stop?.report?._id,
      stop?.report?.id,
      stop?.wasteReport?._id,
      stop?.wasteReport?.id,
      stop?._id,
      stop?.id,
    ];
    const value = candidates.find((item) => item !== undefined && item !== null && String(item).trim() !== "");
    return value ? String(value).trim() : "";
  };

  const getAssignmentStops = (assignment) =>
    assignment?.route?.stops || assignment?.optimizedRoute?.stops || assignment?.stops || [];

  // ============================================================
  // LOAD EVERYTHING
  // ============================================================

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const results = await Promise.allSettled([
        api("/reports"),
        api("/reports/hotspots"),
        api("/auth/users"),
      ]);

      const [reportsResult, hotspotsResult, usersResult] =
        results;

      if (reportsResult.status === "fulfilled") {
        const data = Array.isArray(reportsResult.value)
          ? reportsResult.value
          : [];

        setReports(data.map(normalizeReport));
      } else {
        console.error("Reports API failed:", reportsResult.reason);
      }


      if (hotspotsResult.status === "fulfilled") {
        const data = Array.isArray(hotspotsResult.value)
          ? hotspotsResult.value
          : [];

        setHotspots(data.map(normalizeHotspot));
      } else {
        console.error("Hotspots API failed:", hotspotsResult.reason);
      }

      if (usersResult.status === "fulfilled") {
        setUsers(Array.isArray(usersResult.value) ? usersResult.value : []);
      } else {
        console.error("Users API failed:", usersResult.reason);
      }

      const failedCount = results.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failedCount === results.length) {
        setError(
          "Unable to connect to the EcoTrek backend. Please make sure the backend server is running.",
        );
      } else if (failedCount > 0) {
        setError(
          "Some dashboard data could not be loaded. Available sections are still shown.",
        );
      }

    } catch (err) {
      console.error("Admin dashboard loading failed:", err);

      setError(err?.message || "Failed to load the admin dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ============================================================
  // ML ROUTE GENERATION
  // ============================================================

  const generateMLRoute = async () => {
    try {
      setRouteLoading(true);
      setRouteError("");
      setActiveRouteAssigned(false);

      const depotLat = 28.6139;
      const depotLng = 77.209;

      const data = await api(
        `/reports/route?lat=${depotLat}&lng=${depotLng}&capacity=100&radiusKm=5`,
      );

      // Demo mode: exclude every report already included in a local assignment.
      // Match IDs from common API response shapes (reportId, nested report._id, _id, etc.).
      const assignedReportIds = new Set(
        assignments
          .flatMap((assignment) => getAssignmentStops(assignment))
          .map(getStopReportId)
          .filter(Boolean),
      );

      const originalStops = Array.isArray(data?.stops) ? data.stops : [];
      const availableStops = originalStops.filter((stop) => {
        const reportId = getStopReportId(stop);
        // Keep stops without an ID rather than accidentally hiding valid route data.
        return !reportId || !assignedReportIds.has(reportId);
      });

      let stopsToShow = availableStops;
      let usingRemainingReportsFallback = false;

      // If the ML endpoint repeats only already-assigned stops, check the full
      // reports list for remaining unresolved reports. This makes those reports
      // visible instead of incorrectly claiming that everything is assigned.
      if (stopsToShow.length === 0 && reports.length > 0) {
        const remainingReports = reports.filter((report) => {
          const reportId = String(report?._id || report?.id || report?.reportId || "");
          const status = String(report?.status || "Pending").toLowerCase();
          return (
            reportId &&
            !assignedReportIds.has(reportId) &&
            !["resolved", "completed", "collected", "closed"].includes(status)
          );
        });

        if (remainingReports.length > 0) {
          stopsToShow = remainingReports.map((report, index) => ({
            reportId: String(report._id || report.id || report.reportId),
            locationName:
              report.locationName ||
              report.location?.address ||
              report.address ||
              report.title ||
              `Waste location ${index + 1}`,
            center: {
              lat: report.lat ?? report.location?.lat ?? report.coordinates?.lat,
              lng: report.lng ?? report.location?.lng ?? report.coordinates?.lng,
            },
            wasteType: report.aiCategory || report.wasteType || report.category || "Mixed",
            totalQuantity: Number(report.quantityValue ?? report.totalQuantity ?? 0),
            priorityScore: Number(report.priorityScore ?? 0),
            mlUtility: Number(report.mlUtility ?? 0),
            severity: report.severity || "Medium",
            quantity: report.quantity || "Unknown",
            sequence: index + 1,
            sourceReport: report,
          }));
          usingRemainingReportsFallback = true;
        }
      }

      if (stopsToShow.length === 0) {
        setRouteData(null);
        setRouteError(
          originalStops.length > 0
            ? "The ML route endpoint returned only reports that are already assigned, and no additional unresolved reports were available in the loaded reports list. Refresh reports or check the report statuses."
            : "The ML model did not return any collection stops.",
        );
        return;
      }

      const recalculatedCapacity = stopsToShow.reduce(
        (sum, stop) => sum + (Number(stop.totalQuantity) || 0),
        0,
      );

      setRouteData({
        ...data,
        stops: stopsToShow.map((stop, index) => ({
          ...stop,
          sequence: index + 1,
        })),
        capacityUsed: usingRemainingReportsFallback
          ? recalculatedCapacity
          : (data?.capacityUsed ?? recalculatedCapacity),
        // This fallback is a visibility safeguard, not an ML-optimized route.
        isRemainingReportsFallback: usingRemainingReportsFallback,
      });
    } catch (err) {
      console.error("ML route generation failed:", err);
      setRouteError(err?.message || "Unable to generate optimized route.");
    } finally {
      setRouteLoading(false);
    }
  };

  // ============================================================
  // CREATE A LOCAL DEMO ROUTE ASSIGNMENT (NO BACKEND REQUIRED)
  // ============================================================

  const sendRouteToDriver = (event) => {
    event.preventDefault();

    if (!routeData || !selectedDriver || !vehicle || !collectionDate) {
      setAssignmentError("Please select a driver, vehicle and collection date.");
      return;
    }

    const demoDriver = DUMMY_DRIVERS.find((item) => item.id === selectedDriver);
    const registeredDriver = users.find(
      (item) => (item._id || item.id) === selectedDriver,
    );
    const driverName = demoDriver?.name || registeredDriver?.name || registeredDriver?.email || "Selected driver";

    const assignment = {
      _id: `ECO-${Date.now()}`,
      reportId: `ECO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      driverId: selectedDriver,
      driverName,
      vehicle,
      collectionDate,
      instructions: instructions.trim(),
      route: routeData,
      status: "Assigned",
      createdAt: new Date().toISOString(),
      demo: true,
    };

    setAssignmentLoading(true);
    setAssignmentError("");
    setAssignments((current) => [assignment, ...current]);
    setActiveRouteAssigned(true);
    setSuccessAssignment(assignment);
    setShowAssignModal(false);
    setSelectedDriver("");
    setVehicle("");
    setCollectionDate("");
    setInstructions("");
    setAssignmentLoading(false);
  };

  // ============================================================
  // AUTO REFRESH
  // ============================================================

  // Keep demo assignment history after a page refresh in this browser only.
  useEffect(() => {
    try {
      window.localStorage.setItem("ecotrek-demo-assignments", JSON.stringify(assignments));
    } catch (storageError) {
      console.warn("Could not save demo assignments in this browser:", storageError);
    }
  }, [assignments]);

  useEffect(() => {
    if (user?.role !== "Admin") {
      return undefined;
    }

    load();

    const refresh = setInterval(() => {
      load(true);
    }, 10000);

    return () => clearInterval(refresh);
  }, [user, load]);

  // ============================================================
  // UPDATE REPORT STATUS
  // ============================================================

  const updateReportStatus = async (id, status) => {
    if (!id) return;

    setUpdatingId(id);
    setError("");

    try {
      await api(`/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
        }),
      });

      await load(true);

      // Route may have changed after status update.
      setRouteData(null);
    } catch (err) {
      console.error("Report status update failed:", err);

      setError(err?.message || "Unable to update report status.");
    } finally {
      setUpdatingId(null);
    }
  };


  // ============================================================
  // UPDATE USER ROLE
  // ============================================================

  const updateRole = async (id, role) => {
    if (!id) return;

    setUpdatingId(id);
    setError("");

    try {
      await api(`/auth/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({
          role,
        }),
      });

      const refreshedUsers = await api("/auth/users");

      setUsers(Array.isArray(refreshedUsers) ? refreshedUsers : []);
    } catch (err) {
      console.error("Role update failed:", err);

      setError(err?.message || "Unable to update user role.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================================
  // FILTER REPORTS
  // ============================================================

  const visibleReports = useMemo(() => {
    return reports.filter((report) => {
      const statusMatches =
        reportFilter === "All" || report.status === reportFilter;

      const typeMatches =
        typeFilter === "All" || report.reportType === typeFilter;

      return statusMatches && typeMatches;
    });
  }, [reports, reportFilter, typeFilter]);

  // ============================================================
  // OUTDOOR REPORTS
  // ============================================================

  const outdoorReports = useMemo(() => {
    return reports.filter((report) => report.reportType === "Outdoor/Public");
  }, [reports]);

  // ============================================================
  // VALID MAP REPORTS
  // ============================================================

  const reportMarkers = useMemo(() => {
    return outdoorReports
      .filter(
        (report) => Number.isFinite(report.lat) && Number.isFinite(report.lng),
      )
      .map((report) => ({
        ...report,
        lat: Number(report.lat),
        lng: Number(report.lng),
      }));
  }, [outdoorReports]);

  // ============================================================
  // HOTSPOT MARKERS
  // ============================================================

  const hotspotMarkers = useMemo(() => {
    return hotspots
      .filter(
        (hotspot) =>
          Number.isFinite(hotspot.center?.lat) &&
          Number.isFinite(hotspot.center?.lng),
      )
      .map((hotspot, index) => ({
        id: `hotspot-${index}`,
        _id: `hotspot-${index}`,

        lat: Number(hotspot.center.lat),
        lng: Number(hotspot.center.lng),

        title: `Hotspot Cluster ${index + 1}`,

        description: `${hotspot.reportCount} report(s) · ${formatCondition(
          hotspot.priority,
        )} priority`,

        aiCategory: "Hotspot",

        status: "Pending",

        severity: hotspot.severity,

        quantity: hotspot.quantity,

        priority: hotspot.priority,

        isHotspot: true,
      }));
  }, [hotspots]);

  // ============================================================
  // COMBINED MAP DATA
  // ============================================================

  const mapMarkers = useMemo(() => {
    return [...reportMarkers, ...hotspotMarkers];
  }, [reportMarkers, hotspotMarkers]);

  // ============================================================
  // MAP CENTER
  // ============================================================

  const mapCenter = useMemo(() => {
    if (hotspotMarkers.length > 0) {
      return {
        lat: hotspotMarkers[0].lat,
        lng: hotspotMarkers[0].lng,
      };
    }

    if (reportMarkers.length > 0) {
      return {
        lat: reportMarkers[0].lat,
        lng: reportMarkers[0].lng,
      };
    }

    return null;
  }, [hotspotMarkers, reportMarkers]);

  // ============================================================
  // COUNTERS
  // ============================================================

  const pendingReports = reports.filter(
    (report) => report.status === "Pending",
  ).length;

  const inProgressReports = reports.filter(
    (report) => report.status === "In Progress",
  ).length;

  const resolvedReports = reports.filter(
    (report) => report.status === "Resolved",
  ).length;

  const activeHotspots = hotspots.filter(
    (hotspot) => hotspot.priority !== "Low",
  ).length;

  // ============================================================
  // ACCESS CONTROL
  // ============================================================

  if (user?.role !== "Admin") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 text-center border border-red-100 shadow-xl">
          <ShieldAlert size={52} className="mx-auto text-red-500 mb-5" />

          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
            RESTRICTED AUTHORITY ZONE
          </h2>

          <p className="text-slate-600 font-medium text-lg">
            This portal is restricted to administrator accounts.
          </p>

          <Link
            to="/admin/login"
            className="inline-flex mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-extrabold transition"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="bg-emerald-950 rounded-[2rem] p-7 md:p-9 mb-8 shadow-xl border border-emerald-900 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-800 border border-emerald-700 flex items-center justify-center">
                <ShieldAlert size={22} className="text-emerald-300" />
              </div>

              <span className="text-emerald-400 text-xs font-extrabold uppercase tracking-[0.18em]">
                EcoTrek Authority Portal
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              Central Waste Management
            </h1>

            <p className="text-emerald-200/80 mt-2 font-medium">
              Monitor reports, hotspots, cleanup requests and citizen activity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold border border-emerald-700 transition disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-900 border border-emerald-700 text-emerald-300 font-extrabold text-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM LIVE
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        {/* TOTAL */}

        <div className="bg-white/90 rounded-3xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-700 font-extrabold">
                Total Reports
              </p>

              <p className="text-4xl font-extrabold text-emerald-950 mt-2">
                {reports.length}
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Activity size={23} />
            </div>
          </div>
        </div>

        {/* PENDING */}

        <div className="bg-white/90 rounded-3xl p-6 border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-orange-700 font-extrabold">
                Pending
              </p>

              <p className="text-4xl font-extrabold text-orange-700 mt-2">
                {pendingReports}
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
              <Clock size={23} />
            </div>
          </div>
        </div>

        {/* IN PROGRESS */}

        <div className="bg-white/90 rounded-3xl p-6 border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-700 font-extrabold">
                In Progress
              </p>

              <p className="text-4xl font-extrabold text-blue-700 mt-2">
                {inProgressReports}
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Truck size={23} />
            </div>
          </div>
        </div>

        {/* HOTSPOTS */}

        <div className="bg-white/90 rounded-3xl p-6 border border-red-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-red-700 font-extrabold">
                Active Hotspots
              </p>

              <p className="text-4xl font-extrabold text-red-700 mt-2">
                {activeHotspots}
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <MapPin size={23} />
            </div>
          </div>
        </div>

        {/* USERS */}

        <div className="bg-white/90 rounded-3xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-700 font-extrabold">
                Users
              </p>

              <p className="text-4xl font-extrabold text-emerald-950 mt-2">
                {users.length}
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Users size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          MAP + HOTSPOTS
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* MAP */}

        <div className="xl:col-span-2 bg-white/90 rounded-3xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={21} className="text-emerald-500" />

                <h2 className="text-xl font-extrabold text-emerald-950">
                  Live Waste Hotspot Map
                </h2>
              </div>

              <p className="text-sm text-emerald-700/70 font-semibold mt-1">
                Outdoor reports and detected hotspot clusters
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Reports
              </span>

              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Hotspots
              </span>
            </div>
          </div>

          <div className="h-[460px] rounded-2xl overflow-hidden border border-emerald-200 shadow-inner relative">
            {loading && (
              <div className="absolute inset-0 z-20 bg-emerald-50/80 flex items-center justify-center">
                <div className="flex items-center gap-3 text-emerald-700 font-extrabold">
                  <RefreshCw size={20} className="animate-spin" />
                  Loading map...
                </div>
              </div>
            )}

            <Map
              position={mapCenter}
              setPosition={() => {}}
              markers={mapMarkers}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-extrabold">
                Outdoor Reports
              </p>

              <p className="text-xl font-extrabold text-emerald-950 mt-1">
                {outdoorReports.length}
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-red-600 font-extrabold">
                Hotspot Clusters
              </p>

              <p className="text-xl font-extrabold text-red-700 mt-1">
                {hotspots.length}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">
                Mapped Points
              </p>

              <p className="text-xl font-extrabold text-slate-800 mt-1">
                {mapMarkers.length}
              </p>
            </div>
          </div>
        </div>

        {/* HOTSPOTS */}

        <div className="bg-white/90 rounded-3xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-emerald-950">
                Priority Hotspots
              </h2>

              <p className="text-sm text-emerald-700/70 font-semibold mt-1">
                Clustered unresolved reports
              </p>
            </div>

            <Layers size={21} className="text-emerald-500" />
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            {hotspots.length === 0 ? (
              <div className="border border-dashed border-emerald-200 bg-emerald-50 rounded-2xl p-8 text-center">
                <MapPin size={28} className="mx-auto text-emerald-400 mb-3" />

                <p className="text-emerald-700 font-extrabold">
                  No active hotspot clusters
                </p>

                <p className="text-xs text-emerald-600/70 mt-1 font-semibold">
                  New outdoor reports will appear here when clusters are
                  detected.
                </p>
              </div>
            ) : (
              hotspots.map((hotspot, index) => (
                <div
                  key={`hotspot-${index}`}
                  className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/50 hover:bg-emerald-50 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-extrabold text-emerald-950">
                      Hotspot #{index + 1}
                    </span>

                    <span className="text-[10px] uppercase font-extrabold text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                      {formatCondition(hotspot.priority)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-extrabold">
                        Reports
                      </p>

                      <p className="font-extrabold text-emerald-900">
                        {hotspot.reportCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase text-slate-500 font-extrabold">
                        Severity
                      </p>

                      <p className="font-extrabold text-emerald-900">
                        {formatCondition(hotspot.severity)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 font-semibold">
                    <Navigation size={13} />

                    {Number.isFinite(hotspot.center.lat) &&
                    Number.isFinite(hotspot.center.lng)
                      ? `${hotspot.center.lat.toFixed(
                          5,
                        )}, ${hotspot.center.lng.toFixed(5)}`
                      : "Coordinates unavailable"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>



      {/* ======================================================
          REPORT QUEUE
      ====================================================== */}

      <div className="bg-white/90 rounded-3xl p-6 border border-emerald-100 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-emerald-950">
              Incoming Citizen Reports
            </h2>

            <p className="text-sm text-emerald-700/70 font-semibold mt-1">
              Review, prioritize and update waste incidents.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              className="bg-white border border-emerald-200 text-sm rounded-xl px-3 py-2.5 text-emerald-900 font-bold"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Modes</option>

              <option value="Outdoor/Public">Outdoor/Public</option>

              <option value="Household">Household</option>
            </select>

            <select
              className="bg-white border border-emerald-200 text-sm rounded-xl px-3 py-2.5 text-emerald-900 font-bold"
              value={reportFilter}
              onChange={(e) => setReportFilter(e.target.value)}
            >
              <option value="All">All Status</option>

              <option value="Pending">Pending</option>

              <option value="In Progress">In Progress</option>

              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-emerald-100 bg-emerald-50/60 text-xs uppercase tracking-wider text-emerald-800 font-extrabold">
                <th className="p-3">Report</th>

                <th className="p-3">Location</th>

                <th className="p-3">Model</th>

                <th className="p-3">Priority</th>

                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-emerald-50">
              {visibleReports.map((report) => {
                const id = report._id || report.id;

                return (
                  <tr
                    key={id}
                    onClick={() =>
                      navigate(`/admin/report/${id}`, {
                        state: {
                          report,
                        },
                      })
                    }
                    className="hover:bg-emerald-50/40 transition cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="font-extrabold text-emerald-950">
                        {report.title}
                      </div>

                      <div className="text-xs text-slate-500 mt-1">
                        {formatCondition(report.reportType)}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-sm font-semibold text-slate-700 max-w-[220px]">
                        {report.address || "GPS coordinates submitted"}
                      </div>

                      {Number.isFinite(report.lat) &&
                        Number.isFinite(report.lng) && (
                          <div className="text-[11px] text-slate-400 mt-1">
                            {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
                          </div>
                        )}
                    </td>

                    <td className="p-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold capitalize">
                        {formatCondition(report.aiCategory)}
                      </span>

                      {report.aiConfidence !== undefined && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          Model confidence: {report.aiConfidence}%
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-extrabold text-red-700 text-sm">
                        {report.priority || report.severity || "Low"}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1">
                        {report.quantity} quantity · {report.density} density
                      </div>
                    </td>

                    <td className="p-4">
                      <select
                        className="bg-white border border-emerald-200 text-sm rounded-xl px-3 py-2 text-emerald-900 font-bold disabled:opacity-50"
                        value={report.status}
                        disabled={updatingId === id}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();

                          updateReportStatus(id, e.target.value);
                        }}
                      >
                        <option value="Pending">Pending</option>

                        <option value="In Progress">In Progress</option>

                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                );
              })}

              {visibleReports.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="py-12 text-center text-slate-500 font-semibold"
                  >
                    No reports match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          STATUS OVERVIEW
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <p className="text-xs uppercase font-extrabold text-orange-700 tracking-wider">
            Pending Resolution
          </p>

          <p className="text-3xl font-extrabold text-orange-700 mt-2">
            {pendingReports}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs uppercase font-extrabold text-blue-700 tracking-wider">
            Cleanup In Progress
          </p>

          <p className="text-3xl font-extrabold text-blue-700 mt-2">
            {inProgressReports}
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">
            Resolved Reports
          </p>

          <p className="text-3xl font-extrabold text-emerald-700 mt-2">
            {resolvedReports}
          </p>
        </div>
      </div>
      {/* ======================================================
          ML ROUTE OPTIMIZATION
      ====================================================== */}

      <div className="bg-white/90 rounded-3xl p-6 border border-purple-100 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Navigation size={21} className="text-purple-600" />

              <h2 className="text-xl font-extrabold text-slate-900">
                ML Collection Route
              </h2>

              <span className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-extrabold uppercase">
                EcoTrek-Learned
              </span>
            </div>

            <p className="text-sm text-slate-500 font-semibold mt-1">
              ML-generated collection sequence using waste priority, volume and
              travel efficiency.
            </p>
          </div>

          <button
            onClick={generateMLRoute}
            disabled={routeLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold transition disabled:opacity-60"
          >
            {routeLoading ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Navigation size={17} />
            )}

            {routeLoading ? "Generating Route..." : "Generate ML Route"}
          </button>
        </div>

        {routeError && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">
            {routeError}
          </div>
        )}

        {!routeData && !routeLoading && !routeError && (
          <div className="border border-dashed border-purple-200 bg-purple-50/50 rounded-2xl p-10 text-center">
            <Navigation size={32} className="mx-auto text-purple-400 mb-3" />

            <p className="text-purple-800 font-extrabold">
              No route generated yet
            </p>

            <p className="text-xs text-purple-600/70 mt-1 font-semibold">
              Generate an ML route using the current unresolved waste reports.
            </p>
          </div>
        )}

        {routeLoading && (
          <div className="border border-purple-100 bg-purple-50 rounded-2xl p-10 text-center">
            <RefreshCw
              size={28}
              className="mx-auto text-purple-500 animate-spin mb-3"
            />

            <p className="text-purple-800 font-extrabold">
              Running EcoTrek route model...
            </p>
          </div>
        )}

        {routeData && !routeLoading && (
          <>
            {/* ROUTE SUMMARY */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-extrabold">
                  Distance
                </p>

                <p className="text-2xl font-extrabold text-emerald-950 mt-1">
                  {routeData.totalDistanceKm ?? 0} km
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-blue-600 font-extrabold">
                  Capacity Used
                </p>

                <p className="text-2xl font-extrabold text-blue-900 mt-1">
                  {routeData.capacityUsed ?? 0} kg
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-purple-600 font-extrabold">
                  Route Stops
                </p>

                <p className="text-2xl font-extrabold text-purple-900 mt-1">
                  {routeData.stops?.length ?? 0}
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-orange-600 font-extrabold">
                  Return Distance
                </p>

                <p className="text-2xl font-extrabold text-orange-900 mt-1">
                  {routeData.returnToDepotKm ?? 0} km
                </p>
              </div>
            </div>

            {activeRouteAssigned && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                <CheckCircle2 size={18} />
                This route has been assigned. Generate a new ML route to view remaining unassigned stops.
              </div>
            )}

            {/* MODEL INFORMATION */}

            <div className="mb-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-extrabold">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Model:{" "}
                {routeData.mlModel?.name || "ecotrek_route_utility_model"}
              </span>

              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold">
                Capacity: {routeData.capacity ?? 100} kg
              </span>

              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                Unassigned: {routeData.unassignedHotspots ?? 0}
              </span>
            </div>

            {/* ROUTE STOPS */}

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-800">
                      Recommended Collection Sequence
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Generated by the EcoTrek-Learned route utility model
                    </p>
                  </div>

                  <span className="text-xs font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg">
                    {routeData.stops?.length ?? 0} stops
                  </span>
                </div>
              </div>

              {routeData.stops?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">
                        <th className="p-3">#</th>

                        <th className="p-3">Location</th>

                        <th className="p-3">Waste</th>

                        <th className="p-3">Priority</th>

                        <th className="p-3">ML Utility</th>

                        <th className="p-3">Severity</th>

                        <th className="p-3">Quantity</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {routeData.stops.map((stop) => (
                        <tr
                          key={`${stop.reportId}-${stop.sequence}`}
                          className="hover:bg-purple-50/40 transition"
                        >
                          <td className="p-3">
                            <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-extrabold">
                              {stop.sequence}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-slate-800 max-w-[320px]">
                              {stop.locationName || "Location unavailable"}
                            </div>

                            <div className="text-[10px] text-slate-400 mt-1">
                              {Number.isFinite(Number(stop.center?.lat)) &&
                              Number.isFinite(Number(stop.center?.lng))
                                ? `${Number(stop.center.lat).toFixed(5)}, ${Number(
                                    stop.center.lng,
                                  ).toFixed(5)}`
                                : "Coordinates unavailable"}
                            </div>

                            <div className="text-[10px] text-slate-400 mt-1">
                              Report: {stop.reportId}
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="font-extrabold text-slate-800">
                              {stop.totalQuantity ?? 0} kg
                            </span>
                          </td>

                          <td className="p-3">
                            <span className="font-extrabold text-red-700">
                              {Number(stop.priorityScore ?? 0).toFixed(2)}
                            </span>
                          </td>

                          <td className="p-3">
                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-extrabold">
                              {Number(stop.mlUtility ?? 0).toFixed(4)}
                            </span>
                          </td>

                          <td className="p-3">
                            <span className="font-bold text-slate-700">
                              {formatCondition(stop.severity)}
                            </span>
                          </td>

                          <td className="p-3">
                            <span className="text-xs font-bold text-slate-600">
                              {formatCondition(stop.quantity)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center">
                  <p className="text-slate-500 font-semibold">
                    No collection stops were generated.
                  </p>
                </div>
              )}
            </div>

            {routeData.unassignedHotspots > 0 && (
              <p className="mt-4 text-xs text-orange-700 font-bold">
                {routeData.unassignedHotspots} hotspot(s) could not be included
                within the vehicle capacity.
              </p>
            )}
          </>
        )}
      </div>


      {/* ======================================================
          DRIVER ASSIGNMENT & COLLECTION REPORTS
      ====================================================== */}

      {routeData && !routeLoading && (
        <div className="bg-white/90 rounded-3xl p-6 border border-emerald-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Truck size={21} className="text-emerald-600" />
                <h2 className="text-xl font-extrabold text-emerald-950">
                  Assign Collection Route
                </h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Send this ML-generated route to a selected driver and save an assignment report for the admin.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {activeRouteAssigned && (
                <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700">
                  <CheckCircle2 size={17} />
                  Route Assigned
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setAssignmentError("");
                  setShowAssignModal(true);
                }}
                disabled={!routeData.stops?.length || activeRouteAssigned}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={17} />
                {activeRouteAssigned ? "Already Assigned" : "Send Route to Driver"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/90 rounded-3xl p-6 border border-emerald-100 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-5">
          <ClipboardList size={21} className="text-emerald-600" />
          <h2 className="text-xl font-extrabold text-emerald-950">
            Collection Assignment Reports
          </h2>
        </div>

        {assignments.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            No route assignments have been sent yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-emerald-50 text-xs uppercase text-emerald-800">
                  <th className="p-3">Assignment ID</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Stops</th>
                  <th className="p-3">Collection Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {assignments.map((assignment, index) => (
                  <tr
                    key={assignment._id || assignment.id || index}
                    onClick={() => setSelectedAssignment(assignment)}
                    className="cursor-pointer transition hover:bg-emerald-50"
                    title="Click to open this collection assignment"
                  >
                    <td className="p-3 font-bold text-emerald-900 underline decoration-dotted underline-offset-4">
                      {assignment.reportId || assignment._id || `ECO-${index + 1}`}
                    </td>
                    <td className="p-3 text-sm">{assignment.driverName || assignment.driver?.name || "Driver"}</td>
                    <td className="p-3 text-sm">{assignment.vehicle || "—"}</td>
                    <td className="p-3 text-sm">{assignment.route?.stops?.length ?? assignment.stops?.length ?? 0}</td>
                    <td className="p-3 text-sm">
                      {assignment.collectionDate
                        ? new Date(assignment.collectionDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                        {assignment.status || "Assigned"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedAssignment(assignment);
                        }}
                        className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        Open route
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Assign Route to Driver</h2>
                <p className="text-sm text-slate-500 mt-1">Confirm the assignment details before sending.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close assignment dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4 mb-5 text-sm text-emerald-900">
              <p><strong>Route stops:</strong> {routeData?.stops?.length || 0}</p>
              <p><strong>Total distance:</strong> {routeData?.totalDistanceKm ?? "—"} km</p>
              <p><strong>Capacity used:</strong> {routeData?.capacityUsed ?? "—"} kg</p>
            </div>

            <form onSubmit={sendRouteToDriver} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Select Driver</label>
                <select
                  value={selectedDriver}
                  onChange={(event) => {
                    const driverId = event.target.value;
                    setSelectedDriver(driverId);
                    const demoDriver = DUMMY_DRIVERS.find((item) => item.id === driverId);
                    if (demoDriver) setVehicle(demoDriver.vehicle);
                  }}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Choose a driver</option>
                  <optgroup label="Demo drivers (for testing)">
                    {DUMMY_DRIVERS.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} — {driver.vehicle}
                      </option>
                    ))}
                  </optgroup>
                  {users.filter((account) => account.role === "Driver").length > 0 && (
                    <optgroup label="Registered driver accounts">
                      {users
                        .filter((account) => account.role === "Driver")
                        .map((driver) => (
                          <option key={driver._id || driver.id} value={driver._id || driver.id}>
                            {driver.name || driver.email}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-xs text-amber-700 mt-1">
                  Demo mode: assignments are recorded in this browser only. No driver account or notification is required.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle</label>
                <input
                  value={vehicle}
                  onChange={(event) => setVehicle(event.target.value)}
                  required
                  placeholder="e.g. Truck 01"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Collection Date</label>
                <input
                  type="date"
                  value={collectionDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setCollectionDate(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Instructions (optional)</label>
                <textarea
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  rows={3}
                  placeholder="Collection instructions for the driver..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              {assignmentError && (
                <p className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-700">
                  {assignmentError}
                </p>
              )}

              <button
                type="submit"
                disabled={assignmentLoading || !selectedDriver}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send size={17} />
                {assignmentLoading ? "Sending Route..." : "Confirm & Send Route"}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedAssignment && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">Collection assignment</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  {selectedAssignment.reportId || selectedAssignment._id}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assigned to {selectedAssignment.driverName || "Driver"} · {selectedAssignment.vehicle || "Vehicle not specified"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close assignment details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Stops</p>
                <p className="text-xl font-extrabold text-emerald-950">{getAssignmentStops(selectedAssignment).length}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-xs text-blue-700">Distance</p>
                <p className="text-xl font-extrabold text-blue-950">{selectedAssignment.route?.totalDistanceKm ?? "—"} km</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3">
                <p className="text-xs text-purple-700">Capacity</p>
                <p className="text-xl font-extrabold text-purple-950">{selectedAssignment.route?.capacityUsed ?? "—"} kg</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-xs text-amber-700">Status</p>
                <p className="text-xl font-extrabold text-amber-950">{selectedAssignment.status || "Assigned"}</p>
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-slate-200 p-4 text-sm">
              <p><strong>Collection date:</strong> {selectedAssignment.collectionDate ? new Date(selectedAssignment.collectionDate).toLocaleDateString() : "—"}</p>
              <p className="mt-1"><strong>Assigned at:</strong> {selectedAssignment.createdAt ? new Date(selectedAssignment.createdAt).toLocaleString() : "—"}</p>
              {selectedAssignment.instructions && <p className="mt-1"><strong>Instructions:</strong> {selectedAssignment.instructions}</p>}
            </div>

            <h3 className="mb-3 font-extrabold text-slate-900">Assigned collection route</h3>
            {getAssignmentStops(selectedAssignment).length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-emerald-50 text-xs uppercase text-emerald-800">
                    <tr>
                      <th className="p-3">Stop</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Report ID</th>
                      <th className="p-3">Waste</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getAssignmentStops(selectedAssignment).map((stop, stopIndex) => (
                      <tr key={`${getStopReportId(stop) || "stop"}-${stopIndex}`}>
                        <td className="p-3 font-bold">{stop.sequence || stopIndex + 1}</td>
                        <td className="p-3">{stop.locationName || stop.address || "Location unavailable"}</td>
                        <td className="p-3 font-mono text-xs">{getStopReportId(stop) || "—"}</td>
                        <td className="p-3">{stop.wasteType || stop.aiCategory || "—"}</td>
                        <td className="p-3">{formatCondition(stop.severity)}</td>
                        <td className="p-3">{stop.totalQuantity ?? stop.quantity ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No stop details were saved with this assignment.</p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {successAssignment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <CheckCircle2 size={58} className="mx-auto text-emerald-600 mb-4" />
            <h2 className="text-2xl font-extrabold text-emerald-800">Report Sent Successfully!</h2>
            <p className="text-slate-600 mt-2">
              The optimized route has been assigned in this EcoTrek demo. No external driver notification was sent.
            </p>
            <div className="my-5 rounded-2xl bg-emerald-50 p-4 text-left text-sm space-y-2">
              <p><strong>Assignment:</strong> {successAssignment.reportId || successAssignment._id}</p>
              <p><strong>Driver:</strong> {successAssignment.driverName}</p>
              <p><strong>Vehicle:</strong> {successAssignment.vehicle}</p>
              <p><strong>Status:</strong> {successAssignment.status}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessAssignment(null)}
              className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-extrabold text-white hover:bg-emerald-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          USERS
      ====================================================== */}

      <div className="bg-white/90 rounded-3xl p-6 border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-emerald-950">
              User & Authority Management
            </h2>

            <p className="text-sm text-emerald-700/70 font-semibold mt-1">
              Manage citizen and administrator access.
            </p>
          </div>

          <span className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-extrabold">
            {users.length} accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-emerald-50 text-xs uppercase tracking-wider text-emerald-800 font-extrabold">
                <th className="p-3">User</th>

                <th className="p-3">Email</th>

                <th className="p-3">Eco Points</th>

                <th className="p-3">Access Role</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-emerald-50">
              {users.map((account) => {
                const id = account._id || account.id;

                return (
                  <tr key={id}>
                    <td className="p-3 font-bold text-emerald-950">
                      {account.name || "Unknown User"}
                    </td>

                    <td className="p-3 text-sm text-slate-600">
                      {account.email}
                    </td>

                    <td className="p-3 text-sm font-extrabold text-emerald-700">
                      {account.ecoPoints || 0}
                    </td>

                    <td className="p-3">
                      <select
                        className="border border-emerald-200 rounded-xl px-3 py-2 text-sm font-bold text-emerald-900 disabled:opacity-50"
                        value={account.role || "Citizen"}
                        disabled={updatingId === id}
                        onChange={(event) => updateRole(id, event.target.value)}
                      >
                        <option value="Citizen">Citizen</option>

                        <option value="Driver">Driver</option>

                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import Map from "../components/Map";
import { useAuth } from "../context/AuthContext";

import {
  Activity,
  MapPin,
  ShieldAlert,
  RefreshCw,
  Users,
  Truck,
  Navigation,
  Clock,
  Layers,
} from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [users, setUsers] = useState([]);

  // ML ROUTE
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

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

      const depotLat = 28.6139;
      const depotLng = 77.209;

      const data = await api(
        `/reports/route?lat=${depotLat}&lng=${depotLng}&capacity=100&radiusKm=5`,
      );

      setRouteData(data);
    } catch (err) {
      console.error("ML route generation failed:", err);

      setRouteError(err?.message || "Unable to generate optimized route.");
    } finally {
      setRouteLoading(false);
    }
  };

  // ============================================================
  // AUTO REFRESH
  // ============================================================

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

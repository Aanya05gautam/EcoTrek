import React, { useEffect, useState } from "react";
import { api, uploadUrl } from "../api";
import { predictWaste, predictOutdoorWaste } from "../services/mlApi";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import Map from "../components/Map";
import {
  MapPin,
  Navigation,
  Info,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Radio,
} from "lucide-react";

export default function Reports() {
  const { user, updateEcoPoints } = useAuth();
  const location = useLocation();

  const [reports, setReports] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    lat: "28.6139",
    lng: "77.2090",
    aiCategory: "Unknown",
    aiConfidence: 0,
    reportType: "Outdoor/Public",
    quantity: "Medium",
    density: "Medium",
    hazard: "None",
    severity: "Medium",
  });

  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [pos, setPos] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // LOAD REPORTS
  // ============================================================

  const load = () => {
    api("/reports")
      .then((res) => {
        if (Array.isArray(res)) {
          setReports(res);
        }
      })
      .catch((error) => {
        console.error("Failed to load reports:", error);
      });
  };

  useEffect(() => {
    load();
  }, []);

  // ============================================================
  // RECEIVE DATA FROM IDENTIFY PAGE
  // ============================================================

  useEffect(() => {
    const workflow = location.state;

    if (!workflow?.fromIdentify || !workflow.file) {
      return;
    }

    setFile(workflow.file);
    setAnalysis(workflow.analysis || null);

    const aiResult = workflow.analysis || {};

    setForm((prev) => ({
      ...prev,

      title: `Outdoor/Public ${
  (aiResult.material || "waste").charAt(0).toUpperCase() +
  (aiResult.material || "waste").slice(1)
} Report`,

description: `Model detected ${
  (aiResult.material || "unknown").charAt(0).toUpperCase() +
  (aiResult.material || "unknown").slice(1)
} outdoor waste conditions with ${
  aiResult.confidence || 0
}% confidence. ${aiResult.guidance || ""}`,

      aiCategory: aiResult.material || "Unknown",

      aiConfidence: Number(aiResult.confidence) || 0,

      reportType: "Outdoor/Public",

      severity:
        aiResult.material === "overflowing"
          ? "High"
          : aiResult.material === "scattered"
            ? "Medium"
            : "Low",
    }));
  }, [location.state]);

  // ============================================================
  // GPS / LOCATION
  // ============================================================

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setPos({
          lat,
          lng,
        });

        setForm((prev) => ({
          ...prev,
          lat: String(lat),
          lng: String(lng),
        }));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          );

          const data = await res.json();

          if (data?.display_name) {
            setForm((prev) => ({
              ...prev,
              address: data.display_name,
            }));
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
        }
      },

      (error) => {
        alert(
          "Failed to acquire GPS location: " +
            error.message +
            ". Please allow location access in your browser.",
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  // ============================================================
  // FILE + AI CLASSIFICATION
  // ============================================================

  const handleFileChange = async (selectedFile) => {
    setFile(selectedFile);
    setErr("");

    if (!selectedFile) {
      setAnalysis(null);
      return;
    }

    setAnalysisLoading(true);

    try {
      let result;

      if (form.reportType === "Outdoor/Public") {
        result = await predictOutdoorWaste(selectedFile);
      } else {
        result = await predictWaste(selectedFile);
      }

      console.log("EcoTrek ML prediction:", result);

      setAnalysis(result);

      setForm((prev) => ({
        ...prev,

        aiCategory: result.material || result.category || "Unknown",

        aiConfidence: Number(result.confidence) || 0,

        title:
          form.reportType === "Outdoor/Public"
            ? `${result.material || "waste"} hotspot`
            : `${result.category || "waste"} report`,

        description:
          form.reportType === "Outdoor/Public"
            ? `AI detected ${
                result.material || "unknown"
              } outdoor waste conditions with ${
                result.confidence || 0
              }% confidence. ${result.guidance || ""}`
            : `AI classified this waste as ${
                result.category || "Unknown"
              } with ${result.confidence || 0}% confidence.`,
      }));
    } catch (classificationError) {
      setAnalysis(null);

      setErr(classificationError.message || "Image classification failed.");

      console.error("Image classification failed:", classificationError);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // ============================================================
  // SUBMIT REPORT / HOTSPOT
  // ============================================================

  const submit = async (e) => {
    e.preventDefault();

    setErr("");

    if (
      form.reportType === "Outdoor/Public" &&
      !pos &&
      (!form.lat || !form.lng)
    ) {
      setErr(
        "Please detect the GPS location before submitting an outdoor hotspot.",
      );
      return;
    }

    setLoading(true);

    const fd = new FormData();

    const reportData = {
      ...form,
      ...(pos || {}),
    };

    Object.entries(reportData).forEach(([key, value]) => {
      fd.append(key, value);
    });

    if (file) {
      fd.append("image", file);
    }

    try {
      await api("/reports", {
        method: "POST",
        body: fd,
      });

      updateEcoPoints(10);

      setForm({
        title: "",
        description: "",
        address: "",
        lat: "28.6139",
        lng: "77.2090",
        aiCategory: "Unknown",
        aiConfidence: 0,
        reportType: "Outdoor/Public",
        quantity: "Medium",
        density: "Medium",
        hazard: "None",
        severity: "Medium",
      });

      setFile(null);
      setAnalysis(null);
      setPos(null);

      await load();
    } catch (error) {
      console.error("Report submission failed:", error);

      setErr(error.message || "Transmission failed.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // AI CONDITION HELPERS
  // ============================================================

  const outdoorCondition = analysis?.material || "unknown";

  const isCleanupRequired =
    outdoorCondition === "overflowing" || outdoorCondition === "scattered";

  const conditionLabel = {
    normal: "Normal",
    overflowing: "Overflowing",
    scattered: "Scattered",
  };

  const conditionDescription = {
    Normal: "The area appears to have normal waste conditions.",

    Overflowing:
      "The waste container appears to be overflowing. Cleanup or collection is recommended.",

    Scattered:
      "Waste appears to be scattered around the area. Cleanup is recommended.",
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="bg-emerald-900 rounded-3xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-20 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Radio size={22} className="text-emerald-400" />

            <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-widest">
              EcoTrek Hotspot Reporting
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Geospatial Waste Reporting
          </h1>

          <p className="text-emerald-100/90 font-medium text-sm md:text-base max-w-3xl leading-relaxed">
            Upload outdoor waste evidence, let the AI classify the scene, attach
            your GPS location, and submit the hotspot for cleanup.
          </p>
        </div>

        <div className="relative z-10 shrink-0 bg-emerald-950 px-6 py-4 rounded-xl border border-emerald-700 shadow-inner flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
            Your Total
          </span>

          <span className="text-3xl font-extrabold text-white">
            {user?.ecoPoints || 0} pts
          </span>
        </div>
      </div>

      {/* ======================================================
          MAIN GRID
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* ====================================================
            REPORT FORM
        ==================================================== */}

        <div className="lg:col-span-5 flex flex-col h-full">
          <form
            className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-emerald-100 shadow-[0_12px_44px_rgba(6,78,59,0.06)] h-full flex flex-col"
            onSubmit={submit}
          >
            {/* FORM HEADER */}

            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                <MapPin size={24} />
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-emerald-950">
                  {form.reportType === "Household"
                    ? "Household Waste Report"
                    : "Outdoor Waste Hotspot"}
                </h2>

                <p className="text-xs font-bold text-emerald-600 mt-1">
                  ML + GPS powered reporting
                </p>
              </div>
            </div>

            {/* ERROR */}

            {err && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl font-bold text-sm shadow-sm">
                ⚠️ {err}
              </div>
            )}

            <div className="space-y-6 flex-grow">
              {/* TITLE */}

              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">
                  Report Title
                </label>

                <input
                  className="w-full bg-slate-50 border border-emerald-100 rounded-xl px-5 py-4 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold shadow-sm"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Overflowing waste bin"
                  required
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">
                  Status Details
                </label>

                <textarea
                  rows="3"
                  className="w-full bg-slate-50 border border-emerald-100 rounded-xl px-5 py-4 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold shadow-sm"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Provide scene context..."
                  required
                />
              </div>

              {/* REPORT PARAMETERS */}

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {/* REPORT TYPE */}

                <label className="text-emerald-950 font-extrabold text-xs uppercase tracking-wider">
                  Report mode
                  <select
                    className="mt-2 w-full bg-slate-50 border border-emerald-100 rounded-xl px-3 py-3 text-emerald-950 font-semibold"
                    value={form.reportType}
                    onChange={(e) => {
                      const type = e.target.value;

                      setForm({
                        ...form,
                        reportType: type,
                      });

                      setAnalysis(null);
                    }}
                  >
                    <option>Outdoor/Public</option>

                    <option>Household</option>
                  </select>
                </label>

                {/* QUANTITY */}

                <label className="text-emerald-950 font-extrabold text-xs uppercase tracking-wider">
                  Quantity
                  <select
                    className="mt-2 w-full bg-slate-50 border border-emerald-100 rounded-xl px-3 py-3 text-emerald-950 font-semibold"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        quantity: e.target.value,
                      })
                    }
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>

                {/* DENSITY */}

                <label className="text-emerald-950 font-extrabold text-xs uppercase tracking-wider">
                  Density
                  <select
                    className="mt-2 w-full bg-slate-50 border border-emerald-100 rounded-xl px-3 py-3 text-emerald-950 font-semibold"
                    value={form.density}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        density: e.target.value,
                      })
                    }
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>

                {/* HAZARD */}

                <label className="text-emerald-950 font-extrabold text-xs uppercase tracking-wider">
                  Hazard
                  <select
                    className="mt-2 w-full bg-slate-50 border border-emerald-100 rounded-xl px-3 py-3 text-emerald-950 font-semibold"
                    value={form.hazard}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        hazard: e.target.value,
                      })
                    }
                  >
                    <option>None</option>
                    <option>Possible</option>
                    <option>Confirmed</option>
                  </select>
                </label>

                {/* SEVERITY */}

                <label className="text-emerald-950 font-extrabold text-xs uppercase tracking-wider">
                  Severity
                  <select
                    className="mt-2 w-full bg-slate-50 border border-emerald-100 rounded-xl px-3 py-3 text-emerald-950 font-semibold"
                    value={form.severity}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        severity: e.target.value,
                      })
                    }
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </label>
              </div>

              {/* PHOTO */}

              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">
                  Attach Photo
                </label>

                <div className="relative w-full">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute opacity-0 inset-0 cursor-pointer w-full h-full z-10"
                    onChange={(e) =>
                      handleFileChange(e.target.files?.[0] || null)
                    }
                  />

                  <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 text-emerald-700 font-bold text-center truncate hover:bg-emerald-100 transition-colors shadow-sm">
                    {file ? file.name : "Upload file..."}
                  </div>
                </div>
              </div>

              {/* AI PREVIEW */}

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="text-emerald-950 font-extrabold text-sm uppercase tracking-wider">
                    AI Preview
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1 rounded-full">
                    {analysisLoading
                      ? "Analyzing..."
                      : analysis
                        ? "AI Classified"
                        : "Waiting for image"}
                  </span>
                </div>

                {analysis ? (
                  <div className="space-y-3 text-sm font-semibold text-emerald-900">
                    <div className="flex justify-between items-center">
                      <span>Condition</span>

                      <span className="font-extrabold capitalize">
                        {conditionLabel[analysis.material] ||
                          analysis.material ||
                          analysis.category ||
                          "Unknown"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Confidence</span>

                      <span className="font-extrabold">
                        {analysis.confidence}%
                      </span>
                    </div>

                    {analysis.allPredictions && (
                      <div className="pt-2 space-y-2">
                        {analysis.allPredictions.map((prediction) => (
                          <div
                            key={prediction.material}
                            className="flex items-center gap-3"
                          >
                            <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{
                                  width: `${prediction.confidence}%`,
                                }}
                              />
                            </div>

                            <span className="text-xs font-bold w-24 capitalize">
                              {prediction.material} {prediction.confidence}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isCleanupRequired && (
                      <div className="bg-orange-100 border border-orange-200 text-orange-800 rounded-xl px-4 py-3 font-bold flex items-start gap-2">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />

                        <span>
                          Cleanup / pickup is recommended for this hotspot.
                        </span>
                      </div>
                    )}

                    {analysis.guidance && (
                      <div className="text-emerald-700 leading-relaxed">
                        {analysis.guidance}
                      </div>
                    )}

                    {analysis.action && (
                      <div className="text-emerald-800 font-bold">
                        Action: {analysis.action}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-emerald-700/80">
                    Upload a photo to preview the model's prediction before
                    submitting the report.
                  </div>
                )}
              </div>

              {/* GPS */}

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-emerald-950 font-extrabold text-sm uppercase tracking-wider">
                    Physical Address
                  </label>

                  <button
                    type="button"
                    onClick={detectLocation}
                    className="text-emerald-700 text-xs font-extrabold flex items-center gap-1 hover:text-emerald-900 hover:bg-emerald-100 transition-colors bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm"
                  >
                    <Navigation size={14} />
                    Detect GPS Target
                  </button>
                </div>

                <input
                  className="w-full bg-slate-50 border border-emerald-100 rounded-xl px-5 py-4 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold shadow-sm"
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: e.target.value,
                    })
                  }
                  placeholder="Detect your location or enter address"
                />
              </div>

              {/* COORDINATES */}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-extrabold">
                    Latitude
                  </div>

                  <div className="text-sm font-bold text-emerald-950 mt-1 truncate">
                    {pos?.lat || form.lat || "Not detected"}
                  </div>
                </div>

                <div className="bg-slate-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-extrabold">
                    Longitude
                  </div>

                  <div className="text-sm font-bold text-emerald-950 mt-1 truncate">
                    {pos?.lng || form.lng || "Not detected"}
                  </div>
                </div>
              </div>

              {/* MAP */}

              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                  Geolocation Target
                  <Info size={14} className="text-emerald-500" />
                </label>

                <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-inner h-[250px] relative">
                  <div className="absolute inset-0">
                    <Map
                      position={pos}
                      setPosition={(p) => {
                        setPos(p);

                        if (p) {
                          setForm((prev) => ({
                            ...prev,
                            lat: String(p.lat),
                            lng: String(p.lng),
                          }));
                        }
                      }}
                      markers={[]}
                    />
                  </div>
                </div>

                {pos && (
                  <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={14} />
                    GPS hotspot location selected
                  </div>
                )}
              </div>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg py-4 rounded-xl transition-transform shadow-[0_4px_20px_rgba(5,150,105,0.3)] disabled:opacity-50 hover:-translate-y-0.5 mt-8 flex items-center justify-center gap-2"
            >
              <MapPin size={20} />

              {loading ? "Transmitting Data..." : "Submit Resolution Request"}
            </button>
          </form>
        </div>

        {/* ====================================================
            RIGHT SIDE
        ==================================================== */}

        <div className="lg:col-span-7 flex flex-col gap-8 h-full">
          {/* ACTIVE RADAR */}

          <div className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-emerald-100 shadow-[0_12px_44px_rgba(6,78,59,0.06)] h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
                  Active Incident Radar
                </h2>

                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  Reported outdoor waste hotspots
                </p>
              </div>

              <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live View
              </span>
            </div>

            <div className="rounded-3xl overflow-hidden border border-emerald-200 flex-grow shadow-inner relative min-h-[300px]">
              <div className="absolute inset-0">
                <Map position={null} setPosition={() => {}} markers={reports} />
              </div>
            </div>
          </div>

          {/* CITY FEED */}

          <div className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-emerald-100 shadow-[0_12px_44px_rgba(6,78,59,0.06)] flex-grow hidden lg:flex lg:flex-col overflow-hidden">
            <h2 className="text-2xl font-extrabold text-emerald-950 tracking-tight mb-6 flex items-center gap-2">
              City Feed
              <ExternalLink size={18} className="text-emerald-400" />
            </h2>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {reports.length === 0 ? (
                <div className="p-10 border border-dashed border-emerald-200 bg-emerald-50 rounded-3xl text-center text-emerald-700 font-bold">
                  No incidents reported in the cluster yet.
                </div>
              ) : (
                reports.map((r) => (
                  <div
                    key={r._id || r.id}
                    className="bg-white p-5 rounded-2xl border border-emerald-100 flex gap-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group"
                  >
                    {/* IMAGE */}

                    {r.imageUrl && (
                      <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl overflow-hidden shrink-0 border border-emerald-200 shadow-sm relative">
                        <img
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          src={uploadUrl(r.imageUrl)}
                          alt="Report Log"
                        />
                      </div>
                    )}

                    {/* DETAILS */}

                    <div className="flex-grow flex flex-col justify-center">
                      <h3 className="text-xl font-extrabold text-emerald-950 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {r.title}
                      </h3>

                      <div className="flex gap-2 mt-2 flex-wrap">
                        {/* STATUS */}

                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            r.status === "Resolved"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-orange-100 text-orange-700 border border-orange-200"
                          }`}
                        >
                          {r.status || "Pending"}
                        </span>

                        {/* AI CATEGORY */}

                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          {r.aiCategory || "Unknown"}
                        </span>

                        {/* REPORT TYPE */}

                        {r.reportType && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {r.reportType}
                          </span>
                        )}
                      </div>

                      <p className="text-emerald-700/80 text-sm mt-3 font-semibold line-clamp-2">
                        {r.address || r.description}
                      </p>

                      {/* COORDINATES */}

                      {(r.lat || r.lng) && (
                        <div className="text-xs text-slate-500 mt-2 font-semibold">
                          📍 {r.lat}, {r.lng}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

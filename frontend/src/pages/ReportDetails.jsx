import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  FileText,
  ShieldAlert,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function ReportDetails() {
  const location = useLocation();
  const report = location.state?.report;

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-10 text-center border border-red-100 shadow-sm">
          <FileText
            size={48}
            className="mx-auto text-red-500 mb-4"
          />

          <h2 className="text-2xl font-extrabold text-slate-900">
            Report not found
          </h2>

          <p className="text-slate-500 mt-2">
            Please return to the Admin Reports page and select a report.
          </p>

          <Link
            to="/admin"
            className="inline-flex items-center gap-2 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-extrabold"
          >
            <ArrowLeft size={18} />
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const formatValue = (value) => {
    if (!value) return "Not provided";

    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const coordinates =
    report.location?.coordinates || [];

  const longitude =
    report.lng ??
    coordinates[0];

  const latitude =
    report.lat ??
    coordinates[1];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Back */}
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 text-emerald-700 font-extrabold hover:text-emerald-900 mb-6"
      >
        <ArrowLeft size={18} />
        Back to Reports
      </Link>

      {/* Header */}
      <div className="bg-emerald-950 rounded-[2rem] p-7 md:p-9 text-white shadow-xl mb-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          <div>
            <p className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest mb-2">
              Full Waste Report
            </p>

            <h1 className="text-3xl md:text-4xl font-extrabold">
              {report.title || "Waste Report"}
            </h1>

            <p className="text-emerald-200 mt-2 font-semibold">
              {formatValue(report.reportType)}
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20">
            <span className="text-xs text-emerald-200 block">
              Current Status
            </span>

            <span className="font-extrabold text-lg">
              {formatValue(report.status)}
            </span>
          </div>

        </div>
      </div>

      {/* Image + Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Image */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">

          <div className="p-5 border-b border-emerald-50">
            <h2 className="font-extrabold text-xl text-emerald-950">
              Waste Image
            </h2>
          </div>

          {report.imageUrl ? (
            <img
              src={
                report.imageUrl.startsWith("http")
                  ? report.imageUrl
                  : `http://127.0.0.1:5000${report.imageUrl}`
              }
              alt="Reported waste"
              className="w-full h-[360px] object-cover"
            />
          ) : (
            <div className="h-[360px] flex items-center justify-center text-slate-400 font-semibold">
              No image uploaded
            </div>
          )}

        </div>

        {/* Model Analysis */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">

          <h2 className="font-extrabold text-xl text-emerald-950 mb-5">
            Model Analysis
          </h2>

          <div className="space-y-4">

            <DetailRow
              label="Detected Category"
              value={formatValue(report.aiCategory)}
            />

            <DetailRow
              label="Model Confidence"
              value={
                report.aiConfidence !== undefined
                  ? `${report.aiConfidence}%`
                  : "Not available"
              }
            />

            <DetailRow
              label="Report Type"
              value={formatValue(report.reportType)}
            />

            <DetailRow
              label="Quantity"
              value={formatValue(report.quantity)}
            />

            <DetailRow
              label="Density"
              value={formatValue(report.density)}
            />

            <DetailRow
              label="Hazard"
              value={formatValue(report.hazard)}
            />

            <DetailRow
              label="Severity"
              value={formatValue(report.severity)}
            />

            <DetailRow
              label="Priority"
              value={formatValue(report.priority)}
            />

          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 mb-6">

        <div className="flex items-center gap-3 mb-4">
          <FileText
            size={22}
            className="text-emerald-600"
          />

          <h2 className="font-extrabold text-xl text-emerald-950">
            Description
          </h2>
        </div>

        <p className="text-slate-700 leading-7">
          {report.description || "No description provided."}
        </p>

      </div>

      {/* Location */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 mb-6">

        <div className="flex items-center gap-3 mb-5">
          <MapPin
            size={22}
            className="text-emerald-600"
          />

          <h2 className="font-extrabold text-xl text-emerald-950">
            Location
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <InfoBox
            label="Address"
            value={report.address || "GPS coordinates submitted"}
          />

          <InfoBox
            label="Latitude"
            value={
              Number.isFinite(Number(latitude))
                ? Number(latitude).toFixed(6)
                : "Not available"
            }
          />

          <InfoBox
            label="Longitude"
            value={
              Number.isFinite(Number(longitude))
                ? Number(longitude).toFixed(6)
                : "Not available"
            }
          />

        </div>

      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">

          <div className="flex items-center gap-3 mb-4">
            <Clock
              size={22}
              className="text-emerald-600"
            />

            <h2 className="font-extrabold text-xl text-emerald-950">
              Report Information
            </h2>
          </div>

          <div className="space-y-3">

            <DetailRow
              label="Report ID"
              value={report._id || report.id || "N/A"}
            />

            <DetailRow
              label="Created"
              value={
                report.createdAt
                  ? new Date(report.createdAt).toLocaleString()
                  : "Not available"
              }
            />

            <DetailRow
              label="Updated"
              value={
                report.updatedAt
                  ? new Date(report.updatedAt).toLocaleString()
                  : "Not available"
              }
            />

          </div>
        </div>

        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6">

          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert
              size={22}
              className="text-emerald-600"
            />

            <h2 className="font-extrabold text-xl text-emerald-950">
              Resolution
            </h2>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">

            <CheckCircle
              size={24}
              className="text-emerald-600"
            />

            <div>
              <p className="text-xs text-emerald-700 font-bold uppercase">
                Current Status
              </p>

              <p className="font-extrabold text-emerald-950">
                {formatValue(report.status)}
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 font-semibold">
        {label}
      </span>

      <span className="text-sm text-slate-900 font-extrabold text-right">
        {value}
      </span>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500 font-extrabold mb-1">
        {label}
      </p>

      <p className="text-sm text-slate-900 font-bold break-words">
        {value}
      </p>
    </div>
  );
}
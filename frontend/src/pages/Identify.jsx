import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { predictWaste, predictOutdoorWaste } from "../services/mlApi";
import {
  Camera,
  UploadCloud,
  ShieldAlert,
  BadgeCheck,
  Lightbulb,
  Zap,
  Leaf,
  Recycle,
  TriangleAlert,
  Sparkles,
  ArrowRight,
  Heart,
  Home,
  MapPin,
} from "lucide-react";

export default function Identify() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [workflow, setWorkflow] = useState("household");
  const [result, setResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [err, setErr] = useState("");

  const ClassificationIcon =
    result?.category === "Organic"
      ? Leaf
      : result?.category === "Recyclable"
        ? Recycle
        : result?.category === "Hazardous"
          ? TriangleAlert
          : Sparkles;

  const submit = async () => {
    if (!file) return;

    setLoading(true);
    setErr("");

    try {
      const classification =
  workflow === "outdoor"
    ? await predictOutdoorWaste(file)
    : await predictWaste(file);

      console.log("EcoTrek ML prediction:", classification);

      if (workflow === "outdoor") {
        navigate("/reports", {
          state: {
            file,
            analysis: classification,
            fromIdentify: true,
          },
        });

        return;
      }

      setResult(classification);
      setRecommendation(null);
    } catch (e) {
      console.error("Waste classification failed:", e);

      setErr(e.message || "Unable to classify the waste image.");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = async () => {
    if (!file || !result) return;
    setRecommendationLoading(true);
    setErr("");
    const fd = new FormData();
    fd.append("image", file);
    fd.append("category", result.category);
    fd.append("confidence", result.confidence);
    try {
      navigate("/recommendation", { state: { file, result } });
    } catch (error) {
      setErr(error.message);
    } finally {
      setRecommendationLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 h-full space-y-6">
          <div className="bg-emerald-900 rounded-[2.5rem] p-8 md:p-10 border border-emerald-800 shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 -m-16 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800/80 rounded-full text-emerald-200 font-bold text-xs uppercase tracking-widest mb-6 border border-emerald-500/30">
                <Camera size={14} /> Keras Vision Model
              </span>
              <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                Local Waste Classifier
              </h2>
              <p className="text-emerald-100/90 font-medium text-lg leading-relaxed mb-6">
                Upload a waste image and let the exported Keras model classify
                it into the correct disposal category.
              </p>

              <ul className="space-y-4 border-t border-emerald-500/30 pt-6 mt-auto">
                <li className="flex items-start gap-4">
                  <BadgeCheck
                    className="text-emerald-400 shrink-0 mt-1"
                    size={20}
                  />
                  <span className="text-emerald-50 font-medium">
                    Model-backed image classification
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <Zap className="text-emerald-400 shrink-0 mt-1" size={20} />
                  <span className="text-emerald-50 font-medium">
                    Instant preview from the local service
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <section className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-emerald-100 shadow-[0_8px_40px_rgba(6,78,59,0.06)] relative h-full flex flex-col items-center justify-center">
            <div className="w-full max-w-lg">
              <div className="mb-8">
                <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-600 mb-3">
                  Choose your workflow
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWorkflow("household")}
                    className={`rounded-2xl border p-4 text-left transition ${workflow === "household" ? "border-emerald-500 bg-emerald-100 shadow-sm" : "border-emerald-100 bg-white hover:border-emerald-300"}`}
                  >
                    <span className="flex items-center gap-2 font-extrabold text-emerald-950">
                      <Home size={19} /> Household waste
                    </span>
                    <span className="block text-xs font-semibold text-emerald-700/75 mt-2">
                      Classify it and get reuse or recycle guidance.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkflow("outdoor")}
                    className={`rounded-2xl border p-4 text-left transition ${workflow === "outdoor" ? "border-emerald-500 bg-emerald-100 shadow-sm" : "border-emerald-100 bg-white hover:border-emerald-300"}`}
                  >
                    <span className="flex items-center gap-2 font-extrabold text-emerald-950">
                      <MapPin size={19} /> Outdoor waste
                    </span>
                    <span className="block text-xs font-semibold text-emerald-700/75 mt-2">
                      Classify it, add GPS details, and report it to the city.
                    </span>
                  </button>
                </div>
              </div>

              <div className="relative border-2 border-dashed border-emerald-200 rounded-3xl bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-400 transition-all p-12 flex flex-col items-center justify-center cursor-pointer group shadow-sm text-center">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={(e) => {
                    setFile(e.target.files[0]);
                    setResult(null);
                    setRecommendation(null);
                    setErr("");
                  }}
                />
                <UploadCloud
                  size={56}
                  className="text-emerald-300 group-hover:text-emerald-500 group-hover:scale-110 transition-all mb-4"
                />
                <div className="text-xl font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors mb-2">
                  Upload Waste Image
                </div>
                <div className="text-sm font-semibold text-emerald-600/70">
                  Tap or drag and drop an image here for Keras inference
                </div>
              </div>

              {file && (
                <div className="mt-8 bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    Target Scanned
                  </div>
                  <img
                    className="max-w-full max-h-64 rounded-2xl mx-auto object-contain"
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                  />
                </div>
              )}

              <button
                className="mt-8 w-full bg-emerald-600 px-6 py-4 rounded-2xl text-white font-extrabold text-lg hover:bg-emerald-700 shadow-[0_4px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_8px_30px_rgba(5,150,105,0.4)] transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                disabled={!file || loading}
                onClick={submit}
              >
                {loading ? (
                  <span className="animate-pulse">
                    Processing via AI Authority Node...
                  </span>
                ) : (
                  <>
                    <Camera size={20} />{" "}
                    {workflow === "outdoor"
                      ? "Classify and create report"
                      : "Run Neural Analysis"}
                  </>
                )}
              </button>

              {err && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-left font-bold text-sm flex items-center gap-3">
                  <ShieldAlert size={20} className="shrink-0" /> {err}
                </div>
              )}

              {result && (
                <div className="mt-8 bg-emerald-950 p-8 rounded-3xl text-left shadow-2xl text-emerald-50">
                  <div className="flex items-center gap-4 border-b border-emerald-800 pb-6">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-800/80 flex items-center justify-center text-emerald-400 border border-emerald-600/50 shadow-inner">
                      <ClassificationIcon size={28} />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                        Keras classification
                      </div>
                      <h3 className="text-2xl font-extrabold text-white">
                        {result.category}
                      </h3>

                      <div className="mt-2 text-emerald-200 font-bold text-sm">
                        Detected material:{" "}
                        <span className="text-white capitalize">
                          {result.material}
                        </span>
                      </div>

                      <div className="text-emerald-300 font-bold text-sm mt-1">
                        AI Confidence: {result.confidence}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">

  <div className="rounded-xl bg-emerald-900/80 border border-emerald-800 px-4 py-3">
    <div className="text-xs uppercase tracking-wider font-extrabold text-emerald-400">
      Disposal guidance
    </div>

    <p className="mt-1 text-emerald-100 font-medium">
      {result.guidance}
    </p>
  </div>

  <div className="rounded-xl bg-emerald-900/80 border border-emerald-800 px-4 py-3">
    <div className="text-xs uppercase tracking-wider font-extrabold text-emerald-400">
      Recommended action
    </div>

    <p className="mt-1 text-emerald-100 font-medium">
      {result.action}
    </p>
  </div>

</div>
                  <button
                    type="button"
                    onClick={getRecommendation}
                    disabled={recommendationLoading}
                    className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-extrabold text-emerald-950 hover:bg-emerald-300 disabled:opacity-50"
                  >
                    {recommendationLoading
                      ? "Generating recommendation..."
                      : "Get recycle recommendation"}
                  </button>
                </div>
              )}

              {recommendation && (
                <div className="mt-8 bg-emerald-950 p-8 rounded-3xl text-left shadow-2xl text-emerald-50">
                  <div className="flex items-center gap-4 mb-6 border-b border-emerald-800 pb-6">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-800/80 flex items-center justify-center text-emerald-400 border border-emerald-600/50 shadow-inner">
                      <Sparkles size={28} />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                        Gemini recommendation
                      </div>
                      <h3 className="text-2xl font-extrabold text-white">
                        {recommendation.headline || "Your waste plan"}
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb
                        size={20}
                        className="text-emerald-400 shrink-0 mt-1"
                      />
                      <p className="text-emerald-100 font-medium leading-relaxed">
                        {recommendation.guidance}
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-900/80 border border-emerald-800 px-4 py-3 text-sm font-semibold text-emerald-200">
                      <span className="font-extrabold text-emerald-300">
                        Recommended action:{" "}
                      </span>
                      {recommendation.action}
                    </div>
                    {recommendation.reuseIdeas?.length > 0 && (
                      <div className="rounded-xl bg-emerald-900/80 border border-emerald-800 px-4 py-3">
                        <div className="font-extrabold text-emerald-300 text-sm">
                          Reuse and recycle ideas
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-emerald-100 list-disc pl-5">
                          {recommendation.reuseIdeas.map((idea) => (
                            <li key={idea}>{idea}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recommendation.steps?.length > 0 && (
                      <details className="rounded-xl bg-emerald-900/80 border border-emerald-800 px-4 py-3 group">
                        <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-extrabold text-emerald-200">
                          <span>Make the next step simple</span>
                          <ArrowRight
                            size={17}
                            className="group-open:rotate-90 transition-transform"
                          />
                        </summary>
                        <ol className="mt-3 space-y-2 text-sm text-emerald-100 list-decimal pl-5">
                          {recommendation.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </details>
                    )}
                    {recommendation.whyItMatters && (
                      <div className="flex items-start gap-2 text-sm text-emerald-200">
                        <Heart
                          size={17}
                          className="text-emerald-400 shrink-0 mt-0.5"
                        />
                        {recommendation.whyItMatters}
                      </div>
                    )}
                    {recommendation.safetyNote && (
                      <div className="text-sm font-semibold text-amber-200">
                        Safety: {recommendation.safetyNote}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import {
  ArrowLeft,
  CheckCircle,
  Heart,
  Lightbulb,
  Recycle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function Recommendation() {
  const location = useLocation();
  const navigate = useNavigate();
  const workflow = location.state;
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(
    Boolean(workflow?.file && workflow?.result),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workflow?.file || !workflow?.result) {
      setLoading(false);
      return;
    }
    const generate = async () => {
      const formData = new FormData();
      formData.append("image", workflow.file);
      formData.append("category", workflow.result.category);
      formData.append("confidence", workflow.result.confidence);
      try {
        const advice = await api("/ai/recommend", {
          method: "POST",
          body: formData,
        });
        const disposalReport = await api("/household-disposals", {
          method: "POST",
          body: JSON.stringify({
            ...advice,
            imageUrl: workflow.result.imageUrl,
          }),
        });
        setRecommendation({ ...advice, disposalReport });
      } catch (requestError) {
        setError(
          requestError.message || "Recommendation service is unavailable.",
        );
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, [workflow?.file, workflow?.result]);

  if (!workflow?.file || !workflow?.result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShieldAlert size={42} className="mx-auto text-amber-500 mb-4" />
        <h1 className="text-3xl font-extrabold text-emerald-950">
          Start with an image classification
        </h1>
        <p className="mt-3 text-emerald-800/70 font-medium">
          Your recommendation session is no longer available. Upload the image
          again to continue.
        </p>
        <Link
          to="/identify"
          className="inline-flex items-center gap-2 mt-7 rounded-xl bg-emerald-600 px-5 py-3 text-white font-extrabold"
        >
          <ArrowLeft size={17} /> Back to Identify
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to="/identify"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700 hover:text-emerald-950"
          >
            <ArrowLeft size={16} /> Back to classification
          </Link>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-600 mt-6">
            Household action plan
          </p>
          <h1 className="text-4xl font-extrabold text-emerald-950 mt-2">
            A better next step for your waste
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 font-extrabold text-sm">
          <CheckCircle size={18} /> Saved to your household record
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8">
        <section className="bg-emerald-950 rounded-[2rem] p-7 text-white shadow-xl">
          <div className="rounded-2xl overflow-hidden border border-emerald-700/70 bg-emerald-900">
            <img
              src={URL.createObjectURL(workflow.file)}
              alt="Classified household waste"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="mt-6 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            Keras classification
          </div>
          <div className="flex items-end justify-between gap-4 mt-2">
            <h2 className="text-3xl font-extrabold">
              {workflow.result.category}
            </h2>
            <span className="text-emerald-200 font-bold">
              {workflow.result.confidence}%
            </span>
          </div>
          <div className="mt-5 h-2 rounded-full bg-emerald-900 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{
                width: `${Math.min(Number(workflow.result.confidence) || 0, 100)}%`,
              }}
            />
          </div>
        </section>

        <section className="bg-white rounded-[2rem] border border-emerald-100 shadow-[0_12px_44px_rgba(6,78,59,0.07)] p-7 md:p-9">
          {loading && (
            <div className="py-20 text-center text-emerald-700 font-extrabold animate-pulse">
              Preparing your reuse and recycle plan...
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 font-bold">
              {error}
            </div>
          )}
          {recommendation && (
            <div>
              <div className="flex items-start gap-4 border-b border-emerald-100 pb-6">
                <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Sparkles size={27} />
                </div>
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                    Personalized recommendation
                  </div>
                  <h2 className="text-2xl font-extrabold text-emerald-950 mt-1">
                    {recommendation.headline || "Your waste plan"}
                  </h2>
                </div>
              </div>
              <div className="mt-7 space-y-5">
                {recommendation.guidance && (
                  <div className="flex items-start gap-3">
                    <Lightbulb
                      className="text-emerald-500 shrink-0"
                      size={21}
                    />
                    <p className="text-emerald-900 font-semibold leading-relaxed">
                      {recommendation.guidance}
                    </p>
                  </div>
                )}
                {recommendation.action && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                      Recommended action
                    </div>
                    <p className="mt-2 text-emerald-950 font-extrabold">
                      {recommendation.action}
                    </p>
                  </div>
                )}
                {recommendation.reuseIdeas?.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-extrabold text-emerald-950">
                      <Recycle size={19} className="text-emerald-500" /> Reuse
                      and recycle ideas
                    </h3>
                    <ul className="mt-3 space-y-2 text-emerald-800 font-semibold list-disc pl-6">
                      {recommendation.reuseIdeas.map((idea) => (
                        <li key={idea}>{idea}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {recommendation.steps?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-extrabold text-emerald-950">
                      Simple steps
                    </h3>
                    <ol className="mt-3 space-y-2 text-emerald-800 font-semibold list-decimal pl-6">
                      {recommendation.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {recommendation.whyItMatters && (
                  <div className="flex items-start gap-2 text-sm text-emerald-700 font-semibold">
                    <Heart size={18} className="text-emerald-500 shrink-0" />
                    {recommendation.whyItMatters}
                  </div>
                )}
                {recommendation.safetyNote && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 font-bold">
                    Safety: {recommendation.safetyNote}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate("/identify")}
                className="mt-8 w-full rounded-xl bg-emerald-600 px-5 py-3 text-white font-extrabold hover:bg-emerald-700"
              >
                Classify another item
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

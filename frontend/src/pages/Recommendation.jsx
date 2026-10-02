import React from "react";
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

  /*
   * Identify page sends:
   *
   * {
   *   file,
   *   result
   * }
   *
   * result comes from:
   *
   * FastAPI -> /predict
   */

  if (!workflow?.file || !workflow?.result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShieldAlert
          size={42}
          className="mx-auto text-amber-500 mb-4"
        />

        <h1 className="text-3xl font-extrabold text-emerald-950">
          Start with an image classification
        </h1>

        <p className="mt-3 text-emerald-800/70 font-medium">
          Your recommendation session is no longer available.
          Upload the image again to continue.
        </p>

        <Link
          to="/identify"
          className="inline-flex items-center gap-2 mt-7 rounded-xl bg-emerald-600 px-5 py-3 text-white font-extrabold"
        >
          <ArrowLeft size={17} />
          Back to Identify
        </Link>
      </div>
    );
  }

  const result = workflow.result;

  /*
   * ML RESULT
   */

  const material = result.material || "waste item";

  const category = result.category || "Other";

  const confidence = Number(result.confidence) || 0;

  const guidance =
    result.guidance ||
    "Review the item and dispose of it using the appropriate waste stream.";

  const action =
    result.action ||
    "Use the appropriate local waste stream.";

  /*
   * Compost ideas coming from FastAPI.
   *
   * These are available for organic waste.
   */

  const compostIdeas = result.compostIdeas || [];

  /*
   * MATERIAL-SPECIFIC IDEAS
   */

  const categoryIdeas = {
    organic: [
      "Home composting: combine fruit and vegetable scraps with dry leaves or shredded cardboard.",
      "Garden composting: mix suitable kitchen waste with dry leaves and garden waste.",
      "Small-space composting: use a suitable ventilated composting container.",
      "Vermicomposting: use suitable organic waste with earthworms to create nutrient-rich compost.",
      "Community composting: take suitable organic waste to a nearby community composting facility.",
    ],

    plastic: [
      "Reuse suitable plastic containers for storage after cleaning them thoroughly.",
      "Avoid mixing clean recyclable plastic with food-contaminated waste.",
      "Empty and rinse suitable plastic containers before recycling.",
      "Keep recyclable plastic clean and dry.",
    ],

    cardboard: [
      "Reuse clean cardboard boxes for storage or packing.",
      "Flatten large cardboard boxes to save space.",
      "Remove food contamination before recycling.",
      "Keep cardboard dry so it remains suitable for recycling.",
    ],

    paper: [
      "Reuse one-sided paper for notes or rough work.",
      "Keep paper clean and dry.",
      "Separate paper from food and liquid contamination.",
      "Send suitable paper to the recyclable waste stream.",
    ],

    glass: [
      "Reuse suitable glass jars and containers after cleaning them.",
      "Keep glass separate from other household waste.",
      "Empty containers before recycling.",
      "Handle broken glass carefully and follow appropriate local disposal guidance.",
    ],

    metal: [
      "Reuse suitable metal containers where practical.",
      "Empty and clean food or beverage containers before recycling.",
      "Keep metal separate from organic waste.",
      "Send suitable metal items to the recyclable waste stream.",
    ],

    trash: [
      "This item is classified as non-recyclable by the household model.",
      "Do not mix it with clean recyclable materials.",
      "Keep it separate from organic and recyclable waste.",
      "Place it in the appropriate non-recyclable waste stream.",
    ],
  };

  const ideas =
    categoryIdeas[material.toLowerCase()] || [
      "Separate the item from mixed waste.",
      "Check whether the item can be reused.",
      "Use the appropriate local waste stream.",
    ];

  /*
   * MATERIAL-SPECIFIC SIMPLE STEPS
   */

  const stepsByMaterial = {
    organic: [
      "Separate organic waste from plastic, glass and other non-organic materials.",
      "Choose a suitable composting method.",
      "Add suitable organic material to your composting system.",
    ],

    plastic: [
      "Empty the plastic item.",
      "Rinse and dry it if appropriate.",
      "Place it in the recyclable waste stream.",
    ],

    cardboard: [
      "Remove food or other contamination.",
      "Flatten the cardboard.",
      "Keep it dry and place it in recycling.",
    ],

    paper: [
      "Remove contaminated or wet paper.",
      "Keep clean paper dry.",
      "Place suitable paper in recycling.",
    ],

    glass: [
      "Empty the container.",
      "Keep glass separate from other waste.",
      "Place it in the appropriate glass recycling stream.",
    ],

    metal: [
      "Empty the container.",
      "Rinse it if appropriate.",
      "Place it in the recyclable waste stream.",
    ],

    trash: [
      "Keep the item separate from recyclable materials.",
      "Do not mix it with organic waste.",
      "Place it in the non-recyclable waste stream.",
    ],
  };

  const steps =
    stepsByMaterial[material.toLowerCase()] || [
      `Identified material: ${material}.`,
      "Keep the item separate from incompatible waste.",
      action,
    ];

  /*
   * DISPLAY IDEAS
   *
   * For organic waste, use the structured
   * compostIdeas returned by the backend.
   */

  const displayIdeas =
    material.toLowerCase() === "organic" &&
    compostIdeas.length > 0
      ? compostIdeas
      : ideas;

  /*
   * Dynamic heading
   */

  const ideasHeading =
    material.toLowerCase() === "organic"
      ? "🌱 Composting ideas"
      : material.toLowerCase() === "trash"
      ? "🚫 Disposal guidance"
      : "♻️ Reuse and recycling ideas";

  /*
   * Dynamic icon/intro text
   */

  const recommendationIntro =
    material.toLowerCase() === "organic"
      ? "Turn suitable organic waste into something useful."
      : material.toLowerCase() === "trash"
      ? "Keep non-recyclable waste separate from recyclable materials."
      : "Follow these steps to handle this material responsibly.";

      const handleExcessWasteReport = async () => {
  if (!navigator.geolocation) {
    alert("Location access is required to report excess waste.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const formData = new FormData();

        formData.append(
          "title",
          `Excess Household Waste - ${material}`
        );

        formData.append(
          "description",
          `User reported an excessive quantity of household waste. The model identified the waste as ${material} with ${confidence.toFixed(
            2
          )}% confidence.`
        );

        formData.append("reportType", "Household");
        formData.append("quantity", "High");
        formData.append("density", "High");
        formData.append("hazard", category === "Hazardous" ? "Hazardous" : "None");
        formData.append("severity", "High");

        formData.append("aiCategory", category);
        formData.append("aiConfidence", confidence);

        let address = "";

try {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
  );

  const locationData = await response.json();
  address = locationData.display_name || "";
} catch (error) {
  console.error("Address lookup failed:", error);
}

formData.append("address", address);
formData.append("lat", position.coords.latitude);
formData.append("lng", position.coords.longitude);
       

        if (workflow.file) {
          formData.append("image", workflow.file);
        }

        await api("/reports", {
          method: "POST",
          body: formData,
        });

        alert(
          "Excess waste report created successfully. The Admin team can now see it."
        );

        navigate("/reports");
      } catch (error) {
        console.error("Excess waste report failed:", error);
        alert("Could not create the report. Please try again.");
      }
    },
    () => {
      alert(
        "Please allow location access so we can send the waste report to the correct area."
      );
    }
  );
};

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">

      {/* HEADER */}

      <div className="flex items-center justify-between gap-4 mb-8">

        <div>

          <Link
            to="/identify"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700 hover:text-emerald-950"
          >
            <ArrowLeft size={16} />
            Back to classification
          </Link>

          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-600 mt-6">
            Household action plan
          </p>

          <h1 className="text-4xl font-extrabold text-emerald-950 mt-2">
            A better next step for your waste
          </h1>

        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 font-extrabold text-sm">

          <CheckCircle size={18} />

          AI analysis completed

        </div>

      </div>


      {/* MAIN GRID */}

      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8">


        {/* LEFT — IMAGE + CLASSIFICATION */}

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

            <div>

              <h2 className="text-3xl font-extrabold">
                {category}
              </h2>

              <p className="mt-1 text-emerald-200 capitalize font-semibold">
                Detected material: {material}
              </p>

            </div>

            <span className="text-emerald-200 font-bold">
              {confidence.toFixed(2)}%
            </span>

          </div>


          {/* CONFIDENCE BAR */}

          <div className="mt-5 h-2 rounded-full bg-emerald-900 overflow-hidden">

            <div
              className="h-full rounded-full bg-emerald-400"
              style={{
                width: `${Math.min(confidence, 100)}%`,
              }}
            />

          </div>


          <div className="mt-3 text-xs text-emerald-300 font-semibold">
            AI confidence
          </div>

        </section>


        {/* RIGHT — RECOMMENDATION */}

        <section className="bg-white rounded-[2rem] border border-emerald-100 shadow-[0_12px_44px_rgba(6,78,59,0.07)] p-7 md:p-9">

          <div>

            {/* TITLE */}

            <div className="flex items-start gap-4 border-b border-emerald-100 pb-6">

              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">

                <Sparkles size={27} />

              </div>

              <div>

                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  Personalized recommendation
                </div>

                <h2 className="text-2xl font-extrabold text-emerald-950 mt-1">
                  What you should do with this waste
                </h2>

                <p className="mt-2 text-sm text-emerald-700 font-semibold">
                  {recommendationIntro}
                </p>

              </div>

            </div>


            {/* GUIDANCE */}

            <div className="mt-7 space-y-5">

              <div className="flex items-start gap-3">

                <Lightbulb
                  className="text-emerald-500 shrink-0"
                  size={21}
                />

                <div>

                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 mb-1">
                    Disposal guidance
                  </div>

                  <p className="text-emerald-900 font-semibold leading-relaxed">
                    {guidance}
                  </p>

                </div>

              </div>


              {/* ACTION */}

              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">

                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  Recommended action
                </div>

                <p className="mt-2 text-emerald-950 font-extrabold">
                  {action}
                </p>

              </div>


              {/* IDEAS */}

              <div>

                <h3 className="flex items-center gap-2 text-lg font-extrabold text-emerald-950">

                  <Recycle
                    size={19}
                    className="text-emerald-500"
                  />

                  {ideasHeading}

                </h3>


                <ul className="mt-4 space-y-3">

                  {displayIdeas.map((idea, index) => {

                    /*
                     * Organic backend response:
                     *
                     * {
                     *   title: "...",
                     *   description: "..."
                     * }
                     */

                    const title =
                      typeof idea === "object"
                        ? idea.title
                        : null;

                    const description =
                      typeof idea === "object"
                        ? idea.description
                        : idea;

                    return (
                      <li
                        key={index}
                        className="rounded-xl bg-emerald-50 border border-emerald-100 p-4"
                      >

                        {title && (
                          <div className="font-extrabold text-emerald-950 mb-1">
                            {title}
                          </div>
                        )}

                        <div className="text-emerald-800 font-semibold leading-relaxed">
                          {description}
                        </div>

                      </li>
                    );

                  })}

                </ul>

              </div>


              {/* SIMPLE STEPS */}

              <div>

                <h3 className="text-lg font-extrabold text-emerald-950">
                  Simple steps
                </h3>

                <ol className="mt-4 space-y-3">

                  {steps.map((step, index) => (

                    <li
                      key={index}
                      className="flex items-start gap-3 rounded-xl border border-emerald-100 p-4"
                    >

                      <span className="flex-shrink-0 h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-extrabold">
                        {index + 1}
                      </span>

                      <span className="text-emerald-800 font-semibold leading-relaxed">
                        {step}
                      </span>

                    </li>

                  ))}

                </ol>

              </div>


              {/* ORGANIC EXTRA MESSAGE */}

              {material.toLowerCase() === "organic" && (

                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">

                  <div className="flex items-start gap-3">

                    <span className="text-2xl">
                      🌱
                    </span>

                    <div>

                      <h3 className="font-extrabold text-emerald-950">
                        Give your organic waste a second life
                      </h3>

                      <p className="mt-1 text-sm text-emerald-800 font-semibold leading-relaxed">
                        Instead of sending suitable biodegradable waste
                        to general waste, consider composting it at home,
                        in a garden, or through a community composting
                        system.
                      </p>

                    </div>

                  </div>

                </div>

              )}


              {/* WHY IT MATTERS */}

              <div className="flex items-start gap-2 text-sm text-emerald-700 font-semibold">

                <Heart
                  size={18}
                  className="text-emerald-500 shrink-0"
                />

                <span>
                  Properly separating waste helps keep recyclable
                  materials cleaner and easier to process.
                </span>

              </div>


              {/* SAFETY */}

              {(category === "Hazardous" ||
                material.toLowerCase() === "trash") && (

                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 font-bold">

                  <ShieldAlert
                    size={17}
                    className="inline mr-2"
                  />

                  {material.toLowerCase() === "trash"
                    ? "Do not mix non-recyclable waste with clean recyclable or organic waste."
                    : "Do not mix hazardous material with household recyclable waste."
                  }

                </div>

              )}

            </div>


            {/* BUTTON */}

            <button
              type="button"
              onClick={() => navigate("/identify")}
              className="mt-8 w-full rounded-xl bg-emerald-600 px-5 py-3 text-white font-extrabold hover:bg-emerald-700 transition"
            >
              Classify another item
            </button>

            <button
  type="button"
  onClick={handleExcessWasteReport}
  className="mt-3 w-full rounded-xl border-2 border-amber-400 bg-amber-50 px-5 py-3 text-amber-800 font-extrabold hover:bg-amber-100 transition"
>
  ⚠️ Report Excess Waste
</button>

          </div>

        </section>

      </div>

    </div>
  );
}
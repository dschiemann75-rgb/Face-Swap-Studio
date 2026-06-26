import { useState, useMemo } from "react";
import { FaceData } from "../types";
import { generateEmbedding, calculateCosineSimilarity } from "../data";
import SvgFace from "./SvgFace";
import { Sparkles, HelpCircle, GitCommit, Sliders, Hash } from "lucide-react";

interface StepEmbeddingProps {
  source: FaceData;
  target: FaceData;
  onUpdateSource: (updated: FaceData) => void;
}

export default function StepEmbedding({ source, target, onUpdateSource }: StepEmbeddingProps) {
  const [activeSegment, setActiveSegment] = useState<{ start: number; end: number; desc: string; label: string } | null>(null);

  // Generate vectors and calculate similarity
  const sourceVec = useMemo(() => generateEmbedding(source), [source]);
  const targetVec = useMemo(() => generateEmbedding(target), [target]);

  const similarity = useMemo(() => {
    const sim = calculateCosineSimilarity(sourceVec, targetVec);
    // Map cosine similarity (-1 to 1) to a friendly 0% to 100% metric
    return Math.max(0, Math.min(100, ((sim + 1) / 2) * 100));
  }, [sourceVec, targetVec]);

  // Define logical segments in the 512-dim vector for explanation
  const segments = [
    { start: 0, end: 49, label: "Augen & Blick", desc: "Größe der Augen, Abstand der Pupillen zueinander und Schrägstellung der Augen." },
    { start: 50, end: 149, label: "Nasenform", desc: "Länge der Nase, Breite des Nasenrückens und Form der Nasenspitze." },
    { start: 150, end: 249, label: "Lippen & Mund", desc: "Breite des Mundes, Dicke der Lippen und Verlauf der Mundwinkel." },
    { start: 250, end: 379, label: "Gesichtsform", desc: "Kinnform (z.B. rund oder spitz), Breite des Kiefers, Stirnhöhe und Schläfenbreite." },
    { start: 380, end: 459, label: "Grundmerkmale", desc: "Männliche oder weibliche Züge, Knochenbau der Stirn und Gesichtskonturen." },
    { start: 460, end: 511, label: "Hautton & Licht", desc: "Hautfarbe, Helligkeitsunterschiede und wie das Gesicht auf Schatten und Licht reagiert." },
  ];

  // Helper to get color based on vector weight (-1 to 1)
  const getWeightColor = (val: number) => {
    // scale from -1..1 to 0..255
    if (val > 0) {
      // Emerald green for positive weights
      const alpha = Math.min(1, Math.abs(val) * 1.5);
      return `rgba(16, 185, 129, ${alpha})`;
    } else {
      // Indigo blue for negative weights
      const alpha = Math.min(1, Math.abs(val) * 1.5);
      return `rgba(59, 130, 246, ${alpha})`;
    }
  };

  // Handle fine-tuning sliders
  const handleFeatureChange = (key: keyof FaceData["features"], value: number) => {
    onUpdateSource({
      ...source,
      features: {
        ...source.features,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Interactive controls: Feature modification (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Gesichtsform verändern
            </h3>
            <p className="text-xs text-zinc-200 mb-6 leading-relaxed">
              Verändere die Form und Merkmale des Ausgangsgesichts mit den Reglern. Du siehst sofort live, wie sich der erzeugte Zahlencode rechts anpasst.
            </p>

            <div className="space-y-4">
              {/* Face width */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-100">Gesichtsbreite</span>
                  <span className="text-zinc-300 font-bold">{source.features.faceWidth.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={source.features.faceWidth}
                  onChange={(e) => handleFeatureChange("faceWidth", parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  id="slider-facewidth"
                />
              </div>

              {/* Eye size */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-100">Augengröße</span>
                  <span className="text-zinc-300 font-bold">{source.features.eyeSize.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={source.features.eyeSize}
                  onChange={(e) => handleFeatureChange("eyeSize", parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  id="slider-eyesize"
                />
              </div>

              {/* Eye spacing */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-100">Augenabstand</span>
                  <span className="text-zinc-300 font-bold">{source.features.eyeSpacing.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={source.features.eyeSpacing}
                  onChange={(e) => handleFeatureChange("eyeSpacing", parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  id="slider-eyespacing"
                />
              </div>

              {/* Nose length */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-100">Nasenlänge</span>
                  <span className="text-zinc-300 font-bold">{source.features.noseLength.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={source.features.noseLength}
                  onChange={(e) => handleFeatureChange("noseLength", parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  id="slider-noselength"
                />
              </div>

              {/* Jaw roundness */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-100">Kiefer-Rundung</span>
                  <span className="text-zinc-300 font-bold">{source.features.jawRoundness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.3"
                  step="0.05"
                  value={source.features.jawRoundness}
                  onChange={(e) => handleFeatureChange("jawRoundness", parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  id="slider-jaw"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">Gesichts-Vergleich</span>
            <p className="text-xs text-zinc-200 leading-normal">
              Ein Analyse-Modell vergleicht Gesichter anhand von 512 einzelnen Werten. Je ähnlicher sich zwei Gesichter sehen, desto näher liegen ihre Werte beieinander.
            </p>
          </div>
        </div>

        {/* Center: Live vector comparison (8 cols) */}
        <div className="lg:col-span-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-400" />
                  Der biometrische Zahlencode (Embedding)
                </h3>
                <p className="text-xs text-zinc-200 mt-1">
                  Schritt 2: Das Gesicht in Zahlen übersetzen
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-200 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded font-bold">
                  Code-Umfang: 512 Werte
                </span>
              </div>
            </div>

            {/* Embedding Grid & Vector Display */}
            <div className="space-y-6">
              {/* Comparison Ring */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/60">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  {/* Radial progress circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#1e293b"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#10b981"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - similarity / 100)}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-mono font-bold text-white">{similarity.toFixed(1)}%</span>
                    <span className="text-[8px] uppercase text-zinc-300 font-mono tracking-wide font-bold">Ähnlichkeit</span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-zinc-100 font-bold text-sm">Ähnlichkeit der Gesichtsmerkmale</span>
                  <p className="text-zinc-200 leading-relaxed">
                    Der gemessene Unterschied zwischen den Zahlencodes von <strong>{source.name}</strong> und <strong>{target.name}</strong>.
                    {similarity > 75 ? (
                      <span className="text-emerald-400 block mt-1 font-bold">✓ Sehr große Ähnlichkeit (Als dieselbe Person erkannt)</span>
                    ) : similarity > 45 ? (
                      <span className="text-amber-400 block mt-1 font-bold">⚠ Mittlere Ähnlichkeit (Ähnlicher Knochenbau / Verwandte)</span>
                    ) : (
                      <span className="text-rose-400 block mt-1 font-bold">✗ Geringe Ähnlichkeit (Eindeutig andere Personen)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Embedding Heatmaps */}
              <div className="space-y-4">
                {/* Source Vector Heatmap */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-200 mb-1.5 font-bold">
                    <span>{source.name} - Gesichts-Zahlencode</span>
                    <span className="text-[10px] text-zinc-400">512 einzelne Messwerte</span>
                  </div>
                  <div className="grid grid-cols-32 gap-0.5 p-1 bg-zinc-950 border border-zinc-800 rounded-lg">
                    {sourceVec.map((v, i) => {
                      const isHighlighted = activeSegment && i >= activeSegment.start && i <= activeSegment.end;
                      return (
                        <div
                          key={`s_v_${i}`}
                          className={`aspect-square rounded-[1px] transition-all duration-200 ${
                            isHighlighted ? "ring-1 ring-white scale-110 z-10" : ""
                          }`}
                          style={{ backgroundColor: getWeightColor(v) }}
                          title={`Index ${i}: ${v.toFixed(4)}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Target Vector Heatmap */}
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-200 mb-1.5 font-bold">
                    <span>{target.name} - Gesichts-Zahlencode</span>
                    <span className="text-[10px] text-zinc-400">512 einzelne Messwerte</span>
                  </div>
                  <div className="grid grid-cols-32 gap-0.5 p-1 bg-zinc-950 border border-zinc-800 rounded-lg">
                    {targetVec.map((v, i) => {
                      const isHighlighted = activeSegment && i >= activeSegment.start && i <= activeSegment.end;
                      return (
                        <div
                          key={`t_v_${i}`}
                          className={`aspect-square rounded-[1px] transition-all duration-200 ${
                            isHighlighted ? "ring-1 ring-white scale-110 z-10" : ""
                          }`}
                          style={{ backgroundColor: getWeightColor(v) }}
                          title={`Index ${i}: ${v.toFixed(4)}`}
                        />
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 px-1 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Negative Werte</span>
                  </div>
                  <div className="text-zinc-300">Fahre mit der Maus über die Felder unten, um Abschnitte anzuzeigen</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Positive Werte</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Segment Explainer */}
          <div className="mt-6 border-t border-zinc-800 pt-6">
            <span className="text-xs font-mono text-zinc-300 block mb-3 font-bold">Zahlencode-Abschnitte und ihre Bedeutung:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {segments.map((seg, idx) => {
                const isActive = activeSegment?.label === seg.label;
                return (
                  <button
                    key={idx}
                    onMouseEnter={() => setActiveSegment({ ...seg })}
                    onMouseLeave={() => setActiveSegment(null)}
                    onClick={() => setActiveSegment(isActive ? null : { ...seg })}
                    className={`p-2 rounded-xl text-left border transition-all text-[10px] flex flex-col justify-between h-18 ${
                      isActive 
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-zinc-950/50 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:text-white"
                    }`}
                    id={`btn-seg-${idx}`}
                  >
                    <span className="font-semibold truncate">{seg.label}</span>
                    <span className="font-mono text-[9px] text-zinc-400 mt-1 font-bold">
                      Bereich {seg.start}-{seg.end}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Segment Description Panel */}
            <div className="mt-4 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl min-h-[64px] flex items-center">
              {activeSegment ? (
                <div className="text-xs">
                  <strong className="text-emerald-400">{activeSegment.label} (Werte {activeSegment.start} bis {activeSegment.end}): </strong>
                  <span className="text-zinc-100 font-medium">{activeSegment.desc}</span>
                </div>
              ) : (
                <p className="text-xs text-zinc-300 flex items-center gap-1.5 w-full justify-center">
                  <GitCommit className="w-4 h-4 text-zinc-500" />
                  Bewege den Zeiger über ein Segment, um zu sehen, welche Gesichtsabschnitte die Zahlen beschreiben.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

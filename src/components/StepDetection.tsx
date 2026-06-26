import { useState, useMemo } from "react";
import { FaceData, FaceLandmark } from "../types";
import SvgFace from "./SvgFace";
import { Eye, ShieldAlert, CheckCircle2, Info, EyeOff } from "lucide-react";

interface StepDetectionProps {
  source: FaceData;
  target: FaceData;
}

export default function StepDetection({ source, target }: StepDetectionProps) {
  const [confidence, setConfidence] = useState<number>(0.75);
  const [showMesh, setShowMesh] = useState<boolean>(true);
  const [showBox, setShowBox] = useState<boolean>(true);
  const [hoveredLandmark, setHoveredLandmark] = useState<FaceLandmark | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Simulating detection states based on confidence slider
  const detectionState = useMemo(() => {
    if (confidence < 0.25) {
      return {
        status: "over-sensitive",
        message: "Der Schwellenwert ist zu niedrig! Das Programm sieht Gesichter, wo gar keine sind (z.B. im Hintergrund oder am Helm).",
        hasGhostBoxes: true,
        landmarksExtracted: true,
        isSuccess: false,
      };
    } else if (confidence > 0.93) {
      return {
        status: "under-sensitive",
        message: "Der Schwellenwert ist zu streng! Das Gesicht wird nicht erkannt, weil die Messlatte zu hoch liegt.",
        hasGhostBoxes: false,
        landmarksExtracted: false,
        isSuccess: false,
      };
    } else {
      return {
        status: "optimal",
        message: "Perfekt! Das Gesicht wurde sofort gefunden und alle 34 Messpunkte wurden exakt platziert.",
        hasGhostBoxes: false,
        landmarksExtracted: true,
        isSuccess: true,
      };
    }
  }, [confidence]);

  const categories = [
    { id: "jaw", label: "Kinn- & Kieferform", count: 9, color: "border-emerald-500 text-emerald-400" },
    { id: "eye", label: "Augen & Pupillen", count: 10, color: "border-blue-500 text-blue-400" },
    { id: "eyebrow", label: "Augenbrauen", count: 8, color: "border-indigo-500 text-indigo-400" },
    { id: "nose", label: "Nasenform", count: 5, color: "border-amber-500 text-amber-400" },
    { id: "mouth", label: "Mund & Lippen", count: 7, color: "border-rose-500 text-rose-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Interactive Playground: 8 cols */}
        <div className="lg:col-span-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Gesichter finden & Messpunkte setzen
                </h3>
                <p className="text-xs text-zinc-200 mt-1">
                  Schritt 1: Gesicht im Bild aufspüren
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBox(!showBox)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                    showBox ? "bg-rose-500/10 text-rose-300 border border-rose-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                  }`}
                  id="btn-toggle-box"
                >
                  {showBox ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Such-Rahmen
                </button>
                <button
                  onClick={() => setShowMesh(!showMesh)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                    showMesh ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                  }`}
                  id="btn-toggle-mesh"
                >
                  {showMesh ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Punkte-Netz
                </button>
              </div>
            </div>

            {/* Simulated Side-by-Side Face Scanners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center my-4">
              {/* Source Face Scan */}
              <div className="relative flex flex-col items-center">
                <div className="absolute top-2 left-2 z-10 bg-zinc-950/80 backdrop-blur border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300">
                  QUELLE (SOURCE)
                </div>
                <div className="w-full max-w-[280px]">
                  <SvgFace
                    idPrefix="src-detect"
                    face={source}
                    showBoundingBox={showBox && detectionState.isSuccess || (showBox && detectionState.hasGhostBoxes)}
                    showLandmarks={detectionState.landmarksExtracted}
                    showMeshLines={showMesh && detectionState.landmarksExtracted}
                    highlightCategory={selectedCategory}
                    onLandmarkHover={setHoveredLandmark}
                  />
                </div>
                <p className="text-xs text-zinc-200 mt-2 font-mono">{source.name}</p>
              </div>

              {/* Target Face Scan */}
              <div className="relative flex flex-col items-center">
                <div className="absolute top-2 left-2 z-10 bg-zinc-950/80 backdrop-blur border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300">
                  ZIEL (TARGET)
                </div>
                <div className="w-full max-w-[280px]">
                  <SvgFace
                    idPrefix="tgt-detect"
                    face={target}
                    showBoundingBox={showBox && detectionState.isSuccess}
                    showLandmarks={detectionState.landmarksExtracted}
                    showMeshLines={showMesh && detectionState.landmarksExtracted}
                    highlightCategory={selectedCategory}
                    onLandmarkHover={setHoveredLandmark}
                  />
                </div>
                {/* Simulated background "Ghost" bounding box if threshold too low */}
                {showBox && detectionState.hasGhostBoxes && (
                  <div className="absolute top-1/4 right-2 border border-rose-600 border-dashed rounded p-1 animate-pulse bg-rose-900/10 pointer-events-none">
                    <span className="text-[8px] font-mono text-rose-400 block font-bold">FEHLER: Fehlalarm</span>
                    <span className="text-[8px] font-mono text-rose-300 block">Hintergrund fälschlicherweise erkannt</span>
                  </div>
                )}
                <p className="text-xs text-zinc-200 mt-2 font-mono">{target.name}</p>
              </div>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="mt-6 border-t border-zinc-800 pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300">Mindest-Sicherheit für die Erkennung:</span>
                <span className={`font-bold ${detectionState.isSuccess ? "text-emerald-400" : "text-rose-400"}`}>
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.99"
                step="0.01"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full accent-rose-500 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                id="conf-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>0.05 (Zu empfindlich)</span>
                <span>Optimaler Bereich: 0.50 - 0.85</span>
                <span>0.99 (Zu streng)</span>
              </div>
            </div>

            {/* Dynamic system log status */}
            <div className={`p-3 rounded-xl border flex items-start gap-3 transition-colors duration-300 ${
              detectionState.status === "optimal" 
                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
                : "bg-rose-950/20 border-rose-500/20 text-rose-300"
            }`}>
              {detectionState.isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <span className="font-bold block uppercase tracking-wider font-mono text-[10px] mb-0.5">
                  Zustand: {detectionState.status === "optimal" ? "Perfekt" : detectionState.status === "over-sensitive" ? "Zu empfindlich" : "Zu streng"}
                </span>
                <p className="text-zinc-100 leading-relaxed font-medium">{detectionState.message}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info and Landmark Explorer: 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Detailed explanations */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Wie die Gesichtserkennung funktioniert
            </h4>
            <div className="space-y-3 text-xs leading-relaxed text-zinc-200">
              <p>
                Bevor überhaupt etwas getauscht werden kann, muss der Computer erst einmal wissen, wo auf dem Bild sich ein Gesicht befindet. Dafür scannt ein Such-Programm das Foto.
              </p>
              <p>
                Es zieht einen Kasten (<strong>Such-Rahmen</strong>) um das Gesicht und markiert sofort wichtige Fixpunkte – wie Augen, Nase, Mundwinkel und Kinnlinie. Diese Punkte heißen <strong>Landmarks</strong> (Orientierungspunkte).
              </p>
              <p>
                Diese Punkte zeigen dem Computer genau, in welche Richtung die Person schaut, ob der Kopf geneigt ist und wie groß der Abstand zwischen den Augen ist. Dadurch kann das neue Gesicht später perfekt gedreht und eingepasst werden.
              </p>
            </div>
          </div>

          {/* Interactive Landmark Explorer */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-100 mb-3">Bedeutung der Punkte</h4>
              <p className="text-xs text-zinc-200 mb-4 leading-relaxed">
                Klicke auf einen Bereich, um zu erfahren, warum er wichtig ist. Du kannst auch mit der Maus direkt über die Punkte im Gesicht fahren.
              </p>

              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onMouseEnter={() => setSelectedCategory(cat.id)}
                    onMouseLeave={() => setSelectedCategory(null)}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex justify-between items-center ${
                      selectedCategory === cat.id
                        ? "bg-zinc-800/80 border-blue-500/50 text-blue-300 font-medium"
                        : "bg-zinc-950/40 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:text-white"
                    }`}
                    id={`btn-cat-${cat.id}`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {cat.count} Pts
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hovered Landmark Details Display */}
            <div className="mt-6 p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl min-h-[110px] flex flex-col justify-center">
              {hoveredLandmark ? (
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold block mb-1">
                    Gewählter Messpunkt: {hoveredLandmark.name}
                  </span>
                  <p className="text-xs text-zinc-100 leading-relaxed font-medium">
                    {hoveredLandmark.description}
                  </p>
                  <span className="text-[9px] font-mono text-zinc-400 block mt-2">
                    Position auf dem Bild: X: {hoveredLandmark.x.toFixed(1)}% | Y: {hoveredLandmark.y.toFixed(1)}%
                  </span>
                </div>
              ) : selectedCategory ? (
                <div>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold block mb-1">
                    Gesichtszone: {categories.find((c) => c.id === selectedCategory)?.label}
                  </span>
                  <p className="text-xs text-zinc-100 leading-relaxed font-medium">
                    {selectedCategory === "jaw" && "Kinn- und Kieferlinie: Sie sorgt dafür, dass das getauschte Gesicht exakt mit der Kopfform des anderen Bildes abschließt und nicht unnatürlich verrutscht."}
                    {selectedCategory === "eye" && "Augen und Pupillen: Damit das Programm weiß, wohin die Person blickt, und ob die Augen geöffnet, geschlossen oder am Blinzeln sind."}
                    {selectedCategory === "eyebrow" && "Augenbrauen: Sie übertragen die Stimmung. Damit hochgezogene Brauen, Staunen oder ein skeptischer Blick echt rüberkommen."}
                    {selectedCategory === "nose" && "Nase: Sie verrät dem Computer, wie der Kopf im Raum gedreht ist (z.B. im Profil), damit das neue Gesicht nicht wie flach aufgeklebt aussieht."}
                    {selectedCategory === "mouth" && "Mund und Lippen: Verhindert, dass beim Sprechen oder Lächeln die Lippen verzerrt wirken, und passt die Mundform perfekt an das Zielbild an."}
                  </p>
                </div>
              ) : (
                <div className="text-center py-2">
                  <span className="inline-block w-6 h-6 rounded-full border border-dashed border-zinc-600 text-zinc-400 text-xs flex items-center justify-center mx-auto mb-1 font-mono">?</span>
                  <p className="text-xs text-zinc-300 leading-normal">
                    Bewege den Mauszeiger über die Punkte im Gesicht, um mehr über ihre Aufgabe zu erfahren.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, MouseEvent, TouchEvent } from "react";
import { FaceData } from "../types";
import SvgFace from "./SvgFace";
import { Sparkles, Eye, ZoomIn, Sliders, AlertCircle } from "lucide-react";

interface StepEnhancementProps {
  source: FaceData;
  target: FaceData;
}

export default function StepEnhancement({ source, target }: StepEnhancementProps) {
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100 %
  const [restorationStrength, setRestorationStrength] = useState<number>(0.8);
  const [fidelity, setFidelity] = useState<number>(0.65);
  const [showLens, setShowLens] = useState<boolean>(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle split-slider dragging
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const onMouseMove = (e: MouseEvent) => {
    // If clicking/dragging, update slider position
    if (e.buttons === 1) {
      handleMove(e.clientX);
    }

    // Also update magnifying glass coordinates relative to container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setLensPos({
        x: Math.max(0, Math.min(100, (x / rect.width) * 100)),
        y: Math.max(0, Math.min(100, (y / rect.height) * 100)),
      });
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Interactive Comparison Stage (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  Qualität verbessern (Schärfung)
                </h3>
                <p className="text-xs text-zinc-200 mt-1">
                  Schritt 4: Details wie Augen, Haut und Haare scharfzeichnen
                </p>
              </div>
              <button
                onClick={() => setShowLens(!showLens)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all font-bold cursor-pointer ${
                  showLens ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-zinc-800 text-zinc-200 border border-zinc-750"
                }`}
                id="btn-toggle-lens"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                Lupe {showLens ? "An" : "Aus"}
              </button>
            </div>

            {/* Draggable Split comparison viewport */}
            <div 
              ref={containerRef}
              onMouseMove={onMouseMove}
              onTouchMove={onTouchMove}
              onMouseEnter={() => setShowLens(true)}
              onMouseLeave={() => setShowLens(false)}
              className="relative w-full max-w-[450px] mx-auto aspect-square rounded-xl overflow-hidden cursor-ew-resize select-none border border-zinc-800 shadow-2xl"
              id="split-container"
            >
              {/* Left Side: Low-Res Raw Output (Underneath layer) */}
              <div className="absolute inset-0 w-full h-full">
                <SvgFace
                  idPrefix="enhance-blurry"
                  face={target}
                  blendFace={source}
                  blendFactor={1.0} // Fully swapped
                  isPixelated={true}
                  restorationStrength={restorationStrength}
                />
                <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-mono text-rose-300 font-bold border border-rose-900/50">
                  Vorher (unscharfer Tausch): 128x128 px
                </div>
              </div>

              {/* Right Side: Enhanced Output (Clipped Overlay layer) */}
              <div 
                className="absolute inset-0 h-full overflow-hidden"
                style={{ width: `${100 - sliderPos}%`, left: `${sliderPos}%` }}
              >
                <div 
                  className="absolute top-0 h-full aspect-square"
                  style={{ width: containerRef.current?.getBoundingClientRect().width || 450, left: `-${sliderPos}%` }}
                >
                  <SvgFace
                    idPrefix="enhance-restored"
                    face={target}
                    blendFace={source}
                    blendFactor={1.0} // Fully swapped
                    isPixelated={false}
                  />
                </div>
                <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-mono text-emerald-300 font-bold border border-emerald-950/50">
                  Nachher (scharfgezeichnet): HD-Gesicht
                </div>
              </div>

              {/* Interactive Draggable Split Bar */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 cursor-ew-resize"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-400 border-2 border-zinc-950 shadow flex items-center justify-center text-zinc-950 font-bold text-xs">
                  ↔
                </div>
              </div>

              {/* Hover Zoom magnifying glass lens */}
              {showLens && (
                <div 
                  className="absolute w-28 h-28 rounded-full border-2 border-amber-400 shadow-2xl bg-[#080b12] overflow-hidden pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ left: `${lensPos.x}%`, top: `${lensPos.y}%` }}
                >
                  {/* Magnified view based on mouse side */}
                  <div 
                    className="absolute w-[350%] h-[350%] scale-150"
                    style={{ 
                      left: `-${lensPos.x * 3.5}%`, 
                      top: `-${lensPos.y * 3.5}%`,
                    }}
                  >
                    <SvgFace
                      idPrefix="enhance-lens"
                      face={target}
                      blendFace={source}
                      blendFactor={1.0}
                      isPixelated={lensPos.x < sliderPos} // Pixelate inside lens only if lens is on the left side!
                      restorationStrength={restorationStrength}
                    />
                  </div>
                  {/* Small pointer center crosshair */}
                  <div className="absolute w-2 h-2 border-t border-l border-amber-400"></div>
                </div>
              )}
            </div>
            
            <p className="text-center text-[11px] text-zinc-300 font-bold font-mono mt-3">
              Bewege den Regler im Bild von links nach rechts, um den Unterschied vor und nach dem Schärfen zu sehen.
            </p>
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-6">
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-100 font-medium leading-normal">
                <strong>Warum ist das nötig?</strong> Beim Gesichtstausch entstehen oft unscharfe Gesichter, weil der Computer sehr schnell rechnen muss. Ein zweiter Filter (der Qualitätsverbesserer) analysiert das unscharfe Bild und zeichnet Details wie Wimpern, Hautporen und Lichtreflexe in den Augen fotorealistisch nach.
              </p>
            </div>
          </div>
        </div>

        {/* Right Parameters panel & explanations (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Einstellungen zur Bildverbesserung
            </h3>
            <p className="text-xs text-zinc-200 mb-6 leading-relaxed">
              Passe an, wie stark das Bild nachbearbeitet werden soll. Diese Regler zeigen dir, wie die Schärfung im echten System eingestellt werden kann.
            </p>

            <div className="space-y-6">
              {/* Strength */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-zinc-100">Schärfungs-Stärke</span>
                  <span className="text-amber-400 font-bold">{(restorationStrength * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={restorationStrength}
                  onChange={(e) => setRestorationStrength(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  id="enhancer-strength"
                />
                <p className="text-[10px] text-zinc-300 font-bold leading-normal">
                  Bestimmt, wie viele feine Details (wie Hautstrukturen oder Haarsträhnen) rekonstruiert werden.
                </p>
              </div>

              {/* Fidelity / Alignment weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-zinc-100">Originaltreue</span>
                  <span className="text-amber-400 font-bold">{(fidelity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={fidelity}
                  onChange={(e) => setFidelity(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  id="enhancer-fidelity"
                />
                <p className="text-[10px] text-zinc-300 font-bold leading-normal">
                  Bestimmt, wie nah das Ergebnis am Ausgangsgesicht bleiben soll, damit die Person erkennbar bleibt.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">Technische Details</h4>
            <div className="space-y-2 text-xs font-mono font-bold">
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Auflösung beim Tausch:</span>
                <span className="text-rose-400">128 x 128 px</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Auflösung nach Schärfung:</span>
                <span className="text-emerald-400">1024 x 1024 px</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-850">
                <span className="text-zinc-400">Bildqualität:</span>
                <span className="text-emerald-400">Hervorragend</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Rechenzeit (pro Bild):</span>
                <span className="text-zinc-200">Sehr schnell (~45 ms)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

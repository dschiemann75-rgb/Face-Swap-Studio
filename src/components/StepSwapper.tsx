import { useState, useEffect } from "react";
import { FaceData } from "../types";
import SvgFace from "./SvgFace";
import { Cpu, ArrowRight, Zap, Info, ShieldCheck } from "lucide-react";

interface StepSwapperProps {
  source: FaceData;
  target: FaceData;
}

export default function StepSwapper({ source, target }: StepSwapperProps) {
  const [blendFactor, setBlendFactor] = useState<number>(0.5);
  const [animateFlow, setAnimateFlow] = useState<boolean>(true);
  const [flowCycle, setFlowCycle] = useState<number>(0);

  // Simple interval to simulate continuous glowing network flow
  useEffect(() => {
    if (!animateFlow) return;
    const interval = setInterval(() => {
      setFlowCycle((prev) => (prev + 1) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, [animateFlow]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Pipeline Scheme & Projection Control (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-zinc-800 pb-4 mb-6">
              <h3 className="text-lg font-medium text-white tracking-tight flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                Gesichter verschmelzen (Der Tausch)
              </h3>
              <p className="text-xs text-zinc-200 mt-1">
                Schritt 3: Wie die Identität getauscht wird
              </p>
            </div>

            {/* Neural network visualization layout */}
            <div className="space-y-6">
              <p className="text-xs text-zinc-100 leading-relaxed font-medium">
                Der Tausch-Algorithmus nimmt den Zahlencode des Ausgangsgesichts (Quelle) und überträgt ihn auf das Zielgesicht. Dabei bleiben der Gesichtsausdruck (Lächeln, Blinzeln) und die Kopfhaltung des Zielbilds vollständig erhalten.
              </p>

              {/* Data Injection Flow Diagram */}
              <div className="relative bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden">
                {/* Glowing flow lines */}
                {animateFlow && (
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div 
                      className="absolute h-0.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500 w-1/2 transition-all duration-[40ms] ease-linear"
                      style={{ left: `${(flowCycle * 1.5) % 150 - 50}%`, top: "30%" }}
                    />
                    <div 
                      className="absolute h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 w-1/3 transition-all duration-[40ms] ease-linear"
                      style={{ left: `${((flowCycle + 50) * 1.5) % 150 - 50}%`, top: "70%" }}
                    />
                  </div>
                )}

                {/* Source Node */}
                <div className="flex flex-col items-center bg-zinc-900/80 border border-zinc-800 px-3 py-2 rounded-lg text-center w-full md:w-1/3 z-10">
                  <span className="text-[9px] font-mono text-zinc-300 uppercase tracking-widest font-bold">Quelle (Ausgangsbild)</span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 truncate max-w-full">{source.name}</span>
                  <div className="mt-1.5 px-1.5 py-0.5 bg-emerald-950/30 border border-emerald-900/30 rounded text-[8px] font-mono text-emerald-300 font-bold">
                    Gesicht als Zahlencode
                  </div>
                </div>

                <div className="flex items-center shrink-0">
                  <ArrowRight className="w-5 h-5 text-indigo-500 animate-pulse hidden md:block" />
                  <Zap className="w-5 h-5 text-indigo-500 animate-bounce block md:hidden" />
                </div>

                {/* Target Expressions Node */}
                <div className="flex flex-col items-center bg-zinc-900/80 border border-zinc-800 px-3 py-2 rounded-lg text-center w-full md:w-1/3 z-10">
                  <span className="text-[9px] font-mono text-zinc-300 uppercase tracking-widest font-bold">Ziel (Hintergrundbild)</span>
                  <span className="text-xs font-bold text-indigo-400 mt-1 truncate max-w-full">{target.name}</span>
                  <div className="mt-1.5 px-1.5 py-0.5 bg-indigo-950/30 border border-indigo-900/30 rounded text-[8px] font-mono text-indigo-300 font-bold">
                    Ausdruck & Haltung
                  </div>
                </div>
              </div>

              {/* Stabilizer stats table */}
              <div className="bg-zinc-950/30 border border-zinc-800 rounded-xl p-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div>
                  <span className="text-zinc-300 font-mono text-[9px] uppercase block">Kopfhaltung</span>
                  <span className="text-white font-mono font-bold text-sm">{target.expression.headTilt}°</span>
                  <span className="text-emerald-400 text-[8px] font-mono block">Übernommen</span>
                </div>
                <div>
                  <span className="text-zinc-300 font-mono text-[9px] uppercase block">Mund & Lippen</span>
                  <span className="text-white font-mono font-bold text-sm">{target.expression.smile > 0 ? "Lächeln" : "Ernst"}</span>
                  <span className="text-emerald-400 text-[8px] font-mono block">Passt sich an</span>
                </div>
                <div>
                  <span className="text-zinc-300 font-mono text-[9px] uppercase block">Licht & Schatten</span>
                  <span className="text-white font-mono font-bold text-sm">Integriert</span>
                  <span className="text-emerald-400 text-[8px] font-mono block">Hintergrund-Angepasst</span>
                </div>
              </div>
            </div>
          </div>

          {/* Morphing controls */}
          <div className="mt-6 border-t border-zinc-800 pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-zinc-100">Tausch-Stärke (Mischverhältnis):</span>
                <span className="text-indigo-400 font-bold">{(blendFactor * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={blendFactor}
                onChange={(e) => setBlendFactor(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                id="blend-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-300 font-bold">
                <span>0% (Reines Zielbild: {target.name})</span>
                <span>50% (Verschmolzen)</span>
                <span>100% (Komplett getauscht auf {source.name})</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-200 font-bold">
                <input
                  type="checkbox"
                  checked={animateFlow}
                  onChange={(e) => setAnimateFlow(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                  id="chk-animate-flow"
                />
                Fluss-Animation anzeigen
              </label>

              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                <ShieldCheck className="w-4 h-4" />
                Gesichtsausdruck-Schutz aktiv
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Morph Preview (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold block mb-4">
            Live-Mischung
          </span>
          
          <div className="w-full max-w-[320px]">
            <SvgFace
              idPrefix="morph-canvas"
              face={target}
              blendFace={source}
              blendFactor={blendFactor}
              showMeshLines={blendFactor > 0.05 && blendFactor < 0.95}
            />
          </div>

          <div className="mt-4 max-w-[320px] text-xs text-zinc-100 font-medium leading-normal">
            {blendFactor === 0 ? (
              <p>Unberührtes Originalgesicht von <strong>{target.name}</strong>.</p>
            ) : blendFactor === 1 ? (
              <p>Komplett getauscht! Das Gesicht hat jetzt die Merkmale von <strong>{source.name}</strong>, behält aber den Ausdruck von <strong>{target.name}</strong> bei.</p>
            ) : (
              <p>Mischform: Beide Gesichter verschmelzen stufenlos miteinander. Aktuell bei {(blendFactor*100).toFixed(0)}% Stärke.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

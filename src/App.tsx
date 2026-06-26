import { useState } from "react";
import { PRESETS } from "./data";
import { FaceData } from "./types";
import StepDetection from "./components/StepDetection";
import StepEmbedding from "./components/StepEmbedding";
import StepSwapper from "./components/StepSwapper";
import StepEnhancement from "./components/StepEnhancement";
import Glossary from "./components/Glossary";
import SvgFace from "./components/SvgFace";
import FaceSwapStudio from "./components/FaceSwapStudio";
import { 
  Scan, 
  Cpu, 
  Sparkles, 
  Hash, 
  Layers, 
  Play, 
  RotateCcw, 
  Wrench,
  HelpCircle,
  Code
} from "lucide-react";

export default function App() {
  const [appMode, setAppMode] = useState<"studio" | "explain">("studio");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("monalisa_astronaut");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showConfigurator, setShowConfigurator] = useState<boolean>(false);

  // Deep clone presets to avoid mutating static source data
  const [customPresets, setCustomPresets] = useState<typeof PRESETS>(() => JSON.parse(JSON.stringify(PRESETS)));

  const activePreset = customPresets.find((p) => p.id === selectedPresetId) || customPresets[0];

  // Handler to let child components update the active source face properties
  const handleUpdateSource = (updatedSource: FaceData) => {
    setCustomPresets((prev) => 
      prev.map((p) => (p.id === selectedPresetId ? { ...p, source: updatedSource } : p))
    );
  };

  // Handler to let user customize the target face properties
  const handleUpdateTarget = (updatedTarget: FaceData) => {
    setCustomPresets((prev) => 
      prev.map((p) => (p.id === selectedPresetId ? { ...p, target: updatedTarget } : p))
    );
  };

  // Reset current preset to static original data
  const handleResetPreset = () => {
    const original = PRESETS.find((p) => p.id === selectedPresetId);
    if (original) {
      setCustomPresets((prev) => 
        prev.map((p) => (p.id === selectedPresetId ? JSON.parse(JSON.stringify(original)) : p))
      );
    }
  };

  const steps = [
    {
      id: 1,
      title: "1. Gesicht finden",
      short: "Erkennung",
      icon: Scan,
      color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
      activeColor: "bg-rose-500 text-white shadow-rose-500/20",
      desc: "Der Computer scannt das Bild, findet alle Gesichter und setzt Fixpunkte auf Nase, Augen und Mund.",
    },
    {
      id: 2,
      title: "2. Merkmale messen",
      short: "Analyse",
      icon: Hash,
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      activeColor: "bg-emerald-500 text-white shadow-emerald-500/20",
      desc: "Die charakteristischen Züge des Ausgangsgesichts werden in einen einzigartigen Zahlencode übersetzt.",
    },
    {
      id: 3,
      title: "3. Gesicht tauschen",
      short: "Projektion",
      icon: Cpu,
      color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
      activeColor: "bg-indigo-500 text-white shadow-indigo-500/20",
      desc: "Der Zahlencode wird auf das Zielgesicht übertragen, sodass Gesichtsausdruck und Umgebung erhalten bleiben.",
    },
    {
      id: 4,
      title: "4. Bild scharfzeichnen",
      short: "Enhancement",
      icon: Sparkles,
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      activeColor: "bg-amber-500 text-white shadow-amber-500/20",
      desc: "Das fertige Bild wird scharfgezeichnet und fehlende Details wie Wimpern und Hautporen werden hinzugefügt.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080c] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Decorative Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Main Header / Navigation */}
      <header className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-600 flex items-center justify-center shadow-lg shadow-indigo-500/15">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-indigo-400 block tracking-widest leading-none">INTERAKTIVE ANLEITUNG</span>
              <h1 className="text-sm font-semibold tracking-tight text-white mt-1">Deepfake-Wirkungsweise</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => setAppMode("studio")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                appMode === "studio"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Face-Swap Studio
            </button>
            <button
              onClick={() => setAppMode("explain")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                appMode === "explain"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Wie es funktioniert
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 z-10 relative">
        
        {appMode === "studio" ? (
          <FaceSwapStudio />
        ) : (
          <>
            {/* Intro/Concept Banner Card */}
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-950/10 via-transparent to-transparent pointer-events-none rounded-full"></div>
          
          <div className="space-y-3 max-w-3xl">
            <span className="text-xs font-mono font-bold text-rose-500 uppercase tracking-widest bg-rose-500/5 border border-rose-500/15 px-2.5 py-1 rounded-full">
              Funktionsweise verständlich erklärt
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-snug">
              Wie funktionieren Deepfakes und Gesichtstausch?
            </h2>
            <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed font-medium">
              Moderne Programme erzeugen gefälschte Bilder oder Videos meist mit Hilfe von mehreren spezialisierten Filtern nacheinander. In diesem interaktiven Guide kannst du die 4 Stufen einer solchen Bild-Pipeline Schritt für Schritt ausprobieren und verstehen.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={() => setShowConfigurator(!showConfigurator)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                showConfigurator 
                  ? "bg-zinc-100 text-zinc-950 border-white font-semibold shadow-lg shadow-white/5"
                  : "bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-700 hover:text-white"
              }`}
              id="btn-toggle-config"
            >
              <Wrench className="w-3.5 h-3.5" />
              Gesichtszüge anpassen
            </button>
            <button
              onClick={handleResetPreset}
              className="px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-850 hover:border-zinc-700 transition-all cursor-pointer"
              id="btn-reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Zurücksetzen
            </button>
          </div>
        </div>

        {/* Preset Selector Card */}
        <div className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs font-mono text-zinc-200 font-bold">Schritt 1: Gesichter auswählen:</span>
            <div className="flex flex-wrap gap-2">
              {customPresets.map((p) => {
                const isActive = p.id === selectedPresetId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPresetId(p.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs transition-all border font-bold cursor-pointer ${
                      isActive 
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15" 
                        : "bg-zinc-950 border-zinc-850 text-zinc-300 hover:text-zinc-100 hover:border-zinc-750"
                    }`}
                    id={`btn-preset-${p.id}`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-zinc-100 font-medium leading-relaxed max-w-4xl pt-1">
            {activePreset.description}
          </p>
        </div>

        {/* Custom Face Configurator Drawer/Panel (Conditional) */}
        {showConfigurator && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Custom Source Configuration */}
            <div className="space-y-4 border-r border-zinc-800/50 pr-0 md:pr-8">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-emerald-400">AUSGANGSGESICHT (QUELLE):</span>
                <span className="text-xs text-zinc-300 font-mono font-bold">{activePreset.source.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-200 font-bold font-mono block">Hautfarbe:</label>
                  <select
                    value={activePreset.source.faceColor}
                    onChange={(e) => handleUpdateSource({ ...activePreset.source, faceColor: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-zinc-700 cursor-pointer"
                    id="select-src-skin"
                  >
                    <option value="#f2ceab">Hell (Standard)</option>
                    <option value="#e6c295">Renaissance-Warm</option>
                    <option value="#7d5d44">Dunkelbraun</option>
                    <option value="#e0d5f5">Cyber-Pale (Bläulich)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-200 font-bold font-mono block">Augenfarbe:</label>
                  <select
                    value={activePreset.source.eyeColor}
                    onChange={(e) => handleUpdateSource({ ...activePreset.source, eyeColor: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-zinc-700 cursor-pointer"
                    id="select-src-eyes"
                  >
                    <option value="#3a628c">Ozeanblau</option>
                    <option value="#524335">Haselnussbraun</option>
                    <option value="#223d24">Smaragdgrün</option>
                    <option value="#c20a41">Künstliches Rot</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-200 font-bold font-mono block flex justify-between">
                  <span>Mundwinkel (Quelle):</span>
                  <span className="text-zinc-300 font-bold">{(activePreset.source.expression.smile * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="-0.8"
                  max="0.8"
                  step="0.1"
                  value={activePreset.source.expression.smile}
                  onChange={(e) => handleUpdateSource({
                    ...activePreset.source,
                    expression: { ...activePreset.source.expression, smile: parseFloat(e.target.value) }
                  })}
                  className="w-full accent-indigo-500 bg-zinc-950 rounded-lg appearance-none h-1.5 cursor-pointer"
                  id="range-src-smile"
                />
              </div>
            </div>

            {/* Custom Target Configuration */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-indigo-400">HINTERGRUNDGESICHT (ZIEL):</span>
                <span className="text-xs text-zinc-300 font-mono font-bold">{activePreset.target.name}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-200 font-bold font-mono block">Kopfneigung (Ziel):</label>
                  <select
                    value={activePreset.target.expression.headTilt}
                    onChange={(e) => handleUpdateTarget({
                      ...activePreset.target,
                      expression: { ...activePreset.target.expression, headTilt: parseInt(e.target.value) }
                    })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-zinc-700 cursor-pointer"
                    id="select-tgt-tilt"
                  >
                    <option value="-12">Nicken links (-12°)</option>
                    <option value="-6">Leicht links (-6°)</option>
                    <option value="0">Gerade (0°)</option>
                    <option value="6">Leicht rechts (6°)</option>
                    <option value="12">Nicken rechts (12°)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-200 font-bold font-mono block flex justify-between">
                    <span>Augenöffnung (Ziel):</span>
                  </label>
                  <select
                    value={activePreset.target.expression.eyeOpenness}
                    onChange={(e) => handleUpdateTarget({
                      ...activePreset.target,
                      expression: { ...activePreset.target.expression, eyeOpenness: parseFloat(e.target.value) }
                    })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-zinc-700 cursor-pointer"
                    id="select-tgt-eyes"
                  >
                    <option value="0.2">Zugekniffen (20%)</option>
                    <option value="0.5">Müde / Gelassen (50%)</option>
                    <option value="0.8">Normal (80%)</option>
                    <option value="1.0">Weit offen (100%)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-200 font-bold font-mono block flex justify-between">
                  <span>Mundwinkel (Ziel):</span>
                  <span className="text-zinc-300 font-bold">{(activePreset.target.expression.smile * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="-0.8"
                  max="0.8"
                  step="0.1"
                  value={activePreset.target.expression.smile}
                  onChange={(e) => handleUpdateTarget({
                    ...activePreset.target,
                    expression: { ...activePreset.target.expression, smile: parseFloat(e.target.value) }
                  })}
                  className="w-full accent-indigo-500 bg-zinc-950 rounded-lg appearance-none h-1.5 cursor-pointer"
                  id="range-tgt-smile"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4 Steps Navigation Tabs */}
        <div className="space-y-4">
          <span className="text-xs font-mono text-zinc-200 font-bold block">Schritt 2: Wähle eine Stufe der Bearbeitung:</span>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((st) => {
              const isActive = st.id === activeStep;
              const Icon = st.icon;
              return (
                <button
                  key={st.id}
                  onClick={() => setActiveStep(st.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isActive 
                      ? "bg-zinc-900 border-indigo-500/80 text-white shadow-xl shadow-indigo-950/10 font-bold" 
                      : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-300 hover:text-white"
                  }`}
                  id={`btn-step-${st.id}`}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      isActive ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" : st.color
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">STUFE 0{st.id}</span>
                  </div>
                  <h4 className="text-xs font-bold truncate">{st.title}</h4>
                  <p className="text-[10px] text-zinc-200 leading-normal mt-1.5 line-clamp-2 md:line-clamp-none font-medium">
                    {st.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Interactive Playground Card Container */}
        <div className="bg-zinc-950/50 border border-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden min-h-[480px]">
          {/* Animated decorative grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#111115_1px,transparent_1px),linear-gradient(to_bottom,#111115_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40"></div>

          <div className="relative z-10">
            {activeStep === 1 && (
              <StepDetection 
                source={activePreset.source} 
                target={activePreset.target} 
              />
            )}
            {activeStep === 2 && (
              <StepEmbedding 
                source={activePreset.source} 
                target={activePreset.target}
                onUpdateSource={handleUpdateSource}
              />
            )}
            {activeStep === 3 && (
              <StepSwapper 
                source={activePreset.source} 
                target={activePreset.target} 
              />
            )}
            {activeStep === 4 && (
              <StepEnhancement 
                source={activePreset.source} 
                target={activePreset.target} 
              />
            )}
          </div>
        </div>

            {/* Glossary Block (Deep Dive Technical specifications) */}
            <Glossary />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 mt-12 text-zinc-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Google AI Studio Build. Alle Rechte vorbehalten. Dokumentation für Bildverarbeitungs-Pipelines.</p>
          <div className="flex items-center gap-4 text-zinc-500 font-mono text-[10px]">
            <span>Modul: InsightFace / ArcFace / GFPGAN</span>
            <span>•</span>
            <span>Framework: Express + Vite + React 19</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

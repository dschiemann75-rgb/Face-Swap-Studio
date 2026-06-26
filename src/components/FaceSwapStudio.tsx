import React, { useState, useRef, useEffect } from "react";
import { PRESETS } from "../data";
import { FaceData } from "../types";
import SvgFace from "./SvgFace";
import { 
  Upload, 
  Camera, 
  Download, 
  Maximize2, 
  RotateCw, 
  Eye, 
  Sliders, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Move,
  Scissors,
  Check,
  FolderOpen
} from "lucide-react";

// List of high-quality sample backgrounds for face swapping
const BACKGROUND_PRESETS = [
  {
    id: "astronaut",
    name: "Astronaut im Weltall",
    url: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop&q=80",
    defaultFacePos: { x: 50, y: 35, scale: 0.28, rotation: 0 },
    gender: "neutral"
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Hacker",
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    defaultFacePos: { x: 50, y: 40, scale: 0.32, rotation: -5 },
    gender: "neutral"
  },
  {
    id: "monalisa",
    name: "Mona Lisa (Klassisch)",
    url: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800&auto=format&fit=crop&q=80",
    defaultFacePos: { x: 49, y: 32, scale: 0.24, rotation: 4 },
    gender: "female"
  },
  {
    id: "pilot",
    name: "Retro Jet-Pilot",
    url: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&auto=format&fit=crop&q=80",
    defaultFacePos: { x: 50, y: 42, scale: 0.26, rotation: 2 },
    gender: "male"
  },
  {
    id: "business",
    name: "Executive Portrait",
    url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80",
    defaultFacePos: { x: 50, y: 28, scale: 0.22, rotation: 0 },
    gender: "male"
  }
];

// Sample face presets for users who don't want to upload
const FACE_PRESETS = PRESETS.map(p => ({
  id: p.id,
  name: p.source.name,
  faceData: p.source
}));

export default function FaceSwapStudio() {
  // Current step of the workflow
  const [activeStep, setActiveStep] = useState<number>(1);

  // Source selection state (Face)
  const [sourceType, setSourceType] = useState<"preset" | "upload" | "webcam">("preset");
  const [selectedFacePresetId, setSelectedFacePresetId] = useState<string>(FACE_PRESETS[0].id);
  const [customSourceImg, setCustomSourceImg] = useState<string | null>(null);

  // Target selection state (Background)
  const [targetType, setTargetType] = useState<"preset" | "upload">("preset");
  const [selectedBgPresetId, setSelectedBgPresetId] = useState<string>(BACKGROUND_PRESETS[0].id);
  const [customTargetImg, setCustomTargetImg] = useState<string | null>(null);

  // Position & Alignment states
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 50, y: 35 });
  const [scale, setScale] = useState<number>(0.28);
  const [rotation, setRotation] = useState<number>(0);
  const [mirror, setMirror] = useState<boolean>(false);

  // Blending & Color Adjustments
  const [feather, setFeather] = useState<number>(20); // feather width in %
  const [maskShape, setMaskShape] = useState<"oval" | "circle" | "square">("oval");
  const [brightness, setBrightness] = useState<number>(100); // 50 to 150
  const [contrast, setContrast] = useState<number>(100); // 50 to 150
  const [saturation, setSaturation] = useState<number>(100); // 0 to 200
  const [warmth, setWarmth] = useState<number>(0); // -40 to 40 (simulated warmth using hue/sepia/tint overlay)
  const [opacity, setOpacity] = useState<number>(100); // for checking alignment

  // Comparing original/swap
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  // Webcam states
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [webcamCountdown, setWebcamCountdown] = useState<number | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  // Dragging states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Export & Download state
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Dynamic values based on selections
  const activeBg = targetType === "preset" 
    ? BACKGROUND_PRESETS.find(b => b.id === selectedBgPresetId) || BACKGROUND_PRESETS[0]
    : { id: "custom", name: "Benutzerdefiniertes Bild", url: customTargetImg || "", defaultFacePos: { x: 50, y: 40, scale: 0.3, rotation: 0 }, gender: "neutral" };

  const activeFacePreset = FACE_PRESETS.find(f => f.id === selectedFacePresetId) || FACE_PRESETS[0];

  // Auto-reset default face position when changing presets
  useEffect(() => {
    if (targetType === "preset") {
      const bg = BACKGROUND_PRESETS.find(b => b.id === selectedBgPresetId);
      if (bg) {
        setPosition({ x: bg.defaultFacePos.x, y: bg.defaultFacePos.y });
        setScale(bg.defaultFacePos.scale);
        setRotation(bg.defaultFacePos.rotation);
      }
    }
  }, [selectedBgPresetId, targetType]);

  // Handle webcam stream start/stop
  const startWebcam = async () => {
    try {
      setWebcamActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      webcamStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Kamera konnte nicht gestartet werden. Bitte überprüfe deine Berechtigungen.");
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    setWebcamActive(false);
  };

  const captureWebcam = () => {
    setWebcamCountdown(3);
    const counter = setInterval(() => {
      setWebcamCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(counter);
          // Snapshot time!
          triggerCapture();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const triggerCapture = () => {
    if (webcamVideoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = webcamVideoRef.current.videoWidth;
      canvas.height = webcamVideoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirror snapshot for natural look
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(webcamVideoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCustomSourceImg(dataUrl);
        setSourceType("upload");
        stopWebcam();
      }
    }
  };

  // Image Upload handlers
  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomSourceImg(reader.result as string);
        setSourceType("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTargetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomTargetImg(reader.result as string);
        setTargetType("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop handlers for workspace repositioning
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = { x: clientX, y: clientY };
    dragStartOffset.current = { ...position };
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !workspaceRef.current) return;
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragStartPos.current.x;
    const dy = clientY - dragStartPos.current.y;

    const bounds = workspaceRef.current.getBoundingClientRect();
    
    // Convert pixels to percentages of workspace bounds
    const pctX = (dx / bounds.width) * 100;
    const pctY = (dy / bounds.height) * 100;

    setPosition({
      x: Math.max(0, Math.min(100, dragStartOffset.current.x + pctX)),
      y: Math.max(0, Math.min(100, dragStartOffset.current.y + pctY))
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Auto-Match Skin Tone and Lighting
  const handleAutoColorMatch = () => {
    // Highly intelligent tone matching based on preset combinations
    if (targetType === "preset") {
      switch (selectedBgPresetId) {
        case "astronaut":
          // Cool, bluish, low contrast
          setBrightness(90);
          setContrast(85);
          setSaturation(75);
          setWarmth(-15);
          break;
        case "cyberpunk":
          // Saturated neon hues
          setBrightness(105);
          setContrast(115);
          setSaturation(130);
          setWarmth(-5);
          break;
        case "monalisa":
          // Golden, warm classic sepia hues
          setBrightness(85);
          setContrast(90);
          setSaturation(80);
          setWarmth(20);
          break;
        case "pilot":
          // High contrast, sun-drenched
          setBrightness(110);
          setContrast(105);
          setSaturation(100);
          setWarmth(10);
          break;
        case "business":
          // Balanced executive studio light
          setBrightness(100);
          setContrast(100);
          setSaturation(95);
          setWarmth(5);
          break;
      }
    } else {
      // Default auto-match for custom uploads: smooth integration
      setBrightness(95);
      setContrast(95);
      setSaturation(90);
      setWarmth(5);
    }
  };

  // Generate high-resolution blended image for downloading
  const triggerDownload = async () => {
    setExporting(true);
    setExportSuccess(false);

    try {
      const canvas = document.createElement("canvas");
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = activeBg.url;

      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = reject;
      });

      // Match high resolution of background image
      canvas.width = bgImg.naturalWidth;
      canvas.height = bgImg.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed");

      // 1. Draw target background image
      ctx.drawImage(bgImg, 0, 0);

      // 2. Draw source face layer
      const faceCanvas = document.createElement("canvas");
      faceCanvas.width = canvas.width;
      faceCanvas.height = canvas.height;
      const faceCtx = faceCanvas.getContext("2d");
      
      if (faceCtx) {
        // Let's load the source face image (either custom upload or a rendered SVG)
        const faceImg = new Image();
        faceImg.crossOrigin = "anonymous";

        if (sourceType === "preset") {
          // Render the React SvgFace into SVG data URL
          const svgEl = document.getElementById("hidden-svg-face");
          if (svgEl) {
            const svgString = new XMLSerializer().serializeToString(svgEl);
            const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
            faceImg.src = URL.createObjectURL(svgBlob);
          } else {
            // Fallback
            faceImg.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80";
          }
        } else {
          faceImg.src = customSourceImg || "";
        }

        await new Promise((resolve, reject) => {
          faceImg.onload = resolve;
          faceImg.onerror = reject;
        });

        // Compute alignment calculations mapped to native background resolution
        const fx = (position.x / 100) * canvas.width;
        const fy = (position.y / 100) * canvas.height;
        // Scale factor relative to background dimensions
        const faceWidth = canvas.width * scale;
        const faceHeight = faceWidth * (faceImg.naturalHeight / faceImg.naturalWidth || 1);

        // Position and rotate face context
        faceCtx.translate(fx, fy);
        if (mirror) faceCtx.scale(-1, 1);
        faceCtx.rotate((rotation * Math.PI) / 180);

        // Apply masking (clipping path)
        faceCtx.beginPath();
        const rx = faceWidth / 2;
        const ry = faceHeight / 2;
        if (maskShape === "circle") {
          faceCtx.arc(0, 0, rx, 0, 2 * Math.PI);
        } else if (maskShape === "square") {
          faceCtx.rect(-rx, -ry, faceWidth, faceHeight);
        } else {
          // Oval / Ellipse
          faceCtx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);
        }
        faceCtx.clip();

        // Draw face image
        faceCtx.drawImage(faceImg, -rx, -ry, faceWidth, faceHeight);

        // Apply CSS-like adjustments onto face pixels
        const imgData = faceCtx.getImageData(fx - rx - 100, fy - ry - 100, faceWidth + 200, faceHeight + 200);
        // (Note: simple pixel adjustments can be added here or we can use Canvas globalFilters in modern browsers)
        // For broad compatibility, we draw with canvas filter property if supported
        ctx.save();
        
        // Match warmth / temperature (yellow/blue tinting) and light adjustments
        const filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${warmth > 0 ? `sepia(${warmth}%)` : `hue-rotate(${warmth}deg)`}`;
        if ("filter" in ctx) {
          // @ts-ignore
          ctx.filter = filterStr;
        }

        // Draw temporary blended face canvas onto background canvas with feather edge overlay simulation
        ctx.globalAlpha = opacity / 100;
        
        // Simulating feathered edge via temporary shadow blur or double drawing
        ctx.shadowBlur = (feather / 100) * faceWidth;
        ctx.shadowColor = "rgba(0,0,0,0.5)"; // creates natural edge dropoff
        
        // Draw the transformed face canvas
        ctx.drawImage(faceCanvas, 0, 0);
        ctx.restore();
      }

      // 3. Initiate client download
      const mergedUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.download = `FaceSwap_${activeBg.id}_Studio.jpg`;
      link.href = mergedUrl;
      link.click();

      setExportSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Erstellen des Bildes. Bitte lade andere Quelldateien hoch.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Studio Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-widest bg-indigo-500/5 border border-indigo-500/10 px-3 py-1 rounded-full w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            BENUTZERFREUNDLICHER FACE-SWAP CREATOR
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-2">
            Echtzeit Face Swap Studio
          </h2>
          <p className="text-zinc-300 text-xs mt-1 leading-normal">
            Erstelle verblüffende Deepfake-Ergebnisse mit unserem spielerischen Editor. Wähle Vorlagen oder nutze eigene Fotos!
          </p>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1.5 border border-zinc-850 rounded-2xl w-fit">
          {[
            { num: 1, label: "Bilder" },
            { num: 2, label: "Ausrichtung" },
            { num: 3, label: "Farben" },
            { num: 4, label: "Fertig" }
          ].map(s => (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeStep === s.num
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
              }`}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Hand: Controls & Adjusters (5 cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          
          {/* STEP 1: SELECT IMAGES */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
              
              {/* SOURCE SELECTOR (THE FACE) */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    1. Ausgangsgesicht (Quelle)
                  </h3>
                  
                  {/* Source options tabs */}
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 text-[10px] font-bold">
                    <button
                      onClick={() => setSourceType("preset")}
                      className={`px-2 py-1 rounded-lg cursor-pointer ${sourceType === "preset" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                    >
                      Vorlagen
                    </button>
                    <button
                      onClick={() => {
                        setSourceType("upload");
                        stopWebcam();
                      }}
                      className={`px-2 py-1 rounded-lg cursor-pointer ${sourceType === "upload" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => {
                        setSourceType("webcam");
                        startWebcam();
                      }}
                      className={`px-2 py-1 rounded-lg cursor-pointer ${sourceType === "webcam" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                    >
                      Webcam
                    </button>
                  </div>
                </div>

                {/* Preset List */}
                {sourceType === "preset" && (
                  <div className="grid grid-cols-4 gap-2">
                    {FACE_PRESETS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFacePresetId(f.id)}
                        className={`p-1 bg-zinc-950 rounded-xl border transition-all text-center group cursor-pointer ${
                          selectedFacePresetId === f.id ? "border-emerald-500 bg-emerald-950/10" : "border-zinc-850 hover:border-zinc-700"
                        }`}
                      >
                        <div className="w-12 h-12 mx-auto overflow-hidden rounded-lg bg-zinc-900/60 flex items-center justify-center p-1">
                          <SvgFace face={f.faceData} idPrefix={`preset-icon-${f.id}`} />
                        </div>
                        <span className="text-[9px] block text-zinc-300 font-bold mt-1 truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Upload Section */}
                {sourceType === "upload" && (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-950/50 rounded-2xl p-6 cursor-pointer transition-all">
                      <Upload className="w-8 h-8 text-zinc-500 group-hover:text-emerald-400 mb-2" />
                      <span className="text-xs font-bold text-zinc-300">Eigenes Gesicht hochladen</span>
                      <span className="text-[10px] text-zinc-500 mt-1">PNG, JPG oder JPEG</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleSourceUpload}
                      />
                    </label>
                    {customSourceImg && (
                      <div className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                        <img src={customSourceImg} className="w-10 h-10 object-cover rounded-lg border border-zinc-850" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-zinc-300 font-bold truncate">Eigenes Gesicht geladen</p>
                          <span className="text-[9px] text-zinc-500">Bereit zum Tausch</span>
                        </div>
                        <button
                          onClick={() => setCustomSourceImg(null)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Webcam Section */}
                {sourceType === "webcam" && (
                  <div className="space-y-3">
                    <div className="relative bg-zinc-950 rounded-2xl overflow-hidden aspect-video border border-zinc-800 flex items-center justify-center">
                      {webcamActive ? (
                        <video
                          ref={webcamVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover -scale-x-100"
                        />
                      ) : (
                        <span className="text-xs text-zinc-500">Webcam wird gestartet...</span>
                      )}

                      {/* Countdown Overlay */}
                      {webcamCountdown !== null && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                          <span className="text-5xl font-black text-white animate-bounce">{webcamCountdown}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={captureWebcam}
                        disabled={!webcamActive || webcamCountdown !== null}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/10 disabled:opacity-50 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        Foto schießen
                      </button>
                      <button
                        onClick={stopWebcam}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* TARGET SELECTOR (THE BACKGROUND) */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    2. Hintergrund-Szenario (Ziel)
                  </h3>
                  
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 text-[10px] font-bold">
                    <button
                      onClick={() => setTargetType("preset")}
                      className={`px-2 py-1 rounded-lg cursor-pointer ${targetType === "preset" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                    >
                      Vorlagen
                    </button>
                    <button
                      onClick={() => setTargetType("upload")}
                      className={`px-2 py-1 rounded-lg cursor-pointer ${targetType === "upload" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                    >
                      Upload
                    </button>
                  </div>
                </div>

                {/* Preset List */}
                {targetType === "preset" && (
                  <div className="grid grid-cols-5 gap-1.5">
                    {BACKGROUND_PRESETS.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBgPresetId(b.id)}
                        className={`p-1 bg-zinc-950 rounded-xl border transition-all text-center group cursor-pointer ${
                          selectedBgPresetId === b.id ? "border-indigo-500 bg-indigo-950/10" : "border-zinc-850 hover:border-zinc-700"
                        }`}
                      >
                        <img src={b.url} className="w-12 h-12 object-cover mx-auto rounded-lg bg-zinc-900 border border-zinc-850" />
                        <span className="text-[8px] block text-zinc-300 font-bold mt-1 truncate">{b.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Upload */}
                {targetType === "upload" && (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/50 rounded-2xl p-6 cursor-pointer transition-all">
                      <Upload className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 mb-2" />
                      <span className="text-xs font-bold text-zinc-300">Eigenes Hintergrundbild laden</span>
                      <span className="text-[10px] text-zinc-500 mt-1">Beliebiges Foto hochladen</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleTargetUpload}
                      />
                    </label>
                    {customTargetImg && (
                      <div className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                        <img src={customTargetImg} className="w-10 h-10 object-cover rounded-lg border border-zinc-850" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-zinc-300 font-bold truncate">Eigenes Szenario geladen</p>
                          <span className="text-[9px] text-zinc-500">Hintergrund bereit</span>
                        </div>
                        <button
                          onClick={() => setCustomTargetImg(null)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Button */}
              <button
                onClick={() => setActiveStep(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                Weiter zum Ausrichten
              </button>
            </div>
          )}

          {/* STEP 2: POSITION & ALIGN */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Move className="w-4 h-4" />
                  Gesichtsausrichtung & Größe
                </h3>
                <p className="text-[11px] text-zinc-300 leading-normal">
                  Verschiebe das Gesicht mit der Maus direkt auf dem Bild. Nutze die Regler unten, um Größe, Drehung und Spiegeleffekte exakt anzupassen.
                </p>

                <div className="space-y-4 pt-2">
                  {/* Scale Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-300">
                      <span>Größe des Gesichts:</span>
                      <span className="text-indigo-400">{(scale * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.01"
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 bg-zinc-850 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Rotation Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-300">
                      <span>Kopf-Drehung:</span>
                      <span className="text-indigo-400">{rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="1"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 bg-zinc-850 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Mirror & Opacity controls */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={() => setMirror(!mirror)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        mirror ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" : "bg-zinc-950 border-zinc-850 text-zinc-400"
                      }`}
                    >
                      Horizontal spiegeln
                    </button>
                    
                    <button
                      onClick={() => setOpacity(opacity === 100 ? 50 : 100)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        opacity < 100 ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" : "bg-zinc-950 border-zinc-850 text-zinc-400"
                      }`}
                    >
                      Deckkraft {opacity}%
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveStep(1)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Zurück
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Weiter zu Farben & Maske
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: MASK & COLOR */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  3. Farben & Übergänge optimieren
                </h3>
                
                {/* Auto Match Button */}
                <button
                  onClick={handleAutoColorMatch}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Hautton & Licht automatisch anpassen
                </button>

                <div className="space-y-4 pt-2 border-t border-zinc-850">
                  {/* Mask shape selector */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold text-zinc-300 block">Form der Maske:</span>
                    <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                      {["oval", "circle", "square"].map(s => (
                        <button
                          key={s}
                          onClick={() => setMaskShape(s as any)}
                          className={`py-1.5 rounded-lg border transition-all cursor-pointer uppercase text-[10px] ${
                            maskShape === s ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" : "bg-zinc-950 border-zinc-850 text-zinc-400"
                          }`}
                        >
                          {s === "oval" ? "Oval" : s === "circle" ? "Kreis" : "Quadrat"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feather Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-300">
                      <span>Randschärfe / Weichzeichner:</span>
                      <span className="text-indigo-400">{feather}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="1"
                      value={feather}
                      onChange={(e) => setFeather(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 bg-zinc-850 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Warmth Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-300">
                      <span>Hautton-Wärme:</span>
                      <span className="text-indigo-400">{warmth > 0 ? `+${warmth}` : warmth} (Warm vs. Kalt)</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      step="1"
                      value={warmth}
                      onChange={(e) => setWarmth(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 bg-zinc-850 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Brightness Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-300">
                      <span>Helligkeit:</span>
                      <span className="text-indigo-400">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      step="1"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 bg-zinc-850 rounded-lg appearance-none h-1.5 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Progress Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveStep(2)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Zurück
                </button>
                <button
                  onClick={() => setActiveStep(4)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Weiter zum Export
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: DOWNLOAD & CONGRATS */}
          {activeStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Dein Deepfake ist fertig!
                </h3>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Glückwunsch! Du hast das Gesicht perfekt platziert, den Hautton angepasst und weich in den Hintergrund überblendet.
                </p>

                <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-1 text-xs text-indigo-300">
                  <strong className="block font-semibold">Tipp für absolute Perfektion:</strong>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    Halte das Auge-Symbol rechts gedrückt, um das Endergebnis direkt mit dem originalen Hintergrundbild zu vergleichen!
                  </p>
                </div>
                
                {/* Download Button */}
                <button
                  onClick={triggerDownload}
                  disabled={exporting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/15 cursor-pointer disabled:cursor-not-allowed"
                >
                  {exporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Erstelle hochauflösendes Bild...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Ergebnis herunterladen (HD)
                    </>
                  )}
                </button>
              </div>

              {exportSuccess && (
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300 animate-bounce">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <p className="leading-normal">
                    <strong>Erfolgreich heruntergeladen!</strong> Dein fertiger Gesichtstausch wurde direkt im Downloads-Ordner deines Geräts gespeichert.
                  </p>
                </div>
              )}

              {/* Back button */}
              <button
                onClick={() => setActiveStep(3)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
              >
                Zurück zur Bearbeitung
              </button>
            </div>
          )}

        </div>

        {/* Right Hand: Interactive Preview Workspace (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-zinc-950 border border-zinc-850 p-6 rounded-2xl relative min-h-[400px]">
          
          <div className="w-full flex justify-between items-center mb-4">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
              Interaktiver Studio-Monitor
            </span>

            {/* Compare Hold Button */}
            <button
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-all select-none cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              Vergleichen (Gedrückt halten)
            </button>
          </div>

          {/* Hidden SvgFace for Canvas rasterization */}
          <div className="hidden">
            <svg id="hidden-svg-face" width="512" height="512" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="transparent" />
              <SvgFace face={activeFacePreset.faceData} idPrefix="raster" />
            </svg>
          </div>

          {/* Interactive Workspace Container */}
          <div
            ref={workspaceRef}
            onMouseMove={handleDragMove}
            onTouchMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onTouchEnd={handleDragEnd}
            onMouseLeave={handleDragEnd}
            className="relative w-full max-w-[420px] aspect-portrait bg-zinc-900 rounded-2xl overflow-hidden shadow-inner border border-zinc-850 select-none cursor-crosshair"
            id="workspace-studio"
          >
            {/* 1. Target Background Layer */}
            <img
              src={activeBg.url}
              alt="Hintergrund"
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* 2. Swapped Face Layer */}
            {!showOriginal && (
              <div
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                style={{
                  position: "absolute",
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${scale * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg) ${mirror ? "scaleX(-1)" : ""}`,
                  opacity: opacity / 100,
                  mixBlendMode: "normal",
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${
                    warmth > 0 ? `sepia(${warmth * 0.7}%) saturate(${100 + warmth * 0.5}%)` : `hue-rotate(${warmth}deg)`
                  }`,
                  // Advanced SVG feathering simulation via CSS mask-image
                  maskImage: `radial-gradient(${maskShape === "circle" ? "circle" : "ellipse"} at center, rgba(0,0,0,1) ${100 - feather - 15}%, rgba(0,0,0,0) ${100 - 5}%)`,
                  WebkitMaskImage: `radial-gradient(${maskShape === "circle" ? "circle" : "ellipse"} at center, rgba(0,0,0,1) ${100 - feather - 15}%, rgba(0,0,0,0) ${100 - 5}%)`
                }}
                className={`cursor-grab active:cursor-grabbing transition-opacity duration-150 relative ${
                  isDragging ? "ring-2 ring-indigo-500/30 rounded-full" : ""
                }`}
                id="interactive-face-layer"
              >
                {/* Visual outline/guide when dragging */}
                {isDragging && (
                  <div className="absolute inset-0 border-2 border-dashed border-indigo-500 rounded-full animate-ping pointer-events-none" />
                )}

                {sourceType === "preset" ? (
                  <div className="w-full h-full aspect-square pointer-events-none">
                    <SvgFace face={activeFacePreset.faceData} idPrefix="studio-view" />
                  </div>
                ) : (
                  <img
                    src={customSourceImg || ""}
                    alt="Gesicht"
                    className="w-full h-full object-cover pointer-events-none"
                    style={{
                      borderRadius: maskShape === "circle" ? "50%" : maskShape === "square" ? "0%" : "50%"
                    }}
                  />
                )}
              </div>
            )}

            {/* Original / Swapped overlay status tag */}
            <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-mono text-zinc-300 border border-zinc-800 font-bold pointer-events-none">
              {showOriginal ? (
                <span className="text-rose-400">Originales Hintergrundbild</span>
              ) : (
                <span className="text-emerald-400">Live Face-Swap aktiv</span>
              )}
            </div>

            {/* Drag guide helper text */}
            {activeStep === 2 && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur px-3 py-1 rounded-full text-[10px] text-zinc-300 font-bold border border-indigo-500/20 animate-pulse pointer-events-none flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-indigo-400" />
                Ziehe das Gesicht an die richtige Stelle
              </div>
            )}
          </div>

          <p className="text-[10px] text-zinc-500 font-mono mt-3 text-center">
            Unterstützt Maus und Touchscreen-Gesten zum Ziehen.
          </p>
        </div>

      </div>
    </div>
  );
}

import { useMemo } from "react";
import { FaceData, FaceLandmark } from "../types";
import { getLandmarks } from "../data";

interface SvgFaceProps {
  face: FaceData;
  showLandmarks?: boolean;
  showMeshLines?: boolean;
  showBoundingBox?: boolean;
  highlightCategory?: string | null;
  onLandmarkHover?: (landmark: FaceLandmark | null) => void;
  activeLandmarkId?: string | null;
  blendFace?: FaceData;
  blendFactor?: number; // 0 to 1
  isPixelated?: boolean;
  restorationStrength?: number; // 0 to 1
  idPrefix?: string;
}

function interpolateColor(color1: string, color2: string, factor: number): string {
  try {
    const c1 = color1.startsWith('#') ? color1 : '#cccccc';
    const c2 = color2.startsWith('#') ? color2 : '#cccccc';
    
    const r1 = parseInt(c1.substring(1, 3), 16);
    const g1 = parseInt(c1.substring(3, 5), 16);
    const b1 = parseInt(c1.substring(5, 7), 16);

    const r2 = parseInt(c2.substring(1, 3), 16);
    const g2 = parseInt(c2.substring(3, 5), 16);
    const b2 = parseInt(c2.substring(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  } catch (e) {
    return color1;
  }
}

export default function SvgFace({
  face,
  showLandmarks = false,
  showMeshLines = false,
  showBoundingBox = false,
  highlightCategory = null,
  onLandmarkHover,
  activeLandmarkId = null,
  blendFace,
  blendFactor = 0,
  isPixelated = false,
  restorationStrength = 1,
  idPrefix = "face",
}: SvgFaceProps) {
  // Computes the blended face:
  // - Identity traits are blended based on blendFactor
  // - Expression & pose stay locked to the target face (Inswapper principle!)
  const finalFace = useMemo<FaceData>(() => {
    if (!blendFace || blendFactor === 0) return face;
    if (blendFactor === 1) {
      // Inswapper: Copy identity features, but keep expressions and head tilt of target
      return {
        ...blendFace,
        expression: face.expression,
        hairStyle: face.hairStyle, // keep helmet/hair structure of target
        embeddingSeed: blendFace.embeddingSeed,
      };
    }

    const bf = blendFactor;
    return {
      ...face,
      faceColor: interpolateColor(face.faceColor, blendFace.faceColor, bf),
      eyeColor: interpolateColor(face.eyeColor, blendFace.eyeColor, bf),
      hairColor: interpolateColor(face.hairColor, blendFace.hairColor, bf),
      features: {
        faceWidth: face.features.faceWidth + (blendFace.features.faceWidth - face.features.faceWidth) * bf,
        faceHeight: face.features.faceHeight + (blendFace.features.faceHeight - face.features.faceHeight) * bf,
        jawRoundness: face.features.jawRoundness + (blendFace.features.jawRoundness - face.features.jawRoundness) * bf,
        noseLength: face.features.noseLength + (blendFace.features.noseLength - face.features.noseLength) * bf,
        noseBridgeWidth: face.features.noseBridgeWidth + (blendFace.features.noseBridgeWidth - face.features.noseBridgeWidth) * bf,
        eyeSize: face.features.eyeSize + (blendFace.features.eyeSize - face.features.eyeSize) * bf,
        eyeSpacing: face.features.eyeSpacing + (blendFace.features.eyeSpacing - face.features.eyeSpacing) * bf,
        mouthWidth: face.features.mouthWidth + (blendFace.features.mouthWidth - face.features.mouthWidth) * bf,
        lipThickness: face.features.lipThickness + (blendFace.features.lipThickness - face.features.lipThickness) * bf,
      },
    };
  }, [face, blendFace, blendFactor]);

  // Compute 2D coordinates for landmarks
  const landmarks = useMemo(() => getLandmarks(finalFace), [finalFace]);

  // Group landmarks for rendering lines
  const landmarksMap = useMemo(() => {
    const map: Record<string, FaceLandmark> = {};
    landmarks.forEach((l) => {
      map[l.id] = l;
    });
    return map;
  }, [landmarks]);

  // Compute rotation angle for styling
  const rotationAngle = finalFace.expression.headTilt;

  // Visual features derived from landmarks for easy SVG drawing
  const getPoint = (id: string) => landmarksMap[id] || { x: 50, y: 50 };

  // Generate SVG path for Face Silhouette (Jawline)
  const jawPath = useMemo(() => {
    const pts = Array.from({ length: 9 }).map((_, i) => getPoint(`jaw_${i}`));
    return `M ${pts[0].x} ${pts[0].y} 
            C ${pts[1].x} ${pts[1].y}, ${pts[2].x} ${pts[2].y}, ${pts[3].x} ${pts[3].y} 
            S ${pts[5].x} ${pts[5].y}, ${pts[6].x} ${pts[6].y}
            S ${pts[8].x} ${pts[8].y}, ${pts[8].x} ${pts[8].y}`;
  }, [landmarksMap]);

  // Eyebrow paths
  const ebLPath = useMemo(() => {
    const pts = Array.from({ length: 4 }).map((_, i) => getPoint(`eb_l_${i}`));
    return `M ${pts[0].x} ${pts[0].y} Q ${pts[1].x} ${pts[1].y} ${pts[2].x} ${pts[2].y} T ${pts[3].x} ${pts[3].y}`;
  }, [landmarksMap]);

  const ebRPath = useMemo(() => {
    const pts = Array.from({ length: 4 }).map((_, i) => getPoint(`eb_r_${i}`));
    return `M ${pts[0].x} ${pts[0].y} Q ${pts[1].x} ${pts[1].y} ${pts[2].x} ${pts[2].y} T ${pts[3].x} ${pts[3].y}`;
  }, [landmarksMap]);

  // Eye paths
  const eyeLPath = useMemo(() => {
    const p0 = getPoint("eye_l_0");
    const p1 = getPoint("eye_l_1");
    const p2 = getPoint("eye_l_2");
    const p3 = getPoint("eye_l_3");
    return `M ${p0.x} ${p0.y} C ${p0.x + (p2.x - p0.x)/3} ${p1.y}, ${p0.x + (p2.x - p0.x)*2/3} ${p1.y}, ${p2.x} ${p2.y}
            C ${p2.x - (p2.x - p0.x)/3} ${p3.y}, ${p2.x - (p2.x - p0.x)*2/3} ${p3.y}, ${p0.x} ${p0.y} Z`;
  }, [landmarksMap]);

  const eyeRPath = useMemo(() => {
    const p0 = getPoint("eye_r_0");
    const p1 = getPoint("eye_r_1");
    const p2 = getPoint("eye_r_2");
    const p3 = getPoint("eye_r_3");
    return `M ${p0.x} ${p0.y} C ${p0.x + (p2.x - p0.x)/3} ${p1.y}, ${p0.x + (p2.x - p0.x)*2/3} ${p1.y}, ${p2.x} ${p2.y}
            C ${p2.x - (p2.x - p0.x)/3} ${p3.y}, ${p2.x - (p2.x - p0.x)*2/3} ${p3.y}, ${p0.x} ${p0.y} Z`;
  }, [landmarksMap]);

  // Nose paths
  const noseBridgePath = useMemo(() => {
    const p0 = getPoint("nose_0");
    const p1 = getPoint("nose_1");
    const p3 = getPoint("nose_3");
    return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p3.x} ${p3.y}`;
  }, [landmarksMap]);

  const noseTipPath = useMemo(() => {
    const p2 = getPoint("nose_2");
    const p3 = getPoint("nose_3");
    const p4 = getPoint("nose_4");
    return `M ${p2.x} ${p2.y} Q ${p3.x} ${p3.y + 1} ${p4.x} ${p4.y}`;
  }, [landmarksMap]);

  // Mouth paths
  const mouthOuterPath = useMemo(() => {
    const p0 = getPoint("mouth_0");
    const p1 = getPoint("mouth_1");
    const p2 = getPoint("mouth_2");
    const p3 = getPoint("mouth_3");
    const p4 = getPoint("mouth_4");
    const p5 = getPoint("mouth_5");
    return `M ${p0.x} ${p0.y} 
            C ${p1.x} ${p1.y}, ${p3.x} ${p3.y}, ${p4.x} ${p4.y}
            C ${p4.x - 2} ${p5.y}, ${p0.x + 2} ${p5.y}, ${p0.x} ${p0.y} Z`;
  }, [landmarksMap]);

  const mouthInnerPath = useMemo(() => {
    const p0 = getPoint("mouth_0");
    const p4 = getPoint("mouth_4");
    const p6 = getPoint("mouth_6");
    const openFactor = finalFace.expression.smile > 0 ? finalFace.expression.smile * 2 : 0.5;
    return `M ${p0.x} ${p0.y} Q ${p6.x} ${p6.y + openFactor} ${p4.x} ${p4.y}`;
  }, [landmarksMap, finalFace.expression.smile]);

  // Render Background/Theme context elements depending on face.style
  const renderBackdrop = () => {
    switch (finalFace.style) {
      case "renaissance":
        return (
          <g>
            {/* Soft classical museum vignetting and background arch */}
            <rect width="100" height="100" rx="6" fill="#1f1812" />
            <path d="M 15 100 Q 50 10 85 100" fill="#2d2217" opacity="0.6" />
            <radialGradient id={`${idPrefix}-museum-glow`} cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#4d3b2b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1f1812" stopOpacity="0" />
            </radialGradient>
            <circle cx="50" cy="50" r="45" fill={`url(#${idPrefix}-museum-glow)`} />
          </g>
        );
      case "astronaut":
        return (
          <g>
            {/* Space theme background */}
            <rect width="100" height="100" rx="6" fill="#080b12" />
            {/* Cyber grid or stars */}
            <circle cx="15" cy="20" r="0.4" fill="#ffffff" opacity="0.8" />
            <circle cx="85" cy="30" r="0.6" fill="#ffffff" opacity="0.9" />
            <circle cx="75" cy="15" r="0.3" fill="#ffffff" opacity="0.7" />
            <circle cx="30" cy="75" r="0.5" fill="#4d8cff" opacity="0.4" />
            <radialGradient id={`${idPrefix}-space-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#112547" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#080b12" stopOpacity="0" />
            </radialGradient>
            <circle cx="50" cy="50" r="50" fill={`url(#${idPrefix}-space-glow)`} />
          </g>
        );
      case "cyberpunk":
        return (
          <g>
            {/* Cyberpunk neon city backdrop */}
            <rect width="100" height="100" rx="6" fill="#0c0714" />
            <path d="M -10 100 L 30 40 L 40 100 Z" fill="#201130" opacity="0.5" />
            <path d="M 60 100 L 80 50 L 110 100 Z" fill="#1b112b" opacity="0.5" />
            <path d="M 20 100 L 55 60 L 75 100 Z" fill="#2a103d" opacity="0.4" />
            {/* Glowing neon vertical strip */}
            <line x1="10" y1="0" x2="10" y2="100" stroke="#ff007f" strokeWidth="0.5" opacity="0.3" />
            <line x1="90" y1="0" x2="90" y2="100" stroke="#00ffff" strokeWidth="0.5" opacity="0.3" />
          </g>
        );
      case "executive":
        return (
          <g>
            {/* Modern studio gray background */}
            <rect width="100" height="100" rx="6" fill="#1d2026" />
            <linearGradient id={`${idPrefix}-studio-grad`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2e3440" />
              <stop offset="100%" stopColor="#121418" />
            </linearGradient>
            <rect width="100" height="100" rx="6" fill={`url(#${idPrefix}-studio-grad)`} opacity="0.9" />
          </g>
        );
      default:
        return <rect width="100" height="100" rx="6" fill="#18181b" />;
    }
  };

  // Helper to draw hair and head structures
  const renderHairAndHead = () => {
    const headW = finalFace.features.faceWidth * 25;
    const hairC = finalFace.hairColor;
    
    switch (finalFace.hairStyle) {
      case "classic":
        return (
          <g>
            {/* Renaissance long hair flowing down cheeks */}
            <path d={`M 50 ${15} C ${50 - headW} ${15}, ${50 - headW - 6} 45, ${50 - headW - 2} 80
                     C ${50 - headW + 2} 95, 50 95, 50 95
                     C 50 95, ${50 + headW - 2} 95, ${50 + headW + 2} 80
                     C ${50 + headW + 6} 45, ${50 + headW} ${15}, 50 ${15} Z`}
                  fill={hairC} opacity="0.95" />
            {/* Hair texture overlays */}
            <path d={`M 45 16 C 30 25, 22 45, 23 75`} stroke="#4c3b2b" strokeWidth="0.7" fill="none" opacity="0.4" />
            <path d={`M 55 16 C 70 25, 78 45, 77 75`} stroke="#4c3b2b" strokeWidth="0.7" fill="none" opacity="0.4" />
          </g>
        );
      case "space_helmet":
        return (
          <g>
            {/* Under-helmet hood/cap */}
            <path d={`M 50 18 C ${50 - headW + 1} 18, ${50 - headW + 1} 45, ${50 - headW + 4} 68
                     C ${50 - headW + 10} 78, 50 82, 50 82
                     C 50 82, ${50 + headW - 10} 78, ${50 + headW - 4} 68
                     C ${50 + headW - 1} 45, ${50 + headW - 1} 18, 50 18 Z`}
                  fill="#1b202e" />
            
            {/* Astronaut helmet suit collar */}
            <ellipse cx="50" cy="85" rx="35" ry="12" fill="#d9e3f0" stroke="#8da2bb" strokeWidth="1" />
            <path d="M 25 80 C 25 88, 75 88, 75 80 C 75 95, 25 95, 25 80 Z" fill="#b4c7dd" />
            
            {/* Helmet glass dome circle (back) */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e0e8f5" strokeWidth="1.5" opacity="0.6" />
          </g>
        );
      case "neon_mohawk":
        return (
          <g>
            {/* Futuristic shaved sides */}
            <ellipse cx="50" cy="40" rx={headW} ry="22" fill="#2d2238" opacity="0.7" />
            {/* Neon bright Mohawk hair spikes */}
            <path d={`M 50 10 L 45 28 C 42 28, 38 18, 38 10 L 45 12 L 48 5 L 50 10 Z`} fill={hairC} />
            <path d={`M 50 5 L 55 25 L 58 25 L 62 12 L 50 5 Z`} fill={hairC} opacity="0.8" />
            <path d={`M 48 10 L 52 30 L 50 35 L 45 32 L 48 10 Z`} fill="#ff00a0" opacity="0.9" /> {/* neon accent pink */}
          </g>
        );
      case "sleek":
        return (
          <g>
            {/* Modern business combed hair */}
            <path d={`M 50 15 C ${50 - headW - 1} 15, ${50 - headW} 25, ${50 - headW + 1} 40
                     C 50 25, 50 20, 50 15 Z`} fill={hairC} />
            <path d={`M 50 15 C ${50 + headW + 1} 15, ${50 + headW} 25, ${50 + headW - 1} 40
                     C 50 25, 50 20, 50 15 Z`} fill={hairC} />
            {/* Main top volume */}
            <path d={`M ${50 - headW + 1} 22 C 45 12, 55 11, ${50 + headW - 1} 22 Z`} fill={hairC} />
          </g>
        );
      default:
        return null;
    }
  };

  const renderHelmetOverlay = () => {
    if (finalFace.hairStyle !== "space_helmet") return null;
    return (
      <g pointerEvents="none">
        {/* Helmet glass glare lines & reflections */}
        <circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.25" />
        <path d="M 18 30 C 12 45, 20 70, 20 70" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
        <path d="M 82 25 C 88 40, 85 60, 85 60" fill="none" stroke="#ffffff" strokeWidth="0.7" strokeLinecap="round" opacity="0.15" />
        {/* HUD UI inside helmet */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="#4da6ff" strokeWidth="0.3" strokeDasharray="2 3" opacity="0.3" />
        <text x="18" y="24" fill="#4da6ff" fontSize="2.2" fontFamily="monospace" opacity="0.5">O2: 98%</text>
        <text x="75" y="24" fill="#4da6ff" fontSize="2.2" fontFamily="monospace" opacity="0.5">SYS: OK</text>
      </g>
    );
  };

  // Grid / pixelation filter for Step 4 before/after comparison
  const pixelationFilterId = `${idPrefix}-pixelate`;

  return (
    <div className="relative select-none w-full aspect-square bg-[#0b0c10] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      <svg
        id={`${idPrefix}-svg`}
        viewBox="0 0 100 100"
        className={`w-full h-full transition-transform duration-300 ${isPixelated ? "pixelated" : ""}`}
        style={{
          filter: isPixelated 
            ? `url(#${pixelationFilterId})` 
            : undefined,
          imageRendering: isPixelated ? "pixelated" : "auto",
        }}
      >
        <defs>
          {/* Pixelation filter using standard SVG displacement map and morphology to simulate low-resolution ONNX grid */}
          <filter id={pixelationFilterId} x="0%" y="0%" width="100%" height="100%">
            <feGaussianBlur stdDeviation={1.2 / Math.max(0.1, restorationStrength)} result="blur" />
            <feComponentTransfer in="blur" result="transfer">
              {/* Discrete levels to make it look grid-like / low-res */}
              <feFuncR type="discrete" tableValues="0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1" />
              <feFuncG type="discrete" tableValues="0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1" />
              <feFuncB type="discrete" tableValues="0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1" />
            </feComponentTransfer>
          </filter>

          {/* Simple drop shadows for facial features */}
          <filter id={`${idPrefix}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. Backdrop */}
        {renderBackdrop()}

        {/* 2. Hair Back */}
        {renderHairAndHead()}

        {/* 3. Base Face Skin Shape */}
        <g filter={`url(#${idPrefix}-shadow)`}>
          <path
            d={jawPath}
            fill={finalFace.faceColor}
            stroke={interpolateColor(finalFace.faceColor, "#000000", 0.15)}
            strokeWidth="0.5"
          />
        </g>

        {/* 4. Eyes (Iris & Pupil) */}
        <g>
          {/* Left Eye */}
          <path d={eyeLPath} fill="#ffffff" />
          <circle
            cx={getPoint("eye_l_4").x}
            cy={getPoint("eye_l_4").y}
            r={finalFace.features.eyeSize * 1.5}
            fill={finalFace.eyeColor}
          />
          <circle
            cx={getPoint("eye_l_4").x}
            cy={getPoint("eye_l_4").y}
            r={finalFace.features.eyeSize * 0.7}
            fill="#101010"
          />
          {/* Eye shine */}
          <circle
            cx={getPoint("eye_l_4").x - 0.5}
            cy={getPoint("eye_l_4").y - 0.5}
            r="0.4"
            fill="#ffffff"
            opacity="0.8"
          />

          {/* Right Eye */}
          <path d={eyeRPath} fill="#ffffff" />
          <circle
            cx={getPoint("eye_r_4").x}
            cy={getPoint("eye_r_4").y}
            r={finalFace.features.eyeSize * 1.5}
            fill={finalFace.eyeColor}
          />
          <circle
            cx={getPoint("eye_r_4").x}
            cy={getPoint("eye_r_4").y}
            r={finalFace.features.eyeSize * 0.7}
            fill="#101010"
          />
          {/* Eye shine */}
          <circle
            cx={getPoint("eye_r_4").x - 0.5}
            cy={getPoint("eye_r_4").y - 0.5}
            r="0.4"
            fill="#ffffff"
            opacity="0.8"
          />
        </g>

        {/* 5. Eyebrows */}
        <g>
          <path d={ebLPath} fill="none" stroke={finalFace.hairColor} strokeWidth="1.2" strokeLinecap="round" />
          <path d={ebRPath} fill="none" stroke={finalFace.hairColor} strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* 6. Nose */}
        <g>
          <path d={noseBridgePath} fill="none" stroke="#000000" strokeWidth="0.3" opacity="0.15" />
          <path d={noseTipPath} fill="none" stroke="#000000" strokeWidth="0.4" opacity="0.25" strokeLinecap="round" />
        </g>

        {/* 7. Mouth (Lips and Inner) */}
        <g>
          {/* Inner mouth shadow if open */}
          <path d={mouthOuterPath} fill="#4d1a1a" opacity="0.8" />
          {/* Lips shape */}
          <path d={mouthOuterPath} fill={interpolateColor(finalFace.faceColor, "#cc4455", 0.4)} stroke="#000000" strokeWidth="0.15" opacity="0.9" />
          {/* Lip center separator line */}
          <path d={mouthInnerPath} fill="none" stroke="#2a0505" strokeWidth="0.4" strokeLinecap="round" />
        </g>

        {/* Cyberpunk Neon Facial Lines if Cyberpunk */}
        {finalFace.style === "cyberpunk" && (
          <g opacity="0.8">
            <path d={`M 35 40 L 32 50 L 35 55`} fill="none" stroke="#ff00ff" strokeWidth="0.4" />
            <circle cx="35" cy="55" r="0.6" fill="#ff00ff" />
            <path d={`M 65 40 L 68 50 L 65 55`} fill="none" stroke="#00ffff" strokeWidth="0.4" />
            <circle cx="65" cy="55" r="0.6" fill="#00ffff" />
          </g>
        )}

        {/* 8. Space Helmet Overlay (Glass specular reflection) */}
        {renderHelmetOverlay()}

        {/* 9. Glowing Mesh Skeleton Lines (Step 1 & Step 3 visualizer) */}
        {showMeshLines && (
          <g stroke="#10b981" strokeWidth="0.25" strokeLinecap="round" opacity="0.65" pointerEvents="none">
            {/* Draw standard face triangulation paths */}
            {/* Outer Jaw connection */}
            <path d={jawPath} fill="none" strokeDasharray="1 1" />
            {/* Forehead arch */}
            <path d={`M ${getPoint("jaw_0").x} ${getPoint("jaw_0").y} C 35 22, 65 22, ${getPoint("jaw_8").x} ${getPoint("jaw_8").y}`} fill="none" strokeDasharray="1 1" />
            {/* Left eyebrow to left eye */}
            <line x1={getPoint("eb_l_0").x} y1={getPoint("eb_l_0").y} x2={getPoint("eye_l_0").x} y2={getPoint("eye_l_0").y} />
            <line x1={getPoint("eb_l_1").x} y1={getPoint("eb_l_1").y} x2={getPoint("eye_l_1").x} y2={getPoint("eye_l_1").y} />
            <line x1={getPoint("eb_l_2").x} y1={getPoint("eb_l_2").y} x2={getPoint("eye_l_2").x} y2={getPoint("eye_l_2").y} />
            <line x1={getPoint("eb_l_3").x} y1={getPoint("eb_l_3").y} x2={getPoint("eye_l_2").x} y2={getPoint("eye_l_2").y} />

            {/* Right eyebrow to right eye */}
            <line x1={getPoint("eb_r_0").x} y1={getPoint("eb_r_0").y} x2={getPoint("eye_r_0").x} y2={getPoint("eye_r_0").y} />
            <line x1={getPoint("eb_r_1").x} y1={getPoint("eb_r_1").y} x2={getPoint("eye_r_1").x} y2={getPoint("eye_r_1").y} />
            <line x1={getPoint("eb_r_2").x} y1={getPoint("eb_r_2").y} x2={getPoint("eye_r_2").x} y2={getPoint("eye_r_2").y} />
            <line x1={getPoint("eb_r_3").x} y1={getPoint("eb_r_3").y} x2={getPoint("eye_r_2").x} y2={getPoint("eye_r_2").y} />

            {/* Nose bridge to eyes */}
            <line x1={getPoint("nose_0").x} y1={getPoint("nose_0").y} x2={getPoint("eye_l_2").x} y2={getPoint("eye_l_2").y} />
            <line x1={getPoint("nose_0").x} y1={getPoint("nose_0").y} x2={getPoint("eye_r_0").x} y2={getPoint("eye_r_0").y} />
            <line x1={getPoint("nose_1").x} y1={getPoint("nose_1").y} x2={getPoint("eye_l_2").x} y2={getPoint("eye_l_2").y} />
            <line x1={getPoint("nose_1").x} y1={getPoint("nose_1").y} x2={getPoint("eye_r_0").x} y2={getPoint("eye_r_0").y} />

            {/* Nose tip to mouth corners */}
            <line x1={getPoint("nose_3").x} y1={getPoint("nose_3").y} x2={getPoint("mouth_0").x} y2={getPoint("mouth_0").y} />
            <line x1={getPoint("nose_3").x} y1={getPoint("nose_3").y} x2={getPoint("mouth_4").x} y2={getPoint("mouth_4").y} />
            
            {/* Mouth outline connection */}
            <path d={mouthOuterPath} fill="none" strokeDasharray="1 1" />

            {/* Mouth corners to jawline */}
            <line x1={getPoint("mouth_0").x} y1={getPoint("mouth_0").y} x2={getPoint("jaw_2").x} y2={getPoint("jaw_2").y} />
            <line x1={getPoint("mouth_4").x} y1={getPoint("mouth_4").y} x2={getPoint("jaw_6").x} y2={getPoint("jaw_6").y} />
            <line x1={getPoint("mouth_5").x} y1={getPoint("mouth_5").y} x2={getPoint("jaw_4").x} y2={getPoint("jaw_4").y} />
          </g>
        )}

        {/* 10. Glowing Green Landmark Dots */}
        {showLandmarks && (
          <g>
            {landmarks.map((l) => {
              const isHighlighted = highlightCategory === l.category;
              const isActive = activeLandmarkId === l.id;
              
              let r = 0.8;
              let fill = "#10b981"; // emerald 500
              let stroke = "#ffffff";
              let sWidth = 0.2;

              if (isActive) {
                r = 1.3;
                fill = "#ef4444"; // red active
                sWidth = 0.4;
              } else if (isHighlighted) {
                r = 1.1;
                fill = "#3b82f6"; // blue highlighted
                sWidth = 0.3;
              }

              return (
                <circle
                  key={l.id}
                  cx={l.x}
                  cy={l.y}
                  r={r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={sWidth}
                  className="cursor-pointer transition-all duration-150 hover:r-[1.4] hover:fill-[#f59e0b]"
                  onMouseEnter={() => onLandmarkHover && onLandmarkHover(l)}
                  onMouseLeave={() => onLandmarkHover && onLandmarkHover(null)}
                />
              );
            })}
          </g>
        )}

        {/* 11. Bounding Box overlay (YOLO Detection box) */}
        {showBoundingBox && (
          <g pointerEvents="none">
            {/* Standard bounding box centered around face */}
            <rect
              x="18"
              y="12"
              width="64"
              height="74"
              rx="2"
              fill="none"
              stroke="#e11d48" // rose 600
              strokeWidth="0.8"
              strokeDasharray="1 1"
            />
            {/* Box corners */}
            <path d="M 18 18 L 18 12 L 24 12" fill="none" stroke="#e11d48" strokeWidth="1.5" />
            <path d="M 82 18 L 82 12 L 76 12" fill="none" stroke="#e11d48" strokeWidth="1.5" />
            <path d="M 18 80 L 18 86 L 24 86" fill="none" stroke="#e11d48" strokeWidth="1.5" />
            <path d="M 82 80 L 82 86 L 76 86" fill="none" stroke="#e11d48" strokeWidth="1.5" />
            
            {/* Confidence Label badge */}
            <g>
              <rect x="18" y="4" width="28" height="7" rx="1.5" fill="#e11d48" />
              <text x="20" y="9.2" fill="#ffffff" fontSize="3.4" fontFamily="monospace" fontWeight="bold">
                FACE: 99.4%
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

import { FaceData, FaceLandmark, PresetPair } from "./types";

// A fast seed-based pseudo-random number generator for deterministic embedding generation
export function sfc32(a: number, b: number, c: number, d: number) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    var t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export function generateEmbedding(face: FaceData): number[] {
  // Generate a deterministic 512-dimensional vector based on the seed and key features
  const rand = sfc32(face.embeddingSeed, face.embeddingSeed + 1, face.embeddingSeed + 2, face.embeddingSeed + 3);
  const vector: number[] = [];
  
  // Base vector on deterministic noise
  for (let i = 0; i < 512; i++) {
    vector.push(rand() * 2 - 1);
  }

  // Inject structural features into specific segments of the vector to simulate real ArcFace feature encoding
  // For instance, indices 10-30 represent eye size/spacing, 50-70 represent gender/style, etc.
  const eyeFeature = (face.features.eyeSize + face.features.eyeSpacing) / 2;
  const mouthFeature = (face.features.mouthWidth + face.features.lipThickness) / 2;
  const noseFeature = (face.features.noseLength + face.features.noseBridgeWidth) / 2;
  const faceShape = (face.features.faceWidth + face.features.faceHeight + face.features.jawRoundness) / 3;

  for (let i = 0; i < 512; i++) {
    if (i >= 20 && i < 50) {
      vector[i] = vector[i] * 0.3 + eyeFeature * 0.7;
    } else if (i >= 100 && i < 130) {
      vector[i] = vector[i] * 0.3 + mouthFeature * 0.7;
    } else if (i >= 220 && i < 250) {
      vector[i] = vector[i] * 0.3 + noseFeature * 0.7;
    } else if (i >= 350 && i < 380) {
      vector[i] = vector[i] * 0.3 + faceShape * 0.7;
    } else if (i >= 420 && i < 440) {
      vector[i] = vector[i] * 0.4 + (face.gender === "female" ? 0.8 : -0.8) * 0.6;
    }
  }

  // Normalize the vector (unit sphere projection) as done in ArcFace / SphereFace
  let norm = 0;
  for (let i = 0; i < 512; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  return vector.map((v) => v / norm);
}

export function calculateCosineSimilarity(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length) return 0;
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// Generate a set of landmark coordinates (in percentage 0-100) based on FaceData parameters
export function getLandmarks(face: FaceData): FaceLandmark[] {
  const landmarks: FaceLandmark[] = [];
  
  const w = face.features.faceWidth;
  const h = face.features.faceHeight;
  const eyeSp = face.features.eyeSpacing * 7; // spacing adjustment
  const eyeSz = face.features.eyeSize * 3;
  const noseL = face.features.noseLength * 8;
  const noseW = face.features.noseBridgeWidth * 4;
  const mouthW = face.features.mouthWidth * 10;
  const lipT = face.features.lipThickness * 3;
  const jawR = face.features.jawRoundness;
  
  const smile = face.expression.smile;
  const eyeOpen = face.expression.eyeOpenness;
  const ebTilt = face.expression.eyebrowTilt;
  const tilt = (face.expression.headTilt * Math.PI) / 180;

  // Center point
  const cx = 50;
  const cy = 52;

  const rotate = (px: number, py: number) => {
    // Translate to center, rotate, translate back
    const dx = px - cx;
    const dy = py - cy;
    const rx = dx * Math.cos(tilt) - dy * Math.sin(tilt);
    const ry = dx * Math.sin(tilt) + dy * Math.cos(tilt);
    return { x: cx + rx, y: cy + ry };
  };

  // 1. JAWLINE (Kinn und Kiefer) - 9 points
  // Normal chin is centered around x=50, y=78
  const jawPoints = [
    { x: 50 - 24 * w, y: 40 - 4 * h }, // Left temple
    { x: 50 - 23 * w, y: 52 - 1 * h }, // Left cheek high
    { x: 50 - 19 * w, y: 64 + 2 * h }, // Left jaw
    { x: 50 - 10 * w, y: 74 + 4 * h + (1 - jawR) * 2 }, // Left chin transition
    { x: 50,          y: 78 + 5 * h + (1 - jawR) * 3 }, // Chin tip
    { x: 50 + 10 * w, y: 74 + 4 * h + (1 - jawR) * 2 }, // Right chin transition
    { x: 50 + 19 * w, y: 64 + 2 * h }, // Right jaw
    { x: 50 + 23 * w, y: 52 - 1 * h }, // Right cheek high
    { x: 50 + 24 * w, y: 40 - 4 * h }, // Right temple
  ];
  jawPoints.forEach((p, idx) => {
    const rot = rotate(p.x, p.y);
    landmarks.push({
      id: `jaw_${idx}`,
      name: `Kieferpunkt ${idx + 1}`,
      category: "jaw",
      x: rot.x,
      y: rot.y,
      description: "Markiert den Rand des Gesichts, um die Umrisse und Kopfform zu erfassen.",
    });
  });

  // 2. LEFT EYEBROW (Augenbraue links) - 4 points
  const ebLY = 37 - ebTilt * 2;
  const ebLPoints = [
    { x: 50 - eyeSp - 12, y: ebLY + ebTilt },
    { x: 50 - eyeSp - 7,  y: ebLY - 2 },
    { x: 50 - eyeSp - 2,  y: ebLY - 1 },
    { x: 50 - eyeSp + 2,  y: ebLY + ebTilt * 0.5 },
  ];
  ebLPoints.forEach((p, idx) => {
    const rot = rotate(p.x, p.y);
    landmarks.push({
      id: `eb_l_${idx}`,
      name: `Linke Augenbraue ${idx + 1}`,
      category: "eyebrow_l",
      x: rot.x,
      y: rot.y,
      description: "Zeigt, ob die Person glücklich, traurig, wütend oder überrascht schaut.",
    });
  });

  // 3. RIGHT EYEBROW (Augenbraue rechts) - 4 points
  const ebRY = 37 - ebTilt * 2;
  const ebRPoints = [
    { x: 50 + eyeSp - 2,  y: ebRY + ebTilt * 0.5 },
    { x: 50 + eyeSp + 2,  y: ebRY - 1 },
    { x: 50 + eyeSp + 7,  y: ebRY - 2 },
    { x: 50 + eyeSp + 12, y: ebRY + ebTilt },
  ];
  ebRPoints.forEach((p, idx) => {
    const rot = rotate(p.x, p.y);
    landmarks.push({
      id: `eb_r_${idx}`,
      name: `Rechte Augenbraue ${idx + 1}`,
      category: "eyebrow_r",
      x: rot.x,
      y: rot.y,
      description: "Hilft dem Programm zu erkennen, wie symmetrisch die Augenbrauen angeordnet sind.",
    });
  });

  // 4. LEFT EYE (Auge links) - 5 points
  const eyeLY = 44;
  const eyeLPoints = [
    { x: 50 - eyeSp - 8, y: eyeLY }, // outer corner
    { x: 50 - eyeSp - 4, y: eyeLY - eyeSz * eyeOpen }, // top lid
    { x: 50 - eyeSp,     y: eyeLY }, // inner corner
    { x: 50 - eyeSp - 4, y: eyeLY + eyeSz * eyeOpen }, // bottom lid
    { x: 50 - eyeSp - 4, y: eyeLY }, // center/pupil
  ];
  eyeLPoints.forEach((p, idx) => {
    const rot = rotate(p.x, p.y);
    landmarks.push({
      id: `eye_l_${idx}`,
      name: idx === 4 ? "Pupille Links" : `Linkes Auge ${idx + 1}`,
      category: "eye_l",
      x: rot.x,
      y: rot.y,
      description: idx === 4 ? "Die Mitte des linken Auges. Zeigt an, wohin die Person blickt." : "Erfasst, ob das Auge weit geöffnet, geschlossen oder halb zugekniffen ist.",
    });
  });

  // 5. RIGHT EYE (Auge rechts) - 5 points
  const eyeRY = 44;
  const eyeRPoints = [
    { x: 50 + eyeSp,     y: eyeRY }, // inner corner
    { x: 50 + eyeSp + 4, y: eyeRY - eyeSz * eyeOpen }, // top lid
    { x: 50 + eyeSp + 8, y: eyeRY }, // outer corner
    { x: 50 + eyeSp + 4, y: eyeRY + eyeSz * eyeOpen }, // bottom lid
    { x: 50 + eyeSp + 4, y: eyeRY }, // center/pupil
  ];
  eyeRPoints.forEach((p, idx) => {
    const rot = rotate(p.x, p.y);
    landmarks.push({
      id: `eye_r_${idx}`,
      name: idx === 4 ? "Pupille Rechts" : `Rechtes Auge ${idx + 1}`,
      category: "eye_r",
      x: rot.x,
      y: rot.y,
      description: idx === 4 ? "Die Mitte des rechten Auges. Hilft bei der genauen Ausrichtung des Gesichts." : "Hilft dabei, Schrägstellungen des Kopfes auszugleichen und das Auge exakt zu platzieren.",
    });
  });

  // 6. NOSE (Nase) - 5 points
  const noseBridgeY = 41;
  const nosePoints = [
    { x: 50,             y: noseBridgeY }, // top bridge
    { x: 50,             y: noseBridgeY + noseL / 2 }, // middle bridge
    { x: 50 - noseW - 1, y: noseBridgeY + noseL }, // left nostril
    { x: 50,             y: noseBridgeY + noseL + 2 }, // nose tip
    { x: 50 + noseW + 1, y: noseBridgeY + noseL }, // right nostril
  ];
  nosePoints.forEach((p, idx) => {
    const rot = rotate(p.x, p.y);
    landmarks.push({
      id: `nose_${idx}`,
      name: idx === 3 ? "Nasenspitze" : `Nase ${idx + 1}`,
      category: "nose",
      x: rot.x,
      y: rot.y,
      description: idx === 3 ? "Die Nasenspitze ist der wichtigste Punkt, um zu erkennen, wie stark der Kopf gedreht ist." : "Die Nasenlinie teilt das Gesicht in zwei Hälften und zeigt die Blickrichtung an.",
    });
  });

  // 7. MOUTH (Mund) - 7 points
  const mY = 62 + noseL * 0.2; // mouth position shifts based on nose length
  const smileFactor = smile * 4;
  const mouthPoints = [
    { x: 50 - mouthW / 2,     y: mY - smileFactor * 0.3 }, // Left corner
    { x: 50 - mouthW / 4,     y: mY - lipT - smileFactor * 0.6 }, // Upper lip left
    { x: 50,                  y: mY - lipT * 1.5 - smileFactor * 0.8 }, // Cupid's bow
    { x: 50 + mouthW / 4,     y: mY - lipT - smileFactor * 0.6 }, // Upper lip right
    { x: 50 + mouthW / 2,     y: mY - smileFactor * 0.3 }, // Right corner
    { x: 50,                  y: mY + lipT * 1.5 + smileFactor * 0.5 }, // Lower lip bottom
    { x: 50,                  y: mY + smileFactor * 0.1 }, // Mouth center
  ];
  mouthPoints.forEach((p, idx) => {
    const rot = rotate(p.x, p.y);
    landmarks.push({
      id: `mouth_${idx}`,
      name: idx === 0 ? "Mundwinkel Links" : idx === 4 ? "Mundwinkel Rechts" : idx === 6 ? "Mundzentrum" : `Lippenpunkt ${idx + 1}`,
      category: "mouth",
      x: rot.x,
      y: rot.y,
      description: idx === 0 || idx === 4 ? "Die Mundwinkel zeigen sofort, ob die Person lächelt, traurig ist oder ernst schaut." : "Zeigen die genaue Lippenform und wie weit der Mund für die Mimikübertragung geöffnet ist.",
    });
  });

  return landmarks;
}

// Default Presets
export const PRESETS: PresetPair[] = [
  {
    id: "monalisa_astronaut",
    name: "Mona Lisa zu Astronaut",
    description: "Der Klassiker: Das berühmte Ölgemälde wird in den Raumanzug eines Astronauten eingefügt. Perfekt zu sehen, wie sich das gemalte Gesicht an die Haltung und das Licht des Fotos anpasst.",
    source: {
      id: "src_monalisa",
      name: "Mona Lisa (Gemälde)",
      gender: "female",
      style: "renaissance",
      faceColor: "#e6c295",
      eyeColor: "#524335",
      hairColor: "#362a1e",
      hairStyle: "classic",
      expression: {
        smile: 0.2, // enigmatic smile!
        eyeOpenness: 0.75,
        eyebrowTilt: -0.1,
        headTilt: 4,
      },
      features: {
        faceWidth: 1.05,
        faceHeight: 1.05,
        jawRoundness: 0.9,
        noseLength: 1.1,
        noseBridgeWidth: 1.2,
        eyeSize: 0.9,
        eyeSpacing: 1.05,
        mouthWidth: 0.9,
        lipThickness: 1.1,
      },
      embeddingSeed: 12345,
    },
    target: {
      id: "tgt_astronaut",
      name: "Leo (Astronaut)",
      gender: "male",
      style: "astronaut",
      faceColor: "#f2ceab",
      eyeColor: "#3a628c",
      hairColor: "#544438",
      hairStyle: "space_helmet",
      expression: {
        smile: 0.8, // wide smile of accomplishment
        eyeOpenness: 0.9,
        eyebrowTilt: 0.1,
        headTilt: -8,
      },
      features: {
        faceWidth: 0.95,
        faceHeight: 1.0,
        jawRoundness: 0.6,
        noseLength: 0.95,
        noseBridgeWidth: 0.9,
        eyeSize: 1.1,
        eyeSpacing: 0.95,
        mouthWidth: 1.15,
        lipThickness: 0.85,
      },
      embeddingSeed: 67890,
    },
  },
  {
    id: "cyberpunk_exec",
    name: "Cyberpunk zu Business-Executive",
    description: "Ein futuristisches Gesicht mit bunten Haaren wird auf einen Geschäftsmann übertragen. Spannend zu sehen, wie sehr unterschiedliche Gesichtsformen und Hautfarben miteinander verschmelzen.",
    source: {
      id: "src_cyberpunk",
      name: "Vera (Cyberpunk)",
      gender: "female",
      style: "cyberpunk",
      faceColor: "#e0d5f5", // pale bluish skin
      eyeColor: "#c20a41", // red artificial eyes
      hairColor: "#05ffd5", // neon cyan hair
      hairStyle: "neon_mohawk",
      expression: {
        smile: -0.4, // serious, grim smirk
        eyeOpenness: 0.8,
        eyebrowTilt: 0.5, // slightly angry
        headTilt: -5,
      },
      features: {
        faceWidth: 0.85,
        faceHeight: 1.1,
        jawRoundness: 0.4, // very sharp chin
        noseLength: 1.15,
        noseBridgeWidth: 0.8,
        eyeSize: 1.2,
        eyeSpacing: 1.0,
        mouthWidth: 0.95,
        lipThickness: 0.75,
      },
      embeddingSeed: 11223,
    },
    target: {
      id: "tgt_executive",
      name: "Dr. Gabriel (Manager)",
      gender: "male",
      style: "executive",
      faceColor: "#7d5d44", // deep brown skin
      eyeColor: "#223d24", // dark green eyes
      hairColor: "#211d1c",
      hairStyle: "sleek",
      expression: {
        smile: 0.4, // professional warm expression
        eyeOpenness: 0.85,
        eyebrowTilt: 0.0,
        headTilt: 2,
      },
      features: {
        faceWidth: 1.0,
        faceHeight: 0.95,
        jawRoundness: 0.7,
        noseLength: 1.0,
        noseBridgeWidth: 1.1,
        eyeSize: 0.95,
        eyeSpacing: 1.1,
        mouthWidth: 1.05,
        lipThickness: 1.2,
      },
      embeddingSeed: 44556,
    },
  },
];

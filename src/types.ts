export interface FaceLandmark {
  id: string;
  name: string;
  category: "eye_l" | "eye_r" | "eyebrow_l" | "eyebrow_r" | "nose" | "mouth" | "jaw";
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  description: string;
}

export interface FaceData {
  id: string;
  name: string;
  gender: "male" | "female";
  style: "renaissance" | "astronaut" | "cyberpunk" | "executive";
  faceColor: string;
  eyeColor: string;
  hairColor: string;
  hairStyle: "classic" | "space_helmet" | "neon_mohawk" | "sleek";
  expression: {
    smile: number; // -1 (frown) to 1 (broad smile)
    eyeOpenness: number; // 0 (closed) to 1 (wide open)
    eyebrowTilt: number; // -1 (sad) to 1 (angry)
    headTilt: number; // -15 to 15 degrees
  };
  // Facial feature offsets for morphing and representation
  features: {
    faceWidth: number; // scale factor
    faceHeight: number; // scale factor
    jawRoundness: number; // curvature
    noseLength: number;
    noseBridgeWidth: number;
    eyeSize: number;
    eyeSpacing: number;
    mouthWidth: number;
    lipThickness: number;
  };
  embeddingSeed: number; // used to generate a unique 512-dim embedding
}

export interface PresetPair {
  id: string;
  name: string;
  description: string;
  source: FaceData;
  target: FaceData;
}

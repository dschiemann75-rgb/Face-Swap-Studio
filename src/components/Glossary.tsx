import { Cpu, Terminal, ShieldAlert, BookOpen } from "lucide-react";

export default function Glossary() {
  const terms = [
    {
      name: "RetinaFace / YOLOv8-Face",
      category: "Gesichtserkennung",
      role: "Schritt 1: Gesicht finden",
      desc: "Spezialisierte Programme, die Gesichter in Millisekunden aufspüren. Sie legen einen Rahmen um das Gesicht und markieren wichtige Punkte wie Augen, Nase und Mund, um das Gesicht geradezurichten.",
    },
    {
      name: "InsightFace (ArcFace)",
      category: "Merkmalsanalyse",
      role: "Schritt 2: Merkmale messen",
      desc: "Ein System, das Gesichter in einen einzigartigen Zahlencode (ein biometrisches Profil) übersetzt. Dieser Zahlencode erfasst die unverwechselbaren Züge einer Person und lässt Gesichtsausdrücke, Licht oder Blickwinkel einfach außen vor.",
    },
    {
      name: "Inswapper ONNX",
      category: "Gesichtstausch",
      role: "Schritt 3: Gesicht tauschen",
      desc: "Der eigentliche Kern des Tausches. Dieses Programm überträgt die biometrischen Merkmale der Quelle direkt in das Zielbild. Es führt den Gesichtstausch in einem einzigen, schnellen Rechenschritt aus.",
    },
    {
      name: "GFPGAN / CodeFormer",
      category: "Bildverbesserung",
      role: "Schritt 4: Bild scharfzeichnen",
      desc: "Qualitätsfilter. Da der Gesichtstausch für eine hohe Geschwindigkeit auf einem kleinen Pixelgitter rechnet, ist das Ergebnis oft etwas verschwommen. Diese Filter zeichnen das Gesicht scharf und fügen Details wie einzelne Wimpern, Fältchen und Hautporen realistisch hinzu.",
    },
  ];

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h3 className="text-base font-semibold text-white">Begriffserklärung & Hintergrundwissen</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {terms.map((term, idx) => (
          <div key={idx} className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold">
                  {term.category}
                </span>
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                  {term.role}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mt-3 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                {term.name}
              </h4>
              <p className="text-xs text-zinc-200 font-medium leading-relaxed mt-2">
                {term.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-amber-950/15 border border-amber-900/20 rounded-xl flex items-start gap-3 text-xs text-amber-300">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <strong className="block font-semibold mb-1 text-amber-400">Ethischer Hinweis & Deepfakes:</strong>
          <p className="leading-relaxed text-zinc-200 font-medium">
            Diese Open-Source-Pipelines sind mächtige Werkzeuge für kreative Bildbearbeitung, Filmrestaurierung und CGI. Sie bergen jedoch das Risiko des Missbrauchs für nicht-konsensuelle Manipulationen (Deepfakes). Moderne Plattformen nutzen digitale Signaturen (Watermarks), um generierte Inhalte transparent als synthetisch zu kennzeichnen.
          </p>
        </div>
      </div>
    </div>
  );
}

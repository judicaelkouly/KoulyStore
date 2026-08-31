import { useState, useMemo } from "react";
import { Settings, ExternalLink, BellRing, X, Radio, AlarmClockCheck } from "lucide-react";

// --- Données d'exemple : à remplacer par la sortie du script de veille ---
const MOCK_EVALUATIONS = [
  {
    id: 1,
    ue: "UE305 — Bases de données avancées",
    nom: "Devoir 2 : Modélisation relationnelle",
    ouverture: "2026-08-29T08:00:00",
    fermeture: "2026-09-01T23:59:00",
  },
  {
    id: 2,
    ue: "UE212 — Communication et médias numériques",
    nom: "Étude de cas : Stratégie éditoriale",
    ouverture: "2026-08-30T08:00:00",
    fermeture: "2026-09-04T23:59:00",
  },
  {
    id: 3,
    ue: "UE118 — Méthodes de recherche",
    nom: "Examen final",
    ouverture: "2026-09-02T08:00:00",
    fermeture: "2026-09-06T23:59:00",
  },
  {
    id: 4,
    ue: "UE401 — Gestion de projet",
    nom: "Rendu de livrable intermédiaire",
    ouverture: "2026-08-20T08:00:00",
    fermeture: "2026-08-28T23:59:00",
  },
];

const NOW = new Date("2026-08-31T10:00:00");

function getStatus(evalItem) {
  const opens = new Date(evalItem.ouverture);
  const closes = new Date(evalItem.fermeture);
  if (NOW < opens) return "a_venir";
  if (NOW > closes) return "cloture";
  const hoursLeft = (closes - NOW) / (1000 * 60 * 60);
  if (hoursLeft <= 48) return "urgent";
  return "ouvert";
}

function formatCountdown(evalItem) {
  const opens = new Date(evalItem.ouverture);
  const closes = new Date(evalItem.fermeture);
  const status = getStatus(evalItem);

  if (status === "a_venir") {
    const diff = opens - NOW;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { big: `J-${days}`, small: "avant ouverture" };
  }
  if (status === "cloture") {
    return { big: "Clôturé", small: "" };
  }
  const diff = closes - NOW;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return { big: `${days}j ${hours}h`, small: "restants" };
  return { big: `${hours}h`, small: "restants" };
}

const STATUS_STYLES = {
  urgent: { bar: "bg-[#FF5C5C]", text: "text-[#FF8080]", label: "Urgent" },
  ouvert: { bar: "bg-[#3ED598]", text: "text-[#3ED598]", label: "Ouvert" },
  a_venir: { bar: "bg-[#4C8DFF]", text: "text-[#7BA6FF]", label: "À venir" },
  cloture: { bar: "bg-[#4A5064]", text: "text-[#6B7185]", label: "Clôturé" },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UvciWatcherDashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [channel, setChannel] = useState("ntfy");
  const [ntfyTopic, setNtfyTopic] = useState("koulyvski-uvci");
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  const sorted = useMemo(() => {
    const priority = { urgent: 0, ouvert: 1, a_venir: 2, cloture: 3 };
    return [...MOCK_EVALUATIONS].sort(
      (a, b) => priority[getStatus(a)] - priority[getStatus(b)]
    );
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0F1320] text-[#E7E9F0] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-[#232838]">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">
            Veille UVCI
          </h1>
          <p className="text-sm text-[#8B92A8] mt-0.5">
            Surveillance des évaluations programmées
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://master.uvci.online/login/index.php"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#4C7EFF] hover:bg-[#3D6BEF] transition-colors text-sm font-medium"
          >
            Se connecter à UVCI
            <ExternalLink size={15} />
          </a>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Paramètres de notification"
            className="p-2.5 rounded-md border border-[#232838] hover:border-[#3A4155] transition-colors"
          >
            <Settings size={18} className="text-[#8B92A8]" />
          </button>
        </div>
      </header>

      {/* Info banner */}
      <div className="mx-6 mt-5 px-4 py-3 rounded-md bg-[#161B2B] border border-[#232838] flex items-center gap-2.5">
        <Radio size={15} className="text-[#4C8DFF] shrink-0" />
        <p className="text-sm text-[#8B92A8]">
          Données d'exemple — ce tableau affichera les évaluations réelles une
          fois connecté au script de veille.
        </p>
      </div>

      {/* Evaluation list */}
      <main className="px-6 py-6 max-w-3xl">
        <div className="space-y-0.5">
          {sorted.map((evalItem) => {
            const status = getStatus(evalItem);
            const style = STATUS_STYLES[status];
            const countdown = formatCountdown(evalItem);
            return (
              <div
                key={evalItem.id}
                className="flex items-stretch gap-4 py-4 border-b border-[#1C2131]"
              >
                <div className={`w-1 rounded-full ${style.bar}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-[#6B7185] mb-1">
                    {evalItem.ue}
                  </p>
                  <p className="font-medium text-[#E7E9F0]">{evalItem.nom}</p>
                  <p className="text-sm text-[#6B7185] mt-1.5">
                    Ouvre le {formatDate(evalItem.ouverture)} · Ferme le{" "}
                    {formatDate(evalItem.fermeture)}
                  </p>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className={`font-display text-lg font-semibold ${style.text}`}>
                    {countdown.big}
                  </p>
                  <p className="text-xs text-[#6B7185]">{countdown.small}</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Settings panel */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="relative w-full max-w-sm h-full bg-[#141826] border-l border-[#232838] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold">
                Notifications
              </h2>
              <button
                onClick={() => setSettingsOpen(false)}
                aria-label="Fermer"
                className="p-1.5 rounded-md hover:bg-[#1C2131]"
              >
                <X size={18} className="text-[#8B92A8]" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-[#8B92A8] mb-3">Canal d'alerte</p>
              <div className="space-y-2">
                {[
                  { id: "ntfy", label: "ntfy.sh", detail: "Gratuit, alerte sonore forte" },
                  { id: "pushover", label: "Pushover", detail: "Sonne en boucle jusqu'à lecture" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setChannel(opt.id)}
                    className={`w-full text-left px-4 py-3 rounded-md border transition-colors ${
                      channel === opt.id
                        ? "border-[#4C7EFF] bg-[#4C7EFF]/10"
                        : "border-[#232838] hover:border-[#3A4155]"
                    }`}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-[#6B7185] mt-0.5">{opt.detail}</p>
                  </button>
                ))}
              </div>
            </div>

            {channel === "ntfy" && (
              <div className="mb-6">
                <label className="text-sm text-[#8B92A8] mb-2 block">
                  Nom du topic ntfy
                </label>
                <input
                  type="text"
                  value={ntfyTopic}
                  onChange={(e) => setNtfyTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#0F1320] border border-[#232838] text-sm focus:outline-none focus:border-[#4C7EFF]"
                />
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-3 rounded-md border border-[#232838] mb-6">
              <div className="flex items-center gap-2.5">
                <AlarmClockCheck size={16} className="text-[#8B92A8]" />
                <span className="text-sm">Son d'alarme</span>
              </div>
              <button
                onClick={() => setAlarmEnabled(!alarmEnabled)}
                className={`w-10 h-5.5 rounded-full transition-colors relative ${
                  alarmEnabled ? "bg-[#4C7EFF]" : "bg-[#2A3044]"
                }`}
                style={{ height: "22px" }}
                aria-label="Activer le son d'alarme"
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{
                    transform: alarmEnabled ? "translateX(20px)" : "translateX(2px)",
                  }}
                />
              </button>
            </div>

            <button
              onClick={() => setSettingsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#4C7EFF] hover:bg-[#3D6BEF] transition-colors text-sm font-medium"
            >
              <BellRing size={15} />
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default UvciWatcherDashboard;
import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Bell,
  Volume2,
  Send,
  Settings,
  Radio
} from 'lucide-react';

const UVCI_LOGIN_URL = "https://master.uvci.online/login/index.php";

// --- Données d'exemple : à remplacer par la sortie du script de veille ---
const evaluations = [
  {
    id: 1,
    ue: "BCD301 - Développement Web Fullstack",
    title: "Évaluation Pratique : API REST avec NestJS",
    startDate: "2026-08-30T08:00:00",
    endDate: "2026-09-02T23:59:00",
    status: "in_progress"
  },
  {
    id: 2,
    ue: "BCD302 - Communication Digitale",
    title: "Devoir 1 : Stratégie de contenu Social Media",
    startDate: "2026-09-01T10:00:00",
    endDate: "2026-09-05T18:00:00",
    status: "upcoming"
  },
  {
    id: 3,
    ue: "BCD303 - Base de Données Avancée",
    title: "QCM - Modélisation NoSQL & MongoDB",
    startDate: "2026-08-20T00:00:00",
    endDate: "2026-08-25T23:59:00",
    status: "expired"
  }
];

export default function UvciDashboard() {
  const [filter, setFilter] = useState('all');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [notifications, setNotifications] = useState({
    alarm: true,
    telegram: false,
    push: true,
    telegramChatId: ''
  });

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredEvaluations = useMemo(
    () => evaluations.filter(item => filter === 'all' || item.status === filter),
    [filter]
  );

  const counts = {
    in_progress: evaluations.filter(e => e.status === 'in_progress').length,
    upcoming: evaluations.filter(e => e.status === 'upcoming').length,
    expired: evaluations.filter(e => e.status === 'expired').length,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-lg text-slate-900 font-bold text-sm sm:text-base">
              UVCI
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight">Moniteur d'Évaluations</h1>
              <p className="text-[10px] sm:text-xs text-slate-400">Université Virtuelle de Côte d'Ivoire</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={UVCI_LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-lg shadow-emerald-900/40 transition"
            >
              <span>Se connecter à UVCI</span>
              <ExternalLink size={15} />
            </a>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Paramètres de notification"
              className="p-2.5 rounded-lg border border-slate-700 hover:border-slate-500 transition"
            >
              <Settings size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6 sm:space-y-8">

        {/* Statut de surveillance */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 sm:p-3 bg-slate-700/50 rounded-lg text-emerald-400 shrink-0">
              <RefreshCw size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-200">Statut de la surveillance</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Le script de veille se connecte pour toi et rafraîchit cette page — ta session UVCI reste dans l'onglet que tu ouvres toi-même.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-400 w-full sm:w-auto border-t sm:border-t-0 border-slate-700/50 pt-2 sm:pt-0">
            Dernier contrôle : <span className="text-slate-200 font-mono">Aujourd'hui, 01:28</span>
          </div>
        </div>

        {/* Info sur les données d'exemple */}
        <div className="px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center gap-2.5">
          <Radio size={15} className="text-blue-400 shrink-0" />
          <p className="text-sm text-slate-400">
            Données d'exemple — ce tableau affichera les évaluations réelles une fois le script de veille branché.
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-amber-400 font-medium">Devoirs en cours</p>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-slate-100">{counts.in_progress}</h2>
            </div>
            <div className="bg-amber-500/10 p-2.5 sm:p-3 rounded-xl text-amber-400">
              <Clock size={24} />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-blue-500/30 rounded-xl p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-blue-400 font-medium">À venir</p>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-slate-100">{counts.upcoming}</h2>
            </div>
            <div className="bg-blue-500/10 p-2.5 sm:p-3 rounded-xl text-blue-400">
              <Calendar size={24} />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-rose-500/30 rounded-xl p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-rose-400 font-medium">Terminés / Expirés</p>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-slate-100">{counts.expired}</h2>
            </div>
            <div className="bg-rose-500/10 p-2.5 sm:p-3 rounded-xl text-rose-400">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        {/* Liste des évaluations */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-400" />
              Liste des Évaluations Programmées
            </h2>

            <div className="flex w-full sm:w-auto bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs sm:text-sm">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'in_progress', label: 'En cours' },
                { id: 'upcoming', label: 'À venir' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-medium transition ${
                    filter === tab.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4">
            {filteredEvaluations.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-slate-600"
              >
                <div className="space-y-1.5 w-full md:w-auto">
                  <span className="inline-block px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold bg-slate-700 text-emerald-400 rounded-md">
                    {item.ue}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">{item.title}</h3>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-400 shrink-0" />
                      Ouverture : <strong className="text-slate-300">{new Date(item.startDate).toLocaleString('fr-FR')}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-rose-400 shrink-0" />
                      Fermeture : <strong className="text-slate-300">{new Date(item.endDate).toLocaleString('fr-FR')}</strong>
                    </span>
                  </div>
                </div>

                <div className="w-full md:w-auto flex justify-start md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-700/50">
                  {item.status === 'in_progress' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                      En cours (Urgent)
                    </span>
                  )}
                  {item.status === 'upcoming' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      À venir
                    </span>
                  )}
                  {item.status === 'expired' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-400">
                      Expiré (Note 0/20)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Panneau de paramètres de notification */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSettingsOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-slate-800 border-l border-slate-700 p-5 sm:p-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Canaux & Alarmes d'Alerte</h2>
                <p className="text-xs text-slate-400 mt-1">Comment te prévenir dès qu'une évaluation est publiée</p>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl border transition ${notifications.alarm ? 'bg-slate-900/60 border-emerald-500/40' : 'bg-slate-900/20 border-slate-700'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${notifications.alarm ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Volume2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">Alarme Sonore</h4>
                      <p className="text-xs text-slate-400">Sonne comme un réveil sur le téléphone (ntfy / Pushover).</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.alarm}
                    onChange={() => toggleNotification('alarm')}
                    className="h-5 w-5 accent-emerald-500 cursor-pointer rounded"
                  />
                </div>
              </div>

              <div className={`p-4 rounded-xl border transition ${notifications.telegram ? 'bg-slate-900/60 border-emerald-500/40' : 'bg-slate-900/20 border-slate-700'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${notifications.telegram ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Send size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">Bot Telegram (optionnel)</h4>
                      <p className="text-xs text-slate-400">Message instantané en plus de l'alarme.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.telegram}
                    onChange={() => toggleNotification('telegram')}
                    className="h-5 w-5 accent-emerald-500 cursor-pointer rounded"
                  />
                </div>
                {notifications.telegram && (
                  <input
                    type="text"
                    placeholder="ID de chat Telegram (ex: 123456789)"
                    value={notifications.telegramChatId}
                    onChange={(e) => setNotifications({ ...notifications, telegramChatId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              <div className={`p-4 rounded-xl border transition ${notifications.push ? 'bg-slate-900/60 border-emerald-500/40' : 'bg-slate-900/20 border-slate-700'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${notifications.push ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      <Bell size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">Notification Push</h4>
                      <p className="text-xs text-slate-400">Bannière d'alerte sur l'écran, en complément du son.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={() => toggleNotification('push')}
                    className="h-5 w-5 accent-emerald-500 cursor-pointer rounded"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setSettingsOpen(false)}
              className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors text-sm font-semibold"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
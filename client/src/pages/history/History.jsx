import { useMemo } from "react";
import {
  FaHistory,
  FaCheckCircle,
  FaBookOpen,
  FaPlay,
  FaTrophy,
} from "react-icons/fa";
import { Sidebar, BottomNav } from "../../components/sidebar";
import Header from "../../components/Header";

// ----- Mock data with real timestamps -----
const rawHistory = [
  { id: 1, action: "Cours terminé", subject: "JavaScript pour débutants", timestamp: "2025-03-10T14:30:00", icon: FaBookOpen, color: "text-blue-600 bg-blue-100" },
  { id: 2, action: "Quiz réussi", subject: "React Hooks", timestamp: "2025-03-10T10:15:00", icon: FaCheckCircle, color: "text-green-600 bg-green-100" },
  { id: 3, action: "Session d'apprentissage", subject: "Python - Data Science", timestamp: "2025-03-09T18:45:00", icon: FaPlay, color: "text-yellow-600 bg-yellow-100" },
  { id: 4, action: "Badge obtenu", subject: "Développeur Frontend", timestamp: "2025-03-09T12:00:00", icon: FaTrophy, color: "text-purple-600 bg-purple-100" },
  { id: 5, action: "Cours commencé", subject: "Bases de données SQL", timestamp: "2025-03-08T09:20:00", icon: FaBookOpen, color: "text-indigo-600 bg-indigo-100" },
  { id: 6, action: "Quiz échoué", subject: "CSS Avancé", timestamp: "2025-03-07T16:10:00", icon: FaCheckCircle, color: "text-red-600 bg-red-100" },
  { id: 7, action: "Badge obtenu", subject: "Développeur Backend", timestamp: "2025-03-06T11:05:00", icon: FaTrophy, color: "text-purple-600 bg-purple-100" },
];

export default function History() {
  // ---- Group activities by date (formatted as "Aujourd'hui", "Hier", "Il y a X jours", or full date) ----
  const groupedHistory = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const groups = {};

    rawHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .forEach((item) => {
        const date = new Date(item.timestamp);
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        let key;
        if (dateOnly.getTime() === today.getTime()) {
          key = "Aujourd'hui";
        } else if (dateOnly.getTime() === yesterday.getTime()) {
          key = "Hier";
        } else {
          const diffDays = Math.floor((today - dateOnly) / 86400000);
          if (diffDays <= 7) {
            key = `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
          } else {
            key = date.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
          }
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

    return groups;
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
      `}</style>

      <div className="min-h-screen flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 ml-0 lg:ml-[260px] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto min-h-screen">
          <Header />

          {/* Titre */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <FaHistory className="text-gray-600" /> Historique
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Consultez l’ensemble de vos activités d’apprentissage.
            </p>
          </div>

          {/* Timeline */}
          <div className="max-w-2xl">
            {Object.keys(groupedHistory).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FaHistory className="mx-auto text-4xl mb-3" />
                <p className="font-medium">Aucune activité pour le moment.</p>
                <p className="text-sm">Commencez un cours ou un quiz pour voir votre historique.</p>
              </div>
            )}

            {Object.entries(groupedHistory).map(([dateLabel, items]) => (
              <div key={dateLabel} className="mb-8">
                {/* Date header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {dateLabel}
                  </h3>
                </div>

                {/* Entries */}
                <div className="space-y-0">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-4 py-3 ${
                        idx !== items.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.color}`}
                      >
                        <item.icon className="text-sm" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.action}</p>
                            <p className="text-xs text-gray-500">{item.subject}</p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(item.timestamp).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}
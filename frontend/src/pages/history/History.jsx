import { useMemo, useState, useEffect } from "react";
import {
  FaHistory,
  FaCheckCircle,
  FaBookOpen,
  FaPlay,
  FaTrophy,
  FaBell,
  FaStar,
  FaExclamationCircle,
} from "react-icons/fa";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";

// Mapping of notification types to icons and colors
const typeConfig = {
  welcome: { icon: FaBell, color: "text-yellow-600 bg-yellow-100" },
  course_start: { icon: FaPlay, color: "text-indigo-600 bg-indigo-100" },
  course_completed: { icon: FaCheckCircle, color: "text-green-600 bg-green-100" },
  quiz_passed: { icon: FaCheckCircle, color: "text-green-600 bg-green-100" },
  quiz_failed: { icon: FaExclamationCircle, color: "text-red-600 bg-red-100" },
  badge_earned: { icon: FaTrophy, color: "text-purple-600 bg-purple-100" },
  reminder: { icon: FaBookOpen, color: "text-blue-600 bg-blue-100" },
  progress_milestone: { icon: FaStar, color: "text-yellow-600 bg-yellow-100" },
  info: { icon: FaBell, color: "text-gray-600 bg-gray-100" },
};

export default function History() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    fetch(`http://localhost:5000/api/notifications/${currentUser.uid}`)
      .then((res) => res.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement historique :", err);
        setLoading(false);
      });
  }, [currentUser]);

  const groupedHistory = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const groups = {};

    notifications
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach((item) => {
        const date = new Date(item.created_at + "Z");
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
  }, [notifications]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
      `}</style>

      <Header />

      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <FaHistory className="text-gray-600" /> Historique
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Consultez l’ensemble de vos activités d’apprentissage.
        </p>
      </div>

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
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                {dateLabel}
              </h3>
            </div>

            <div className="space-y-0">
              {items.map((item, idx) => {
                const config = typeConfig[item.type] || typeConfig.info;
                const IconComponent = config.icon;
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 py-3 ${
                      idx !== items.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                      <IconComponent className="text-sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.message}</p>
                          {item.type && (
                            <p className="text-xs text-gray-500 capitalize">{item.type.replace("_", " ")}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(item.created_at + "Z").toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
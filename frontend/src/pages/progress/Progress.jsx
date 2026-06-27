import { useState, useEffect, useMemo } from "react";
import {
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaArrowUp,
  FaFire,
} from "react-icons/fa";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";

// Simple bar chart component for daily activity
const BarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end justify-between gap-1 h-24">
      {data.map((item) => (
        <div key={item.day} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs font-medium text-gray-600">{item.count}</span>
          <div
            className="w-full bg-purple-500 rounded-t-md transition-all"
            style={{ height: `${(item.count / max) * 100}%` }}
          />
          <span className="text-xs text-gray-400">{item.day}</span>
        </div>
      ))}
    </div>
  );
};

export default function Progress() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch progress stats
    fetch(`http://localhost:5000/api/progress/stats/${currentUser.uid}`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error);

    // Fetch notifications and compute daily counts for last 7 days
    fetch(`http://localhost:5000/api/notifications/${currentUser.uid}`)
      .then((res) => res.json())
      .then((notifs) => {
        const today = new Date();
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const count = notifs.filter((n) => {
            const ndate = new Date(n.created_at + "Z").toISOString().split("T")[0];
            return ndate === dateStr;
          }).length;
          days.push({
            day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
            count,
          });
        }
        setDailyActivity(days);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const kpis = stats
    ? [
        {
          icon: FaCheckCircle,
          color: "bg-green-100 text-green-600",
          value: `${stats.avgProgress}%`,
          label: "Taux de réussite",
        },
        {
          icon: FaClock,
          color: "bg-yellow-100 text-yellow-600",
          value: stats.totalWatchTime,
          label: "Temps total regardé",
        },
        {
          icon: FaTrophy,
          color: "bg-pink-100 text-pink-600",
          value: stats.badges,
          label: "Badges obtenus",
        },
        {
          icon: FaArrowUp,
          color: "bg-indigo-100 text-indigo-600",
          value: stats.completedCourses,
          label: "Cours terminés",
        },
      ]
    : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
        .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
      `}</style>

      <Header />

      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <FaChartBar className="text-purple-600" /> Progression
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Suivez votre évolution et vos performances.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-sm border border-gray-100 hover-elevate"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${kpi.color} mb-2 sm:mb-3`}>
              <kpi.icon className="text-base sm:text-lg" />
            </div>
            <p className="text-xl sm:text-3xl font-extrabold text-gray-900">{kpi.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Daily activity chart */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <FaFire className="text-orange-500" /> Activité quotidienne
          </h3>
          <span className="text-xs text-gray-400">7 derniers jours</span>
        </div>
        {dailyActivity.length > 0 && <BarChart data={dailyActivity} />}
      </div>

      {/* Per‑course breakdown (if needed) */}
      {stats && stats.courseCount > 0 && (
        <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
            Répartition par matière
          </h3>
          <p className="text-gray-500 text-sm">Données détaillées à venir.</p>
        </div>
      )}
    </>
  );
}
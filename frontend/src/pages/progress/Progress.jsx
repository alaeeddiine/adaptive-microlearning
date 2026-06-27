import { useState, useEffect } from "react";
import {
  FaChartBar, FaCheckCircle, FaClock, FaTrophy, FaArrowUp, FaFire,
} from "react-icons/fa";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";

const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end justify-between gap-1 h-24">
      {data.map(item => (
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
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    Promise.all([
      fetch(`http://localhost:5000/api/progress/stats/${uid}`).then(r => r.json()),
      fetch(`http://localhost:5000/api/activity/weekly/${uid}`).then(r => r.json()),
      fetch(`http://localhost:5000/api/courses/user/${uid}`).then(r => r.json()),
    ])
      .then(([statsData, weekly, userCourses]) => {
        setStats(statsData || { avgProgress: 0, totalWatchTime: "0m", badges: 0, completedCourses: 0, courseCount: 0 });
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push({
            day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
            count: Array.isArray(weekly) ? (weekly[i] || 0) : 0,
          });
        }
        setWeeklyActivity(days);
        setCourses(Array.isArray(userCourses) ? userCourses : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Impossible de charger les données.");
        setLoading(false);
      });
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const kpis = [
    {
      icon: FaCheckCircle,
      color: "bg-green-100 text-green-600",
      value: `${stats?.avgProgress ?? 0}%`,
      label: "Progression moyenne",
    },
    {
      icon: FaClock,
      color: "bg-yellow-100 text-yellow-600",
      value: stats?.totalWatchTime ?? "0m",
      label: "Temps total regardé",
    },
    {
      icon: FaTrophy,
      color: "bg-pink-100 text-pink-600",
      value: stats?.badges ?? 0,
      label: "Badges obtenus",
    },
    {
      icon: FaArrowUp,
      color: "bg-indigo-100 text-indigo-600",
      value: stats?.completedCourses ?? 0,
      label: "Cours terminés",
    },
  ];

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

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-sm border border-gray-100 hover-elevate">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${kpi.color} mb-2 sm:mb-3`}>
              <kpi.icon className="text-base sm:text-lg" />
            </div>
            <p className="text-xl sm:text-3xl font-extrabold text-gray-900">{kpi.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <FaFire className="text-orange-500" /> Activité quotidienne
          </h3>
          <span className="text-xs text-gray-400">7 derniers jours</span>
        </div>
        {weeklyActivity.length > 0 && weeklyActivity.some(d => d.count > 0) ? (
          <BarChart data={weeklyActivity} />
        ) : (
          <p className="text-gray-400 text-sm py-4 text-center">Aucune activité récente.</p>
        )}
      </div>

      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Répartition par cours</h3>
        {courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map(course => (
              <div key={course.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900 truncate">{course.title}</span>
                  <span className="text-gray-600">{course.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                    style={{ width: `${course.progress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm py-4 text-center">
            Aucun cours commencé. Lancez un cours depuis "Mes cours".
          </p>
        )}
      </div>
    </>
  );
}
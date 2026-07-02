import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChartBar, FaCheckCircle, FaClock, FaTrophy, FaArrowUp, FaFire,
} from "react-icons/fa";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";

const ActivityChart = ({ data }) => {
  const values = Array.isArray(data) ? data : [];
  const max = Math.max(...values.map(d => d.count || 0), 1);

  return (
    <div className="h-44 sm:h-52 flex items-end justify-between gap-2 sm:gap-3">
      {values.map(item => {
        const barHeight = Math.max(10, ((item.count || 0) / max) * 100);
        return (
          <div key={item.day} className="flex flex-col items-center justify-end flex-1 h-full min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 leading-none">
              {item.count || 0}
            </span>
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg shadow-sm"
                style={{ height: `${barHeight}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 mt-2 leading-none">
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function Progress() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [activities, setActivities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    Promise.all([
      fetch(`http://localhost:5000/api/progress/stats/${uid}`).then(r => r.json()),
      fetch(`http://localhost:5000/api/activity/weekly/${uid}`).then(r => r.json()),
      fetch(`http://localhost:5000/api/activity/user/${uid}`).then(r => r.json()),
      fetch(`http://localhost:5000/api/courses/user/${uid}`).then(r => r.json()),
    ])
      .then(([statsData, weekly, userActivities, userCourses]) => {
        setStats(statsData || { avgProgress: 0, overallProgress: 0, totalWatchTime: "0m", badges: 0, completedCourses: 0, courseCount: 0 });
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
        setActivities(Array.isArray(userActivities) ? userActivities : []);
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

  const mapQuiz = (act) => {
    let score = null;
    let title = act.quiz_title || "Quiz";
    try {
      const details = typeof act.event_data === "string" ? JSON.parse(act.event_data) : act.event_data || {};
      score = details.score ?? null;
      title = details.quiz_title || title;
    } catch {}

    return {
      id: act.id,
      title,
      score,
      timestamp: new Date(act.created_at + "Z").toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      completed: score === 100,
    };
  };

  const recentQuizzes = activities
    .filter((act) => act.event_type === "quiz_submitted")
    .slice(0, 3)
    .map(mapQuiz);
  const recentCourses = courses.slice(0, 3);

  const kpis = [
    {
      icon: FaCheckCircle,
      color: "bg-green-100 text-green-600",
      value: `${stats?.overallProgress ?? stats?.avgProgress ?? 0}%`,
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
        {weeklyActivity.length > 0 ? (
          <ActivityChart data={weeklyActivity} />
        ) : (
          <p className="text-gray-400 text-sm py-4 text-center">Aucune activité récente.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Cours récents</h3>
            <button onClick={() => navigate("/courses")} className="text-xs sm:text-sm text-[#5B4BFF] font-semibold hover:underline">Voir tout</button>
          </div>
          <div className="space-y-3">
            {recentCourses.length ? (
              recentCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-3 p-2 sm:p-3 rounded-2xl hover:bg-gray-50 transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${Number(course.progress) >= 100 ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600"}`}>
                    {Number(course.progress) >= 100 ? "✓" : "📘"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {course.progress != null ? `Progression : ${course.progress}%` : "Cours lancé"}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">{course.category_name || ""}</span>
                  <button
                    onClick={() => navigate("/courses")}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm whitespace-nowrap ${
                      Number(course.progress) >= 100
                        ? "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {Number(course.progress) >= 100 ? "Validé" : "Continuer"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-6">Aucun cours récent.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Quiz récents</h3>
            <button onClick={() => navigate("/quiz")} className="text-xs sm:text-sm text-[#5B4BFF] font-semibold hover:underline">Voir tout</button>
          </div>
          <div className="space-y-3">
            {recentQuizzes.length ? (
              recentQuizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center gap-3 p-2 sm:p-3 rounded-2xl hover:bg-gray-50 transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${quiz.completed ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"}`}>
                    {quiz.completed ? "✓" : "❓"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{quiz.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {quiz.score != null ? `Score : ${quiz.score}%` : "Quiz soumis"}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">{quiz.timestamp}</span>
                  <button
                    onClick={() => navigate("/quiz")}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm whitespace-nowrap ${
                      quiz.completed
                        ? "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {quiz.completed ? "Validé" : "Continuer"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-6">Aucun quiz récent.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

import { useState, useEffect } from "react";
import {
  FaUsers, FaBookOpen, FaGraduationCap, FaChartLine,
  FaClock, FaUserPlus, FaFire, FaStar, FaPlay,
} from "react-icons/fa";
import Header from "../../components/Header";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/dashboard")
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const kpis = [
    { icon: FaUsers, label: "Utilisateurs", value: data.users, color: "bg-blue-100 text-blue-600" },
    { icon: FaBookOpen, label: "Cours", value: data.courses, color: "bg-green-100 text-green-600" },
    { icon: FaGraduationCap, label: "Cours terminés", value: data.completed, color: "bg-yellow-100 text-yellow-600" },
    { icon: FaChartLine, label: "Progression moy.", value: `${data.avgProgress}%`, color: "bg-purple-100 text-purple-600" },
    { icon: FaClock, label: "Temps total passé", value: data.totalTimeSpent, color: "bg-pink-100 text-pink-600" },
    { icon: FaFire, label: "Groupe A", value: data.groupA, color: "bg-indigo-100 text-indigo-600" },
    { icon: FaStar, label: "Groupe B", value: data.groupB, color: "bg-orange-100 text-orange-600" },
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
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Tableau de bord administrateur</h2>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de la plateforme LearnSmart.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4 mb-8">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-sm border border-gray-100 hover-elevate">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${kpi.color} mb-2 sm:mb-3`}>
              <kpi.icon className="text-base sm:text-lg" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{kpi.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Two columns: recent signups + recent courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent signups */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaUserPlus className="text-purple-600" /> Derniers inscrits
          </h3>
          <div className="space-y-3">
            {data.recentUsers?.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(user.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
            {data.recentUsers?.length === 0 && (
              <p className="text-center text-gray-400 py-4">Aucun utilisateur récent.</p>
            )}
          </div>
        </div>

        {/* Recently played courses */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaPlay className="text-purple-600" /> Cours récemment joués
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.recentCourses?.map((course, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900 truncate">{course.title}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(course.last_played + "Z").toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            {data.recentCourses?.length === 0 && (
              <p className="text-center text-gray-400 py-4">Aucun cours joué récemment.</p>
            )}
          </div>
        </div>
      </div>

      {/* Most active users + Top courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Most active users */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaFire className="text-purple-600" /> Utilisateurs les plus actifs
          </h3>
          <div className="space-y-3">
            {data.mostActiveUsers?.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span className="text-xs text-gray-400">{user.totalTimeFormatted}</span>
              </div>
            ))}
            {data.mostActiveUsers?.length === 0 && (
              <p className="text-center text-gray-400 py-4">Aucune donnée d'activité.</p>
            )}
          </div>
        </div>

        {/* Top courses */}
        <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaBookOpen className="text-purple-600" /> Cours les plus suivis
          </h3>
          <div className="space-y-3">
            {data.topCourses?.map((course, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{course.title}</span>
                <span className="text-xs text-gray-500">{course.user_count} utilisateur(s)</span>
              </div>
            ))}
            {data.topCourses?.length === 0 && (
              <p className="text-center text-gray-400 py-4">Aucune donnée pour le moment.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
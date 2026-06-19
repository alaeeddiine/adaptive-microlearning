import { useState } from "react";
import {
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaPlay,
  FaMobileAlt,
  FaWifi,
  FaHeadphones,
} from "react-icons/fa";
import { Sidebar, BottomNav } from "../../components/sidebar";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";

// ---- Mock data ----
const weeklyProgress = [30, 45, 40, 55, 70, 65, 85];
const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const courses = [
  { id: 1, title: "JavaScript pour débutants", progress: 67, icon: "📘" },
  { id: 2, title: "React - Les fondamentaux", progress: 45, icon: "📙" },
  { id: 3, title: "Bases de données SQL", progress: 30, icon: "📗" },
];

const activities = [
  { id: 1, title: "Quiz terminé", subtitle: "JavaScript avancé", timestamp: "Il y a 2h", status: "Réussi", color: "green" },
  { id: 2, title: "Cours terminé", subtitle: "Python débutants", timestamp: "Il y a 5h", status: "Terminé", color: "blue" },
  { id: 3, title: "Session d'apprentissage", subtitle: "React Hooks", timestamp: "Hier", status: "En cours", color: "yellow" },
  { id: 4, title: "Badge obtenu", subtitle: "Frontend", timestamp: "Hier", status: "Débloqué", color: "purple" },
];

// ---- Simple line chart ----
const LineChart = ({ data }) => {
  const width = 280, height = 120, maxVal = 100;
  const points = data.map((val, i) => `${(i/(data.length-1))*width},${height-(val/maxVal)*height}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
      {[0,25,50,75,100].map(p => (
        <line key={p} x1="0" y1={height-(p/maxVal)*height} x2={width} y2={height-(p/maxVal)*height} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4" />
      ))}
      <polyline points={points} fill="none" stroke="#5B4BFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((val, i) => (
        <circle key={i} cx={(i/(data.length-1))*width} cy={height-(val/maxVal)*height} r="4" fill="white" stroke="#5B4BFF" strokeWidth="2" />
      ))}
    </svg>
  );
};

export default function Dashboard() {
  const { userData } = useAuth();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
        .progress-bar { transition: width 0.6s ease; }
        .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
        @media (max-width: 640px) {
          .context-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Sidebar (desktop only) */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 ml-0 lg:ml-[260px] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto min-h-screen">
          <Header />

          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { icon: FaBookOpen, color: "bg-indigo-100 text-indigo-600", value: "12", label: "Cours suivis", link: "Voir tout →" },
              { icon: FaCheckCircle, color: "bg-green-100 text-green-600", value: "85%", label: "Taux de réussite", link: "Voir détails →" },
              { icon: FaClock, color: "bg-yellow-100 text-yellow-600", value: "24h 30m", label: "Temps total", link: "Voir stats →" },
              { icon: FaTrophy, color: "bg-pink-100 text-pink-600", value: "7", label: "Badges", link: "Voir badges →" },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-sm border border-gray-100 hover-elevate">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${stat.color} mb-2 sm:mb-3`}>
                  <stat.icon className="text-base sm:text-lg" />
                </div>
                <p className="text-xl sm:text-3xl font-extrabold text-gray-900">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{stat.label}</p>
                <button className="text-[#5B4BFF] text-xs font-semibold mt-1 sm:mt-2 hover:underline hidden sm:inline-block">{stat.link}</button>
              </div>
            ))}
          </div>

          {/* RECOMMENDATION + PROGRESS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Recommended Course */}
            <div className="lg:col-span-2 bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Contenu recommandé pour vous</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">Basé sur votre profil</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center shrink-0">
                  <FaPlay className="text-gray-500 text-xl sm:text-2xl" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Audio</span>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 mt-1">Les bases de Git</h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">Apprenez les commandes essentielles de Git en 5 minutes.</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                    <span><strong>Difficulté :</strong> Débutant</span>
                    <span><strong>Durée :</strong> 2 min</span>
                  </div>
                </div>
              </div>
              <button className="mt-4 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2.5 px-5 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition text-sm">
                Commencer →
              </button>
            </div>

            {/* Progress Chart */}
            <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Votre progression</h3>
                <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600">
                  <option>7 jours</option>
                  <option>30 jours</option>
                </select>
              </div>
              <LineChart data={weeklyProgress} />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                {days.map((d,i)=><span key={i}>{d}</span>)}
              </div>
            </div>
          </div>

          {/* CURRENT COURSES */}
          <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 mb-6 hover-elevate">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Cours en cours</h3>
              <button className="text-xs sm:text-sm text-[#5B4BFF] font-semibold hover:underline">Voir tout</button>
            </div>
            <div className="space-y-3">
              {courses.map(course => (
                <div key={course.id} className="flex items-center gap-3 p-2 sm:p-3 rounded-2xl hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">{course.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                    <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full progress-bar" style={{width: `${course.progress}%`}} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 hidden sm:inline">{course.progress}%</span>
                  <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm whitespace-nowrap">Continue</button>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 mb-6 hover-elevate">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Activité récente</h3>
            <div className="space-y-4">
              {activities.map(act => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                    act.color==="green"?"bg-green-100 text-green-600": act.color==="blue"?"bg-blue-100 text-blue-600": act.color==="yellow"?"bg-yellow-100 text-yellow-600":"bg-purple-100 text-purple-600"
                  }`}>
                    <FaCheckCircle className="text-sm sm:text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{act.title}</p>
                        <p className="text-xs text-gray-500">{act.subtitle}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        act.status==="Réussi"?"bg-green-50 text-green-700": act.status==="Terminé"?"bg-blue-50 text-blue-700": act.status==="En cours"?"bg-yellow-50 text-yellow-700":"bg-purple-50 text-purple-700"
                      }`}>{act.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{act.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI CONTEXT BAR */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Contexte actuel détecté
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Notre IA adapte les contenus pour vous offrir la meilleure expérience.</p>
              </div>
              <button className="mt-3 sm:mt-0 px-4 py-2 border border-indigo-300 text-indigo-700 font-semibold rounded-xl sm:rounded-2xl hover:bg-indigo-50 transition shadow-sm text-sm">Mettre à jour</button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <FaMobileAlt className="text-gray-400 text-lg sm:text-xl" />
                <div><p className="text-xs font-medium text-gray-500">Appareil</p><p className="text-sm font-semibold text-gray-900">Mobile</p></div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <FaWifi className="text-gray-400 text-lg sm:text-xl" />
                <div><p className="text-xs font-medium text-gray-500">Connexion</p><p className="text-sm font-semibold text-gray-900">Faible</p></div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <FaHeadphones className="text-gray-400 text-lg sm:text-xl" />
                <div><p className="text-xs font-medium text-gray-500">Bruit ambiant</p><p className="text-sm font-semibold text-gray-900">Élevé</p></div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom navigation (mobile/tablet) */}
        <BottomNav />
      </div>
    </>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaPlay,
  FaMobileAlt,
  FaWifi,
  FaHeadphones,
  FaLightbulb,
} from "react-icons/fa";
import Header from "../../components/Header";
import useRealDashboardData from "../../hooks/useRealDashboardData";
import useAuth from "../../hooks/useAuth";

// ---- Simple line chart (unchanged) ----
const LineChart = ({ data }) => {
  if (!data || !data.length) data = [0, 0, 0, 0, 0, 0, 0];
  const width = 280, height = 120, maxVal = 100;
  const points = data
    .map((val, i) => `${(i / (data.length - 1)) * width},${height - (val / maxVal) * height}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
      {[0, 25, 50, 75, 100].map((p) => (
        <line key={p} x1="0" y1={height - (p / maxVal) * height} x2={width} y2={height - (p / maxVal) * height} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4" />
      ))}
      <polyline points={points} fill="none" stroke="#5B4BFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((val, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * width} cy={height - (val / maxVal) * height} r="4" fill="white" stroke="#5B4BFF" strokeWidth="2" />
      ))}
    </svg>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, loading } = useRealDashboardData();
  const { userData } = useAuth();            // get userData to know the group
  const isGroupA = userData?.ab_group === "A";

  // ----- CONTEXT DETECTION (unchanged) -----
  const [context, setContext] = useState({
    device: "Détection...",
    connection: "Détection...",
    noise: "Détection...",
  });
  const [detecting, setDetecting] = useState(false);

  const detectContext = async () => {
    setDetecting(true);
    setContext({ device: "Détection...", connection: "Détection...", noise: "Détection..." });

    // 1. Device
    const userAgent = navigator.userAgent;
    const width = window.innerWidth;
    let device = "Desktop";
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) || width < 1024) {
      device = width < 768 ? "Mobile" : "Tablette";
    }

    // 2. Network
    let connection = "Inconnu";
    if (navigator.connection) {
      const conn = navigator.connection;
      if (conn.effectiveType) {
        const type = conn.effectiveType.toLowerCase();
        switch (type) {
          case "slow-2g": case "2g": connection = "Faible"; break;
          case "3g": connection = "Moyenne"; break;
          case "4g": case "5g": connection = "Élevé"; break;
          case "wifi": case "ethernet": connection = "WiFi / Ethernet"; break;
          default: connection = type.charAt(0).toUpperCase() + type.slice(1);
        }
      } else if (conn.type) {
        connection = conn.type === "wifi" || conn.type === "ethernet" ? "WiFi / Ethernet" : conn.type;
      } else {
        connection = "Connecté";
      }
    } else if (navigator.onLine === false) {
      connection = "Hors ligne";
    } else {
      connection = "Connecté";
    }

    // 3. Noise
    let noise = "Non disponible";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      await new Promise((resolve) => setTimeout(resolve, 500));
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      stream.getTracks().forEach((track) => track.stop());
      audioContext.close();
      if (avg < 30) noise = "Faible";
      else if (avg < 60) noise = "Modéré";
      else noise = "Élevé";
    } catch (err) {
      noise = "Non autorisé";
    }

    setContext({ device, connection, noise });
    setDetecting(false);
  };

  useEffect(() => { detectContext(); }, []);

  // ---- Loading ----
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700" />
      </div>
    );
  }

  // ---- KPI cards ----
  const stats = [
    {
      icon: FaBookOpen,
      color: "bg-indigo-100 text-indigo-600",
      value: data?.totalCourses ?? 0,
      label: "Cours suivis",
      link: "Voir tout →",
    },
    {
      icon: FaCheckCircle,
      color: "bg-green-100 text-green-600",
      value: `${data?.successRate ?? 0}%`,
      label: "Taux de réussite",
      link: "Voir détails →",
    },
    {
      icon: FaClock,
      color: "bg-yellow-100 text-yellow-600",
      value: data?.timeSpent ?? "0m",
      label: "Temps total",
      link: "Voir stats →",
    },
    {
      icon: FaTrophy,
      color: "bg-pink-100 text-pink-600",
      value: data?.badges ?? 0,
      label: "Badges",
      link: "Voir badges →",
    },
  ];

  const weeklyProgress = data?.weeklyProgress ?? [0, 0, 0, 0, 0, 0, 0];
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // ---- Activity mapping (unchanged) ----
  const mapActivity = (act) => {
    let title = act.event_type;
    let subtitle = "";
    let color = "green";
    let status = "Terminé";
    try {
      const details = typeof act.event_data === "string" ? JSON.parse(act.event_data) : act.event_data || {};
      switch (act.event_type) {
        case "started":
          title = "Cours commencé";
          subtitle = details.progress !== undefined ? `Progression initiale: ${details.progress}%` : "";
          color = "blue";
          status = "En cours";
          break;
        case "completed":
          title = "Cours terminé";
          subtitle = "Félicitations !";
          color = "green";
          status = "Réussi";
          break;
        case "abandoned":
          title = "Cours abandonné";
          subtitle = `Progression: ${details.progress || 0}%`;
          color = "yellow";
          status = "Abandonné";
          break;
        case "blur":
          title = "Perte de focus";
          subtitle = `Progression: ${details.progress || 0}%`;
          color = "yellow";
          status = "En cours";
          break;
        case "focus":
          title = "Retour focus";
          subtitle = details.blurDurationMs ? `Absence: ${Math.round(details.blurDurationMs / 1000)}s` : "";
          color = "blue";
          status = "En cours";
          break;
        default:
          title = act.event_type;
          subtitle = JSON.stringify(details);
          color = "purple";
          status = act.event_type;
      }
    } catch (e) {}
    return {
      id: act.id,
      title,
      subtitle,
      timestamp: new Date(act.created_at + "Z").toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status,
      color,
    };
  };

  const recentActivities = (data?.activities || []).map(mapActivity);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
        .progress-bar { transition: width 0.6s ease; }
        .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
      `}</style>

      <Header />

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((stat, idx) => (
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
        {/* ---- Conditional recommendation card ---- */}
        <div className="lg:col-span-2 bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate">
          {isGroupA ? (
            // GROUP A : personalised recommendation
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Contenu recommandé pour vous</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">
                    Basé sur votre profil
                  </span>
                </div>
              </div>
              {data?.recommendedCourse ? (
                <div className="flex gap-3">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center shrink-0">
                    <FaPlay className="text-gray-500 text-xl sm:text-2xl" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      {data.recommendedCourse.category_name || "Cours"}
                    </span>
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{data.recommendedCourse.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{data.recommendedCourse.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                      <span><strong>Difficulté :</strong> {data.recommendedCourse.level || "Intermédiaire"}</span>
                      <span><strong>Durée :</strong> {data.recommendedCourse.duration || "—"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Aucune recommandation pour le moment. Complétez votre profil ou lancez une session.</p>
              )}
              {data?.recommendedCourse && (
                <button
                  onClick={() => navigate(`/course/${data.recommendedCourse.id}`)}
                  className="mt-4 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2.5 px-5 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition text-sm"
                >
                  Commencer →
                </button>
              )}
            </>
          ) : (
            // GROUP B : invitation to browse all courses
            <div className="text-center">
              <FaLightbulb className="mx-auto text-4xl text-yellow-500 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Explorez tous les cours disponibles</h3>
              <p className="text-sm text-gray-500 mb-4">
                Notre plateforme vous propose un catalogue complet de cours. Découvrez-les dès maintenant.
              </p>
              <button
                onClick={() => navigate("/recommendations")}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition text-sm"
              >
                Voir toutes les recommandations
              </button>
            </div>
          )}
        </div>

        {/* Progress chart (unchanged) */}
        <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 hover-elevate">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Votre progression</h3>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600">
              <option>7 jours</option>
            </select>
          </div>
          <LineChart data={weeklyProgress} />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            {days.map((d, i) => <span key={i}>{d}</span>)}
          </div>
        </div>
      </div>

      {/* CURRENT COURSES */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 mb-6 hover-elevate">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Cours en cours</h3>
          <button onClick={() => navigate("/courses")} className="text-xs sm:text-sm text-[#5B4BFF] font-semibold hover:underline">Voir tout</button>
        </div>
        <div className="space-y-3">
          {data?.courses.length ? (
            data.courses.map((course) => (
              <div key={course.id} className="flex items-center gap-3 p-2 sm:p-3 rounded-2xl hover:bg-gray-50 transition">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
                  📘
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full progress-bar" style={{ width: `${course.progress || 0}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:inline">{course.progress || 0}%</span>
                <button
                  onClick={() => navigate(`/course/${course.id}`)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm whitespace-nowrap"
                >
                  Continuer
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-6">Aucun cours en cours.</p>
          )}
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 mb-6 hover-elevate">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Activité récente</h3>
        <div className="space-y-4">
          {recentActivities.length ? (
            recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                  act.color === "green" ? "bg-green-100 text-green-600" :
                  act.color === "blue" ? "bg-blue-100 text-blue-600" :
                  act.color === "yellow" ? "bg-yellow-100 text-yellow-600" :
                  "bg-purple-100 text-purple-600"
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
                      act.status === "Réussi" ? "bg-green-50 text-green-700" :
                      act.status === "Abandonné" ? "bg-red-50 text-red-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>{act.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{act.timestamp}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-6">Aucune activité récente.</p>
          )}
        </div>
      </div>

      {/* AI CONTEXT BAR (unchanged) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[20px] sm:rounded-[24px] p-3 sm:p-5 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Contexte actuel détecté
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Notre IA adapte les contenus pour vous offrir la meilleure expérience.</p>
          </div>
          <button onClick={detectContext} disabled={detecting}
            className="shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 border border-indigo-300 text-indigo-700 font-semibold rounded-xl sm:rounded-2xl hover:bg-indigo-50 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {detecting ? "..." : "Mettre à jour"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FaMobileAlt className="text-gray-400 text-base sm:text-lg shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Appareil</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900">{context.device}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FaWifi className="text-gray-400 text-base sm:text-lg shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Connexion</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900">{context.connection}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FaHeadphones className="text-gray-400 text-base sm:text-lg shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Bruit ambiant</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900">{context.noise}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  FaArrowLeft,
  FaUser,
  FaBookOpen,
  FaChartLine,
  FaHistory,
  FaClock,
  FaMobileAlt,
  FaWifi,
  FaBatteryFull,
  FaSun,
  FaStar,
} from "react-icons/fa";

export default function AdminUserProgress() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    fetch(`http://localhost:5000/api/admin/users/${uid}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [uid]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">{error || "Aucune donnée"}</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-200 rounded-xl text-sm">
            Retour
          </button>
        </div>
      </>
    );
  }

  const { user, courses, activities, sessions, arcs } = data;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
        .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
      `}</style>

      <Header />
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <FaArrowLeft /> Retour à la liste
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Détails de l'utilisateur</h2>

      {/* ---- 1. Informations personnelles ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaUser className="text-purple-600" /> Informations générales
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Nom</p>
            <p className="text-sm font-semibold">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-semibold">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Groupe A/B</p>
            <p className="text-sm font-semibold">{user.ab_group || "?"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Inscrit le</p>
            <p className="text-sm font-semibold">
              {new Date(user.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      {/* ---- 2. Profil d'apprentissage (questionnaire) ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaChartLine className="text-purple-600" /> Profil d'apprentissage
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Âge</p>
            <p className="text-sm font-semibold">{user.age || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Niveau d'études</p>
            <p className="text-sm font-semibold">{user.education || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Maîtrise du sujet</p>
            <p className="text-sm font-semibold">{user.mastery || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Niveau de compétence</p>
            <p className="text-sm font-semibold">{user.competence || "—"}</p>
          </div>
        </div>
      </div>

      {/* ---- 3. Temps total et stats ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Temps total regardé</p>
          <p className="text-xl font-extrabold text-gray-900">{user.total_time_watched}</p>
        </div>
        <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Cours suivis</p>
          <p className="text-xl font-extrabold text-gray-900">{courses.length}</p>
        </div>
        <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Sessions enregistrées</p>
          <p className="text-xl font-extrabold text-gray-900">{sessions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Réponses ARCS</p>
          <p className="text-xl font-extrabold text-gray-900">{arcs.length}</p>
        </div>
      </div>

      {/* ---- 4. Cours en cours avec progression ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaBookOpen className="text-purple-600" /> Cours en cours
        </h3>
        {courses.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun cours commencé.</p>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                  📘
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {course.title}
                  </p>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                      style={{ width: `${course.progress || 0}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {course.progress || 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- 5. Activité récente ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaHistory className="text-purple-600" /> Activité récente
        </h3>
        {activities.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune activité enregistrée.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activities.map((act, idx) => {
              let eventText = act.event_type;
              let details = "";
              try {
                const data =
                  typeof act.event_data === "string"
                    ? JSON.parse(act.event_data)
                    : act.event_data || {};

                switch (act.event_type) {
                  case "started":
                    eventText = "Cours démarré";
                    break;
                  case "completed":
                    eventText = "Cours terminé";
                    details = `Progression finale: ${data.progress ?? "?"}%`;
                    break;
                  case "abandoned":
                    eventText = "Cours abandonné";
                    if (data.progress !== undefined) {
                      details = `Progression: ${data.progress}%`;
                      // compute watched time from segments
                      if (Array.isArray(data.watched_segments)) {
                        const totalWatch = data.watched_segments.reduce(
                          (sum, seg) => sum + (seg[1] - seg[0]),
                          0
                        );
                        details += `, Temps regardé: ${Math.round(totalWatch)}s`;
                      }
                    }
                    break;
                  case "blur":
                    eventText = "Perte de focus";
                    break;
                  case "focus":
                    eventText = "Retour focus";
                    if (data.blurDurationMs) {
                      details = `Absence: ${Math.round(data.blurDurationMs / 1000)}s`;
                    }
                    break;
                  default:
                    eventText = act.event_type;
                    details = JSON.stringify(data);
                }
              } catch {
                details = act.event_data;
              }

              return (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div>
                    <span
                      className={`font-medium capitalize ${
                        act.event_type === "completed"
                          ? "text-green-700"
                          : act.event_type === "abandoned"
                          ? "text-red-700"
                          : act.event_type === "blur"
                          ? "text-yellow-700"
                          : "text-gray-900"
                      }`}
                    >
                      {eventText}
                    </span>
                    {details && (
                      <span className="text-xs text-gray-500 ml-2">{details}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(act.created_at + "Z").toLocaleString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- 6. Sessions contextuelles ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaClock className="text-purple-600" /> Sessions enregistrées
        </h3>
        {sessions.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune session enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess, idx) => (
              <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <FaClock className="text-gray-400" /> {sess.time_available}
                </div>
                <div className="flex items-center gap-1">
                  <FaWifi className="text-gray-400" /> {sess.connection_level}
                </div>
                <div className="flex items-center gap-1">
                  <FaMobileAlt className="text-gray-400" /> {sess.device_type}
                </div>
                <div className="flex items-center gap-1">
                  <FaBatteryFull className="text-gray-400" /> {sess.battery_level}
                </div>
                <div className="flex items-center gap-1">
                  <FaSun className="text-gray-400" /> {sess.time_of_day}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- 7. ARCS (motivation) ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaStar className="text-purple-600" /> Motivation (ARCS)
        </h3>
        {arcs.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune réponse ARCS.</p>
        ) : (
          <div className="space-y-2">
            {arcs.map((arc, idx) => (
              <div key={idx} className="text-sm">
                <p className="font-medium">
                  Cours ID {arc.course_id} – {new Date(arc.created_at).toLocaleDateString("fr-FR")}
                </p>
                <div className="flex gap-4 mt-1 text-xs text-gray-600">
                  <span>Attention: {arc.attention}</span>
                  <span>Pertinence: {arc.relevance}</span>
                  <span>Confiance: {arc.confidence}</span>
                  <span>Satisfaction: {arc.satisfaction}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
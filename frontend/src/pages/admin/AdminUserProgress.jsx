import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  FaArrowLeft, FaUser, FaBookOpen, FaChartLine, FaHistory,
  FaClock, FaMobileAlt, FaWifi, FaBatteryFull, FaSun,
  FaStar, FaCheckCircle, FaTrophy, FaQuestionCircle, FaTimesCircle,
} from "react-icons/fa";

export default function AdminUserProgress() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    let alive = true;

    fetch(`http://localhost:5000/api/admin/users/${uid}`)
      .then((userRes) => {
        if (!userRes.ok) throw new Error(`Erreur ${userRes.status}`);
        return userRes.json();
      })
      .then((userJson) => {
        if (!alive) return;
        setData(userJson);
        setError("");
        void fetch("http://localhost:5000/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firebase_uid: uid }),
        })
          .then((res) => res.ok ? res.json() : null)
          .then((recommendation) => {
            if (!alive || !recommendation) return;
            const type = String(recommendation.predictedType || recommendation.course_type || "").trim();
            if (!type) {
              setAiRecommendation("—");
              return;
            }
            setAiRecommendation(type.charAt(0).toUpperCase() + type.slice(1));
          })
          .catch((recommendationErr) => {
            console.error(recommendationErr);
          });
      })
      .catch((err) => {
        if (!alive) return;
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
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

  const { user, courses, activities, sessions, sessionSummary, arcs, badges, quizzes } = data;

  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.progress >= 100).length;
  const overallProgress = Math.min(100, Number(user.avgProgress ?? user.overall_progress ?? 0));
  const recentQuizzes = quizzes.slice(0, 3);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
        .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
      `}</style>

      <Header />
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
        <FaArrowLeft /> Retour à la liste
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Détails de l'utilisateur</h2>

      {/* ---- 1. Informations personnelles ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaUser className="text-purple-600" /> Informations générales
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-xs text-gray-500">Nom</p><p className="text-sm font-semibold">{user.name}</p></div>
          <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-semibold">{user.email}</p></div>
          <div><p className="text-xs text-gray-500">Groupe A/B</p><p className="text-sm font-semibold">{user.ab_group || "?"}</p></div>
          <div><p className="text-xs text-gray-500">Inscrit le</p><p className="text-sm font-semibold">{new Date(user.created_at).toLocaleDateString("fr-FR")}</p></div>
        </div>
      </div>

      {/* ---- 2. Profil d'apprentissage ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaChartLine className="text-purple-600" /> Profil d'apprentissage
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div><p className="text-xs text-gray-500">Âge</p><p className="text-sm font-semibold">{user.age || "—"}</p></div>
          <div><p className="text-xs text-gray-500">Niveau d'études</p><p className="text-sm font-semibold">{user.education || "—"}</p></div>
          <div><p className="text-xs text-gray-500">Maîtrise du sujet</p><p className="text-sm font-semibold">{user.mastery || "—"}</p></div>
          <div><p className="text-xs text-gray-500">Niveau de compétence</p><p className="text-sm font-semibold">{user.competence || "—"}</p></div>
          <div><p className="text-xs text-gray-500">Recommendation AI</p><p className="text-sm font-semibold">{aiRecommendation}</p></div>
        </div>
      </div>

      {/* ---- 3. Progression réelle (KPI) ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 text-center">
              <FaBookOpen className="mx-auto text-xl text-indigo-600 mb-2" />
              <p className="text-2xl font-extrabold text-gray-900">{totalCourses}</p>
              <p className="text-xs text-gray-500">Cours commencés</p>
          </div>
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 text-center">
              <FaCheckCircle className="mx-auto text-xl text-green-600 mb-2" />
              <p className="text-2xl font-extrabold text-gray-900">{completedCourses}</p>
              <p className="text-xs text-gray-500">Cours terminés</p>
          </div>
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 text-center">
              <FaChartLine className="mx-auto text-xl text-purple-600 mb-2" />
              <p className="text-2xl font-extrabold text-gray-900">{overallProgress}%</p>
              <p className="text-xs text-gray-500">Progression totale</p>
          </div>

          {/* Quiz réussis (score ≥ 80%) */}
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 text-center">
              <FaCheckCircle className="mx-auto text-xl text-green-500 mb-2" />
              <p className="text-2xl font-extrabold text-gray-900">
                  {quizzes.filter(q => q.score >= 80).length}
              </p>
              <p className="text-xs text-gray-500">Quiz réussis</p>
          </div>

          {/* Quiz échoués (score < 80%) */}
          <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 text-center">
              <FaTimesCircle className="mx-auto text-xl text-red-500 mb-2" />
              <p className="text-2xl font-extrabold text-gray-900">
                  {quizzes.filter(q => q.score < 80).length}
              </p>
              <p className="text-xs text-gray-500">Quiz échoués</p>
          </div>
      </div>

      {/* ---- 5. Cours suivis ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaBookOpen className="text-purple-600" /> Cours suivis
        </h3>
        {courses.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun cours commencé.</p>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">📘</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                  <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${course.progress || 0}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">{course.progress || 0}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- 6. Quiz complétés ---- */}
      {recentQuizzes.length > 0 && (
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaQuestionCircle className="text-purple-600" /> Quiz effectués
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentQuizzes.map((quiz) => {
              const isSuccess = quiz.score >= 80;
              return (
                <div key={quiz.quiz_id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">{quiz.title}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      isSuccess ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {isSuccess ? "Terminé" : "Échoué"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{quiz.description || quiz.category_name || ""}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{quiz.correct_answers}/{quiz.total_questions} correctes</span>
                    <span className={`font-bold ${isSuccess ? "text-green-600" : "text-red-600"}`}>
                      {quiz.score}%
                    </span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`h-full rounded-full ${isSuccess ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${quiz.score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- 7. Activité récente (aujourd’hui uniquement) ---- */}
      {(() => {
        // Obtenir la date du jour au format YYYY-MM-DD
        const todayStr = new Date().toISOString().split("T")[0];

        // Filtrer les activités dont la date correspond à aujourd'hui
        const todayActivities = activities.filter(act => {
          try {
            const actDate = new Date(act.created_at + "Z").toISOString().split("T")[0];
            return actDate === todayStr;
          } catch {
            return false;
          }
        });

        return (
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaHistory className="text-purple-600" /> Activité du jour
            </h3>
            {todayActivities.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune activité aujourd’hui.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {todayActivities.map((act, idx) => {
                  let eventText = act.event_type;
                  let details = "";
                  let resourceTitle = act.course_title || act.quiz_title || "";
                  try {
                    const evtData = typeof act.event_data === "string" ? JSON.parse(act.event_data) : act.event_data || {};
                    switch (act.event_type) {
                      case "started":
                        eventText = "Cours démarré";
                        break;
                      case "completed":
                        eventText = "Cours terminé";
                        details = `Progression finale : ${evtData.progress ?? "?"}%`;
                        break;
                      case "abandoned":
                        eventText = "Cours abandonné";
                        details = `Progression : ${evtData.progress || 0}%`;
                        break;
                      case "blur":
                        eventText = "Perte de focus";
                        break;
                      case "focus":
                        eventText = "Retour focus";
                        if (evtData.blurDurationMs) details = `Absence : ${Math.round(evtData.blurDurationMs / 1000)}s`;
                        break;
                      case "quiz_submitted":
                        eventText = "Quiz soumis";
                        if (resourceTitle) eventText += ` : ${resourceTitle}`;
                        details = `Score : ${evtData.score || 0}%`;
                        resourceTitle = "";
                        break;
                      default:
                        eventText = act.event_type;
                        details = JSON.stringify(evtData);
                    }
                  } catch {}
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div>
                        <span
                          className={`font-medium capitalize ${
                            act.event_type === "completed" ? "text-green-700" :
                            act.event_type === "abandoned" ? "text-red-700" :
                            "text-gray-900"
                          }`}
                        >
                          {eventText}
                        </span>
                        {resourceTitle && <span className="text-xs text-gray-500 ml-1">– {resourceTitle}</span>}
                        {details && <span className="text-xs text-gray-500 ml-2">{details}</span>}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(act.created_at + "Z").toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ---- 8. Sessions contextuelles ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaClock className="text-purple-600" /> Sessions enregistrées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Contexte actuel détecté</p>
            <p className="text-sm font-semibold text-gray-900">
              {sessionSummary?.currentContext
                ? `${sessionSummary.currentContext.device_type || "—"} · ${sessionSummary.currentContext.connection_level || "—"}`
                : "Aucun contexte détecté"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {sessionSummary?.currentContext?.time_of_day || "—"}
            </p>
            <p className="text-sm font-bold text-gray-900 mt-2">
              {sessionSummary?.currentSessionDuration || "0m"}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Batterie moyenne</p>
            <p className="text-sm font-semibold text-gray-900">
              {sessionSummary?.averageBatteryPercent != null
                ? `Moyenne (${sessionSummary.averageBatteryPercent}%)`
                : "Non disponible"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {sessionSummary?.currentBatteryPercent != null
                ? `Actuelle (${sessionSummary.currentBatteryPercent}%)`
                : sessionSummary?.currentBatteryLevel || "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Temps moyen / jour</p>
            <p className="text-sm font-semibold text-gray-900">{sessionSummary?.averageDailyFormatted || "0m"}</p>
            <p className="text-xs text-gray-500 mt-1">
              {sessionSummary?.activeSessionsCount || 0} sessions actives sur {sessionSummary?.activeDaysCount || 0} jour(s)
            </p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune session enregistrée.</p>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            {(() => {
              const sess = sessions[0];
              return (
                <>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(sess.created_at).toLocaleString("fr-FR")}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600">
                      {sessionSummary?.currentSessionDuration || "0m"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div className="flex items-center gap-1"><FaClock className="text-gray-400" /> {sessionSummary?.currentSessionDuration || "0m"}</div>
                    <div className="flex items-center gap-1"><FaWifi className="text-gray-400" /> {sess.connection_level}</div>
                    <div className="flex items-center gap-1"><FaMobileAlt className="text-gray-400" /> {sess.device_type}</div>
                    <div className="flex items-center gap-1"><FaBatteryFull className="text-gray-400" /> {sess.battery_percent != null ? `${Math.round(sess.battery_percent)}%` : sess.battery_level}</div>
                    <div className="flex items-center gap-1"><FaSun className="text-gray-400" /> {sess.time_of_day}</div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* ---- 9. Badges obtenus ---- */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaTrophy className="text-purple-600" /> Badges obtenus
        </h3>
        {badges.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun badge pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{badge.icon || "🏆"}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{badge.name}</p>
                    <p className="text-xs text-gray-500">{badge.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(badge.earned_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- 10. Motivation (ARCS) ---- */}
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
                <p className="font-medium">{arc.course_title || `Cours ID ${arc.course_id}`} - {new Date(arc.created_at).toLocaleDateString("fr-FR")}</p>
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

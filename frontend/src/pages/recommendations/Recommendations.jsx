import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBrain,
  FaClock,
  FaFire,
  FaLightbulb,
  FaPlay,
  FaStar,
} from "react-icons/fa";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";
import { getContentTypeMeta } from "../../utils/contentTypes";

function RecommendationCard({ item, onStart }) {
  const contentType = getContentTypeMeta(item);

  return (
    <div className="min-w-[240px] sm:min-w-[280px] bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 hover-elevate flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${contentType.iconBox}`}>
          <contentType.Icon />
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${contentType.badge}`}>
          {contentType.label}
        </span>
      </div>
      <h4 className="text-base font-bold text-gray-900 line-clamp-1">{item.title}</h4>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        {contentType.type !== "quiz" && (
          <>
            <span className="flex items-center gap-1"><FaBrain className="text-gray-400" />{item.level || "-"}</span>
            <span className="flex items-center gap-1"><FaClock className="text-gray-400" />{item.duration || "-"}</span>
            <span className="flex items-center gap-1 text-yellow-500"><FaStar className="text-yellow-400" />{item.rating || "-"}</span>
          </>
        )}
      </div>
      <button
        onClick={() => onStart(item)}
        className="mt-4 w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-purple-700 transition shadow-sm flex items-center justify-center gap-1"
      >
        <FaPlay className="text-xs" /> {contentType.type === "quiz" ? "Commencer le quiz" : "Demarrer"}
      </button>
    </div>
  );
}

export default function Recommendations() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [predictedType, setPredictedType] = useState(null);
  const [loading, setLoading] = useState(true);

  const isGroupA = userData?.ab_group === "A";

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    fetch("http://localhost:5000/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebase_uid: currentUser.uid }),
    })
      .then((res) => res.json())
      .then((data) => {
        setRecommendations(Array.isArray(data.courses) ? data.courses : []);
        setPredictedType(data.predictedType || null);
      })
      .catch((err) => {
        console.error("Erreur recommandations:", err);
        setRecommendations([]);
        setPredictedType(null);
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleStart = (item) => {
    if (item.type === "quiz") {
      navigate(`/quiz/${item.id}`);
    } else {
      navigate(`/course/${item.id}`);
    }
  };

  const featured = recommendations[0] || null;
  const featuredType = featured ? getContentTypeMeta(featured) : null;
  const trending = recommendations.slice(1, 6);
  const moreRecommendations = recommendations.slice(6);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
        .hover-elevate { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-elevate:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1); }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Header />

      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <FaLightbulb className="text-yellow-500" /> Recommandations
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isGroupA
            ? "Contenus personnalises selon votre profil d'apprentissage."
            : "Decouvrez l'ensemble des cours disponibles sur la plateforme."}
        </p>
        {isGroupA && predictedType && (
          <span className="inline-flex mt-3 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">
            Type recommande par l'IA : {predictedType}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FaLightbulb className="mx-auto text-4xl mb-3" />
          <p className="font-medium">Aucune recommandation pour le moment.</p>
          <p className="text-sm">
            {isGroupA
              ? "Completez votre profil ou commencez des cours pour affiner vos suggestions."
              : "Le catalogue est vide pour le moment. Revenez plus tard."}
          </p>
        </div>
      ) : (
        <>
          {featured && (
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-purple-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg hover-elevate">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-full" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                    <featuredType.Icon />
                  </div>
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium mb-2">
                      {featuredType.label}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-bold">{featured.title}</h3>
                    <p className="mt-2 text-white/80 text-sm max-w-lg">{featured.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-white/70 text-xs">
                      {featuredType.type !== "quiz" ? (
                        <>
                          {featured.category_name && <span>{featured.category_name}</span>}
                          <span className="flex items-center gap-1"><FaBrain /> {featured.level || "-"}</span>
                          <span className="flex items-center gap-1"><FaClock /> {featured.duration || "-"}</span>
                          <span className="flex items-center gap-1 text-yellow-300"><FaStar /> {featured.rating || "-"}</span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1"><featuredType.Icon /> Quiz interactif</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleStart(featured)}
                  className="mt-5 inline-flex items-center gap-2 bg-white text-purple-700 font-semibold py-2.5 px-5 rounded-xl text-sm shadow hover:bg-gray-100 transition"
                >
                  <FaPlay /> {featuredType.type === "quiz" ? "Commencer le quiz" : "Commencer"}
                </button>
              </div>
            </div>
          )}

          {trending.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaFire className="text-orange-500" /> Recommandes
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto scroll-hide pb-2">
                {trending.map((item) => (
                  <RecommendationCard key={`${item.type}-${item.id}`} item={item} onStart={handleStart} />
                ))}
              </div>
            </div>
          )}

          {moreRecommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Plus de recommandations
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto scroll-hide pb-2">
                {moreRecommendations.map((item) => (
                  <RecommendationCard key={`${item.type}-${item.id}`} item={item} onStart={handleStart} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

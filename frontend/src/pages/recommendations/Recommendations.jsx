import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaLightbulb, FaPlay, FaStar, FaBrain, FaClock,
} from "react-icons/fa";
import Header from "../../components/Header";
import useAuth from "../../hooks/useAuth";

function RecommendationCard({ item, onStart }) {
  return (
    <div className="min-w-[240px] sm:min-w-[280px] bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 hover-elevate flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
          {item.icon || "📘"}
        </div>
        <span className="text-xs font-medium px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
          {item.category_name || ""}
        </span>
      </div>
      <h4 className="text-base font-bold text-gray-900 line-clamp-1">{item.title}</h4>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><FaBrain className="text-gray-400" />{item.level}</span>
        <span className="flex items-center gap-1"><FaClock className="text-gray-400" />{item.duration}</span>
        <span className="flex items-center gap-1 text-yellow-500"><FaStar className="text-yellow-400" />{item.rating || "—"}</span>
      </div>
      <button
        onClick={() => onStart(item)}
        className="mt-4 w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-purple-700 transition shadow-sm flex items-center justify-center gap-1"
      >
        <FaPlay className="text-xs" /> Démarrer
      </button>
    </div>
  );
}

export default function Recommendations() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    fetch("http://localhost:5000/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebase_uid: currentUser.uid }),
    })
      .then(res => res.json())
      .then(data => {
        setRecommendations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur recommandations:", err);
        setLoading(false);
      });
  }, [currentUser]);

  const handleStart = (course) => {
    navigate(`/course/${course.id}`);
  };

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
          Contenus sélectionnés pour vous selon votre profil et vos progrès.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      ) : recommendations.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto scroll-hide pb-2">
          {recommendations.map((item) => (
            <RecommendationCard key={item.id} item={item} onStart={handleStart} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <FaLightbulb className="mx-auto text-4xl mb-3" />
          <p className="font-medium">Aucune recommandation pour le moment.</p>
          <p className="text-sm">Complétez des cours pour affiner vos suggestions.</p>
        </div>
      )}
    </>
  );
}
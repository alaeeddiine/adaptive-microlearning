import {
  FaLightbulb,
  FaPlay,
  FaStar,
  FaBrain,
  FaClock,
  FaFire,
} from "react-icons/fa";
import { Sidebar, BottomNav } from "../../components/sidebar";
import Header from "../../components/Header";

// ----- Données mock -----
const featured = {
  id: 1,
  title: "Les bases de Git",
  description: "Apprenez les commandes essentielles de Git en 5 minutes.",
  type: "Audio",
  duration: "2 min",
  difficulty: "Débutant",
  rating: 4.9,
  icon: "🔧",
};

const trending = [
  {
    id: 2,
    title: "Introduction à Python",
    description: "Découvrez les fondamentaux du langage Python.",
    type: "Vidéo",
    duration: "10 min",
    difficulty: "Débutant",
    rating: 4.8,
    icon: "🐍",
  },
  {
    id: 3,
    title: "React Hooks avancés",
    description: "Maîtrisez les hooks avec des exemples concrets.",
    type: "Article",
    duration: "8 min",
    difficulty: "Intermédiaire",
    rating: 4.7,
    icon: "📙",
  },
  {
    id: 4,
    title: "Design patterns en JavaScript",
    description: "Comprenez les patrons de conception les plus utilisés.",
    type: "Vidéo",
    duration: "15 min",
    difficulty: "Avancé",
    rating: 4.6,
    icon: "📘",
  },
];

const allRecommendations = [
  ...trending,
  {
    id: 5,
    title: "CSS Grid & Flexbox",
    description: "Maîtrisez la mise en page moderne.",
    type: "Article",
    duration: "12 min",
    difficulty: "Intermédiaire",
    rating: 4.8,
    icon: "🎨",
  },
  {
    id: 6,
    title: "Node.js pour débutants",
    description: "Créez votre premier serveur backend.",
    type: "Vidéo",
    duration: "20 min",
    difficulty: "Débutant",
    rating: 4.5,
    icon: "💚",
  },
];

// ----- Composant réutilisable pour une carte -----
function RecommendationCard({ item }) {
  return (
    <div className="min-w-[240px] sm:min-w-[280px] bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 hover-elevate flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
          {item.icon}
        </div>
        <span className="text-xs font-medium px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
          {item.type}
        </span>
      </div>
      <h4 className="text-base font-bold text-gray-900 line-clamp-1">{item.title}</h4>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><FaBrain className="text-gray-400" />{item.difficulty}</span>
        <span className="flex items-center gap-1"><FaClock className="text-gray-400" />{item.duration}</span>
        <span className="flex items-center gap-1 text-yellow-500"><FaStar className="text-yellow-400" />{item.rating}</span>
      </div>
      <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-purple-700 transition shadow-sm flex items-center justify-center gap-1">
        <FaPlay className="text-xs" /> Démarrer
      </button>
    </div>
  );
}

export default function Recommendations() {
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

      <div className="min-h-screen flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 ml-0 lg:ml-[260px] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto min-h-screen">
          <Header />

          {/* Titre */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <FaLightbulb className="text-yellow-500" /> Recommandations
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Contenus sélectionnés pour vous selon votre profil et vos progrès.
            </p>
          </div>

          {/* FEATURED CARD */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-purple-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg hover-elevate">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-full" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">
                  {featured.icon}
                </div>
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium mb-2">
                    Recommandé pour vous
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold">{featured.title}</h3>
                  <p className="mt-2 text-white/80 text-sm max-w-lg">{featured.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-white/70 text-xs">
                    <span className="flex items-center gap-1"><FaBrain /> {featured.difficulty}</span>
                    <span className="flex items-center gap-1"><FaClock /> {featured.duration}</span>
                    <span className="flex items-center gap-1 text-yellow-300"><FaStar /> {featured.rating}</span>
                  </div>
                </div>
              </div>
              <button className="mt-5 inline-flex items-center gap-2 bg-white text-purple-700 font-semibold py-2.5 px-5 rounded-xl text-sm shadow hover:bg-gray-100 transition">
                <FaPlay /> Commencer
              </button>
            </div>
          </div>

          {/* TRENDING SECTION – horizontal scroll */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaFire className="text-orange-500" /> Tendances
              </h3>
              <button className="text-sm text-purple-600 font-semibold hover:underline">
                Voir tout
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto scroll-hide pb-2">
              {trending.map((item) => (
                <RecommendationCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* PLUS DE RECOMMANDATIONS – exactement le même affichage horizontal */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Plus de recommandations
              </h3>
              <button className="text-sm text-purple-600 font-semibold hover:underline">
                Voir tout
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto scroll-hide pb-2">
              {allRecommendations.map((item) => (
                <RecommendationCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}
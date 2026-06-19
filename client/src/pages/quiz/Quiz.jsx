import { FaQuestionCircle, FaPlay, FaCheckCircle, FaClock, FaFire } from "react-icons/fa";
import { Sidebar, BottomNav } from "../../components/sidebar";
import Header from "../../components/Header";

// ----- Données mock -----
const featuredQuiz = {
  id: 1,
  title: "JavaScript avancé",
  description: "Testez vos connaissances sur les closures, prototypes et ES6.",
  questionCount: 15,
  avgTime: "7 min",
  difficulty: "Avancé",
  icon: "📘",
};

const trendingQuizzes = [
  {
    id: 2,
    title: "React Hooks",
    description: "Quiz rapide sur useState, useEffect et useContext.",
    questionCount: 10,
    avgTime: "5 min",
    difficulty: "Intermédiaire",
    icon: "📙",
    completed: true,
  },
  {
    id: 3,
    title: "Python Basics",
    description: "Variables, boucles et fonctions en Python.",
    questionCount: 12,
    avgTime: "6 min",
    difficulty: "Débutant",
    icon: "🐍",
    completed: false,
  },
  {
    id: 4,
    title: "CSS moderne",
    description: "Flexbox, Grid, animations et responsive design.",
    questionCount: 8,
    avgTime: "4 min",
    difficulty: "Intermédiaire",
    icon: "🎨",
    completed: false,
  },
];

const allQuizzes = [
  ...trendingQuizzes,
  {
    id: 5,
    title: "SQL pour débutants",
    description: "Requêtes SELECT, JOIN et agrégations.",
    questionCount: 20,
    avgTime: "10 min",
    difficulty: "Débutant",
    icon: "📗",
    completed: false,
  },
  {
    id: 6,
    title: "Node.js & Express",
    description: "Quiz sur la création d'API REST.",
    questionCount: 10,
    avgTime: "8 min",
    difficulty: "Intermédiaire",
    icon: "💚",
    completed: true,
  },
];

// ----- Composant réutilisable pour une carte quiz -----
function QuizCard({ item }) {
  return (
    <div className="min-w-[240px] sm:min-w-[280px] bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 hover-elevate flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
          {item.icon}
        </div>
        {item.completed && (
          <span className="text-xs font-medium px-2 py-0.5 bg-green-50 text-green-700 rounded-full flex items-center gap-1">
            <FaCheckCircle className="text-xs" /> Terminé
          </span>
        )}
      </div>
      <h4 className="text-base font-bold text-gray-900 line-clamp-1">{item.title}</h4>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><FaQuestionCircle className="text-gray-400" />{item.questionCount} questions</span>
        <span className="flex items-center gap-1"><FaClock className="text-gray-400" />{item.avgTime}</span>
      </div>
      <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-purple-700 transition shadow-sm flex items-center justify-center gap-1">
        <FaPlay className="text-xs" /> {item.completed ? "Revoir" : "Démarrer"}
      </button>
    </div>
  );
}

export default function Quiz() {
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
              <FaQuestionCircle className="text-purple-600" /> Quiz
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Testez vos connaissances avec des quiz adaptés à votre niveau.
            </p>
          </div>

          {/* FEATURED QUIZ */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-purple-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg hover-elevate">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-full" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">
                  {featuredQuiz.icon}
                </div>
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium mb-2">
                    Quiz à la une
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold">{featuredQuiz.title}</h3>
                  <p className="mt-2 text-white/80 text-sm max-w-lg">{featuredQuiz.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-white/70 text-xs">
                    <span className="flex items-center gap-1"><FaQuestionCircle /> {featuredQuiz.questionCount} questions</span>
                    <span className="flex items-center gap-1"><FaClock /> {featuredQuiz.avgTime}</span>
                    <span className="flex items-center gap-1">📊 {featuredQuiz.difficulty}</span>
                  </div>
                </div>
              </div>
              <button className="mt-5 inline-flex items-center gap-2 bg-white text-purple-700 font-semibold py-2.5 px-5 rounded-xl text-sm shadow hover:bg-gray-100 transition">
                <FaPlay /> Démarrer le quiz
              </button>
            </div>
          </div>

          {/* TRENDING QUIZZES */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaFire className="text-orange-500" /> Quiz populaires
              </h3>
              <button className="text-sm text-purple-600 font-semibold hover:underline">
                Voir tout
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto scroll-hide pb-2">
              {trendingQuizzes.map((item) => (
                <QuizCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* PLUS DE QUIZ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Plus de quiz
              </h3>
              <button className="text-sm text-purple-600 font-semibold hover:underline">
                Voir tout
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto scroll-hide pb-2">
              {allQuizzes.map((item) => (
                <QuizCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}
import { useState, useMemo } from "react";
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlay,
  FaStop,
} from "react-icons/fa";
import { Sidebar, BottomNav } from "../../components/sidebar";
import Header from "../../components/Header";

// ----- Mock data -----
const initialCourses = [
  { id: 1, title: "JavaScript pour débutants", category: "Développement", level: "Débutant", duration: "6h 30m", progress: 67 },
  { id: 2, title: "React – Les fondamentaux", category: "Développement", level: "Intermédiaire", duration: "8h 15m", progress: 45 },
  { id: 3, title: "Bases de données SQL", category: "Données", level: "Débutant", duration: "5h 45m", progress: 30 },
  { id: 4, title: "Python pour la data science", category: "Données", level: "Intermédiaire", duration: "10h 20m", progress: 12 },
  { id: 5, title: "Design UI/UX moderne", category: "Design", level: "Débutant", duration: "4h 10m", progress: 82 },
  { id: 6, title: "Git & GitHub pour équipes", category: "Outils", level: "Intermédiaire", duration: "3h 45m", progress: 55 },
];

const categories = ["Tous", "Développement", "Données", "Design", "Outils"];

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [courses, setCourses] = useState(initialCourses);

  // ---- Tri + filtrage ----
  const filteredAndSorted = useMemo(() => {
    let result = [...courses];

    if (filter !== "Tous") {
      result = result.filter((c) => c.category === filter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(term));
    }

    if (sortField) {
      result.sort((a, b) => {
        let valA, valB;
        switch (sortField) {
          case "title":
          case "category":
          case "level":
          case "duration":
            valA = a[sortField].toLowerCase();
            valB = b[sortField].toLowerCase();
            break;
          case "progress":
            valA = a.progress;
            valB = b.progress;
            break;
          default:
            return 0;
        }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [courses, filter, searchTerm, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort className="text-gray-400 ml-1 text-xs" />;
    return sortOrder === "asc" ? (
      <FaSortUp className="text-purple-600 ml-1 text-xs" />
    ) : (
      <FaSortDown className="text-purple-600 ml-1 text-xs" />
    );
  };

  const handleContinue = (id) => {
    alert(`Continuer le cours #${id}`);
  };

  const handleStop = (id) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap');
        body { font-family: 'Inter', sans-serif; margin:0; background:#F7F8FC; -webkit-font-smoothing:antialiased; }
        .progress-bar { transition: width 0.6s ease; }
        .table-classic {
          border-collapse: separate;
          border-spacing: 0;
        }
        .table-classic th {
          font-weight: 600;
          font-size: 0.875rem;
          color: #6B7280;
          background: #F9FAFB;
        }
        .table-classic th:first-child {
          border-top-left-radius: 16px;
        }
        .table-classic th:last-child {
          border-top-right-radius: 16px;
        }
        .table-classic tr:last-child td:first-child {
          border-bottom-left-radius: 16px;
        }
        .table-classic tr:last-child td:last-child {
          border-bottom-right-radius: 16px;
        }
      `}</style>

      <div className="min-h-screen flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 ml-0 lg:ml-[260px] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto min-h-screen">
          <Header />

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              Mes cours
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Gérez et suivez vos cours en cours.
            </p>
          </div>

          {/* Recherche & filtre */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div className="relative w-full sm:w-48">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-purple-400 cursor-pointer w-full"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tableau classique */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm table-classic bg-white">
              <thead>
                <tr>
                  {[
                    { label: "Nom", field: "title" },
                    { label: "Catégorie", field: "category" },
                    { label: "Niveau", field: "level" },
                    { label: "Durée", field: "duration" },
                    { label: "Progression", field: "progress" },
                  ].map((col) => (
                    <th
                      key={col.field}
                      onClick={() => handleSort(col.field)}
                      className="px-4 py-3 text-left cursor-pointer select-none hover:text-purple-600 transition"
                    >
                      <span className="inline-flex items-center">
                        {col.label}
                        <SortIcon field={col.field} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSorted.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{course.title}</td>
                    <td className="px-4 py-3 text-gray-600">{course.category}</td>
                    <td className="px-4 py-3 text-gray-600">{course.level}</td>
                    <td className="px-4 py-3 text-gray-600">{course.duration}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full progress-bar"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{course.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleContinue(course.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition shadow-sm"
                        >
                          <FaPlay className="text-xs" /> Continuer
                        </button>
                        <button
                          onClick={() => handleStop(course.id)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <FaStop className="text-xs" /> Arrêter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      <FaSearch className="mx-auto text-3xl mb-3" />
                      <p className="font-medium">Aucun cours trouvé</p>
                      <p className="text-sm">Essayez d'autres mots-clés ou filtres.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}
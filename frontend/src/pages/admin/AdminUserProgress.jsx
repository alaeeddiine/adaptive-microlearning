import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { FaArrowLeft } from "react-icons/fa";

export default function AdminUserProgress() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return;

    setLoading(true);
    fetch(`http://localhost:5000/api/admin/users/${uid}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur ${res.status} : ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Données reçues :", data);
        setUserData(data.user || null);
        setCourses(Array.isArray(data.courses) ? data.courses : []);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Impossible de charger les données.");
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

  if (error) {
    return (
      <>
        <Header />
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-xl text-sm"
          >
            Retour
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <FaArrowLeft /> Retour
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Détails de l'utilisateur
      </h2>

      {/* Profil d'apprentissage */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Profil d'apprentissage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Âge</p>
            <p className="text-sm font-semibold">
              {userData?.age || "Non renseigné"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Niveau d'études</p>
            <p className="text-sm font-semibold">
              {userData?.education || "Non renseigné"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Maîtrise du sujet</p>
            <p className="text-sm font-semibold">
              {userData?.mastery || "Non renseigné"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Niveau de compétence</p>
            <p className="text-sm font-semibold">
              {userData?.competence || "Non renseigné"}
            </p>
          </div>
        </div>
      </div>

      {/* Cours suivis */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Cours en cours</h3>
        {courses.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun cours pour cet utilisateur.</p>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                  {course.icon || "📘"}
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
    </>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import useAuth from "../hooks/useAuth";
import { FaPlay, FaClock, FaWifi, FaMobileAlt, FaBatteryFull, FaSun } from "react-icons/fa";

const timeOptions = ["Moins de 15 min", "15-30 min", "30-60 min", "Plus d'1h"];
const batteryOptions = ["Faible", "Moyen", "Élevé"];

export default function SessionContext() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Auto‑detected values
  const userAgent = navigator.userAgent;
  const width = window.innerWidth;
  const deviceType = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) || width < 1024
    ? (width < 768 ? "Mobile" : "Tablette")
    : "Desktop";

  let connectionLevel = "Inconnu";
  if (navigator.connection && navigator.connection.effectiveType) {
    const type = navigator.connection.effectiveType.toLowerCase();
    switch (type) {
      case "slow-2g": case "2g": connectionLevel = "Faible"; break;
      case "3g": connectionLevel = "Moyenne"; break;
      case "4g": case "5g": connectionLevel = "Élevé"; break;
      case "wifi": case "ethernet": connectionLevel = "WiFi / Ethernet"; break;
      default: connectionLevel = type;
    }
  }

  const hour = new Date().getHours();
  let timeOfDay = "Matin";
  if (hour >= 12 && hour < 17) timeOfDay = "Après-midi";
  else if (hour >= 17 && hour < 21) timeOfDay = "Soir";
  else if (hour >= 21 || hour < 5) timeOfDay = "Nuit";

  const [timeAvailable, setTimeAvailable] = useState(timeOptions[1]);
  const [batteryLevel, setBatteryLevel] = useState(batteryOptions[1]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: currentUser.uid,
          time_available: timeAvailable,
          connection_level: connectionLevel,
          device_type: deviceType,
          battery_level: batteryLevel,
          time_of_day: timeOfDay,
        }),
      });
      const data = await res.json();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (recommendations.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Contenu recommandé pour cette session</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <h3 className="font-bold text-gray-900">{course.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FaClock /> {course.duration}</span>
                  <span className="flex items-center gap-1"><FaMobileAlt /> {course.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-lg mx-auto p-4 sm:p-6 lg:p-8 mt-12">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Votre session d’apprentissage</h2>
        <p className="text-sm text-gray-500 mb-6">Adaptons le contenu à votre contexte actuel.</p>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          {/* Temps disponible */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <FaClock className="inline mr-2 text-gray-400" /> Temps disponible
            </label>
            <select
              value={timeAvailable}
              onChange={(e) => setTimeAvailable(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-purple-400"
            >
              {timeOptions.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Connexion (auto) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <FaWifi className="inline mr-2 text-gray-400" /> Connexion
            </label>
            <input
              type="text"
              value={connectionLevel}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Appareil (auto) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <FaMobileAlt className="inline mr-2 text-gray-400" /> Appareil
            </label>
            <input
              type="text"
              value={deviceType}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Batterie (manuel) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <FaBatteryFull className="inline mr-2 text-gray-400" /> Niveau de batterie
            </label>
            <select
              value={batteryLevel}
              onChange={(e) => setBatteryLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-purple-400"
            >
              {batteryOptions.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Moment de la journée (auto) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <FaSun className="inline mr-2 text-gray-400" /> Moment de la journée
            </label>
            <input
              type="text"
              value={timeOfDay}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <FaPlay /> Démarrer la session
          </button>
        </div>
      </div>
    </div>
  );
}
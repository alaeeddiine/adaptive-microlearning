import { useState, useRef, useEffect } from "react";
import {
  FaBell,
  FaChevronDown,
  FaSignOutAlt,
  FaEnvelope,
  FaUser,
  FaCheckDouble,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useNotifications from "../hooks/useNotifications";

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export default function Header() {
  const { currentUser, userData, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === "/dashboard";

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useClickOutside(notifRef, () => setShowNotifications(false));
  useClickOutside(profileRef, () => setShowProfile(false));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // ---------- Détection admin ----------
  const isAdmin = userData?.role === "admin"; // À ADAPTER selon ton modèle
  // -------------------------------------

  const displayName = isAdmin
    ? "Admin"
    : userData?.name || currentUser?.displayName || "Ahmed";
  const displayEmail = userData?.email || currentUser?.email || "ahmed@example.com";
  const avatarLetter = (displayName?.[0] || "A").toUpperCase();

  const formatTime = (timestamp) => {
    const date = new Date(timestamp + "Z");
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "À l’instant";
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="ml-12 lg:ml-0">
        {isDashboard ? (
          <>
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-extrabold text-gray-900">
              Bonjour, {displayName} ! 👋
            </h1>
            <p className="text-gray-500 mt-0.5 font-medium text-xs sm:text-sm hidden sm:block">
              Prêt à continuer votre apprentissage ?
            </p>
            <p className="text-gray-500 mt-0.5 font-medium text-xs sm:hidden">
              Continuons l'apprentissage !
            </p>
          </>
        ) : (
          <div />
        )}
      </div>

      <div className="flex items-center gap-3 ml-4">
        {/* Notification */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition relative"
          >
            <FaBell className="text-lg" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <h4 className="font-semibold text-sm text-gray-900">Notifications</h4>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-gray-400 hover:text-gray-600 transition"
                      title="Tout marquer comme lu"
                    >
                      <FaCheckDouble className="text-sm" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/history");
                    }}
                    className="text-xs text-purple-600 font-medium hover:underline"
                  >
                    Tout voir
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-50 last:border-0"
                  >
                    <p className={`text-sm ${!notif.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatTime(notif.created_at)}</p>
                  </div>
                ))}
              </div>
              {notifications.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">Aucune notification</p>
              )}
            </div>
          )}
        </div>

        {/* Profil */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
              {avatarLetter}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{isAdmin ? "Admin" : "Apprenant"}</p>
            </div>
            <FaChevronDown className={`text-gray-400 text-xs transition-transform ${showProfile ? "rotate-180" : ""}`} />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <FaEnvelope className="text-gray-400" /> {displayEmail}
                </p>
              </div>
              <div className="px-4 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-gray-600 hover:text-red-500 py-1.5 text-sm transition-colors"
                >
                  <FaSignOutAlt />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
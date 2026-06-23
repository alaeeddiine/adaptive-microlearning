import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  FaGraduationCap,
  FaHome,
  FaBook,
  FaLightbulb,
  FaQuestionCircle,
  FaChartBar,
  FaHistory,
  FaCog,
  FaBars,
  FaTimes,
  FaUser,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import useAuth from "../hooks/useAuth";

// ----- Navigation items (normal users) -----
const navItems = [
  { to: "/dashboard", icon: FaHome, label: "Tableau de bord" },
  { to: "/courses", icon: FaBook, label: "Mes cours" },
  { to: "/recommendations", icon: FaLightbulb, label: "Recommandations" },
  { to: "/quiz", icon: FaQuestionCircle, label: "Quiz" },
  { to: "/progress", icon: FaChartBar, label: "Progression" },
  { to: "/history", icon: FaHistory, label: "Historique" },
  { to: "/settings", icon: FaUser, label: "Profile" },
];

// ----- Admin navigation items -----
const adminNavItems = [
  { to: "/admin", icon: FaShieldAlt, label: "Dashboard admin" },
  { to: "/admin/users", icon: FaUsers, label: "Utilisateurs" },
  { to: "/admin/courses", icon: FaBook, label: "Cours" },
];

// ----- Mobile bottom nav – default user -----
const userQuickNav = [
  { to: "/dashboard", icon: FaHome, label: "Accueil" },
  { to: "/courses", icon: FaBook, label: "Mes cours" },
  { to: "/history", icon: FaHistory, label: "Historique" },
  { to: "/settings", icon: FaUser, label: "Profile" },
];

// ----- Mobile bottom nav – admin -----
const adminQuickNav = [
  { to: "/admin", icon: FaShieldAlt, label: "Admin" },
  { to: "/admin/users", icon: FaUsers, label: "Utilisateurs" },
  { to: "/admin/courses", icon: FaBook, label: "Cours" },
];

// ----- Desktop Sidebar -----
function DesktopSidebar({ onLogout, userData }) {
  const isAdmin = userData?.role === "admin";

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-gray-100 flex-col p-6 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
          <FaGraduationCap className="text-white text-sm" />
        </div>
        <span className="text-xl font-bold">
          <span className="text-gray-900">Learn</span>
          <span className="text-[#5B4BFF]">Smart</span>
        </span>
      </div>

      {/* Navigation – active exacte pour éviter les chevauchements */}
      <nav className="space-y-1.5 flex-1">
        {isAdmin
          ? adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end   // ← seul le chemin exact active le lien
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`
                }
              >
                <item.icon className="text-lg" />
                {item.label}
              </NavLink>
            ))
          : navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`
                }
              >
                <item.icon className="text-lg" />
                {item.label}
              </NavLink>
            ))}
      </nav>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="mt-4 w-full flex items-center gap-2 text-gray-500 hover:text-red-500 py-2 px-3 rounded-lg text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Déconnexion
      </button>
    </aside>
  );
}

// ----- Mobile Sidebar (drawer) -----
function MobileSidebar({ isOpen, onClose, onLogout, userData }) {
  const isAdmin = userData?.role === "admin";

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-[260px] bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full p-6">
          <button onClick={onClose} className="self-end p-2 text-gray-500 hover:text-gray-700">
            <FaTimes className="text-xl" />
          </button>

          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <FaGraduationCap className="text-white text-sm" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-gray-900">Learn</span>
              <span className="text-[#5B4BFF]">Smart</span>
            </span>
          </div>

          <nav className="space-y-1.5 flex-1">
            {isAdmin
              ? adminNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    end
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-purple-50 text-purple-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`
                    }
                  >
                    <item.icon className="text-lg" />
                    {item.label}
                  </NavLink>
                ))
              : navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    end
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-purple-50 text-purple-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`
                    }
                  >
                    <item.icon className="text-lg" />
                    {item.label}
                  </NavLink>
                ))}
          </nav>

          <button onClick={onLogout} className="mt-4 w-full flex items-center gap-2 text-gray-500 hover:text-red-500 py-2 px-3 rounded-lg text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}

// ----- Bottom Navigation (mobile) – adaptée au rôle -----
export function BottomNav() {
  const { userData } = useAuth();
  const isAdmin = userData?.role === "admin";
  const links = isAdmin ? adminQuickNav : userQuickNav;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex justify-around items-center py-2 px-1 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {links.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 font-medium text-[10px] sm:text-xs ${
              isActive ? "text-purple-700" : "text-gray-500"
            }`
          }
        >
          <item.icon className="text-lg sm:text-xl" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// ----- Main exported Sidebar -----
export function Sidebar() {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <DesktopSidebar onLogout={handleLogout} userData={userData} />
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50"
      >
        <FaBars className="text-lg" />
      </button>
      <MobileSidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        userData={userData}
      />
    </>
  );
}
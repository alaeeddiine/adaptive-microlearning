import { FaBell, FaBars } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function MobileTopBar({ onMenuClick }) {
  const { userData } = useAuth();

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4 shadow-sm">
      {/* Burger */}
      <button
        onClick={onMenuClick}
        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
      >
        <FaBars className="text-lg" />
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification */}
        <div className="relative">
          <button className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
            <FaBell className="text-base" />
          </button>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
        </div>

        {/* Avatar mini */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
          {userData?.name?.[0] || "A"}
        </div>
      </div>
    </div>
  );
}
import { Outlet } from "react-router-dom";
import { Sidebar, BottomNav } from "./sidebar";
import useAutoSession from "../hooks/useAutoSession";

export default function Layout() {
  useAutoSession();   // starts session tracking
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-[260px] p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
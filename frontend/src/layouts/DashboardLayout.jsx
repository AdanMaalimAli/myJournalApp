import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const location = useLocation();

  // Determine title based on current routet
  let title = "";
  if (location.pathname.includes("performance")) title = "Performance";
  else if (location.pathname.includes("journal")) title = "Daily Journal";
  else if (location.pathname.includes("trades")) title = "Trades";

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1">
        {/* Navbar */}
        <Navbar title={title} />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-200  p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


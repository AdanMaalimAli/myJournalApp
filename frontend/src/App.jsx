import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Performance from "./pages/Performance";
import DailyJournal from "./pages/DailyJournal";
import Trades from "./pages/Trades";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    
    <Routes>
      {/* Home page */}
      <Route path="/" element={<Home />} />

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Default route for dashboard redirects to /dashboard/performance */}
          <Route index element={<Navigate to="performance" replace />} />

          {/* Dashboard pages (relative paths) */}
          <Route path="performance" element={<Performance />} />
          <Route path="dailyjournal" element={<DailyJournal />} />
          <Route path="trades" element={<Trades />} />
        </Route>
      </Route>

      {/* 404 page */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;



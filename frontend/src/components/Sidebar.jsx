import React, { useState } from "react";
import { FaChartBar, FaBook, FaTable, FaLink, FaCrown } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import AddTradeModal from "../pages/AddTradeModal";
import ConnectBrokerModal from "../pages/ConnectBrokerModal";
import UpgradeModal from "../pages/UpgradeModal";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ activePage, setActivePage }) {
  const { user } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleSaveTrade = (tradeData) => {
    console.log("Saving new trade:", tradeData);
    // Here you would typically update your global state or Context
  };

  return (
    <>
      <div className="w-64 shrink-0 h-screen bg-[#2a154b] text-white p-6 flex flex-col space-y-10">
        
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg flex items-center justify-center text-xl font-bold text-white">
            mJ
          </div>
          <h1 className="text-xl font-semibold tracking-wide bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            myJournal
          </h1>
        </div>

        {/* Add Trade Button - NOW INTERACTIVE */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[#7d4cff] hover:bg-[#6b3ee0] transition text-white py-2 rounded-lg font-medium"
        >
          + Add Trade
        </button>

        {/* Navigation */}
        <nav className="flex flex-col space-y-4">
            <Link
            to="/dashboard/performance"
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition ${
              isActive("/dashboard/performance") ? "bg-[#3b1f63]" : "hover:bg-[#3b1f63]"
            }`}
          >
            <FaChartBar size={20} />
            <span>Performance</span>
          </Link>

        <Link
            to="/dashboard/dailyjournal"
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition ${
              isActive("/dashboard/dailyjournal") ? "bg-[#3b1f63]" : "hover:bg-[#3b1f63]"
            }`}
          >
            <FaBook size={20} />
            <span>Daily Journal</span>
          </Link>

        <Link
            to="/dashboard/trades"
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition ${
              isActive("/dashboard/trades") ? "bg-[#3b1f63]" : "hover:bg-[#3b1f63]"
            }`}
          >
            <FaTable size={20} />
            <span>Trades</span>
          </Link>
        </nav>

        {/* Pro Section */}
        <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
            {user?.isPro ? (
                <button 
                    onClick={() => setIsBrokerModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600/50 hover:bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold transition-all border border-indigo-400/30 shadow-lg shadow-indigo-900/20"
                >
                    <FaLink /> Connect Broker
                </button>
            ) : (
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <FaCrown className="text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Upgrade to Pro</span>
                    </div>
                    <p className="text-[10px] text-white/60 mb-3 leading-relaxed">
                        Automated sync, unlimited history & AI insights.
                    </p>
                    <button 
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="w-full bg-white text-purple-900 py-2 rounded-lg text-xs font-bold hover:bg-purple-50 transition"
                    >
                        Get Pro - $11
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* --- RENDER MODALS --- */}
      <AddTradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTrade} 
      />

      {isBrokerModalOpen && (
        <ConnectBrokerModal onClose={() => setIsBrokerModalOpen(false)} />
      )}

      {isUpgradeModalOpen && (
        <UpgradeModal onClose={() => setIsUpgradeModalOpen(false)} />
      )}
    </>
  );
}





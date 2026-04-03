import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ProfileModal from "../pages/ProfileModal";
import { LogOut, User as UserIcon, Sun, Moon } from "lucide-react";

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profilePic = user?.profilePicture
    ? (user.profilePicture.startsWith('http') ? user.profilePicture : `/uploads/${user.profilePicture}`)
    : "https://via.placeholder.com/150";

  const handleLogout = () => {
    setIsLoggingOut(true);
    // Give a brief delay for a smoother, more "safe" logout experience
    setTimeout(() => {
      logout();
    }, 2000);
  };

  return (
    <>
      {/* Logout Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
            <svg className="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-800 dark:text-slate-100 font-bold text-lg">Logging you out safely...</p>
            <p className="text-gray-500 text-sm">See you next time!</p>
          </div>
        </div>
      )}

      <nav className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 flex items-center justify-between relative z-20 transition-colors">
        {/* Dynamic title */}
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h1>

        {/* Profile on the right */}
        <div className="flex items-center space-x-4">
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user?.isPro ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">Pro Trader</span>
                </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/dashboard/upgrade')}
                    className="hidden sm:block text-[11px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-1.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-200"
                >
                    Upgrade Now
                </button>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Starter</span>
                </div>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center focus:outline-none p-0.5 rounded-full hover:ring-2 hover:ring-purple-200 dark:hover:ring-purple-900 transition-all"
            >
              <img
                src={profilePic}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 mb-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.username || "User"}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>
                
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-purple-600 flex items-center gap-2 transition-colors"
                >
                  <UserIcon size={16} />
                  Profile Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Logout Account
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Modals */}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
    </>
  );
}

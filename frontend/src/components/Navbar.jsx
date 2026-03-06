import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProfileModal from "../pages/ProfileModal";
import UpgradeModal from "../pages/UpgradeModal";
import { LogOut, User as UserIcon } from "lucide-react";

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Construct image URL
  const profileImg = user?.profilePicture && user.profilePicture !== 'no-photo.jpg'
    ? (user.profilePicture.startsWith('http') ? user.profilePicture : `/uploads/${user.profilePicture}`)
    : "https://via.placeholder.com/150";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowDropdown(false);
    
    // Add a professional delay (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    logout();
  };

  return (
    <>
      {/* Logout Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
            <svg className="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-800 font-bold text-lg">Logging you out safely...</p>
            <p className="text-gray-500 text-sm">See you next time!</p>
          </div>
        </div>
      )}

      <nav className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between relative z-20">
        {/* Dynamic title */}
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

        {/* Profile on the right */}
        <div className="flex items-center space-x-4">
          {user?.isPro ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Pro Trader</span>
            </div>
          ) : (
            <>
                <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="hidden sm:block text-[11px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-1.5 rounded-full hover:opacity-90 transition shadow-md shadow-purple-200"
                >
                    Upgrade Now
                </button>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Starter</span>
                </div>
            </>
          )}

          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden cursor-pointer border-2 border-transparent hover:border-purple-500 transition-all focus:outline-none active:scale-95"
            >
              <img
                src={profileImg}
                alt="profile"
                className="w-full h-full object-cover"
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.username || "User"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-600 flex items-center gap-2 transition-colors"
                >
                  <UserIcon size={16} />
                  My Profile
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            )}
            
            {/* Backdrop to close dropdown */}
            {showDropdown && (
              <div 
                className="fixed inset-0 z-[-1]" 
                onClick={() => setShowDropdown(false)}
              ></div>
            )}
          </div>
        </div>
      </nav>

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </>
  );
}



import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

function ProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    if (file) {
      formData.append("image", file);
    }

    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const { success, error } = await updateProfile(formData);
    setIsLoading(false);

    if (success) {
      setMessage("Profile updated successfully!");
      setTimeout(() => onClose(), 1500);
    } else {
      setError(error);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Your Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Update your personal details</p>
        </div>

        {message && <p className="text-green-600 text-sm font-medium bg-green-50 p-3 rounded-lg border border-green-100">{message}</p>}
        {error && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Profile Picture Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
               <img 
                 src={
                   preview 
                   ? preview 
                   : (user?.profilePicture && user.profilePicture !== 'no-photo.jpg')
                     ? (user.profilePicture.startsWith('http') ? user.profilePicture : `/uploads/${user.profilePicture}`)
                     : "https://via.placeholder.com/150"
                 } 
                 alt="Profile" 
                 className="w-full h-full object-cover"
               />
            </div>
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition active:scale-95">
              Change Photo
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-700 to-pink-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
             {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : "Save Changes"}
          </button>
        </form>
      </div>
    </Modal>
  );
}

export default ProfileModal;

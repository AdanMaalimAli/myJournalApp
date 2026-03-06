import Modal from "../components/Modal.jsx";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';


function LoginModal({ onClose, goToSignup, goToForgot }) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [loadingStep, setLoadingStep] = useState(0);

 //continue with google 
 const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError("");
    setLoadingStep(1); // "Verifying..."
    
    // Change message after 1.2 seconds to "Syncing..."
    const stepTimer = setTimeout(() => setLoadingStep(2), 1200);
    
    const { success, error } = await loginWithGoogle(credentialResponse.credential);
    
    clearTimeout(stepTimer);
    if (success) {
      setLoadingStep(3); // "Welcome!"
      await new Promise(resolve => setTimeout(resolve, 800)); // Brief pause on success
      onClose();
      navigate("/dashboard/performance");
    } else {
      setIsLoading(false);
      setLoadingStep(0);
      setError(error || "Google login failed. Please try again.");
    }
  };

  const getLoadingMessage = () => {
    if (email) return "Logging in...";
    switch(loadingStep) {
      case 1: return "Verifying Google account...";
      case 2: return "Syncing your journal...";
      case 3: return "Welcome back!";
      default: return "Processing...";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Artificial delay for better UX (optional, but requested for "less quick" feel)
    await new Promise(resolve => setTimeout(resolve, 10000));

    const { success, error } = await login(email, password);
    setIsLoading(false);

    if (success) {
      onClose();
      navigate("/dashboard/performance");
    } else {
      setError(error);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-1">
            Log in to continue your trading journal
          </p>
        </div>

        {/* Google Login */}
          <div className="flex flex-col items-center justify-center p-6 border rounded-xl shadow-md bg-white">
            <h2 className="text-xl font-bold mb-4">Welcome Back</h2>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.log('Login Failed')}
              useOneTap
            />
          </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

        {/* Email Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" />
              Remember me
            </label>

            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    goToForgot();
                }}
                className="text-purple-600 hover:underline text-sm"
                >
                Forgot password?
            </a>

          </div>

          {/* Submit */}
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
                {getLoadingMessage()}
              </>
            ) : "Log in"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-center text-gray-500">
          Don’t have an account?{" "}
          <button onClick={goToSignup}  className="text-purple-600 font-medium hover:underline">
            Sign up
          </button>
        </p>

      </div>
    </Modal>
  );
}

export default LoginModal;


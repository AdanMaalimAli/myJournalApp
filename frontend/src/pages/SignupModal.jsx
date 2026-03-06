import Modal from "../components/Modal.jsx";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

function SignupModal({ onClose, goToLogin }) {
  const { register, loginWithGoogle } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [loadingStep, setLoadingStep] = useState(0);

// Handle Google Signup
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError("");
    setLoadingStep(1); // "Verifying..."
    
    // Change message after 1.2 seconds to "Creating..."
    const stepTimer = setTimeout(() => setLoadingStep(2), 1200);
    
    // Using loginWithGoogle from context as it handles both login/signup on backend
    const { success, error } = await loginWithGoogle(credentialResponse.credential);
    
    clearTimeout(stepTimer);
    if (success) {
      setLoadingStep(3); // "Success!"
      await new Promise(resolve => setTimeout(resolve, 800)); // Brief pause
      onClose();
      navigate("/dashboard/performance");
    } else {
      setIsLoading(false);
      setLoadingStep(0);
      setError(error || "Google signup failed. Try again.");
    }
  };

  const getLoadingMessage = () => {
    if (username) return "Creating account...";
    switch(loadingStep) {
      case 1: return "Verifying Google account...";
      case 2: return "Preparing your journal...";
      case 3: return "Account created!";
      default: return "Processing...";
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 10000));

    const { success, error } = await register(username, email, password);
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
          <h2 className="text-2xl font-bold">Create your account</h2>
          <p className="text-sm text-gray-500 mt-1">
            Start journaling your trades in seconds
          </p>
        </div>

      {/* Google Signup Button */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Signup failed")}
            text="signup_with" // Sets text to "Sign up with Google"
            shape="pill"
            theme="outline"
            width="340px" // Adjust to match your form width
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
            type="text"
            placeholder="Full name"
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />

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

          {/* Agreement */}
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input type="checkbox" className="mt-1" required />
            <span>
              I agree to the{" "}
              <a href="#" className="text-purple-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-purple-600 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>

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
            ) : "Create account"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <button onClick={goToLogin} className="text-purple-600 font-medium hover:underline">
            Log in
          </button>
        </p>

      </div>
    </Modal>
  );
}

export default SignupModal;


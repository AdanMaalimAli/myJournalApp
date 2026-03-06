import Modal from "../components/Modal.jsx";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function ForgotPasswordModal({ onClose, goToLogin }) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { success, data, error } = await forgotPassword(email);

    if (success) {
      setMessage("Email sent! Check your inbox.");
    } else {
      setError(error);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Reset your password</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and we’ll send you a reset link
          </p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-500 text-sm">{message}</p>}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="w-full bg-gradient-to-r from-purple-700 to-pink-500 text-white py-3 rounded-lg font-bold hover:opacity-90 transition">
            Send reset link
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Remembered your password?{" "}
          <button onClick={goToLogin} className="text-purple-600 font-medium hover:underline">
            Back to login
          </button>
        </div>

      </div>
    </Modal>
  );
}

export default ForgotPasswordModal;

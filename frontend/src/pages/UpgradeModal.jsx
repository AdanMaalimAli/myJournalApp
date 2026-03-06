import React, { useState, useEffect } from 'react';
import { FaPhoneAlt, FaMobileAlt, FaCheckCircle, FaCircleNotch, FaTimes } from 'react-icons/fa';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function UpgradeModal({ onClose }) {
  const { token, refreshUser } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('idle'); // idle, initiating, polling, success, error
  const [message, setMessage] = useState('');

  const handleUpgrade = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setStatus('initiating');
    setMessage('Connecting to M-Pesa...');

    try {
      const res = await fetch('/api/payments/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          phoneNumber: phoneNumber.replace('+', ''), 
          amount: 1 // 1 KES for testing
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('polling');
        setMessage('Please check your phone for the M-Pesa prompt.');
        // Start polling for status
        startPolling();
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to initiate payment');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const startPolling = () => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 30) { // Timeout after 2 minutes
        clearInterval(interval);
        setStatus('error');
        setMessage('Payment verification timed out. If you paid, it will reflect shortly.');
        return;
      }

      try {
        const res = await fetch('/api/payments/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (data.success && data.isPro) {
          clearInterval(interval);
          setStatus('success');
          setMessage('Welcome to Pro Trader! Your account has been upgraded.');
          setTimeout(() => {
            onClose();
            window.location.reload(); 
          }, 3000);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 4000);
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-2">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaMobileAlt size={30} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Upgrade to Pro</h2>
          <p className="text-slate-500 text-sm mt-1">Pay with M-Pesa (1 KES for testing)</p>
        </div>

        {status === 'idle' || status === 'error' ? (
          <form onSubmit={handleUpgrade} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Safaricom Number</label>
              <div className="relative">
                <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="07XXXXXXXX" 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Enter your Safaricom number (e.g., 0712345678)</p>
            </div>

            {status === 'error' && (
              <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-100">
                {message}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200"
            >
              Pay via M-Pesa
            </button>
          </form>
        ) : status === 'initiating' || status === 'polling' ? (
          <div className="py-10 text-center space-y-4">
            <FaCircleNotch className="animate-spin text-indigo-600 mx-auto" size={40} />
            <p className="text-slate-700 font-medium">{message}</p>
            <p className="text-xs text-slate-400 italic">Do not close this window until complete</p>
          </div>
        ) : (
          <div className="py-10 text-center space-y-4 animate-bounce">
            <FaCheckCircle className="text-emerald-500 mx-auto" size={50} />
            <p className="text-slate-900 font-bold text-lg">{message}</p>
          </div>
        )}
        
        <button 
          onClick={onClose}
          className="w-full mt-4 py-2 text-slate-400 hover:text-slate-600 text-sm font-medium transition"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

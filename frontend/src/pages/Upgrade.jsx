import React, { useState } from 'react';
import { FaCheckCircle, FaPhoneAlt, FaMobileAlt, FaCircleNotch, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Upgrade() {
  const { token, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('idle'); // idle, initiating, polling, success, error
  const [message, setMessage] = useState('');
  const [showPayment, setShowPayment] = useState(false);

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
      if (attempts > 30) {
        clearInterval(interval);
        setStatus('error');
        setMessage('Payment verification timed out. If you paid, it will reflect shortly.');
        return;
      }

      try {
        const res = await fetch('/api/payments/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          if (data.isPro) {
            clearInterval(interval);
            setStatus('success');
            setMessage('Welcome to Pro Trader! Your account has been upgraded.');
            await refreshUser(); // Update AuthContext
            setTimeout(() => {
              navigate('/dashboard/performance');
              window.location.reload(); 
            }, 4000);
          } else if (data.paymentStatus === 'Failed' || data.paymentStatus === 'Cancelled') {
            clearInterval(interval);
            setStatus('error');
            setMessage(`Payment ${data.paymentStatus.toLowerCase()}. Please try again.`);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 4000);
  };

  if (user?.isPro && status !== 'success') {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <FaCheckCircle size={50} />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">You are a Pro Trader!</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          You already have access to all premium features. Go ahead and master the markets.
        </p>
        <Link to="/dashboard/performance" className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition shadow-xl shadow-white/5">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0b0f19] relative flex items-center justify-center p-4 lg:p-6 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] -ml-48 -mb-48"></div>

      <div className="max-w-6xl w-full mx-auto relative z-10 flex flex-col justify-center h-full max-h-[700px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch h-full">
          
          {/* 1. Pricing & Benefits Card */}
          <div className="relative animate-fade-in flex h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 blur-[40px] opacity-10 -rotate-3"></div>
            <div className="relative flex-1 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-white mb-0.5 tracking-tight">Lifetime Access</h2>
                    <p className="text-slate-400 text-xs font-medium italic">One-time payment. No subscriptions.</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600 to-pink-500 text-white text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-purple-500/20">
                    Pro Trader
                  </div>
                </div>

                <div className="flex items-baseline gap-3 py-2">
                  <span className="text-6xl font-black text-white">$11</span>
                  <div className="flex flex-col">
                    <span className="text-xl text-slate-500 line-through font-bold opacity-50">$49</span>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Save 75% Today</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">What's Included:</h3>
                  <ul className="grid grid-cols-1 gap-3">
                    {[
                      "Automated Broker Sync (MT4, MT5, DXTrade)",
                      "Unlimited Trade History Storage",
                      "Advanced Performance Analytics",
                      "Daily Trading Journal & Mood Tracker",
                      "Priority Community Support"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-slate-300 text-xs font-medium group">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                          <FaCheckCircle className="text-emerald-500 shrink-0" size={12} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <p className="text-center text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">
                  Trusted by 5,000+ professional traders
                </p>
              </div>
            </div>
          </div>

          {/* 2. Payment Form Card */}
          <div className="relative animate-fade-in flex h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 blur-[40px] opacity-10 rotate-3"></div>
            <div className="relative flex-1 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col">
              
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                  <FaMobileAlt size={24} />
                </div>
                <h2 className="text-xl font-black text-white mb-0.5 tracking-tight">M-Pesa Checkout</h2>
                <p className="text-slate-400 text-xs font-medium">Enter your details to initiate payment</p>
              </div>

              {status === 'idle' || status === 'error' ? (
                <form onSubmit={handleUpgrade} className="space-y-5 flex-1 flex flex-col justify-center">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Safaricom Phone Number</label>
                    <div className="relative">
                      <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-3.5" />
                      <input 
                        type="text" 
                        placeholder="07XXXXXXXX" 
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-base font-mono tracking-wider"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mt-3 p-2.5 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Amount to Pay</span>
                        <span className="text-xs font-black text-white">1.00 KES <span className="text-[9px] text-slate-500 font-medium italic">(Test)</span></span>
                    </div>
                  </div>

                  {status === 'error' && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded-xl font-bold text-center animate-shake">
                      {message}
                    </div>
                  )}

                  <div className="pt-1">
                    <button 
                      type="submit"
                      className="w-full py-4 bg-white text-slate-900 font-black rounded-xl text-sm uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
                    >
                      Confirm & Pay
                    </button>
                    <p className="text-[9px] text-slate-500 mt-3 text-center font-medium italic opacity-50">
                      Clicking confirm will send an STK push to your phone.
                    </p>
                  </div>
                </form>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  {status === 'polling' || status === 'initiating' ? (
                    <div className="relative">
                        <FaCircleNotch className="animate-spin text-purple-500" size={48} />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 animate-bounce">
                        <FaCheckCircle size={32} />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-white text-lg font-black tracking-tight mb-1">{message}</p>
                    <p className="text-slate-500 text-[10px] font-medium italic opacity-50">Please keep this window open</p>
                  </div>
                  {status === 'polling' && (
                    <button 
                      onClick={() => setStatus('idle')}
                      className="px-5 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition mt-2"
                    >
                      Cancel & Reset
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Info */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
            <div className="flex items-center gap-1.5">
                <FaCheckCircle className="text-white" size={10} />
                <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
                <FaCheckCircle className="text-white" size={10} />
                <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Instant Access</span>
            </div>
            <div className="flex items-center gap-1.5">
                <FaCheckCircle className="text-white" size={10} />
                <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Verified</span>
            </div>
        </div>
      </div>
    </div>
  );
}

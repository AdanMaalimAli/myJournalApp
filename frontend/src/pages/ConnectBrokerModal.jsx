import React, { useState } from 'react';
import { FaServer, FaUser, FaKey, FaLink, FaCheckCircle, FaCircleNotch, FaExclamationTriangle } from 'react-icons/fa';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function ConnectBrokerModal({ onClose }) {
  const { token, user, refreshUser } = useAuth();
  const [platform, setPlatform] = useState('MT5');
  const [accountNumber, setAccountNumber] = useState('');
  const [brokerServer, setBrokerServer] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('idle'); // idle, connecting, success, error
  const [message, setMessage] = useState('');

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!user?.isPro) {
        setStatus('error');
        setMessage('Broker integration is a Pro feature. Please upgrade first.');
        return;
    }

    setStatus('connecting');
    setMessage('Connecting to your broker...');

    try {
      const res = await fetch('/api/broker/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ platform, accountNumber, brokerServer, apiKey })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('Broker connected! Your trades will now sync automatically.');
        await refreshUser();
        setTimeout(() => onClose(), 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to connect broker');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-2">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLink size={30} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Connect Broker</h2>
          <p className="text-slate-500 text-sm mt-1">Sync your live trading data automatically</p>
        </div>

        {!user?.isPro && status === 'idle' ? (
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 text-center space-y-4">
                <FaExclamationTriangle className="text-amber-500 mx-auto" size={30} />
                <h3 className="font-bold text-amber-900">Pro Feature</h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                    Automated broker sync is only available for Pro Trader members.
                </p>
                <button 
                    onClick={onClose}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition"
                >
                    Upgrade Now
                </button>
            </div>
        ) : status === 'idle' || status === 'error' ? (
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Platform</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="MT4">MetaTrader 4</option>
                <option value="MT5">MetaTrader 5</option>
                <option value="DXTrade">DXTrade (Prop Firms)</option>
                <option value="MatchTrader">MatchTrader</option>
                <option value="cTrader">cTrader</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Account #</label>
                    <div className="relative">
                        <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                        type="text" 
                        placeholder="123456" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Server</label>
                    <div className="relative">
                        <FaServer className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                        type="text" 
                        placeholder="ICMarkets-Live" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                        value={brokerServer}
                        onChange={(e) => setBrokerServer(e.target.value)}
                        required
                        />
                    </div>
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Password / API Key</label>
              <div className="relative">
                <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>
            </div>

            {status === 'error' && (
              <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-100">
                {message}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              Connect Account
            </button>
          </form>
        ) : status === 'connecting' ? (
          <div className="py-10 text-center space-y-4">
            <FaCircleNotch className="animate-spin text-indigo-600 mx-auto" size={40} />
            <p className="text-slate-700 font-medium">{message}</p>
          </div>
        ) : (
          <div className="py-10 text-center space-y-4">
            <FaCheckCircle className="text-emerald-500 mx-auto" size={50} />
            <p className="text-slate-900 font-bold text-lg">{message}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';

const TradeContext = createContext();

const DEMO_DATA = {
  account: { balance: 12300, lastUpdated: "Demo Mode", isConnected: true, percentageChange: 2.4, isPositive: true },
  statsData: [
    { title: "Net Profit", value: "+$2,450.00", colorClass: "text-emerald-600 bg-emerald-50", valueColor: "text-emerald-600" },
    { title: "Win Rate", value: "65%", colorClass: "text-teal-600 bg-teal-50" },
    { title: "Total Trades", value: "120", colorClass: "text-blue-600 bg-blue-50" },
    { title: "Avg. Win", value: "$45.20", colorClass: "text-emerald-600 bg-emerald-50" },
    { title: "Profit Factor", value: "2.35", colorClass: "text-purple-600 bg-purple-50" },
  ],
  dailyPnL: [{ day: "Jan 20", pnl: 120 }, { day: "Jan 21", pnl: 280 }, { day: "Jan 22", pnl: 680 }],
  // Demo mode now uses the single "pnl" key for the net calculation
  monthlyBars: [{ month: "Jan 26", pnl: 1200 }, { month: "Feb 26", pnl: -400 }],
};

export const TradeProvider = ({ children }) => {
  const { token } = useAuth();
  const [uploadedTrades, setUploadedTrades] = useState([]); // CSV SESSION (Performance/DailyJournal)
  const [archivedTrades, setArchivedTrades] = useState([]); // PERMANENT ARCHIVE (Trades Page)
  const [journalData, setJournalData] = useState({});
  const [isLive, setIsLive] = useState(false);
  const [manualDemoMode, setManualDemoMode] = useState(() => localStorage.getItem('myjournal_demo_mode_v2') === 'true');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); 
  };

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setArchivedTrades([]);
        setJournalData({});
        setIsLive(false);
        return;
      }
      setIsLive(true);
      setLoading(true);
      try {
        const [tradesRes, journalRes] = await Promise.all([
          fetch('/api/trades', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/journal', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (tradesRes.ok) {
          const tradesData = await tradesRes.json();
          setArchivedTrades(tradesData.data || []);
        }
        if (journalRes.ok) {
          const journalDataJson = await journalRes.json();
          const formattedJournal = {};
          (journalDataJson.data || []).forEach(entry => { formattedJournal[entry.date] = entry; });
          setJournalData(formattedJournal);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [token]);

  // --- 2. IMPORT (Performance Session) ---
  const importTrades = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target.result;
          const rows = text.split('\n').filter(row => row.trim() !== '');
          const splitCSVRow = (row) => {
            const result = [];
            let current = '', inQuotes = false;
            for (let char of row) {
              if (char === '"') inQuotes = !inQuotes;
              else if (char === ',' && !inQuotes) { result.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
              else current += char;
            }
            result.push(current.trim().replace(/^"|"$/g, ''));
            return result;
          };
          const parsedRows = rows.map(splitCSVRow);
          const headerRowIndex = parsedRows.findIndex(row => row.some(cell => /PnL|Ticket|Close Time/i.test(cell)));
          const headers = parsedRows[headerRowIndex].map(h => h.toLowerCase().trim());
          const colMap = {
            ticket: headers.findIndex(h => h.includes('ticket')),
            pnl: headers.findIndex(h => h === 'pnl'),
            date: headers.findIndex(h => h === 'close time'),
            pair: headers.findIndex(h => h === 'symbol'),
            type: headers.findIndex(h => h === 'side'),
            entry: headers.findIndex(h => h === 'open price'),
            exit: headers.findIndex(h => h === 'close price'),
            sl: headers.findIndex(h => h === 'sl'),
            tp: headers.findIndex(h => h === 'tp'),
            duration: headers.findIndex(h => h === 'duration'),
            lots: headers.findIndex(h => h === 'lots'),
            commission: headers.findIndex(h => h === 'commissions'),
            gain: headers.findIndex(h => h === 'gain')
          };
          const parsed = parsedRows.slice(headerRowIndex + 1).map((cols, i) => {
            const val = (idx) => (idx !== -1 && cols[idx]) ? cols[idx].trim() : "";
            let cleanDate = "";
            const rawDate = val(colMap.date);
            if (rawDate && rawDate.includes('/')) {
              const dateOnly = rawDate.split(' ')[0];
              const [d, m, y] = dateOnly.split('/');
              cleanDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
            const pnl = parseFloat(val(colMap.pnl).replace(/[$\s,]/g, ""));
            if (!cleanDate || isNaN(pnl)) return null;
            return { 
              ticket: val(colMap.ticket) || `tmp-${i}`, 
              date: cleanDate, 
              pair: val(colMap.pair).toUpperCase(), 
              pnl,
              type: val(colMap.type) || "Trade",
              entry: parseFloat(val(colMap.entry)) || 0,
              exit: parseFloat(val(colMap.exit)) || 0,
              sl: parseFloat(val(colMap.sl)) || 0,
              tp: parseFloat(val(colMap.tp)) || 0,
              duration: val(colMap.duration) || "",
              lots: parseFloat(val(colMap.lots)) || 0,
              commission: parseFloat(val(colMap.commission)) || 0,
              roi: parseFloat(val(colMap.gain)?.replace(/[%,]/g, "") || "0") || 0
            };
          }).filter(t => t !== null);

          setUploadedTrades(parsed);
          setManualDemoMode(false);
          showNotification(`CSV Loaded: ${parsed.length} trades.`, "success");
          resolve(parsed);
        } catch (err) { reject(err); }
      };
      reader.readAsText(file);
    });
  };

  // --- 3. SAVE (Archive with Instant UI Update) ---
  const saveDailyJournal = async (date, data, dailyTrades = null, silent = false) => {
    try {
      const existingTickets = new Set(archivedTrades.map(t => t.ticket));
      const uniqueTrades = dailyTrades ? dailyTrades.filter(t => !existingTickets.has(t.ticket)) : [];

      const [journalRes, tradesRes] = await Promise.all([
        fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ date, ...data })
        }),
        uniqueTrades.length > 0 ? fetch('/api/trades/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ trades: uniqueTrades })
        }) : Promise.resolve(null)
      ]);

      if (journalRes.ok) {
        const updatedJournal = await journalRes.json();
        setJournalData(prev => ({ ...prev, [date]: updatedJournal.data }));
      }

      if (tradesRes && tradesRes.ok) {
        const savedTradesData = await tradesRes.json();
        // The backend returns the COMPLETE list, so replace instead of append to prevent doubling
        setArchivedTrades(savedTradesData.data);
        // Clear the temporary session trades now that they are permanently archived
        setUploadedTrades([]);
      }
      if (!silent) showNotification("Archived successfully.", "success");
    } catch (err) { console.error(err); }
  };

  // --- 4. CALCULATIONS (Fixed Monthly Bars) ---
  const syncData = useMemo(() => {
    const isPerformanceDemo = !isLive || manualDemoMode;
    
    // Combine archived database trades with current session uploaded trades
    const archivedTickets = new Set(archivedTrades.map(t => t.ticket));
    const combinedTrades = [
        ...archivedTrades,
        ...uploadedTrades.filter(t => !archivedTickets.has(t.ticket))
    ];

    const source = combinedTrades; 

    // Sort CSV data chronologically
    const sorted = [...source].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Core Stats
    const totalNetPnl = source.reduce((acc, t) => acc + t.pnl, 0);
    const wins = source.filter(t => t.pnl > 0);
    const losses = source.filter(t => t.pnl < 0);
    const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));

    // A. CUMULATIVE PnL GRAPH
    const pnlByDate = {};
    sorted.forEach(t => { pnlByDate[t.date] = (pnlByDate[t.date] || 0) + t.pnl; });
    let runningTotal = 0;
    const liveDailyPnL = Object.keys(pnlByDate).sort().map(date => {
      runningTotal += pnlByDate[date];
      return { day: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), pnl: runningTotal };
    });

    // B. MONTHLY BARS (Net Performance Calculation)
    const monthMap = {};
    sorted.forEach(t => {
      const date = new Date(t.date);
      const mKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthMap[mKey]) {
        monthMap[mKey] = { month: mKey, pnl: 0, timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime() };
      }
      monthMap[mKey].pnl += t.pnl;
    });
    const liveMonthlyBars = Object.values(monthMap).sort((a, b) => a.timestamp - b.timestamp);

    // C. STATS CARDS
    const liveStats = [
      { title: "Net Profit", value: `$${totalNetPnl.toLocaleString()}`, colorClass: totalNetPnl >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50", valueColor: totalNetPnl >= 0 ? "text-emerald-600" : "text-rose-600" },
      { title: "Win Rate", value: `${source.length > 0 ? ((wins.length / source.length) * 100).toFixed(1) : 0}%`, colorClass: "text-teal-600 bg-teal-50" },
      { title: "Total Trades", value: source.length.toString(), colorClass: "text-blue-600 bg-blue-50" },
      { title: "Avg. Win", value: `$${wins.length > 0 ? (grossProfit / wins.length).toFixed(2) : "0.00"}`, colorClass: "text-emerald-600 bg-emerald-50" },
      { title: "Profit Factor", value: grossLoss === 0 ? grossProfit.toFixed(2) : (grossProfit / grossLoss).toFixed(2), colorClass: "text-purple-600 bg-purple-50" }
    ];

    return {
      // Logic for demo/live switching
      statsData: isPerformanceDemo ? DEMO_DATA.statsData : liveStats,
      dailyPnL: isPerformanceDemo ? DEMO_DATA.dailyPnL : (liveDailyPnL.length ? liveDailyPnL : [{day: 'No Data', pnl: 0}]),
      monthlyBars: isPerformanceDemo ? DEMO_DATA.monthlyBars : liveMonthlyBars,
      
      chartColor: totalNetPnl >= 0 ? "#10b981" : "#f43f5e",
      realTrades: archivedTrades, 
      uploadedTrades, 
      isLive,
      isDemo: isPerformanceDemo,
      isPerformanceDemo,
      manualDemoMode,
      setManualDemoMode,
      importTrades,
      resetPerformance: () => { setUploadedTrades([]); setManualDemoMode(true); showNotification("Performance and Journal reset to demo mode. History preserved.", "info"); },
      resetDatabase: () => { setArchivedTrades([]); setJournalData({}); showNotification("Database Reset", "info"); },
      journalData,
      saveDailyJournal,
      loading
    };
  }, [uploadedTrades, archivedTrades, isLive, journalData, manualDemoMode]);

  return (
    <TradeContext.Provider value={syncData}>
      {children}
      {toast && (
        <div className="fixed top-10 right-10 z-[9999] bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl border border-slate-700">
          {toast.message}
        </div>
      )}
    </TradeContext.Provider>
  );
};

export const useTrades = () => useContext(TradeContext);
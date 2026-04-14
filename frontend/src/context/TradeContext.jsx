import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';

const TradeContext = createContext();

export const TradeProvider = ({ children }) => {
  const { token } = useAuth();
  const [uploadedTrades, setUploadedTrades] = useState([]); 
  const [archivedTrades, setArchivedTrades] = useState([]); 
  const [journalData, setJournalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [currentMonth, setCurrentMonth] = useState({ 
    year: new Date().getFullYear(), 
    month: new Date().getMonth() + 1 
  });
  const [selectedDay, setSelectedDay] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); 
  };

  const handleMonthChange = (direction) => {
    setCurrentMonth(prev => {
      let { year, month } = prev;
      month += direction;
      if (month > 12) { month = 1; year++; }
      else if (month < 1) { month = 12; year--; }
      return { year, month };
    });
    setSelectedDay(null);
  };

  const monthName = useMemo(() => {
    return new Date(currentMonth.year, currentMonth.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setArchivedTrades([]);
        setJournalData({});
        return;
      }
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

  // --- 2. IMPORT ---
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
          if (headerRowIndex === -1) {
            showNotification("Invalid CSV format", "error");
            return reject("No headers found");
          }
          const headers = parsedRows[headerRowIndex].map(h => h.toLowerCase().trim());
          const colMap = {
            ticket: headers.findIndex(h => h.includes('ticket')),
            pnl: headers.findIndex(h => h === 'pnl'),
            date: headers.findIndex(h => h === 'close time'),
            pair: headers.findIndex(h => h === 'symbol'),
            type: headers.findIndex(h => h === 'side'),
            entry: headers.findIndex(h => h === 'open price'),
            exit: headers.findIndex(h => h === 'close price'),
            lots: headers.findIndex(h => h === 'lots'),
            commission: headers.findIndex(h => h === 'commissions'),
          };
          const parsed = parsedRows.slice(headerRowIndex + 1).map((cols, i) => {
            const val = (idx) => (idx !== -1 && cols[idx]) ? cols[idx].trim() : "";
            let cleanDate = "";
            const rawDate = val(colMap.date);
            if (rawDate) {
              const dateOnly = rawDate.split(' ')[0];
              let d, m, y;
              if (dateOnly.includes('/')) { [d, m, y] = dateOnly.split('/'); }
              else if (dateOnly.includes('.')) { [y, m, d] = dateOnly.split('.'); if (y.length < 4) { const tmp = y; y = d; d = tmp; } }
              else if (dateOnly.includes('-')) { [y, m, d] = dateOnly.split('-'); if (y.length < 4) { const tmp = y; y = d; d = tmp; } }

              if (y && m && d) { if (y.length === 2) y = "20" + y; cleanDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
              else { const parsedD = new Date(rawDate); if (!isNaN(parsedD.getTime())) cleanDate = parsedD.toISOString().split('T')[0]; }
            }
            const pnl = parseFloat(val(colMap.pnl).replace(/[$\s,]/g, ""));
            if (!cleanDate || isNaN(pnl)) return null;
            return { 
              ticket: val(colMap.ticket) || `tmp-${i}-${Date.now()}`, 
              date: cleanDate, 
              pair: val(colMap.pair).toUpperCase(), 
              pnl,
              type: val(colMap.type) || "Trade",
              entry: parseFloat(val(colMap.entry)) || 0,
              exit: parseFloat(val(colMap.exit)) || 0,
              lots: parseFloat(val(colMap.lots)) || 0,
              commission: parseFloat(val(colMap.commission)) || 0,
            };
          }).filter(t => t !== null);

          // Save to database
          if (token && parsed.length > 0) {
            const res = await fetch('/api/trades/bulk', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ trades: parsed })
            });

            if (res.ok) {
              const savedTradesData = await res.json();
              setArchivedTrades(savedTradesData.data);
              setUploadedTrades([]);
              showNotification(`CSV Imported and Saved: ${parsed.length} trades.`, "success");
            } else {
              showNotification("Failed to save trades to database", "error");
            }
          } else {
            setUploadedTrades(parsed);
            showNotification(`CSV Loaded: ${parsed.length} trades. (Not logged in)`, "info");
          }
          resolve(parsed);
        } catch (err) { reject(err); }
      };
      reader.readAsText(file);
    });
  };

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
        setArchivedTrades(savedTradesData.data);
        setUploadedTrades([]);
      }
      if (!silent) showNotification("Archived successfully.", "success");
    } catch (err) { console.error(err); }
  };

  const updateTrade = async (id, data) => {
    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated = await res.json();
        setArchivedTrades(prev => prev.map(t => t._id === id ? updated.data : t));
        return { success: true };
      }
    } catch (err) { console.error(err); return { success: false }; }
  };

  const syncData = useMemo(() => {
    const archivedTickets = new Set(archivedTrades.map(t => t.ticket));
    const combinedTrades = [
        ...archivedTrades,
        ...uploadedTrades.filter(t => !archivedTickets.has(t.ticket))
    ];

    const source = combinedTrades; 
    const parseDate = (d) => {
      if (!d) return new Date(0);
      const date = new Date(d);
      return isNaN(date.getTime()) ? new Date(0) : date;
    };

    const sorted = [...source].sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
    
    const totalNetPnl = source.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);
    const wins = source.filter(t => (parseFloat(t.pnl) || 0) > 0);
    const losses = source.filter(t => (parseFloat(t.pnl) || 0) < 0);
    const grossProfit = wins.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0));

    let runningTotal = 0;
    const dailyPnL = [];
    if (sorted.length > 0) {
      const firstDate = parseDate(sorted[0].date);
      const dayBefore = new Date(firstDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      dailyPnL.push({ day: dayBefore.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), pnl: 0, date: dayBefore.toISOString().split('T')[0] });
    }

    const pnlByDate = {};
    sorted.forEach(t => { const amount = parseFloat(t.pnl) || 0; const dKey = t.date || "Unknown"; pnlByDate[dKey] = (pnlByDate[dKey] || 0) + amount; });
    const sortedDates = Object.keys(pnlByDate).sort((a, b) => parseDate(a).getTime() - parseDate(b).getTime());
    sortedDates.forEach(date => { runningTotal += pnlByDate[date]; dailyPnL.push({ day: parseDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), pnl: runningTotal, date: date }); });

    const monthMap = {};
    sorted.forEach(t => {
      const date = parseDate(t.date);
      if (date.getTime() === 0) return;
      const mKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthMap[mKey]) { monthMap[mKey] = { month: mKey, pnl: 0, timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime() }; }
      monthMap[mKey].pnl += (parseFloat(t.pnl) || 0);
    });
    const monthlyBars = Object.values(monthMap).sort((a, b) => a.timestamp - b.timestamp);

    const statsData = [
      { title: "Net Profit", value: `$${totalNetPnl.toLocaleString()}`, colorClass: totalNetPnl >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50", valueColor: totalNetPnl >= 0 ? "text-emerald-600" : "text-rose-600" },
      { title: "Win Rate", value: `${source.length > 0 ? ((wins.length / source.length) * 100).toFixed(1) : 0}%`, colorClass: "text-teal-600 bg-teal-50" },
      { title: "Total Trades", value: source.length.toString(), colorClass: "text-blue-600 bg-blue-50" },
      { title: "Avg. Win", value: `$${wins.length > 0 ? (grossProfit / wins.length).toFixed(2) : "0.00"}`, colorClass: "text-emerald-600 bg-emerald-50" },
      { title: "Profit Factor", value: grossLoss === 0 ? (grossProfit > 0 ? grossProfit.toFixed(2) : "0.00") : (grossProfit / grossLoss).toFixed(2), colorClass: "text-purple-600 bg-purple-50" }
    ];

    const { year, month } = currentMonth;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); 
    const calendarGrid = [];
    for (let i = 0; i < firstDayIndex; i++) { calendarGrid.push({ type: 'empty', key: `empty-${i}` }); }
    for (let d = 1; d <= daysInMonth; d++) {
        const dDate = new Date(year, month - 1, d);
        const dayString = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const matches = source.filter(t => t.date === dayString);
        const pnl = matches.reduce((acc, curr) => acc + (parseFloat(curr.pnl) || 0), 0);
        calendarGrid.push({ type: 'day', date: dDate, dayOfMonth: d, isWeekend: dDate.getDay() === 0 || dDate.getDay() === 6, pnl, trades: matches.length, key: `day-${d}`, dateString: dayString });
    }

    const weeklyBreakdown = [];
    const weeksInGrid = Math.ceil(calendarGrid.length / 7);
    for (let i = 0; i < weeksInGrid; i++) {
        const weekDays = calendarGrid.slice(i * 7, (i * 7) + 7);
        const weekPnl = weekDays.reduce((acc, day) => acc + (day.pnl || 0), 0);
        if (weekDays.find(d => d.type === 'day')) { weeklyBreakdown.push({ label: `Week ${i + 1}`, pnl: weekPnl }); }
    }

    return {
      statsData,
      dailyPnL: dailyPnL.length ? dailyPnL : [{day: 'No Data', pnl: 0}],
      monthlyBars,
      weeklyBreakdown,
      calendarGrid,
      monthName,
      handleMonthChange,
      selectedDay,
      setSelectedDay,
      chartColor: totalNetPnl >= 0 ? "#10b981" : "#f43f5e",
      realTrades: source, 
      uploadedTrades, 
      isLive: token !== null,
      isDemo: token === null,
      importTrades,
      saveDailyJournal,
      updateTrade,
      showNotification,
      journalData,
      loading
    };
  }, [uploadedTrades, archivedTrades, journalData, currentMonth, selectedDay, loading, token]);

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

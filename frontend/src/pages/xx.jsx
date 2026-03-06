import {
  FaChartLine,
  FaDollarSign,
  FaListAlt,
  FaBalanceScale,
  FaArrowUp,
  FaArrowDown,
  FaTwitter,
  FaTimes,
  FaDiscord,
  FaGlobe,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaTrophy,       // Added for Win card
  FaLightbulb,    // Added for Loss/Insight card
  FaShieldAlt     // Added for Protection card
} from "react-icons/fa";

import {
  AreaChart,
  ResponsiveContainer,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from 'recharts';
import React, { useState, useMemo } from 'react';
import { useTrades } from "../context/TradeContext";


// --- UI Helpers ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white text-xs p-2 rounded-md shadow-xl">
        <p className="font-semibold mb-1">{label}</p>
        <p>
          <span className="opacity-70">{payload[0].name}:</span>{" "}
          <span className="font-mono font-medium">${payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// --- Footer Component ---
const Footer = () => (
    <footer className="mt-16 pt-10 pb-8 border-t border-gray-200 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div> MyJournal Pro
                </h4>
                <p className="text-xs text-slate-500 mt-2">
                    © {new Date().getFullYear()} Trading Journal Inc. Data for simulation only.
                </p>
            </div>
            <div className="flex gap-8 text-sm font-medium text-slate-600">
                <button className="hover:text-emerald-600 transition">Privacy</button>
                <button className="hover:text-emerald-600 transition">Terms</button>
                <button className="hover:text-emerald-600 transition">Support</button>
            </div>
            <div className="flex gap-5 text-slate-400">
                <button className="hover:text-[#1DA1F2] transition transform hover:-translate-y-1"><FaTwitter size={20} /></button>
                <button className="hover:text-[#5865F2] transition transform hover:-translate-y-1"><FaDiscord size={20} /></button>
                <button className="hover:text-slate-600 transition transform hover:-translate-y-1"><FaGlobe size={20} /></button>
            </div>
        </div>
    </footer>
);

export default function Performance() {

  const { clearData } = useTrades();

  // account
  // 1. Grab everything from the context safely
    const { account = {} } = useTrades() || {};

    // 2. Map them to your existing names so the JSX doesn't break
    const accountBalance = account.balance || 0;
    const lastUpdated = account.lastUpdated || "";
    const accountConnected = account.isConnected ?? true;
    const percentageChange = account.percentageChange || 0;
    const isPositive = account.isPositive ?? true;

  // --- STATS CONFIG ---
  const { statsData = [] } = useTrades() || {};

  const stats = statsData;

  const statIcons = [
    <FaChartLine size={20} />, 
    <FaDollarSign size={20} />, 
    <FaArrowUp size={20} />, 
    <FaListAlt size={20} />, 
    <FaBalanceScale size={20} />
  ];

  // --- CHART DATA ---
  const { dailyPnL = [] } = useTrades() || {};

const off = useMemo(() => {
  if (dailyPnL.length === 0) return 0;
  const dataMax = Math.max(...dailyPnL.map(i => i.pnl));
  const dataMin = Math.min(...dailyPnL.map(i => i.pnl));
  if (dataMax <= 0) return 0;
  if (dataMin >= 0) return 1;
  return dataMax / (dataMax - dataMin);
}, [dailyPnL]);

// 1. Grab monthly data safely
const { monthlyBars = [] } = useTrades() || {};


  // --- CALENDAR LOGIC ---
  const { realTrades = [], isLive = false } = useTrades() || {};

  const [currentMonth, setCurrentMonth] = useState({ year: 2025, month: 12 });
  const [selectedDay, setSelectedDay] = useState(null);

const calendarGrid = useMemo(() => {
    // 1. Get the real data and status from context
    const { realTrades = [], isLive = false } = useTrades() || {};

    const { year, month } = currentMonth;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const days = [];

    // --- EMPTY SLOTS (100% Original) ---
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }

    // --- ACTUAL DAYS (Integrated with Live Data) ---
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      let pnl = 0;
      let trades = 0;
      
      if (isLive) {
          // MODE 1: LIVE DATA
          // Format date as YYYY-MM-DD to match your CSV structure
          const dayString = date.toISOString().split('T')[0];
          const matches = realTrades.filter(t => t.date === dayString);
          
          trades = matches.length;
          // Sum up the P&L for all trades on this day
          pnl = matches.reduce((acc, curr) => acc + (parseFloat(curr.pnl) || 0), 0);
      } else {
          // MODE 2: YOUR ORIGINAL DEMO LOGIC
          if (!isWeekend && Math.random() > 0.4) {
              trades = Math.floor(Math.random() * 5) + 1;
              pnl = Math.floor(Math.random() * 600) - 200;
          }
      }

      days.push({
        type: 'day',
        date: date,
        dayOfMonth: d,
        isWeekend,
        pnl,
        trades,
        key: `day-${d}`
      });
    }
    return days;
  }, [currentMonth, isLive, realTrades]); // Added dependencies to trigger update when CSV is uploaded

  const weeklyPnl = useMemo(() => {
     const actualDays = calendarGrid.filter(d => d.type === 'day');
     let weeks = [0, 0, 0, 0, 0];
     actualDays.forEach(day => {
        const weekIndex = Math.min(Math.floor((day.dayOfMonth - 1) / 7), 4);
        weeks[weekIndex] += day.pnl;
     });
     return weeks.map((val, idx) => ({ label: `Week ${idx + 1}`, pnl: val }));
  }, [calendarGrid]);

  const handleMonthChange = (direction) => {
    let { year, month } = currentMonth;
    month += direction;
    if (month > 12) { month = 1; year++; }
    else if (month < 1) { month = 12; year--; }
    setCurrentMonth({ year, month });
    setSelectedDay(null);
  };

  const monthName = new Date(currentMonth.year, currentMonth.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

 // Replace your 'getTradesForDate' and 'tradesForSelected' with this:
  const tradesForSelected = useMemo(() => {
    // 1. Safety check: If nothing is selected, show nothing
    if (!selectedDay || selectedDay.trades === 0) return [];

    // 2. Grab real data status from context
    const { realTrades = [], isLive = false } = useTrades() || {};

    if (isLive) {
        // MODE 1: LIVE (From CSV)
        const dayString = selectedDay.date.toISOString().split('T')[0];
        return realTrades.filter(t => t.date === dayString);
    } else {
        // MODE 2: DEMO (Your exact original random logic)
        const trades = [];
        for (let i = 0; i < selectedDay.trades; i++) {
          trades.push({
            id: `${selectedDay.dayOfMonth}-${i}`,
            pair: ["EUR/USD", "GBP/USD", "BTC/USD"][i % 3],
            type: i % 2 === 0 ? "Buy" : "Sell",
            entry: (Math.random() * 1.1).toFixed(4), // Updated to look more like Forex
            exit: (Math.random() * 1.1).toFixed(4),
            pnl: Math.floor((Math.random() * 200) - 100)
          });
        }
        return trades;
    }
  }, [selectedDay, isLive, realTrades]); // This updates instantly when you click a day or upload a file

  // --- NEW: Helper to render the specific feedback card ---
  const renderFeedbackCard = () => {
    if (!selectedDay) return null;

    if (selectedDay.pnl > 0) {
      // WINNING DAY
      return (
        <Card className="p-6 bg-gradient-to-r from-emerald-50 to-white border-l-4 border-l-emerald-500 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm text-emerald-500">
              <FaTrophy size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-900">Great Execution!</h3>
              <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
                You capitalized on the market today. Ensure your winners followed your trading plan, not just luck. 
                <span className="font-semibold block mt-1">Status: Disciplined & Profitable.</span>
              </p>
            </div>
          </div>
        </Card>
      );
    } 
    
    if (selectedDay.pnl < 0) {
      // LOSING DAY
      return (
        <Card className="p-6 bg-gradient-to-r from-rose-50 to-white border-l-4 border-l-rose-500 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm text-rose-500">
              <FaLightbulb size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-900">Mental Reset Needed</h3>
              <p className="text-sm text-rose-700 mt-1 leading-relaxed">
                Losses are the tuition you pay to the market. Do not try to win it back immediately.
                Review your rules: did you follow them?
                <span className="font-semibold block mt-1">Advice: Accept the loss and protect your capital.</span>
              </p>
            </div>
          </div>
        </Card>
      );
    }

    return null; // Breakeven or 0 (handled silently or add another case if desired)
  };

  return (
    <div className="bg-slate-50/50 min-h-screen font-sans text-slate-800 pb-10">
      
      {/* Page Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between">
           <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Performance Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isLive ? "Viewing live broker data" : "Viewing simulation data"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Clear Data Button - Only shows when live data exists */}
            {isLive && (
              <button 
                onClick={clearData}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-100"
              >
                <FaTimes size={14} />
                Clear All
              </button>
            )}
        </div>
        </div>

        {/* ---------------- STATS GRID ---------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, idx) => (
              <Card key={idx} className="p-5 hover:shadow-md transition duration-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {stat.title}
                  </span>
                  <div className={`p-2 rounded-lg ${stat.colorClass}`}>
                    {statIcons[idx]}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${stat.valueColor || "text-slate-900"}`}>
                  {stat.value}
                </div>
              </Card>
            ))}
        </div>

        {/* ---------------- TOP CHARTS ROW ---------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* 🔵 DAILY PNL (Span 5) */}
          <Card className="lg:col-span-5 p-6 flex flex-col border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-slate-800">Cumulative Daily P&L</h2>
              <p className="text-xs text-slate-500 mt-1">Net performance over time</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-600 border border-slate-200">
              This Week
            </span>
        </div>
        
        <div className="flex-1 w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyPnL} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* 1. Fill Gradient (Transparent) */}
                  <linearGradient id="splitColorFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset={`${off * 100}%`} stopColor="#10b981" stopOpacity={0} />
                    <stop offset={`${off * 100}%`} stopColor="#f43f5e" stopOpacity={0} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.15} />
                  </linearGradient>

                  {/* 2. Stroke Gradient (Solid Color Switch) */}
                  <linearGradient id="splitColorStroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset={`${off * 100}%`} stopColor="#10b981" stopOpacity={1} />
                    <stop offset={`${off * 100}%`} stopColor="#f43f5e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={1} />
                  </linearGradient>
                  
                  {/* 3. Glow Filter for the Line */}
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.1"/>
                  </filter>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} 
                  dy={10} 
                />
                
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                />
                
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} 
                />
                
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="url(#splitColorStroke)" /* Uses the gradient stroke */
                  strokeWidth={3}
                  fill="url(#splitColorFill)"
                  filter="url(#glow)"             /* Adds the subtle shadow */
                  animationDuration={1500}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#1e293b' }}
                />
              </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

          {/* 🟢 ACCOUNT BALANCE (Span 3) */}
          <Card className="lg:col-span-3 p-6 flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full pointer-events-none"></div>
            
            <h2 className="text-slate-300 font-medium text-sm mb-6">Total Equity</h2>
            
            {!accountConnected ? (
              <div className="flex flex-col items-center justify-center h-full">
                <button 
                  onClick={() => setAccountConnected(true)} 
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow hover:bg-emerald-600 transition text-sm font-semibold"
                >
                  Connect Broker
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                <p className="text-4xl font-bold tracking-tight mb-2">
                  ${accountBalance.toLocaleString()}
                </p>
              {/* THE DYNAMIC SECTION */}
              <div className={`flex items-center gap-2 ${isPositive ? 'text-emerald-400' : 'text-rose-400'} text-sm font-medium mb-6`}>
                {isPositive ? <FaArrowUp size={12}/> : <FaArrowDown size={12}/>} 
                <span>{percentageChange}% today</span>
              </div>
                              
                <div className="pt-6 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
                  <span>Last sync: {lastUpdated}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>
            )}
          </Card>

          {/* 🟣 MONTHLY BAR GRAPH (Span 4) */}
          <Card className="lg:col-span-4 p-6 flex flex-col">
             <div className="flex items-center justify-between mb-6">
               <h2 className="font-bold text-slate-800">Monthly Net P&L</h2>
            </div>
            <div className="flex-1 w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBars} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#cbd5e1" />
                    <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="loss" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} /> 
                  </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* ---------------- CALENDAR & WEEKLY SECTION ---------------- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* MAIN CALENDAR (Span 8) with WRAPPER for Feedback Card */}
          <div className="xl:col-span-8 space-y-6">
            <Card className="p-6">
              {/* Calendar Header */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FaCalendarAlt size={16} /> 
                  </div>
                  Trading Journal
                </h2>
                
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition text-slate-500 hover:text-slate-800">
                      <FaChevronLeft size={12} />
                  </button>
                  <span className="text-sm font-semibold min-w-[140px] text-center text-slate-700 select-none">{monthName}</span>
                  <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-md transition text-slate-500 hover:text-slate-800">
                      <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{day}</div>
                ))}

                {calendarGrid.map((item) => {
                    if (item.type === 'empty') return <div key={item.key} className="h-24"></div>;

                    const isSelected = selectedDay && selectedDay.dayOfMonth === item.dayOfMonth;
                    
                    // Dynamic Classes
                    let bgClass = "bg-white";
                    let textClass = "text-slate-400";
                    let borderClass = "border-slate-100";
                    
                    if (item.pnl > 0) {
                        bgClass = "bg-emerald-50/60";
                        borderClass = "border-emerald-100";
                        textClass = "text-emerald-700";
                    } else if (item.pnl < 0) {
                        bgClass = "bg-rose-50/60";
                        borderClass = "border-rose-100";
                        textClass = "text-rose-700";
                    }

                    if (item.isWeekend) {
                        bgClass = "bg-slate-50 opacity-60";
                        borderClass = "border-transparent";
                    }

                    return (
                    <div
                        key={item.key}
                        onClick={() => !item.isWeekend && setSelectedDay(item)}
                        className={`
                        h-24 rounded-xl p-3 relative flex flex-col justify-between border transition-all duration-200
                        ${bgClass} ${borderClass}
                        ${!item.isWeekend ? 'cursor-pointer hover:border-slate-300 hover:shadow-md' : 'cursor-default'}
                        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 z-10 shadow-lg !border-indigo-500' : ''}
                        `}
                    >
                        <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {item.dayOfMonth}
                        </span>
                        
                        {!item.isWeekend && item.trades > 0 && (
                        <div className="mt-1">
                            <div className={`text-sm font-bold ${textClass}`}>
                                {item.pnl > 0 ? '+' : ''}{item.pnl}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 font-medium">
                                {item.trades} Trades
                            </div>
                        </div>
                        )}
                    </div>
                    );
                })}
              </div>
            </Card>

            {/* DYNAMIC FEEDBACK CARD BELOW CALENDAR */}
            {renderFeedbackCard()}
          </div>

          {/* SIDEBAR: WEEKLY & DETAILS (Span 4) */}
          <div className="xl:col-span-4 space-y-6">
             
             {/* Weekly Stats */}
             <Card className="p-6">
                <h3 className="font-bold text-slate-800 mb-5">Weekly Breakdown</h3>
                <div className="space-y-3">
                    {weeklyPnl.map((week, idx) => {
                        const isProfitable = week.pnl >= 0;
                        return (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-sm font-medium text-slate-500">{week.label}</span>
                                <span className={`font-bold font-mono ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isProfitable ? '+' : ''}{week.pnl}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Selected Day Details */}
            <Card className="p-0 overflow-hidden flex flex-col h-auto max-h-[500px]">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                         <h3 className="font-bold text-slate-800">Trade History</h3>
                         <p className="text-xs text-slate-500 mt-0.5">
                            {selectedDay ? selectedDay.date.toDateString() : "Select a day"}
                         </p>
                    </div>
                    {selectedDay && (
                         <div className={`text-sm font-bold px-2 py-1 rounded ${selectedDay.pnl >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {selectedDay.pnl >= 0 ? '+' : ''}{selectedDay.pnl}
                         </div>
                    )}
                </div>

                <div className="p-2 overflow-y-auto custom-scrollbar">
                    {selectedDay ? (
                        <div className="space-y-1">
                        {tradesForSelected.length === 0 ? (
                            <div className="text-sm text-slate-400 text-center py-8 italic">No trades recorded.</div>
                        ) : tradesForSelected.map(t => (
                            <div key={t.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-8 rounded-full ${t.type === 'Buy' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                    <div>
                                        <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                            {t.pair} 
                                            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${t.type === 'Buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {t.type}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                                            {t.entry} <span className="text-slate-300">➜</span> {t.exit}
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-bold font-mono text-sm ${t.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <FaCalendarAlt size={32} className="opacity-20 mb-3" />
                            <p className="text-sm">Select a date to view trades</p>
                        </div>
                    )}
                </div>
            </Card>

          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
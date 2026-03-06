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
  FaTrophy,       
  FaLightbulb,    
  FaShieldAlt     
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
  Cell,
  Legend,
  ReferenceLine
} from 'recharts';
import React, { useState, useMemo } from 'react';
import { useTrades } from "../context/TradeContext";
import AddTradeModal from "./AddTradeModal";


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

  const { 
    resetDatabase, 
    resetPerformance,
    isLive, 
    isPerformanceDemo: isDemo,
    statsData = [], 
    dailyPnL = [], 
    chartColor = "#10b981", 
    monthlyBars = [], 
    realTrades = [],
    uploadedTrades = [],
    journalData = {}
  } = useTrades() || {};

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to format date consistently with backend/journal format (YYYY-MM-DD)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- STATS CONFIG ---
  const stats = statsData;

  const statIcons = [
    <FaChartLine size={20} />, 
    <FaDollarSign size={20} />, 
    <FaArrowUp size={20} />, 
    <FaListAlt size={20} />, 
    <FaBalanceScale size={20} />
  ];

  // --- CHART DATA ---

const off = useMemo(() => {
  if (dailyPnL.length === 0) return 0;
  const dataMax = Math.max(...dailyPnL.map(i => i.pnl));
  const dataMin = Math.min(...dailyPnL.map(i => i.pnl));
  if (dataMax <= 0) return 0;
  if (dataMin >= 0) return 1;
  return dataMax / (dataMax - dataMin);
}, [dailyPnL]);


  // --- CALENDAR LOGIC ---
  const [currentMonth, setCurrentMonth] = useState({ 
    year: new Date().getFullYear(), 
    month: new Date().getMonth() + 1 
  });
  const [selectedDay, setSelectedDay] = useState(null);

const calendarGrid = useMemo(() => {
    const { year, month } = currentMonth;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const days = [];

    // --- EMPTY SLOTS ---
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }

    // --- ACTUAL DAYS ---
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      let pnl = 0;
      let trades = 0;
      
      if (isLive && !isDemo) {
          // MODE 1: LIVE DATA
          const dayString = formatDate(date);
          
          // Combine permanent archived trades with temporary uploaded session trades
          const allCurrentTrades = [...realTrades, ...(uploadedTrades || [])];
          const matches = allCurrentTrades.filter(t => t.date === dayString);
          
          trades = matches.length;
          pnl = matches.reduce((acc, curr) => acc + (parseFloat(curr.pnl) || 0), 0);
      } else if (!isLive || isDemo) {
          // MODE 2: ORIGINAL DEMO LOGIC
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
  }, [currentMonth, isLive, isDemo, realTrades, uploadedTrades, journalData]); 

const weeklyPnl = useMemo(() => {
  const actualDays = calendarGrid.filter(d => d.type === 'day');
  let weeklyData = {};

  actualDays.forEach(day => {
    const dateObj = day.date;
    const firstDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    const firstWeekday = firstDayOfMonth.getDay(); 
    const weekIndex = Math.floor((day.dayOfMonth + firstWeekday - 1) / 7);
    
    if (!weeklyData[weekIndex]) weeklyData[weekIndex] = 0;
    weeklyData[weekIndex] += day.pnl;
  });

  return Object.keys(weeklyData).sort().map((key) => ({
    label: `Week ${parseInt(key) + 1}`,
    pnl: weeklyData[key]
  }));
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

  const tradesForSelected = useMemo(() => {
    if (!selectedDay || selectedDay.trades === 0) return [];

    if (isLive && !isDemo) {
        // MODE 1: LIVE
        const dayString = formatDate(selectedDay.date);
        return realTrades.filter(t => t.date === dayString);
    } else {
        // MODE 2: DEMO
        const trades = [];
        for (let i = 0; i < selectedDay.trades; i++) {
          trades.push({
            id: `${selectedDay.dayOfMonth}-${i}`,
            pair: ["EUR/USD", "GBP/USD", "BTC/USD"][i % 3],
            type: i % 2 === 0 ? "Buy" : "Sell",
            entry: (Math.random() * 1.1).toFixed(4), 
            exit: (Math.random() * 1.1).toFixed(4),
            pnl: Math.floor((Math.random() * 200) - 100)
          });
        }
        return trades;
    }
  }, [selectedDay, isLive, isDemo, realTrades, journalData]);

  const renderFeedbackCard = () => {
    if (!selectedDay) return null;

    if (selectedDay.pnl > 0) {
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

    return null; 
  };

  return (
    <div className="bg-slate-50/50 min-h-screen font-sans text-slate-800 pb-10">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between">
           <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Performance Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isLive && !isDemo ? "Viewing live broker data" : "Viewing simulation data"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLive && !isDemo && (
              <button 
                onClick={resetPerformance}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-100"
              >
                <FaTimes size={14} />
                Reset Performance
              </button>
            )}
            <div className="text-xs text-slate-400 italic">
               To add trades, go to <strong>Daily Journal</strong>
            </div>
          </div>
        </div>

        <AddTradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

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

          {/* 🔵 CUMULATIVE P&L */}
          <Card className="lg:col-span-8 p-6 flex flex-col border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Cumulative Net Profit</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">Tracking your growth from $0</p>
              </div>
              <div className="flex items-center gap-2">
                {isDemo || !isLive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        <FaArrowUp size={8}/> GROWTH
                      </span>
                    ) : (
                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                        chartColor === "#f43f5e" 
                          ? "text-rose-600 bg-rose-50" 
                          : "text-emerald-600 bg-emerald-50"
                      }`}>
                        {chartColor === "#f43f5e" ? (
                          <>
                            <FaArrowDown size={8}/> LOSS
                          </>
                        ) : (
                          <>
                            <FaArrowUp size={8}/> GROWTH
                          </>
                        )}
                      </span>
                    )}
              </div>
            </div>
            
            <div className="flex w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyPnL} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke={chartColor} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPnL)" 
                  animationDuration={1000}
                />
              </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 🟣 MONTHLY BREAKDOWN */}
{/* 🟣 MONTHLY BREAKDOWN - UPDATED SECTION */}
          <Card className="lg:col-span-4 p-6 flex flex-col border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Monthly Breakdown</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">Net Monthly Performance</p>
              </div>
            </div>
            
            <div className="flex-1 w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBars}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="bg-slate-800 text-white text-xs p-2 rounded-md shadow-xl">
                                    <p className="font-semibold">{payload[0].payload.month}</p>
                                    <p className="font-mono mt-1">
                                        Net: {payload[0].value >= 0 ? '+' : ''}${payload[0].value.toLocaleString()}
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    }}
                  />
                  {/* Single bar using 'pnl' key with conditional coloring */}
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]} barSize={24}>
                    {monthlyBars.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} 
                      />
                    ))}
                  </Bar>
                  {/* Adds a line at 0 for better visual reference */}
                  <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* ---------------- CALENDAR & WEEKLY SECTION ---------------- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          <div className="xl:col-span-8 space-y-6">
            <Card className="p-6">
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
              
              <div className="grid grid-cols-7 gap-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{day}</div>
                ))}

                {calendarGrid.map((item) => {
                    if (item.type === 'empty') return <div key={item.key} className="h-24"></div>;

                    const isSelected = selectedDay && selectedDay.dayOfMonth === item.dayOfMonth;
                    
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
                                {item.pnl >= 0 ? '+' : ''}{item.pnl.toFixed(2)}
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

            {renderFeedbackCard()}
          </div>

          <div className="xl:col-span-4 space-y-6">
             
             <Card className="p-6">
                <h3 className="font-bold text-slate-800 mb-5">Weekly Breakdown</h3>
                <div className="space-y-3">
                    {weeklyPnl.map((week, idx) => {
                        const isProfitable = week.pnl >= 0;
                        return (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <span className="text-sm font-medium text-slate-500">{week.label}</span>
                                <span className={`font-bold font-mono ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isProfitable ? '+' : ''}{week.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </Card>

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
                            {selectedDay.pnl >= 0 ? '+' : ''}{selectedDay.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                            {typeof t.entry === 'number' ? t.entry.toFixed(2) : t.entry} <span className="text-slate-300">➜</span> {typeof t.exit === 'number' ? t.exit.toFixed(2) : t.exit}
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-bold font-mono text-sm ${t.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {t.pnl >= 0 ? `+$${t.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `-$${Math.abs(t.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
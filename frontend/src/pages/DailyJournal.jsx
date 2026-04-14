import React, { useMemo, useState, useRef, useEffect } from "react";
import { 
  FaChartLine, FaDollarSign, FaArrowUp, FaArrowDown, 
  FaBold, FaItalic, FaUnderline, FaTwitter, FaDiscord, FaGlobe, 
  FaListUl, FaImage, FaExternalLinkAlt, FaTimes, FaSave, FaTag, 
  FaMagic, FaStar, FaBrain, FaExclamationTriangle, FaThermometerHalf,
  FaChevronLeft, FaChevronRight, FaCalendarDay, FaCheck, FaCircleNotch
} from "react-icons/fa";
import { AreaChart, ResponsiveContainer, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { useTrades } from "../context/TradeContext";
import { useTheme } from "../context/ThemeContext";

// --- UI COMPONENTS ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`px-2.5 py-1.5 rounded text-sm font-semibold border ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

export default function DailyJournal({ date: propDate = new Date(), trades: propTrades }) {
  
  // --- CONTEXT & DATE STATE ---
  const { realTrades, uploadedTrades, isLive, isDemo, journalData, saveDailyJournal, updateTrade, showNotification, importTrades } = useTrades() || {};
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(propDate);

  // Auto-navigate to latest trade on import/load
  useEffect(() => {
    if (isLive && realTrades && realTrades.length > 0 && (!propTrades || !propTrades.length)) {
      // Sort to find the latest date safely
      const sorted = [...realTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
      const lastTrade = sorted[sorted.length - 1];
      
      if (lastTrade && lastTrade.date) {
        // Parse "YYYY-MM-DD" to local Date to avoid timezone shifts
        const parts = lastTrade.date.split('-');
        if (parts.length === 3) {
           const [y, m, d] = parts.map(Number);
           setCurrentDate(new Date(y, m - 1, d));
        }
      }
    }
  }, [realTrades, isLive]);

  // Helper to format date as YYYY-MM-DD for comparison
  const formatDateKey = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateKey = formatDateKey(currentDate);

  // --- LOCAL TRADE STATE ---
  const [localTrades, setLocalTrades] = useState([]);
  const [justSaved, setJustSaved] = useState(false);
  const tradeFileInputRef = useRef(null);

  // Reset justSaved when date changes
  useEffect(() => {
    setJustSaved(false);
  }, [dateKey]);

  // Load Journal Data & Trades when Date Changes
  useEffect(() => {
    // 1. Load Journal Metadata
    if (journalData && journalData[dateKey]) {
        const data = journalData[dateKey];
        if (editorRef.current) {
            editorRef.current.innerHTML = data.html || "";
            handleInput();
        }
        setSessionRating(data.rating || 0);
        setRules(data.rules && data.rules.length > 0 ? data.rules : [
            { name: "Risk management applied", followed: false },
            { name: "Waited for confirmation", followed: false },
            { name: "No revenge trading", followed: false },
            { name: "Exit criteria met", followed: false }
        ]);
        setMarketCondition(data.condition || "Trending");
        setSelectedMoods(data.moods || []);
        setSelectedCriteria(data.setups || []);
        setImages(data.images || []);
    } else {
        // Reset if no data
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
            handleInput();
        }
        setSessionRating(0);
        setRules([
            { name: "Risk management applied", followed: false },
            { name: "Waited for confirmation", followed: false },
            { name: "No revenge trading", followed: false },
            { name: "Exit criteria met", followed: false }
        ]);
        setMarketCondition("Trending");
        setSelectedMoods([]);
        setSelectedCriteria([]);
        setImages([]);
    }

    // 2. Load Trades for this Date (Skip if in Demo Mode)
    if (!isDemo) {
        // Filter trades for this date.
        // realTrades is the combined list from the context
        const newTrades = (isLive && realTrades.length > 0) 
            ? realTrades.filter(t => t.date === dateKey)
            : (propTrades || []);
        
        setLocalTrades(prev => {
            // Only update if data actually changed to avoid infinite loops
            if (JSON.stringify(prev) !== JSON.stringify(newTrades)) {
                return newTrades;
            }
            return prev;
        });
    } else if (isDemo) {
        setLocalTrades(propTrades || []);
    }
  }, [dateKey, journalData, realTrades, isLive, isDemo, propTrades]);

  // Handle Date Navigation
  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  // --- STATE MANAGEMENT ---
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, saved
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  
  // New Trader Features State
  const [sessionRating, setSessionRating] = useState(0); // 1-5 Stars (Replaced by Percentage logic below)
  const [rules, setRules] = useState([
    { name: "Risk management applied", followed: false },
    { name: "Waited for confirmation", followed: false },
    { name: "No revenge trading", followed: false },
    { name: "Exit criteria met", followed: false }
  ]);
  const [newRuleInput, setNewRuleInput] = useState("");
  const [marketCondition, setMarketCondition] = useState("Trending");
  const [selectedMoods, setSelectedMoods] = useState([]);

  // Calculate Discipline Percentage
  const disciplinePercentage = useMemo(() => {
    if (rules.length === 0) return 0;
    const followedCount = rules.filter(r => r.followed).length;
    return Math.round((followedCount / rules.length) * 100);
  }, [rules]);
  
  // Tags/Criteria
  const [availableCriteria, setAvailableCriteria] = useState([
      "Break & Retest", "Fibonacci Golden Zone", "Supply Zone", "Double Top", "EMA Crossover"
  ]);
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [newCriteriaInput, setNewCriteriaInput] = useState("");

  // --- CONFIG DATA ---
  const moodOptions = ["Focused", "Anxious", "Confident", "Revenge", "FOMO", "Zen"];
  const conditionOptions = ["Trending", "Ranging", "Choppy", "High Volatility", "Low Volume"];

  const tradingTemplates = [
    { label: "Pre-Market", icon: "📊", text: "📊 PRE-MARKET PLAN", color: "#2563eb" },
    { label: "Execution", icon: "⚡", text: "⚡ TRADE EXECUTION", color: "#d97706" },
    { label: "Psychology", icon: "🧠", text: "🧠 PSYCHOLOGY CHECK", color: "#7c3aed" },
    { label: "Review", icon: "📝", text: "📝 POST-SESSION REVIEW", color: "#059669" }
  ];

  // --- STATS CALCULATIONS ---
  const totalTrades = localTrades.length;
  const netPnL = localTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winTrades = localTrades.filter(t => t.pnl > 0).length;
  const lossTrades = totalTrades - winTrades;
  const winRate = totalTrades ? Math.round((winTrades / totalTrades) * 100) : 0;
  
  // Helper to parse duration string to seconds
  const parseDurationToSeconds = (durationStr) => {
    if (!durationStr) return 0;
    let totalSeconds = 0;
    
    const hoursMatch = durationStr.match(/(\d+)h/);
    const minutesMatch = durationStr.match(/(\d+)m/);
    const secondsMatch = durationStr.match(/(\d+)s/);

    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);

    return totalSeconds;
  };

  // Helper to format seconds back to string
  const formatSecondsToDuration = (totalSeconds) => {
    if (totalSeconds === 0) return "0m";
    
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.round(totalSeconds % 60);

    let result = [];
    if (h > 0) result.push(`${h}h`);
    if (m > 0) result.push(`${m}m`);
    if (s > 0 && h === 0) result.push(`${s}s`); // Show seconds only if no hours (for brevity)
    
    return result.join(' ') || "0s";
  };

  const grossPnL = localTrades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(localTrades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  
  const totalDuration = useMemo(() => {
    if (localTrades.length === 0) return "0m";
    const totalSeconds = localTrades.reduce((acc, t) => acc + parseDurationToSeconds(t.duration), 0);
    return formatSecondsToDuration(totalSeconds);
  }, [localTrades]);

  const commissions = (totalTrades * 2.5).toFixed(2); // Simulated comms

  const pnlData = useMemo(() => {
    let cum = 0;
    const data = [{ trade: 0, pnl: 0 }]; // Start at 0
    localTrades.forEach((t, i) => {
      cum += t.pnl || 0;
      data.push({ trade: i + 1, pnl: cum });
    });
    return data;
  }, [localTrades]);

  // --- HANDLERS ---
  const handleInput = () => {
    if (editorRef.current) setIsEditorEmpty(editorRef.current.innerText.trim().length === 0);
  };

  const handleFormat = (command) => {
    document.execCommand(command, false, null);
    editorRef.current?.focus();
  };

  const insertTemplate = (text, color) => {
    if (editorRef.current) {
        editorRef.current.focus();
        // Add a leading break if the editor is not empty to start on a new line
        const leadingBreak = isEditorEmpty ? "" : "<div><br></div>";
        const html = `${leadingBreak}<div style="margin-top: 8px; margin-bottom: 8px;"><span style="color: ${color}; font-weight: 800; font-size: 1.1em; letter-spacing: 0.05em;">${text}</span></div><div><br></div>`;
        document.execCommand('insertHTML', false, html);
        handleInput(); 
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages([...images, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSelection = (item, list, setList) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const toggleRule = (index) => {
    const updatedRules = [...rules];
    updatedRules[index].followed = !updatedRules[index].followed;
    setRules(updatedRules);
  };

  const addRule = (e) => {
    if (e.key === 'Enter' && newRuleInput.trim() !== "") {
      setRules([...rules, { name: newRuleInput.trim(), followed: false }]);
      setNewRuleInput("");
    }
  };

  const removeRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const addNewCriteria = (e) => {
    if (e.key === 'Enter' && newCriteriaInput.trim() !== "") {
      const newTag = newCriteriaInput.trim();
      if (!availableCriteria.includes(newTag)) setAvailableCriteria([...availableCriteria, newTag]);
      if (!selectedCriteria.includes(newTag)) setSelectedCriteria([...selectedCriteria, newTag]);
      setNewCriteriaInput("");
    }
  };

  const handleTradeImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const parsed = await importTrades(file);
        // Filter for current date for local display if needed, 
        // but the context now holds ALL trades for the calendar.
        const todaysTrades = parsed.filter(t => t.date === dateKey);
        
        if (todaysTrades.length > 0) {
            setLocalTrades(prev => {
                 const existingIds = new Set(prev.map(t => t.id || t.ticket));
                 const uniqueNew = todaysTrades.filter(t => !existingIds.has(t.id || t.ticket));
                 return [...prev, ...uniqueNew];
            });
        }
        
        if (parsed.length > 0) {
            showNotification(`Imported ${parsed.length} trades. Calendar updated.`, "success");
        } else {
            showNotification("No valid trades found in CSV.", "error");
        }
    } catch (err) {
        console.error(err);
        showNotification("Error parsing CSV", "error");
    }
    
    e.target.value = null; // Reset input
  };

  const handleSave = async () => {
    if (saveStatus !== "idle") return;
    setSaveStatus("saving");
    const startTime = Date.now();
    
    try {
        const currentText = editorRef.current.innerHTML;
        const currentImages = [...images]; // Capture current images

        // 1. Save Journal Metadata (Keep text and images)
        const entryData = {
            html: currentText, 
            rating: disciplinePercentage, // Saving percentage in the rating field
            rules: rules,
            condition: marketCondition,
            moods: selectedMoods,
            setups: selectedCriteria,
            images: currentImages 
        };

        // 2. Update Linked Trades with Selected Setups AND Journal Note AND Images
        const updatedTrades = localTrades.map(trade => ({
            ...trade,
            setup: selectedCriteria.length > 0 ? selectedCriteria.join(", ") : trade.setup,
            journalNote: currentText, // Attach text
            journalImages: currentImages // Attach images
        }));

        // 3. Save ALL (Metadata + Trades)
        await saveDailyJournal(dateKey, entryData, updatedTrades, true);

        // Ensure at least 1.2 seconds of "saving" for professional feel
        const elapsed = Date.now() - startTime;
        if (elapsed < 1200) {
            await new Promise(resolve => setTimeout(resolve, 1200 - elapsed));
        }

        setSaveStatus("saved");
        setJustSaved(true); 

        // Show pop-up message AFTER saved state is reached
        if (showNotification) {
            showNotification("Journal saved!", "success");
        }

        // Revert to idle after 2 seconds
        setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
        console.error("Failed to save journal:", err);
        setSaveStatus("idle");
    }
  };

  return (
    <div className="bg-slate-50/50 dark:bg-transparent min-h-screen pb-12 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center gap-4">
               
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Journal your Day</h1>
                    {/* Date Navigation */}
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-100/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-md transition-colors">
                      <button onClick={() => changeDate(-1)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"><FaChevronLeft size={12}/></button>
                      <span className="min-w-[100px] text-center">{currentDate.toDateString()}</span>
                      <button onClick={() => changeDate(1)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"><FaChevronRight size={12}/></button>
                      <button onClick={() => setCurrentDate(new Date())} className="ml-1 hover:text-indigo-600 dark:hover:text-indigo-400" title="Go to Today"><FaCalendarDay size={12}/></button>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-2 mr-4 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                     <span className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase">Net P&L:</span>
                     <span className={`text-sm font-bold ${netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(2)}
                     </span>
                 </div>
                 <button 
                    onClick={handleSave}
                    disabled={saveStatus !== "idle"}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg min-w-[140px] justify-center ${
                        saveStatus === "saving" ? "bg-slate-700 dark:bg-slate-800 text-white cursor-wait" : 
                        saveStatus === "saved" ? "bg-emerald-500 text-white shadow-emerald-200 dark:shadow-none" : 
                        "bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white shadow-slate-200 dark:shadow-none active:scale-95"
                    }`}
                 >
                    {saveStatus === "saving" ? (
                        <><FaCircleNotch className="animate-spin" /> Saving...</>
                    ) : saveStatus === "saved" ? (
                        <><FaCheck className="animate-bounce" /> Saved!</>
                    ) : (
                        <><FaSave /> Save Entry</>
                    )}
                 </button>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* --- TOP ROW: CHART & SCORECARD --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1. Scorecard & Key Stats (Span 4) */}
            <Card className="lg:col-span-4 p-6 flex flex-col justify-between bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <FaStar className="text-amber-400" /> Session Discipline
                    </h3>
                    
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                            <span className="text-4xl font-extrabold text-slate-800 dark:text-white">{disciplinePercentage}%</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">Rules Followed</span>
                        </div>
                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${disciplinePercentage >= 80 ? 'bg-emerald-500' : disciplinePercentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${disciplinePercentage}%` }}
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5">Total Duration</span>
                            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{totalDuration}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5">Win Rate</span>
                            <span className={`text-lg font-bold ${winRate >= 50 ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>{winRate}%</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5">Total Trades</span>
                            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{totalTrades}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5">Commissions</span>
                            <span className="text-lg font-bold text-rose-500">-${commissions}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 2. Main PnL Chart (Span 8) */}
            <Card className="lg:col-span-8 p-6 flex flex-col bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
                <div className="flex justify-between items-center mb-2">
                     <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
                        <FaChartLine className="text-indigo-500" /> Intraday Performance
                     </h3>
                     <Badge color={netPnL >= 0 ? "emerald" : "rose"}>{netPnL >= 0 ? "Profitable Session" : "Red Day"}</Badge>
                </div>
                
                <div className="flex-1 w-full h-[220px]">
                     {totalTrades > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={pnlData}>
                            <defs>
                                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={netPnL >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={netPnL >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                            <XAxis dataKey="trade" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', color: theme === 'dark' ? '#ffffff' : '#000000' }}
                                formatter={(value) => [`$${value}`, "Net PnL"]}
                            />
                            <ReferenceLine y={0} stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} strokeDasharray="3 3" />
                            <Area 
                                type="monotone" 
                                dataKey="pnl" 
                                stroke={netPnL >= 0 ? "#10b981" : "#f43f5e"} 
                                strokeWidth={2} 
                                fill="url(#colorPnL)" 
                                animationDuration={1000}
                            />
                            </AreaChart>
                        </ResponsiveContainer>
                     ) : (
                         <div className="flex items-center justify-center h-full text-slate-300 dark:text-slate-700 italic text-sm">
                             No trades executed today
                         </div>
                     )}
                </div>
            </Card>
        </div>

        {/* --- MIDDLE ROW: SPLIT JOURNAL & CONTEXT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

             {/* LEFT: JOURNAL EDITOR (Span 2) */}
            <div className="lg:col-span-2 space-y-6">
                
                <Card className="flex flex-col min-h-[600px] overflow-hidden shadow-lg border-slate-200 dark:border-slate-800 ring-1 ring-slate-100 dark:ring-slate-900 bg-white dark:bg-slate-900 transition-colors">
                    {/* Professional Toolbar */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-2 flex flex-wrap items-center gap-2 sticky top-0 z-10">
                         {/* Formatting Group */}
                         <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
                             {[
                                { cmd: 'bold', icon: <FaBold />, title: "Bold" },
                                { cmd: 'italic', icon: <FaItalic />, title: "Italic" },
                                { cmd: 'underline', icon: <FaUnderline />, title: "Underline" },
                             ].map((item) => (
                                 <button 
                                    key={item.cmd} 
                                    onMouseDown={(e) => {e.preventDefault(); handleFormat(item.cmd)}} 
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400 transition-colors"
                                    title={item.title}
                                 >
                                     {item.icon}
                                 </button>
                             ))}
                             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                             <button 
                                onMouseDown={(e) => {e.preventDefault(); handleFormat('insertUnorderedList')}} 
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400 transition-colors"
                                title="Bullet List"
                             >
                                <FaListUl />
                             </button>
                         </div>

                         {/* Media Group */}
                         <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
                             <button 
                                onClick={() => fileInputRef.current.click()} 
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400 transition-colors"
                                title="Upload Image"
                             >
                                <FaImage />
                             </button>
                             <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                         </div>
                         
                         <div className="flex-1"></div>

                         {/* Quick Templates */}
                         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">Templates:</span>
                             {tradingTemplates.map((t, idx) => (
                                 <button 
                                    key={idx} 
                                    onClick={() => insertTemplate(t.text, t.color)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition-all whitespace-nowrap"
                                 >
                                     <span>{t.icon}</span>
                                     <span>{t.label}</span>
                                 </button>
                             ))}
                         </div>
                    </div>

                    {/* Editor Area */}
                    <div className="relative flex-1 bg-white dark:bg-slate-900 cursor-text" onClick={() => editorRef.current?.focus()}>
                        <div
                            ref={editorRef}
                            contentEditable={true}
                            spellCheck={false}
                            onInput={handleInput}
                            className="w-full h-full p-8 outline-none text-slate-700 dark:text-slate-300 text-lg leading-8 font-serif transition-colors"
                            style={{ minHeight: '400px' }}
                        />
                        {isEditorEmpty && (
                            <div className="absolute top-8 left-8 text-slate-300 dark:text-slate-700 text-lg font-serif italic pointer-events-none select-none">
                                Start typing your daily review... <br/>
                                <span className="text-sm not-italic text-slate-300/70 dark:text-slate-700/70 mt-2 block font-sans">
                                    💡 Tip: Use templates to structure your thoughts.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Image Preview Strip (Improved) */}
                    {images.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 p-4 transition-colors">
                            <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 ml-1">Attached Evidence</h5>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative group flex-shrink-0">
                                        <div className="w-32 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                                            <img src={img} alt="Evidence" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg pointer-events-none" />
                                        <button 
                                            onClick={() => setImages(images.filter((_, i) => i !== idx))} 
                                            className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 text-rose-500 border border-slate-200 dark:border-slate-700 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                            title="Remove Image"
                                        >
                                            <FaTimes size={10}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Trades Table */}
                <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase">Session Draft (Not Saved)</h3>
                            <button 
                                onClick={() => tradeFileInputRef.current?.click()}
                                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2.5 py-1 rounded transition"
                            >
                                + Import CSV
                            </button>
                            <input 
                                type="file" 
                                ref={tradeFileInputRef} 
                                onChange={handleTradeImport} 
                                className="hidden" 
                                accept=".csv" 
                            />
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{totalTrades} Trades in Draft</span>
                    </div>
                    {totalTrades === 0 ? (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-600 text-sm italic">No trades recorded for this session.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Symbol</th>
                                        <th className="px-6 py-3 text-left">Side</th>
                                        <th className="px-6 py-3 text-left">Entries/Exits</th>
                                        <th className="px-6 py-3 text-right">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {localTrades.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                                            <td className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">{t.pair}</td>
                                            <td className="px-6 py-3">
                                                <Badge color={t.type === 'Long' ? 'emerald' : 'rose'}>{t.type}</Badge>
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono">{t.entry}</span> 
                                                    <span className="text-xs text-slate-300 dark:text-slate-700">➜</span> 
                                                    <span className="font-mono">{t.exit}</span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-3 text-right font-mono font-bold ${t.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                {t.pnl >= 0 ? "+" : "-"}${Math.abs(t.pnl).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            {/* RIGHT: CONTEXT SIDEBAR (Span 1) */}
            <div className="space-y-6">
                
                {/* 1. Market Conditions */}
                <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
                    <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <FaThermometerHalf /> Market Condition
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                        {conditionOptions.map(cond => (
                            <button
                                key={cond}
                                onClick={() => setMarketCondition(cond)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${marketCondition === cond ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                            >
                                {cond}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* 2. Rules Checklist */}
                <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
                    <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <FaBrain /> Rules Checklist
                    </h4>
                    {/* Rules Checklist */}
                    <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {rules.map((rule, idx) => (
                            <div key={idx} className="flex items-center justify-between group">
                                <label className="flex items-center gap-3.5 cursor-pointer flex-1">
                                    <input 
                                        type="checkbox" 
                                        checked={rule.followed} 
                                        onChange={() => toggleRule(idx)}
                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
                                    />
                                    <span className={`text-base transition-colors ${rule.followed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {rule.name}
                                    </span>
                                </label>
                                <button 
                                    onClick={() => removeRule(idx)}
                                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1.5"
                                >
                                    <FaTimes size={12} />
                                </button>
                            </div>
                        ))}
                        <div className="pt-3">
                            <input 
                                type="text"
                                value={newRuleInput}
                                onChange={(e) => setNewRuleInput(e.target.value)}
                                onKeyDown={addRule}
                                placeholder="+ Add new rule..."
                                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-300"
                            />
                        </div>
                    </div>
                </Card>

                {/* 3. Setup Tags */}
                <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 transition-colors">
                    <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <FaTag /> Setup Criteria
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                        {availableCriteria.map((c, i) => (
                            <button
                                key={i}
                                onClick={() => toggleSelection(c, selectedCriteria, setSelectedCriteria)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md border transition ${selectedCriteria.includes(c) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                {c}
                            </button>
                        ))}
                        <input 
                            type="text" 
                            placeholder="+ Add" 
                            value={newCriteriaInput}
                            onChange={(e) => setNewCriteriaInput(e.target.value)}
                            onKeyDown={addNewCriteria}
                            className="px-3 py-1.5 text-xs w-20 focus:w-auto transition-all bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-indigo-500 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-700 dark:text-slate-300"
                        />
                    </div>
                </Card>

            </div>
        </div>

      </div>

      {/* --- FOOTER --- */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-slate-200 mt-12 flex flex-col md:flex-row justify-between items-center text-slate-400 text-base">
           <div>© {new Date().getFullYear()} MyJournal Pro. <span className="hidden md:inline">Built for performance.</span></div>
           <div className="flex gap-8 mt-6 md:mt-0">
               <FaTwitter size={20} className="hover:text-sky-500 cursor-pointer transition" />
               <FaDiscord size={20} className="hover:text-indigo-500 cursor-pointer transition" />
               <FaGlobe size={20} className="hover:text-slate-600 cursor-pointer transition" />
           </div>
      </footer>
    </div>
  );
}
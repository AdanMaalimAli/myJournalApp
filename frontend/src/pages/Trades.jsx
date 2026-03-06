import React, { useState, useMemo } from "react";
import { 
  FaSearch, FaFilter, FaTwitter, FaGlobe, FaDiscord, 
  FaArrowUp, FaArrowDown, FaCalendarAlt, FaEye, FaEdit, FaTrash, 
  FaChevronLeft, FaChevronRight, FaChevronDown, FaFileCsv, FaPlus, FaChartLine, FaFileDownload, FaTimes
} from "react-icons/fa";
import { useTrades } from "../context/TradeContext";
import Modal from "../components/Modal";

export default function TradesHistory() {
  const { realTrades, isLive, isDemo, resetDatabase, journalData } = useTrades();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrade, setSelectedTrade] = useState(null); // For Modal
  
  const itemsPerPage = 10;
  
  const tradesToDisplay = useMemo(() => {
    if (!isLive) return [];
    // Show archived trades even if performance is in demo mode
    return realTrades.filter(trade => {
      const hasJournalData = journalData && journalData[trade.date];
      return trade.journalNote || trade.setup || hasJournalData;
    });
  }, [realTrades, isLive, journalData]);

  const groupedTrades = useMemo(() => {
    const groups = {};
    
    // Sort all trades by date descending first to ensure consistency
    const sortedTrades = [...tradesToDisplay].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedTrades.forEach(trade => {
      if (!groups[trade.date]) {
        groups[trade.date] = {
          date: trade.date,
          trades: [],
          totalPnL: 0,
          totalLots: 0,
          pairs: new Set(),
          winCount: 0,
          lossCount: 0
        };
      }
      groups[trade.date].trades.push(trade);
      groups[trade.date].totalPnL += trade.pnl;
      groups[trade.date].totalLots += trade.lots;
      groups[trade.date].pairs.add(trade.pair);
      if (trade.pnl >= 0) groups[trade.date].winCount++;
      else groups[trade.date].lossCount++;
    });

    return Object.values(groups).filter(group => {
      const matchesSearch = Array.from(group.pairs).some(pair => pair.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const hasLongs = group.trades.some(t => t.type === "BUY" || t.type === "Long");
      const hasShorts = group.trades.some(t => t.type === "SELL" || t.type === "Short");
      const matchesType = filterType === "All" || 
                         (filterType === "Long" && hasLongs) ||
                         (filterType === "Short" && hasShorts);
      
      const status = group.totalPnL >= 0 ? "Win" : "Loss";
      const matchesStatus = filterStatus === "All" || status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [tradesToDisplay, searchTerm, filterType, filterStatus]);

  const [expandedDays, setExpandedDays] = useState({});

  const toggleDay = (date) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const totalPages = Math.ceil(groupedTrades.length / itemsPerPage);
  const currentData = groupedTrades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Stats derived from the filtered groups
  const totalPnL = parseFloat(groupedTrades.reduce((acc, group) => acc + group.totalPnL, 0).toFixed(2));
  const totalTradesCount = groupedTrades.reduce((acc, group) => acc + group.trades.length, 0);
  const avgPnL = totalTradesCount > 0 
    ? (totalPnL / totalTradesCount)
    : 0;

  const stripHtml = (html) => {
     let tmp = document.createElement("DIV");
     tmp.innerHTML = html || "";
     return tmp.textContent || tmp.innerText || "";
  };

  // --- REPORT GENERATION ---
  const downloadReport = (trade) => {
    if (!trade) return;
    const journalEntry = journalData ? journalData[trade.date] : null;

    const notes = trade.journalNote ? stripHtml(trade.journalNote) : (journalEntry ? stripHtml(journalEntry.html) : "No journal entry recorded for this date.");
    const rating = journalEntry?.rating ? `${journalEntry.rating}/5` : "N/A";
    const condition = journalEntry?.condition || "N/A";
    const moods = journalEntry?.moods && journalEntry.moods.length > 0 ? journalEntry.moods.join(", ") : "None";
    const mistakes = journalEntry?.mistakes && journalEntry.mistakes.length > 0 ? journalEntry.mistakes.join(", ") : "None";

    const content = `TRADING REPORT
================================================
DATE:       ${trade.date}
TICKET:     ${trade.id}
================================================

--- TRADE DETAILS ---
Symbol:     ${trade.pair}
Type:       ${trade.type}
Size:       ${trade.lots} Lots
Entry:      ${trade.entry}
Exit:       ${trade.exit}
P&L:        $${trade.pnl.toFixed(2)}
ROI:        ${trade.roi}%
Result:     ${trade.pnl >= 0 ? 'WIN' : 'LOSS'}

--- SESSION CONTEXT ---
Rating:     ${rating}
Condition:  ${condition}
Psychology: ${moods}
Mistakes:   ${mistakes}

--- JOURNAL NOTES ---
${notes}
================================================
Generated by MyJournal Pro
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Report_${trade.date}_${trade.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-50/50 min-h-screen font-sans text-slate-800 min-w-0 w-full overflow-x-hidden">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Trade History</h1>
              <p className="text-xs text-slate-500">
                {isDemo ? "Viewing demo history. Import your data to see real stats." : (realTrades.length > 0 ? "Database of all executed positions grouped by day" : "No trades found. Go to Daily Journal to import your data.")}
              </p>
            </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* SUMMARY STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total P&L</div>
                    <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className={`p-3 rounded-full ${totalPnL >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                   {totalPnL >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Trades</div>
                    <div className="text-2xl font-bold text-slate-800">{totalTradesCount}</div>
                </div>
                <div className="p-3 rounded-full bg-indigo-50 text-indigo-600"><FaFilter /></div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                      Avg P&L
                    </div>
                    <div className={`text-2xl font-bold ${avgPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {avgPnL >= 0 ? '+' : ''}${avgPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className={`p-3 rounded-full ${avgPnL >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {avgPnL >= 0 ? <FaArrowUp /> : <FaChartLine />}
                </div>
            </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="relative w-full lg:w-96">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search Pair..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <select 
                    className="bg-white border border-slate-200 text-slate-700 text-sm py-2 px-3 rounded-lg outline-none hover:bg-slate-50 transition"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="All">All Sides</option>
                    <option value="Long">Long</option>
                    <option value="Short">Short</option>
                </select>
                <select 
                    className="bg-white border border-slate-200 text-slate-700 text-sm py-2 px-3 rounded-lg outline-none hover:bg-slate-50 transition"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="All">All Results</option>
                    <option value="Win">Winners</option>
                    <option value="Loss">Losers</option>
                </select>
            </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/80">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Instruments</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total Lots</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Trades</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Result</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {currentData.length > 0 ? (
                            currentData.map((day) => (
                                <React.Fragment key={day.date}>
                                <tr className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => toggleDay(day.date)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            {expandedDays[day.date] ? <FaChevronDown className="text-slate-300" size={10} /> : <FaChevronRight className="text-slate-300" size={10} />}
                                            {day.date}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-1">
                                            {Array.from(day.pairs).map(pair => (
                                                <span key={pair} className="text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{pair}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">{day.totalLots.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold">{day.winCount}W</span>
                                            <span className="text-slate-300">-</span>
                                            <span className="text-rose-600 font-bold">{day.lossCount}L</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className={`text-sm font-bold font-mono ${day.totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{day.totalPnL >= 0 ? '+' : ''}${day.totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); toggleDay(day.date); }} 
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 transition" 
                                                title="Toggle Details"
                                            >
                                                <FaEye />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedDays[day.date] && (
                                    <tr>
                                        <td colSpan="6" className="bg-slate-50/50 px-6 py-4">
                                            <div className="space-y-2">
                                                {day.trades.map(trade => (
                                                    <div key={trade.id} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center text-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-1 h-8 rounded-full ${(trade.type === 'BUY' || trade.type === 'Long') ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                            <div>
                                                                <div className="font-bold text-slate-800">{trade.pair} <span className="text-[10px] font-normal text-slate-400 ml-2">{trade.type} • {trade.lots} Lots</span></div>
                                                                <div className="text-xs text-slate-500 font-mono">{trade.entry.toFixed(2)} ➜ {trade.exit.toFixed(2)}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <div className={`font-bold font-mono ${trade.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}</div>
                                                                <div className="text-[10px] text-slate-400">{trade.roi.toFixed(2)}% ROI</div>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => setSelectedTrade(trade)} className="p-1 text-slate-400 hover:text-indigo-600"><FaEye size={12}/></button>
                                                                <button onClick={() => downloadReport(trade)} className="p-1 text-slate-400 hover:text-indigo-600"><FaFileDownload size={12}/></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center text-slate-400">No trades found. Please import your CSV file.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                    Showing <span className="font-bold text-slate-700">{groupedTrades.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, groupedTrades.length)}</span> days
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    ><FaChevronLeft size={12} /></button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    ><FaChevronRight size={12} /></button>
                </div>
            </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 pt-8 border-t border-slate-200">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">MyJournal Pro</h4>
                    <p className="text-xs text-slate-500 mt-1">© {new Date().getFullYear()} All rights reserved.</p>
                </div>
                <div className="flex gap-4 text-slate-400">
                    <button className="hover:text-sky-500 transition"><FaTwitter size={18} /></button>
                    <button className="hover:text-indigo-500 transition"><FaDiscord size={18} /></button>
                    <button className="hover:text-slate-600 transition"><FaGlobe size={18} /></button>
                </div>
            </div>
        </footer>

      </div>

      {/* --- TRADE DETAILS MODAL --- */}
      {selectedTrade && (
        <Modal onClose={() => setSelectedTrade(null)}>
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Trade Details</h2>
                        <p className="text-sm text-slate-500">{selectedTrade.date} • {selectedTrade.pair}</p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                        <span className="text-xs text-slate-400 uppercase font-bold">Type</span>
                        <div className={`font-bold ${selectedTrade.type === 'Buy' || selectedTrade.type === 'BUY' ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedTrade.type}</div>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 uppercase font-bold">Result</span>
                        <div className={`font-bold ${selectedTrade.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                             {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 uppercase font-bold">Entry</span>
                        <div className="font-mono text-slate-700">{selectedTrade.entry}</div>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 uppercase font-bold">Exit</span>
                        <div className="font-mono text-slate-700">{selectedTrade.exit}</div>
                    </div>
                </div>

                {/* Journal Context */}
                {journalData && journalData[selectedTrade.date] ? (
                    <div className="space-y-3">
                         <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Journal Context</h3>
                         <div className="font-serif">
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                <div>
                                    <span className="text-xs text-slate-400 block font-sans">Rating</span>
                                    <span className="text-sm font-semibold text-slate-700">{journalData[selectedTrade.date].rating || 0}/5</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 block font-sans">Condition</span>
                                    <span className="text-sm font-semibold text-slate-700">{journalData[selectedTrade.date].condition || "N/A"}</span>
                                </div>
                            </div>
                            <div className="mb-2">
                                <span className="text-xs text-slate-400 block mb-1 font-sans">Mistakes</span>
                                <div className="flex flex-wrap gap-1 font-sans">
                                    {journalData[selectedTrade.date].mistakes && journalData[selectedTrade.date].mistakes.length > 0 ? 
                                        journalData[selectedTrade.date].mistakes.map(m => <span key={m} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] rounded">{m}</span>)
                                        : <span className="text-xs text-slate-400 italic">None recorded</span>
                                    }
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 block mb-1 font-sans">Notes</span>
                                <div className="text-sm text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-16 overflow-y-auto custom-scrollbar">
                                    "{selectedTrade.journalNote ? stripHtml(selectedTrade.journalNote) : (journalData[selectedTrade.date].html ? stripHtml(journalData[selectedTrade.date].html) : "No notes recorded.")}"
                                </div>
                            </div>

                            {/* Images Display */}
                            {(selectedTrade.journalImages?.length > 0 || journalData[selectedTrade.date].images?.length > 0) && (
                                <div className="mt-2">
                                    <span className="text-xs text-slate-400 block mb-1 font-sans">Attached Evidence</span>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {(selectedTrade.journalImages || journalData[selectedTrade.date].images || []).map((img, idx) => (
                                            <div key={idx} className="w-20 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white shrink-0">
                                                <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </div>
                    </div>
                ) : (
                    <div className="p-3 bg-slate-50 rounded-lg text-center text-sm text-slate-400 italic border border-dashed border-slate-200">
                        No journal entry found for this date.
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={() => downloadReport(selectedTrade)}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-200"
                    >
                        <FaFileDownload /> Report
                    </button>
                    <button 
                        onClick={() => setSelectedTrade(null)}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
      )}

    </div>
  );
}
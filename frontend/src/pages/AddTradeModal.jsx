import React, { useState, useRef } from "react";
import { FaTimes, FaCloudUploadAlt, FaFileCsv, FaInfoCircle } from "react-icons/fa";
import { useTrades } from "../context/TradeContext";

export default function AddTradeModal({ isOpen, onClose }) {
  const { importTrades } = useTrades(); // Pull function from context
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      // Execute the import logic from context
      await importTrades(file);
      
      // Artificial delay for UX "feel"
      setTimeout(() => {
        setIsUploading(false);
        setFile(null);
        onClose();
      }, 600);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to parse CSV. Please check the file format.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Import CSV</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Dropzone */}
          <div 
            onClick={() => fileInputRef.current.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
              file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-indigo-400'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={(e) => setFile(e.target.files[0])} 
            />
            <div className={`p-4 rounded-full mb-3 ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              {file ? <FaFileCsv size={30} /> : <FaCloudUploadAlt size={30} />}
            </div>
            <p className="text-sm font-bold text-slate-700">{file ? file.name : "Select Broker CSV"}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl flex gap-3 italic">
             <FaInfoCircle className="text-blue-500 shrink-0" />
             <p className="text-[11px] text-blue-700 leading-tight">Supported: MT4, MT5, and FTMO exports. Ensure headers are visible.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600">
            Cancel
          </button>
          <button 
            onClick={handleImport} 
            disabled={!file || isUploading}
            className={`flex-1 py-3 text-sm font-bold rounded-xl shadow-lg transition-all ${
              file ? 'bg-slate-900 text-white active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isUploading ? "Processing..." : "Import Trades"}
          </button>
        </div>
        
      </div>
    </div>
  );
}

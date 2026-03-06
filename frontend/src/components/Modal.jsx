function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal box */}
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md z-10 shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}

export default Modal;

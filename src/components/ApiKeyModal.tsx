import { useState } from 'react';
import { getSavedApiKey, saveApiKey } from '../services/aiService';

interface Props { onClose: () => void }

export default function ApiKeyModal({ onClose }: Props) {
  const [key, setKey]     = useState(getSavedApiKey);
  const [saved, setSaved] = useState(false);
  const hasKey = getSavedApiKey().length > 0;

  const handleSave = () => {
    saveApiKey(key);
    setSaved(true);
    setTimeout(onClose, 700);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-white font-extrabold text-lg">🔑 Groq API-nyckel</h2>
            <p className="text-slate-400 text-xs mt-0.5">Krävs för AI-måltidsförslag</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-700 transition-all">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {hasKey && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <span className="text-emerald-500 text-lg">✓</span>
              <span className="text-sm font-semibold text-emerald-700">En API-nyckel är sparad</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              API-nyckel
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setSaved(false); }}
              placeholder="gsk_..."
              className="w-full border-2 border-slate-100 focus:border-emerald-400 rounded-2xl px-4 py-3 text-sm font-mono bg-slate-50 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300"
            />
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Groq är <strong className="text-slate-600">gratis</strong>. Hämta din nyckel på{' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
              className="text-emerald-600 font-semibold hover:underline">
              console.groq.com/keys
            </a>
            . Nyckeln sparas bara i din webbläsare.
          </p>

          <button
            onClick={handleSave}
            disabled={!key.trim() || saved}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-2xl py-3.5 font-extrabold text-sm shadow-lg shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {saved ? '✓ Sparad!' : 'Spara nyckel'}
          </button>
        </div>
      </div>
    </div>
  );
}

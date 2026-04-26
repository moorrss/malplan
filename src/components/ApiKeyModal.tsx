import { useState } from 'react';
import { getSavedApiKey, saveApiKey } from '../services/aiService';

interface Props {
  onClose: () => void;
}

export default function ApiKeyModal({ onClose }: Props) {
  const [key, setKey] = useState(getSavedApiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveApiKey(key);
    setSaved(true);
    setTimeout(onClose, 800);
  };

  const hasKey = getSavedApiKey().length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">🔑 Groq API-nyckel</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500">
            AI-förslagen använder Groq (gratis). Nyckeln sparas lokalt i din webbläsare och
            skickas aldrig vidare.
          </p>

          {hasKey && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700">
              ✓ En API-nyckel är sparad
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1.5">
              API-nyckel
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setSaved(false); }}
              placeholder="gsk_..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-300 placeholder:text-slate-300"
            />
          </div>

          <p className="text-xs text-slate-400">
            Skaffa en gratis nyckel på{' '}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              console.groq.com/keys
            </a>
          </p>

          <button
            onClick={handleSave}
            disabled={!key.trim() || saved}
            className="w-full bg-green-500 text-white rounded-xl py-3 font-medium hover:bg-green-600 disabled:opacity-40 transition-all"
          >
            {saved ? '✓ Sparad!' : 'Spara nyckel'}
          </button>
        </div>
      </div>
    </div>
  );
}

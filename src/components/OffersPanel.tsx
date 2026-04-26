import { useState, useEffect } from 'react';
import type { Offer } from '../types';
import { getOffersForStores, getAvailableStores, type StoreKey } from '../services/offerService';

interface Props {
  onOffersLoaded?: (offers: Offer[]) => void;
}

export default function OffersPanel({ onOffersLoaded }: Props) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStores, setSelectedStores] = useState<StoreKey[]>(['lidl', 'willys']);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const stores = getAvailableStores();

  const toggleStore = (key: StoreKey) => {
    setSelectedStores((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const fetchOffers = async () => {
    if (selectedStores.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const data = await getOffersForStores(selectedStores);
      setOffers(data);
      onOffersLoaded?.(data);
      if (data.length === 0) setError('Inga erbjudanden hittades just nu. Prova igen senare.');
    } catch {
      setError('Kunde inte hämta erbjudanden. Kontrollera din internetanslutning.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = offers.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      o.productName.toLowerCase().includes(q) ||
      o.description.toLowerCase().includes(q) ||
      o.store.toLowerCase().includes(q)
    );
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Veckans erbjudanden</h2>
        <button
          onClick={fetchOffers}
          disabled={loading}
          className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
        >
          {loading ? 'Laddar...' : '↻ Uppdatera'}
        </button>
      </div>

      {/* Välj butiker */}
      <div>
        <p className="text-xs text-slate-500 mb-2 font-medium">Butiker</p>
        <div className="flex flex-wrap gap-2">
          {stores.map((s) => (
            <button
              key={s.key}
              onClick={() => toggleStore(s.key as StoreKey)}
              className={`text-sm px-3 py-1.5 rounded-xl border font-medium transition-all ${
                selectedStores.includes(s.key as StoreKey)
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-green-300'
              }`}
            >
              {s.logo} {s.name}
            </button>
          ))}
        </div>
        <button
          onClick={fetchOffers}
          disabled={loading || selectedStores.length === 0}
          className="mt-2 w-full bg-slate-800 text-white rounded-xl py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-40 transition-all"
        >
          {loading ? 'Hämtar erbjudanden...' : 'Hämta erbjudanden'}
        </button>
      </div>

      {/* Sök */}
      {offers.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrera erbjudanden..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      )}

      {/* Fel */}
      {error && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Erbjudandekort */}
      <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
        {loading && (
          <div className="text-center py-8 text-slate-400 text-sm">Hämtar veckans erbjudanden...</div>
        )}
        {!loading && filtered.map((offer) => (
          <div key={offer.id} className="border border-slate-100 rounded-xl p-4 hover:border-green-200 hover:bg-green-50/30 transition-all">
            <div className="flex gap-3">
              {offer.imageUrl && (
                <img
                  src={offer.imageUrl}
                  alt={offer.productName}
                  className="w-16 h-16 object-cover rounded-lg shrink-0 bg-slate-100"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{offer.productName}</p>
                  {offer.price && (
                    <span className="text-sm font-bold text-green-600 shrink-0">{offer.price}</span>
                  )}
                </div>
                {offer.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{offer.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {offer.storeLogo} {offer.store}
                  </span>
                  <span className="text-xs text-slate-400">
                    t.o.m. {formatDate(offer.validTo)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading && offers.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Inga erbjudanden matchar sökningen</p>
        )}
      </div>
    </div>
  );
}

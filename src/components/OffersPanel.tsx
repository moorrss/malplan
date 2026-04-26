import { useState, useEffect } from 'react';
import type { Offer } from '../types';
import {
  getOffersForStores,
  getStoresByCategory,
  getCategoryLabel,
  FOOD_STORE_KEYS,
  type StoreKey,
} from '../services/offerService';

interface Props {
  onOffersLoaded?: (offers: Offer[]) => void;
}

export default function OffersPanel({ onOffersLoaded }: Props) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStores, setSelectedStores] = useState<StoreKey[]>(FOOD_STORE_KEYS.slice(0, 6));
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['mat', 'stormarknad']));

  const storesByCategory = getStoresByCategory();

  const toggleStore = (key: StoreKey) => {
    setSelectedStores((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  };

  const toggleCategory = (cat: string) => {
    const keys = storesByCategory[cat].map((s) => s.key);
    const allSelected = keys.every((k) => selectedStores.includes(k));
    if (allSelected) {
      setSelectedStores((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setSelectedStores((prev) => [...new Set([...prev, ...keys])]);
    }
  };

  const fetchOffers = async () => {
    if (selectedStores.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const data = await getOffersForStores(selectedStores);
      setOffers(data);
      onOffersLoaded?.(data);
      if (data.length === 0) setError('Inga erbjudanden hittades just nu. Prova fler butiker eller kom tillbaka senare.');
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
    return !q || o.productName.toLowerCase().includes(q) || o.description.toLowerCase().includes(q) || o.store.toLowerCase().includes(q);
  });

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }); }
    catch { return iso; }
  };

  return (
    <div className="space-y-4">
      {/* Butiksväljare */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Välj butiker</h2>
          <button
            onClick={fetchOffers}
            disabled={loading || selectedStores.length === 0}
            className="text-sm bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 disabled:opacity-40 font-medium transition-all"
          >
            {loading ? 'Hämtar...' : '↻ Hämta erbjudanden'}
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(storesByCategory).map(([cat, stores]) => {
            const keys = stores.map((s) => s.key);
            const allSelected = keys.every((k) => selectedStores.includes(k));
            const someSelected = keys.some((k) => selectedStores.includes(k));
            const isExpanded = expandedCats.has(cat);

            return (
              <div key={cat} className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCats((prev) => {
                    const next = new Set(prev);
                    isExpanded ? next.delete(cat) : next.add(cat);
                    return next;
                  })}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">{getCategoryLabel(cat)}</span>
                    {someSelected && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {keys.filter((k) => selectedStores.includes(k)).length}/{keys.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
                        allSelected ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {allSelected ? 'Avmarkera alla' : 'Välj alla'}
                    </button>
                    <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3 flex flex-wrap gap-2">
                    {stores.map((store) => (
                      <button
                        key={store.key}
                        onClick={() => toggleStore(store.key)}
                        className={`text-sm px-3 py-1.5 rounded-xl border font-medium transition-all ${
                          selectedStores.includes(store.key)
                            ? 'bg-green-500 text-white border-green-500 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-green-300'
                        }`}
                      >
                        {store.logo} {store.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 text-center">
          Data från ereklamblad.se via Tjek API · {selectedStores.length} butiker valda
        </p>
      </div>

      {/* Erbjudandelista */}
      {(offers.length > 0 || loading || error) && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Veckans erbjudanden
              {offers.length > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length} st)</span>
              )}
            </h2>
          </div>

          {offers.length > 0 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök produkt, butik..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 placeholder:text-slate-300"
            />
          )}

          {error && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-2 max-h-[36rem] overflow-y-auto pr-1">
            {loading && (
              <div className="text-center py-12 text-slate-400">
                <div className="text-2xl mb-2 animate-pulse">🛒</div>
                <p className="text-sm">Hämtar veckans erbjudanden...</p>
              </div>
            )}
            {!loading && filtered.map((offer) => (
              <div
                key={offer.id}
                className="border border-slate-100 rounded-xl p-4 hover:border-green-200 hover:bg-green-50/30 transition-all"
              >
                <div className="flex gap-3">
                  {offer.imageUrl && (
                    <img
                      src={offer.imageUrl}
                      alt={offer.productName}
                      className="w-14 h-14 object-cover rounded-lg shrink-0 bg-slate-100"
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
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {offer.storeLogo} {offer.store}
                      </span>
                      <span className="text-xs text-slate-400">t.o.m. {formatDate(offer.validTo)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!loading && offers.length > 0 && filtered.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Inga erbjudanden matchar sökningen</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

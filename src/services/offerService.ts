import type { Offer } from '../types';

const BASE_URL = 'https://squid-api.tjek.com';

export interface StoreInfo {
  key: string;
  publicId: string;
  name: string;
  logo: string;
  category: 'mat' | 'stormarknad' | 'apotek' | 'bygg' | 'övrigt';
}

// Svenska butiker via ereklamblad.se / Tjek API
export const STORES: StoreInfo[] = [
  // Mat & Dagligvaror
  { key: 'ica_supermarket', publicId: '1d1dvA', name: 'ICA Supermarket',       logo: '🔴', category: 'mat' },
  { key: 'ica_nara',        publicId: '20d4lA', name: 'ICA Nära',              logo: '🔴', category: 'mat' },
  { key: 'ica_kvantum',     publicId: '9cb4wA', name: 'ICA Kvantum',           logo: '🔴', category: 'mat' },
  { key: 'ica_maxi',        publicId: 'ca802A', name: 'ICA Maxi Stormarknad',  logo: '🔴', category: 'stormarknad' },
  { key: 'hemkop',          publicId: 'd9b6XA', name: 'Hemköp',                logo: '🟢', category: 'mat' },
  { key: 'coop',            publicId: '63eeoD', name: 'Coop',                  logo: '🟣', category: 'mat' },
  { key: 'coop_forum',      publicId: '6182VA', name: 'Coop Forum',            logo: '🟣', category: 'stormarknad' },
  { key: 'coop_extra',      publicId: '5fa5aA', name: 'Coop Extra',            logo: '🟣', category: 'mat' },
  { key: 'coop_konsum',     publicId: 'b9ceQA', name: 'Coop Konsum',           logo: '🟣', category: 'mat' },
  { key: 'coop_nara',       publicId: 'aed8FA', name: 'Coop Nära',             logo: '🟣', category: 'mat' },
  { key: 'city_gross',      publicId: 'bfe5hA', name: 'City Gross',            logo: '🔵', category: 'stormarknad' },
  { key: 'lidl',            publicId: '03a7b3', name: 'Lidl',                  logo: '🟡', category: 'mat' },
  { key: 'dollarstore',     publicId: '0a6emU', name: 'DollarStore',           logo: '🟠', category: 'mat' },
  // Apotek
  { key: 'apoteket',        publicId: 'n7SXGd', name: 'Apoteket',              logo: '🏥', category: 'apotek' },
  { key: 'apotek_hjartat',  publicId: 'ptz-9S', name: 'Apotek Hjärtat',        logo: '💊', category: 'apotek' },
  { key: 'apohem',          publicId: 'lsjmBn', name: 'Apohem',                logo: '💊', category: 'apotek' },
  // Bygg & Järn
  { key: 'bauhaus',         publicId: 'aa3053', name: 'BAUHAUS',               logo: '🔨', category: 'bygg' },
  { key: 'biltema',         publicId: 'df0f3C', name: 'Biltema',               logo: '🔧', category: 'bygg' },
  { key: 'byggmax',         publicId: '6d73Hq', name: 'Byggmax',               logo: '🪵', category: 'bygg' },
  { key: 'jula',            publicId: 'ecf1H3', name: 'Jula',                  logo: '🔩', category: 'bygg' },
  { key: 'clas_ohlson',     publicId: 'b9b4J3', name: 'Clas Ohlson',           logo: '🔌', category: 'bygg' },
  // Övrigt
  { key: 'elgiganten',      publicId: '99f9T3', name: 'Elgiganten',            logo: '📺', category: 'övrigt' },
  { key: 'jysk',            publicId: '7b55u3', name: 'JYSK',                  logo: '🛏️', category: 'övrigt' },
  { key: 'intersport',      publicId: '459e73', name: 'INTERSPORT',            logo: '👟', category: 'övrigt' },
  { key: 'arken_zoo',       publicId: 'rIxdFw', name: 'Arken Zoo',             logo: '🐾', category: 'övrigt' },
];

export const FOOD_STORE_KEYS = STORES
  .filter((s) => s.category === 'mat' || s.category === 'stormarknad')
  .map((s) => s.key);

export type StoreKey = string;

export function getAvailableStores(): StoreInfo[] {
  return STORES;
}

export function getStoresByCategory() {
  const groups: Record<string, StoreInfo[]> = {};
  for (const s of STORES) {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  }
  return groups;
}

const CATEGORY_LABELS: Record<string, string> = {
  mat: '🛒 Mat & Dagligvaror',
  stormarknad: '🏪 Stormarknader',
  apotek: '💊 Apotek & Hälsa',
  bygg: '🔨 Bygg & Järn',
  övrigt: '🛍️ Övrigt',
};

export function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

async function fetchOffers(store: StoreInfo): Promise<Offer[]> {
  const results: Offer[] = [];
  try {
    const catRes = await fetch(
      `${BASE_URL}/v2/catalogs?dealer_id=${store.publicId}&order_by=-publication_date&limit=1`,
    );
    if (!catRes.ok) return results;
    const catalogs = await catRes.json();
    if (!Array.isArray(catalogs) || catalogs.length === 0) return results;

    const catalog = catalogs[0];
    const catalogId = catalog.id;
    const validFrom = catalog.run_from ?? new Date().toISOString();
    const validTo = catalog.run_till ?? new Date(Date.now() + 7 * 86400000).toISOString();

    const offRes = await fetch(`${BASE_URL}/v2/catalogs/${catalogId}/hotspots`);
    if (!offRes.ok) return results;
    const hotspots = await offRes.json();
    if (!Array.isArray(hotspots)) return results;

    for (const hs of hotspots) {
      const offer = hs.offer;
      if (!offer?.heading) continue;

      results.push({
        id: `${store.publicId}-${offer.id ?? offer.heading}-${validFrom}`,
        store: store.name,
        storeLogo: store.logo,
        productName: offer.heading,
        description: offer.description ?? '',
        price: parsePriceStr(offer),
        imageUrl: parseImageUrl(offer),
        validFrom,
        validTo,
      });
    }
  } catch {
    // Tyst
  }
  return results;
}

function parsePriceStr(item: Record<string, unknown>): string | undefined {
  const pricing = item.pricing as Record<string, unknown> | undefined;
  if (!pricing) return undefined;
  const price = typeof pricing.price === 'number' ? pricing.price : 0;
  const currency = typeof pricing.currency === 'string' ? pricing.currency : 'SEK';
  return price > 0 ? `${price.toFixed(2)} ${currency}` : undefined;
}

function parseImageUrl(item: Record<string, unknown>): string | undefined {
  const images = item.images as Record<string, unknown> | undefined;
  if (!images) return undefined;
  for (const key of ['zoom', 'view', 'thumb']) {
    const url = images[key];
    if (typeof url === 'string') return url;
  }
  return undefined;
}

export async function getOffersForStores(storeKeys: StoreKey[]): Promise<Offer[]> {
  const stores = STORES.filter((s) => storeKeys.includes(s.key));
  const results = await Promise.all(stores.map(fetchOffers));
  return results.flat();
}

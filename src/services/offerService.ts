import type { Offer } from '../types';

const BASE_URL = 'https://squid-api.tjek.com';

// Svenska butiker på Tjek.com
const STORES: Record<string, { publicId: string; name: string; logo: string }> = {
  lidl:        { publicId: '03a7b3', name: 'Lidl',        logo: '🟡' },
  willys:      { publicId: 'bde1f5', name: 'Willys',      logo: '🔴' },
  hemkop:      { publicId: 'fa7dbe', name: 'Hemköp',      logo: '🟢' },
  ica:         { publicId: '32bfcc', name: 'ICA',         logo: '🔴' },
  coop:        { publicId: 'ca10a4', name: 'Coop',        logo: '🟣' },
};

export type StoreKey = keyof typeof STORES;

export function getAvailableStores() {
  return Object.entries(STORES).map(([key, val]) => ({ key, ...val }));
}

async function fetchOffers(publicId: string, storeName: string, storeLogo: string): Promise<Offer[]> {
  const results: Offer[] = [];

  try {
    // Hämta senaste katalog
    const catRes = await fetch(
      `${BASE_URL}/v2/catalogs?dealer_id=${publicId}&order_by=-publication_date&limit=1`
    );
    if (!catRes.ok) return results;
    const catalogs = await catRes.json();
    if (!Array.isArray(catalogs) || catalogs.length === 0) return results;

    const catalog = catalogs[0];
    const catalogId = catalog.id;
    const validFrom = catalog.run_from ?? new Date().toISOString();
    const validTo = catalog.run_till ?? new Date(Date.now() + 7 * 86400000).toISOString();

    // Hämta erbjudanden ur katalogen
    const offRes = await fetch(`${BASE_URL}/v2/catalogs/${catalogId}/hotspots`);
    if (!offRes.ok) return results;
    const hotspots = await offRes.json();
    if (!Array.isArray(hotspots)) return results;

    for (const hs of hotspots) {
      const offer = hs.offer;
      if (!offer) continue;

      const heading = offer.heading ?? '';
      const description = offer.description ?? '';
      if (!heading) continue;

      const price = parsePriceStr(offer);

      results.push({
        id: `${publicId}-${offer.id ?? heading}-${validFrom}`,
        store: storeName,
        storeLogo,
        productName: heading,
        description,
        price,
        imageUrl: parseImageUrl(offer),
        validFrom,
        validTo,
      });
    }
  } catch {
    // Tyst – returnera vad vi hittills har
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
  const promises = storeKeys.map((key) => {
    const store = STORES[key];
    return fetchOffers(store.publicId, store.name, store.logo);
  });
  const results = await Promise.all(promises);
  return results.flat();
}

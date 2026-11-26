import { templates } from './bills';

const clean = (text) => text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

function parseAmount(value, currency) {
  const compact = value.replace(/\s/g, '');
  const decimal = currency !== 'VND' && /[,.]\d{1,2}$/.test(compact);
  const normalized = decimal
    ? compact.slice(0, compact.search(/[,.]\d{1,2}$/)).replace(/[,.]/g, '') + '.' + compact.match(/\d{1,2}$/)[0]
    : compact.replace(/[,.]/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : undefined;
}

export function parseReceipt(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const normalized = clean(text);
  const matching = templates.find((template) => normalized.includes(clean(template.name)));
  const aliases = [['chatgpt', 'ChatGPT Plus'], ['youtube', 'YouTube Premium'], ['icloud', 'iCloud+']];
  const alias = aliases.find(([word]) => normalized.includes(word));
  const known = matching ?? templates.find((template) => template.name === alias?.[1]);
  const nameLine = lines.find((line) => /^(?:service|subscription|ten dich vu|dich vu)\s*:/i.test(clean(line)));
  const name = known?.name ?? nameLine?.split(':').slice(1).join(':').trim();
  const preferred = lines.filter((line) => /(?:total|amount paid|charged|tong cong|so tien|thanh toan)/i.test(clean(line)));
  const currencyPattern = /(VND|USD|EUR|₫|\$|€)\s*([\d]+(?:[.,\s]\d+)*)|([\d]+(?:[.,\s]\d+)*)\s*(VND|USD|EUR|₫|\$|€)/i;
  const moneyMatch = [...preferred, ...lines].map((line) => line.match(currencyPattern)).find(Boolean);
  const symbol = (moneyMatch?.[1] ?? moneyMatch?.[4])?.toUpperCase();
  const currency = ({ '$': 'USD', '€': 'EUR', '₫': 'VND' })[symbol] ?? symbol;
  const amount = moneyMatch ? parseAmount(moneyMatch[2] ?? moneyMatch[3], currency) : undefined;
  const dateLine = lines.find((line) => /renew|next billing|gia han|ky tiep theo|expires|het han/i.test(clean(line)));
  const iso = dateLine?.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  const local = dateLine?.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
  const components = iso ? [iso[1], iso[2], iso[3]] : local ? [local[3], local[2], local[1]] : null;
  const possible = components?.map((part) => part.padStart(2, '0')).join('-');
  const timestamp = possible ? new Date(possible + 'T00:00:00Z') : null;
  const next = timestamp && Number.isFinite(timestamp.getTime()) && timestamp.toISOString().slice(0, 10) === possible ? possible : undefined;
  return { name, amount, currency, next, category: known?.category, plan: known?.plan };
}

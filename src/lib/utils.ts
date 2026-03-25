import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCountryFlag = (countryName: string): string => {
  if (!countryName) return '🏳️';
  
  const normalized = countryName.toLowerCase().trim();
  
  // Special cases for non-standard ISO flags (like Scotland)
  if (normalized === 'schotland' || normalized === 'scotland') return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
  if (normalized === 'wales') return '🏴󠁧󠁢󠁷󠁬󠁳󠁿';
  if (normalized === 'engeland' || normalized === 'england') return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';

  const countryMap: Record<string, string> = {
    'frankrijk': 'FR', 'france': 'FR',
    'italië': 'IT', 'italy': 'IT',
    'spanje': 'ES', 'spain': 'ES',
    'duitsland': 'DE', 'germany': 'DE',
    'oostenrijk': 'AT', 'austria': 'AT',
    'portugal': 'PT',
    'verenigde staten': 'US', 'usa': 'US', 'united states': 'US', 'v.s.': 'US',
    'australië': 'AU', 'australia': 'AU',
    'nieuw-zeeland': 'NZ', 'new zealand': 'NZ',
    'chili': 'CL', 'chile': 'CL',
    'argentinië': 'AR', 'argentina': 'AR',
    'zuid-afrika': 'ZA', 'south africa': 'ZA',
    'nederland': 'NL', 'netherlands': 'NL', 'holland': 'NL',
    'belgië': 'BE', 'belgium': 'BE',
    'griekenland': 'GR', 'greece': 'GR',
    'hongarije': 'HU', 'hungary': 'HU',
    'moldavië': 'MD', 'moldova': 'MD',
    'georgië': 'GE', 'georgia': 'GE',
    'libanon': 'LB', 'lebanon': 'LB',
    'israël': 'IL', 'israel': 'IL',
    'china': 'CN',
    'japan': 'JP',
    'canada': 'CA',
    'mexico': 'MX',
    'ierland': 'IE', 'ireland': 'IE',
    'verenigd koninkrijk': 'GB', 'united kingdom': 'GB', 'uk': 'GB', 'groot-brittannië': 'GB',
    'rusland': 'RU', 'russia': 'RU',
    'polen': 'PL', 'poland': 'PL',
    'zweden': 'SE', 'sweden': 'SE',
    'noorwegen': 'NO', 'norway': 'NO',
    'finland': 'FI',
    'denemarken': 'DK', 'denmark': 'DK',
    'zwitserland': 'CH', 'switzerland': 'CH',
    'tsjechië': 'CZ', 'czech republic': 'CZ',
    'slowakije': 'SK', 'slovakia': 'SK',
    'roemenië': 'RO', 'romania': 'RO',
    'bulgarije': 'BG', 'bulgaria': 'BG',
    'kroatië': 'HR', 'croatia': 'HR',
    'slovenië': 'SI', 'slovenia': 'SI',
    'turkije': 'TR', 'turkey': 'TR',
    'oekraïne': 'UA', 'ukraine': 'UA',
    'brazilië': 'BR', 'brazil': 'BR',
    'uruguay': 'UY',
    'india': 'IN',
    'zuid-korea': 'KR', 'south korea': 'KR',
    'thailand': 'TH',
    'vietnam': 'VN',
    'peru': 'PE',
  };

  const code = countryMap[normalized];
  if (!code) return '🏳️';

  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

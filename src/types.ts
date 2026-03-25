export type Category = 'Wine' | 'Beer' | 'Gin' | 'Whiskey' | 'Cognac' | 'Rum' | 'Lists';
export type SubTab = 'Cellar' | 'Research' | 'Merchants' | 'Tasks';

// New "From Zero to Wino" Profiles
export type WineProfile = 
  | 'WIT: Light & Fresh' | 'WIT: Medium & Smooth' | 'WIT: Powerful & Complex' | 'WIT: Special & Adventurous'
  | 'ROOD: Juicy & Light' | 'ROOD: Medium & Smooth' | 'ROOD: Powerful & Full' | 'ROOD: Special & Adventurous'
  | 'OVERIG: Orange' | 'OVERIG: Rosé' | 'OVERIG: Bubbles';

export type BeerProfile = 
  | 'For the thirst of a long day'
  | 'For the rebels & the hopheads'
  | 'For the dark end of the night'
  | 'For sweet souls & sour tongues';

export type SpiritProfile = 
  | 'Fresh & Botanical'
  | 'Sweet & Floral'
  | 'Deep & Nutty/Spicy'
  | 'Digestif & Wood-Aged';

export interface RadarDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}

export interface ZeroToWinoAssessment {
  elevatorPitch: string;
  whyPairing: string;
  productionMethod: string;
  productionType: 'Classic' | 'Biodynamic' | 'Natural' | 'Vegan' | 'Other';
}

export interface DrinkBase {
  id: string;
  category: Category;
  brand: string;
  name: string;
  region: string;
  country: string;
  countryFlag?: string;
  qualityScore: number;
  personalRating?: number;
  entryMethod: 'scan' | 'manual' | 'url';
  subTab: SubTab;
  tasteNotes: string;
  radarData: RadarDataPoint[];
  imageUrl?: string;
  foodPairings: {
    classic: string[];
    modern: string[];
    budget: string[];
    matchIcon: 'Meat' | 'Fish' | 'Cheese' | 'Veggie';
  };
  zeroToWino: ZeroToWinoAssessment;
  profile: WineProfile | BeerProfile | SpiritProfile;
  profileDescription?: string;
  profileIcon?: string;
}

export interface WineAnalysis extends DrinkBase {
  category: 'Wine';
  year?: number;
  abv?: number;
  primaryAromas: string[];
  grapes?: string[];
  profileIcon?: string;
}

export interface SpiritAnalysis extends DrinkBase {
  category: 'Gin' | 'Whiskey' | 'Rum' | 'Cognac';
  abv?: number;
  botanicals?: string[]; // For Gin
  caskType?: string[]; // For Whiskey/Rum
  age?: number; // For Whiskey/Rum
  profileIcon?: string;
}

export interface BeerAnalysis extends DrinkBase {
  category: 'Beer';
  style: string;
  abv?: number;
  ibu?: number;
  profileIcon?: string;
}

export type Drink = WineAnalysis | SpiritAnalysis | BeerAnalysis;

export interface Merchant {
  id: string;
  name: string;
  websiteUrl?: string;
  location?: string;
  drinkCount: number;
}

export interface DrinkList {
  id: string;
  name: string;
  source: string; // Restaurant name or Merchant name
  dateScanned: string;
  itemCount: number;
  status: 'Analyzed' | 'Pending';
  items?: Drink[]; // Extracted items from the list
}

export interface AITask {
  id: string;
  uid: string;
  type: 'image_analysis' | 'portfolio_search' | 'product_search' | 'menu_analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  label: string; // e.g. "Analyzing Château Margaux"
  resultCount?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

import { Drink, DrinkList, Merchant } from './types';

export const MOCK_MERCHANTS: Merchant[] = [
  { id: 'm1', name: 'Wijnkoperij De Gouden Druif', websiteUrl: 'https://degoudendruif.nl', location: 'Amsterdam', drinkCount: 12 },
  { id: 'm2', name: 'The Whisky Exchange', websiteUrl: 'https://thewhiskyexchange.com', location: 'London', drinkCount: 45 },
  { id: 'm3', name: 'Gin & Tonic Shop', websiteUrl: 'https://gin-tonic-shop.be', location: 'Antwerpen', drinkCount: 8 }
];

export const MOCK_LISTS: DrinkList[] = [
  { 
    id: 'l1', 
    name: 'Wijnkaart Restaurant De Librije', 
    source: 'De Librije', 
    dateScanned: '2024-03-15', 
    itemCount: 120, 
    status: 'Analyzed',
    items: [
      {
        id: 'w1',
        category: 'Wine',
        brand: 'Château Talbot',
        name: 'Grand Cru Classé',
        region: 'Saint-Julien, Bordeaux',
        country: 'Frankrijk',
        year: 2018,
        qualityScore: 92,
        entryMethod: 'scan',
        subTab: 'Cellar',
        tasteNotes: "Krachtige Bordeaux met tonen van ceder, tabak en rijp zwart fruit. De tannines zijn stevig maar goed geïntegreerd.",
        primaryAromas: ['Ceder', 'Tabak', 'Zwarte bes', 'Pruim'],
        radarData: [
          { subject: 'Zuurtegraad', A: 6, fullMark: 10 },
          { subject: 'Tannines', A: 8, fullMark: 10 },
          { subject: 'Body', A: 8, fullMark: 10 },
          { subject: 'Zoetheid', A: 1, fullMark: 10 },
          { subject: 'Alcohol', A: 7, fullMark: 10 },
        ],
        foodPairings: {
          classic: ['Lamsbout', 'Entrecôte'],
          modern: ['Geroosterde groenten met miso'],
          budget: ['Oude kaas'],
          matchIcon: 'Meat'
        },
        profile: 'ROOD: Powerful & Full',
        profileIcon: '🍷',
        zeroToWino: {
          elevatorPitch: 'Een monumentale Bordeaux die geduld beloont.',
          whyPairing: 'De stevige tannines snijden perfect door het vet van rood vlees.',
          productionMethod: 'Traditionele vinificatie met 18 maanden rijping op Franse eik.',
          productionType: 'Classic'
        },
        countryFlag: '🇫🇷',
        abv: 13.5
      },
      {
        id: 'w2',
        category: 'Wine',
        brand: 'Cloudy Bay',
        name: 'Sauvignon Blanc',
        region: 'Marlborough',
        country: 'Nieuw-Zeeland',
        year: 2022,
        qualityScore: 89,
        entryMethod: 'manual',
        subTab: 'Research',
        tasteNotes: "Explosieve aroma's van passievrucht, kruisbes en vers gemaaid gras. Zeer verfrissend met een strakke zuurgraad.",
        primaryAromas: ['Passievrucht', 'Kruisbes', 'Gras', 'Limoen'],
        radarData: [
          { subject: 'Zuurtegraad', A: 9, fullMark: 10 },
          { subject: 'Tannines', A: 1, fullMark: 10 },
          { subject: 'Body', A: 4, fullMark: 10 },
          { subject: 'Zoetheid', A: 2, fullMark: 10 },
          { subject: 'Alcohol', A: 6, fullMark: 10 },
        ],
        foodPairings: {
          classic: ['Oesters', 'Geitenkaas'],
          modern: ['Ceviche met passievrucht'],
          budget: ['Griekse salade'],
          matchIcon: 'Fish'
        },
        profile: 'WIT: Light & Fresh',
        profileIcon: '🥂',
        zeroToWino: {
          elevatorPitch: 'De referentie voor Nieuw-Zeelandse Sauvignon Blanc.',
          whyPairing: 'De hoge zuren versterken de frisheid van zeevruchten.',
          productionMethod: 'Vergisting op roestvrij staal om de fruitaroma\'s te behouden.',
          productionType: 'Other'
        },
        countryFlag: '🇳🇿',
        abv: 13.0
      }
    ]
  },
  { 
    id: 'l2', 
    name: 'Assortiment Grapedistrict', 
    source: 'Grapedistrict.nl', 
    dateScanned: '2024-03-20', 
    itemCount: 45, 
    status: 'Pending',
    items: []
  }
];

export const MOCK_DRINKS: Drink[] = [
  {
    id: 'w1',
    category: 'Wine',
    brand: 'Château Talbot',
    name: 'Grand Cru Classé',
    region: 'Saint-Julien, Bordeaux',
    country: 'Frankrijk',
    year: 2018,
    qualityScore: 92,
    entryMethod: 'scan',
    subTab: 'Cellar',
    tasteNotes: "Krachtige Bordeaux met tonen van ceder, tabak en rijp zwart fruit. De tannines zijn stevig maar goed geïntegreerd.",
    primaryAromas: ['Ceder', 'Tabak', 'Zwarte bes', 'Pruim'],
    radarData: [
      { subject: 'Zuurtegraad', A: 6, fullMark: 10 },
      { subject: 'Tannines', A: 8, fullMark: 10 },
      { subject: 'Body', A: 8, fullMark: 10 },
      { subject: 'Zoetheid', A: 1, fullMark: 10 },
      { subject: 'Alcohol', A: 7, fullMark: 10 },
    ],
    foodPairings: {
      classic: ['Lamsbout', 'Entrecôte'],
      modern: ['Geroosterde groenten met miso'],
      budget: ['Oude kaas'],
      matchIcon: 'Meat'
    },
    profile: 'ROOD: Powerful & Full',
    profileIcon: '🍷',
    zeroToWino: {
      elevatorPitch: 'Een monumentale Bordeaux die geduld beloont.',
      whyPairing: 'De stevige tannines snijden perfect door het vet van rood vlees.',
      productionMethod: 'Traditionele vinificatie met 18 maanden rijping op Franse eik.',
      productionType: 'Classic'
    },
    countryFlag: '🇫🇷',
    abv: 13.5
  },
  {
    id: 'w2',
    category: 'Wine',
    brand: 'Cloudy Bay',
    name: 'Sauvignon Blanc',
    region: 'Marlborough',
    country: 'Nieuw-Zeeland',
    year: 2022,
    qualityScore: 89,
    entryMethod: 'manual',
    subTab: 'Research',
    tasteNotes: "Explosieve aroma's van passievrucht, kruisbes en vers gemaaid gras. Zeer verfrissend met een strakke zuurgraad.",
    primaryAromas: ['Passievrucht', 'Kruisbes', 'Gras', 'Limoen'],
    radarData: [
      { subject: 'Zuurtegraad', A: 9, fullMark: 10 },
      { subject: 'Tannines', A: 1, fullMark: 10 },
      { subject: 'Body', A: 4, fullMark: 10 },
      { subject: 'Zoetheid', A: 2, fullMark: 10 },
      { subject: 'Alcohol', A: 6, fullMark: 10 },
    ],
    foodPairings: {
      classic: ['Oesters', 'Geitenkaas'],
      modern: ['Ceviche met passievrucht'],
      budget: ['Griekse salade'],
      matchIcon: 'Fish'
    },
    profile: 'WIT: Light & Fresh',
    profileIcon: '🥂',
    zeroToWino: {
      elevatorPitch: 'De referentie voor Nieuw-Zeelandse Sauvignon Blanc.',
      whyPairing: 'De hoge zuren versterken de frisheid van zeevruchten.',
      productionMethod: 'Vergisting op roestvrij staal om de fruitaroma\'s te behouden.',
      productionType: 'Other'
    },
    countryFlag: '🇳🇿',
    abv: 13.0
  },
  {
    id: 'g1',
    category: 'Gin',
    brand: 'Hendrick\'s',
    name: 'Lunar Gin',
    region: 'Girvan',
    country: 'Schotland',
    qualityScore: 85,
    entryMethod: 'scan',
    subTab: 'Cellar',
    tasteNotes: "Een zachte, florale gin met subtiele kruidige tonen en de kenmerkende komkommer- en rozenfinish.",
    botanicals: ['Jeneverbes', 'Komkommer', 'Roos', 'Kamille'],
    radarData: [
      { subject: 'Floraal', A: 8, fullMark: 10 },
      { subject: 'Kruidig', A: 5, fullMark: 10 },
      { subject: 'Citrus', A: 4, fullMark: 10 },
      { subject: 'Jeneverbes', A: 6, fullMark: 10 },
      { subject: 'Complexiteit', A: 7, fullMark: 10 },
    ],
    foodPairings: {
      classic: ['Gin & Tonic met komkommer'],
      modern: ['Zalm tartaar'],
      budget: ['Gezouten amandelen'],
      matchIcon: 'Fish'
    },
    profile: 'Sweet & Floral',
    profileIcon: '🍸',
    zeroToWino: {
      elevatorPitch: 'Een dromerige gin voor de late avonduurtjes.',
      whyPairing: 'De delicate bloemige tonen passen goed bij lichte visgerechten.',
      productionMethod: 'Gedistilleerd in kleine batches in de cabinet of curiosities.',
      productionType: 'Classic'
    },
    countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    abv: 43.4
  },
  {
    id: 'wh1',
    category: 'Whiskey',
    brand: 'Lagavulin',
    name: '16 Years Old',
    region: 'Islay',
    country: 'Schotland',
    qualityScore: 95,
    entryMethod: 'scan',
    subTab: 'Cellar',
    age: 16,
    tasteNotes: "Intens rokerig en turfachtig met tonen van zeewier, jodium en een verrassende zoetheid van gedroogd fruit.",
    caskType: ['Ex-Bourbon', 'Sherry Finish'],
    radarData: [
      { subject: 'Rook', A: 10, fullMark: 10 },
      { subject: 'Turf', A: 9, fullMark: 10 },
      { subject: 'Zoetheid', A: 4, fullMark: 10 },
      { subject: 'Hout', A: 7, fullMark: 10 },
      { subject: 'Afdronk', A: 10, fullMark: 10 },
    ],
    foodPairings: {
      classic: ['Blauwe kaas', 'Pure chocolade'],
      modern: ['Gerookte eend'],
      budget: ['Geroosterde noten'],
      matchIcon: 'Cheese'
    },
    profile: 'Deep & Nutty/Spicy',
    profileIcon: '🥃',
    zeroToWino: {
      elevatorPitch: 'De koning van Islay, een must voor elke turf-liefhebber.',
      whyPairing: 'De intense rook en ziltigheid gaan geweldig samen met sterke kazen.',
      productionMethod: 'Lange distillatie en 16 jaar rijping aan de kust.',
      productionType: 'Classic'
    },
    countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    abv: 43.0
  },
  {
    id: 'b1',
    category: 'Beer',
    brand: 'Westvleteren',
    name: '12',
    region: 'Vleteren',
    country: 'België',
    style: 'Trappist Quadrupel',
    qualityScore: 98,
    entryMethod: 'scan',
    subTab: 'Cellar',
    abv: 10.2,
    ibu: 38,
    tasteNotes: "Een legendarisch bier met complexe tonen van donker fruit, karamel en een verwarmende alcoholische finish.",
    radarData: [
      { subject: 'Bitterheid', A: 4, fullMark: 10 },
      { subject: 'Zoetheid', A: 7, fullMark: 10 },
      { subject: 'Body', A: 9, fullMark: 10 },
      { subject: 'Koolzuur', A: 5, fullMark: 10 },
      { subject: 'Hop', A: 4, fullMark: 10 },
    ],
    foodPairings: {
      classic: ['Stoofvlees', 'Wild'],
      modern: ['Blauwe kaas met vijgen'],
      budget: ['Pure chocolade'],
      matchIcon: 'Meat'
    },
    profile: 'For the dark end of the night',
    profileIcon: '🍺',
    zeroToWino: {
      elevatorPitch: 'Vaak beschouwd als het beste bier ter wereld.',
      whyPairing: 'De rijke moutigheid vult de diepe smaken van stoofgerechten aan.',
      productionMethod: 'Authentiek Trappistenbier, gebrouwen binnen de muren van de abdij.',
      productionType: 'Classic'
    },
    countryFlag: '🇧🇪'
  }
];

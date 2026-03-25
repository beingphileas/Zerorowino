import React, { useState, useMemo } from 'react';
import { Plus, Wine, Loader2, Sparkles, TrendingUp, Search, Filter, Camera, X, Wand2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getCountryFlag } from '../lib/utils';
import { SubTab, WineAnalysis, Drink, WineProfile } from '../types';
import WineDetailView from './WineDetailView';
import PhotoCapture from './PhotoCapture';
import BeverageDiscovery from './BeverageDiscovery';
import TaskCenter from './TaskCenter';
import { analyzeDrinkImage, discoverProducerByProduct } from '../services/aiService';

// Firebase
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface WineModuleProps {
  subTab: SubTab;
  setSubTab: (tab: SubTab) => void;
  drinks: Drink[];
  setDrinks: (drinks: Drink[]) => void;
  forceShowForm?: boolean;
}

const calculateQualityScore = (year: number, country: string, personalRating?: number) => {
  let score = 85; // Base score
  
  // Year factor (Vintages)
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  if (age > 25) score += 6;
  else if (age > 15) score += 4;
  else if (age > 8) score += 2;
  
  // Country rarity factor
  const rareCountries = ['Japan', 'Verenigd Koninkrijk', 'Nederland', 'België', 'China', 'Canada', 'Thailand', 'India'];
  if (rareCountries.some(c => country.toLowerCase().includes(c.toLowerCase()))) {
    score += 4;
  }
  
  // User rating factor (if available)
  if (personalRating && personalRating > 0) {
    // 5 stars = +5, 4 stars = +2, 3 stars = 0, 2 stars = -3, 1 star = -6
    const ratingImpact = (personalRating - 3) * 2.5;
    score += ratingImpact;
  }
  
  // Random variance for "character"
  score += (Math.random() * 4) - 2;
  
  return Math.max(70, Math.min(99, Math.round(score)));
};

const generateRadarData = (profile: string) => {
  const base = [
    { subject: 'Zuurtegraad', A: 5, fullMark: 10 },
    { subject: 'Tannines', A: 5, fullMark: 10 },
    { subject: 'Body', A: 5, fullMark: 10 },
    { subject: 'Zoetheid', A: 2, fullMark: 10 },
    { subject: 'Alcohol', A: 6, fullMark: 10 },
  ];

  if (profile.includes('Light & Fresh')) {
    base[0].A = 8;
    base[1].A = 2;
    base[2].A = 3;
  } else if (profile.includes('Powerful & Full') || profile.includes('Powerful & Complex')) {
    base[0].A = 6;
    base[1].A = 8;
    base[2].A = 8;
    base[4].A = 8;
  } else if (profile.includes('Medium & Smooth')) {
    base[0].A = 5;
    base[1].A = 5;
    base[2].A = 6;
  } else if (profile.includes('Bubbles')) {
    base[0].A = 8;
    base[1].A = 1;
    base[2].A = 4;
  }

  return base.map(p => ({
    ...p,
    A: Math.max(1, Math.min(10, p.A + (Math.floor(Math.random() * 3) - 1)))
  }));
};

const generateFoodPairings = (profile: string) => {
  if (profile.startsWith('WIT')) {
    return {
      classic: ['Gegrilde Zeebaars', 'Oesters'],
      modern: ['Ceviche met Passievrucht', 'Sushi'],
      budget: ['Fish & Chips', 'Pasta Vongole'],
      matchIcon: 'Fish' as const
    };
  } else if (profile.startsWith('ROOD')) {
    return {
      classic: ['Lamsbout met Rozemarijn', 'Entrecôte'],
      modern: ['Geroosterde Eend met Kersen', 'Hertenbiefstuk'],
      budget: ['Bolognese', 'Pizza met Salami'],
      matchIcon: 'Meat' as const
    };
  } else if (profile.includes('Rosé')) {
    return {
      classic: ['Salade Niçoise', 'Gegrilde Gamba\'s'],
      modern: ['Watermeloen & Feta Salade', 'Tapas'],
      budget: ['Quiche', 'Picknick Snacks'],
      matchIcon: 'Veggie' as const
    };
  }
  return {
    classic: ['Kaasplankje', 'Charcuterie'],
    modern: ['Fusion Tapas', 'Gevulde Portobello'],
    budget: ['Stokbrood met Dips', 'Hartige Taart'],
    matchIcon: 'Cheese' as const
  };
};

export default function WineModule({ subTab, setSubTab, drinks, setDrinks, forceShowForm }: WineModuleProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<WineAnalysis | null>(null);
  const [showForm, setShowForm] = useState(forceShowForm || false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'year'>('score');
  const [filterProfile, setFilterProfile] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoverySearchType, setDiscoverySearchType] = useState<'product' | 'producer'>('producer');

  // Mock form state
  const [formData, setFormData] = useState({
    producer: '',
    name: '',
    region: '',
    country: '',
    countryFlag: '',
    personalRating: 0,
    year: '',
    abv: '',
    imageUrl: '',
    tasteNotes: '',
    primaryAromas: [] as string[],
    grapes: [] as string[],
    profile: 'WIT: Light & Fresh' as any,
    profileDescription: '',
    profileIcon: '🍷',
    matchIcon: 'Fish' as any,
    zeroToWino: {
      elevatorPitch: '',
      whyPairing: '',
      productionMethod: '',
      productionType: 'Classic' as any
    }
  });

  const profiles = useMemo(() => {
    const allProfiles = drinks.filter(d => d.category === 'Wine').map(d => d.profile);
    return Array.from(new Set(allProfiles)).filter(Boolean);
  }, [drinks]);

  const vintages = useMemo(() => {
    const allYears = drinks
      .filter(d => d.category === 'Wine' && (d as WineAnalysis).year)
      .map(d => (d as WineAnalysis).year as number);
    return Array.from(new Set(allYears)).sort((a, b) => b - a);
  }, [drinks]);

  const filteredDrinks = useMemo(() => {
    let result = drinks.filter(d => 
      d.category === 'Wine' && 
      (d.subTab || 'Cellar') === subTab &&
      (d.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
       d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       d.region.toLowerCase().includes(searchQuery.toLowerCase()))
    ) as WineAnalysis[];

    if (filterProfile) {
      result = result.filter(d => d.profile === filterProfile);
    }

    if (filterYear) {
      result = result.filter(d => d.year === filterYear);
    }

    return result.sort((a, b) => {
      if (sortBy === 'score') return (b.qualityScore || 0) - (a.qualityScore || 0);
      if (sortBy === 'name') return a.brand.localeCompare(b.brand);
      if (sortBy === 'year') return (b.year || 0) - (a.year || 0);
      return 0;
    });
  }, [drinks, subTab, searchQuery, sortBy, filterProfile]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsAnalyzing(true);
    
    try {
      await addDoc(collection(db, 'tasks'), {
        uid: auth.currentUser.uid,
        type: 'product_search',
        status: 'pending',
        progress: 0,
        label: `Analyse: ${formData.producer} ${formData.name}`,
        payload: {
          productName: `${formData.producer} ${formData.name}`.trim(),
          category: 'Wine'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setSubTab('Tasks');
      setShowForm(false);
      
      // Reset form
      setFormData({
        producer: '', name: '', region: '', country: '', countryFlag: '',
        personalRating: 0, year: '', abv: '', imageUrl: '', tasteNotes: '',
        primaryAromas: [], grapes: [], profile: 'WIT: Light & Fresh' as any,
        profileDescription: '', profileIcon: '🍷', matchIcon: 'Fish' as any,
        zeroToWino: { elevatorPitch: '', whyPairing: '', productionMethod: '', productionType: 'Classic' as any }
      });
    } catch (error) {
      console.error("Error creating analysis task:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExtractFromImage = async (imageUrl: string) => {
    if (!auth.currentUser) return;
    setIsExtracting(true);
    
    try {
      await addDoc(collection(db, 'tasks'), {
        uid: auth.currentUser.uid,
        type: 'image_analysis',
        status: 'pending',
        progress: 0,
        label: "Etiket Analyse",
        payload: { base64Image: imageUrl },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setSubTab('Tasks');
      setShowPhotoCapture(false);
    } catch (error) {
      console.error("Error creating image task:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'drinks', id));
      setSelectedDrink(null);
    } catch (error) {
      console.error("Error deleting drink:", error);
    }
  };

  const handleMoveToCellar = async (id: string) => {
    try {
      await updateDoc(doc(db, 'drinks', id), { subTab: 'Cellar' });
      setSelectedDrink(null);
    } catch (error) {
      console.error("Error moving drink:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {subTab === 'Cellar' ? 'Mijn Kelder' : subTab === 'Research' ? 'Research' : 'Handelaars'}
          </h2>
          <p className="text-sm text-zinc-400">
            {filteredDrinks.length} {filteredDrinks.length === 1 ? 'wijn' : 'wijnen'} gevonden in {subTab.toLowerCase()}.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Zoek wijn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-64 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Filter size={14} className="text-zinc-500" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="score">Top Score</option>
              <option value="name">Naam A-Z</option>
              <option value="year">Jaargang</option>
            </select>
          </div>

          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="font-medium">Nieuwe Wijn</span>
          </button>
        </div>
      </div>

      {profiles.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-white/10">
            <Filter size={12} className="text-zinc-500" />
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Profiel</span>
          </div>
          <button
            onClick={() => setFilterProfile(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
              filterProfile === null 
                ? "bg-primary text-white" 
                : "bg-white/5 text-zinc-400 hover:bg-white/10"
            )}
          >
            Alles
          </button>
          {profiles.map(profile => (
            <button
              key={profile}
              onClick={() => setFilterProfile(profile)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                filterProfile === profile 
                  ? "bg-primary text-white" 
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              )}
            >
              {profile}
            </button>
          ))}
        </div>
      )}

      {vintages.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-white/10">
            <Calendar size={12} className="text-zinc-500" />
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Jaargang</span>
          </div>
          <button
            onClick={() => setFilterYear(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
              filterYear === null 
                ? "bg-primary text-white" 
                : "bg-white/5 text-zinc-400 hover:bg-white/10"
            )}
          >
            Alle Jaren
          </button>
          {vintages.map(year => (
            <button
              key={year}
              onClick={() => setFilterYear(year)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                filterYear === year 
                  ? "bg-primary text-white" 
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 rounded-2xl mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <Sparkles className="text-primary w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">AI Sommelier Analyse</h3>
              </div>

              <form onSubmit={handleAnalyze} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Producent</label>
                  <input 
                    type="text" 
                    placeholder="bijv. Château Margaux"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.producer}
                    onChange={e => setFormData({...formData, producer: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Naam / Cuvée</label>
                  <input 
                    type="text" 
                    placeholder="bijv. Grand Vin"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Regio</label>
                  <input 
                    type="text" 
                    placeholder="bijv. Bordeaux"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.region}
                    onChange={e => setFormData({...formData, region: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Land</label>
                  <input 
                    type="text" 
                    placeholder="bijv. Frankrijk"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Persoonlijke Rating (1-5)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, personalRating: star})}
                        className={cn(
                          "p-1 transition-all",
                          formData.personalRating >= star ? "text-yellow-500" : "text-zinc-600 hover:text-zinc-500"
                        )}
                      >
                        <Sparkles size={20} fill={formData.personalRating >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jaargang</label>
                  <input 
                    type="number" 
                    placeholder="2015"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.year}
                    onChange={e => setFormData({...formData, year: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ABV %</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="13.5"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.abv}
                    onChange={e => setFormData({...formData, abv: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Profiel Icoon (Emoji)</label>
                  <input 
                    type="text" 
                    placeholder="bijv. 🍷 of 🥂"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.profileIcon}
                    onChange={e => setFormData({...formData, profileIcon: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Primaire Aroma's (druk op Enter)</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-white/5 border border-white/10 rounded-lg min-h-[46px]">
                    {formData.primaryAromas.map((aroma, index) => (
                      <span key={index} className="bg-primary/20 text-primary px-2 py-1 rounded-md text-xs flex items-center gap-1">
                        {aroma}
                        <button 
                          type="button" 
                          onClick={() => setFormData({
                            ...formData, 
                            primaryAromas: formData.primaryAromas.filter((_, i) => i !== index)
                          })}
                          className="hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input 
                      type="text"
                      placeholder={formData.primaryAromas.length === 0 ? "bijv. Kers, Vanille, Leder..." : ""}
                      className="bg-transparent border-none outline-none text-sm flex-1 min-w-[120px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !formData.primaryAromas.includes(value)) {
                            setFormData({
                              ...formData,
                              primaryAromas: [...formData.primaryAromas, value]
                            });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Druivensoorten (druk op Enter)</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-white/5 border border-white/10 rounded-lg min-h-[46px]">
                    {formData.grapes.map((grape, index) => (
                      <span key={index} className="bg-primary/20 text-primary px-2 py-1 rounded-md text-xs flex items-center gap-1">
                        {grape}
                        <button 
                          type="button" 
                          onClick={() => setFormData({
                            ...formData, 
                            grapes: formData.grapes.filter((_, i) => i !== index)
                          })}
                          className="hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input 
                      type="text"
                      placeholder={formData.grapes.length === 0 ? "bijv. Cabernet Sauvignon, Merlot, Chardonnay..." : ""}
                      className="bg-transparent border-none outline-none text-sm flex-1 min-w-[120px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !formData.grapes.includes(value)) {
                            setFormData({
                              ...formData,
                              grapes: [...formData.grapes, value]
                            });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Foto</label>
                  {formData.imageUrl ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 group">
                      <img src={formData.imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          type="button"
                          onClick={() => handleExtractFromImage(formData.imageUrl)}
                          disabled={isExtracting}
                          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg disabled:opacity-50"
                        >
                          {isExtracting ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                          <span>AI Extractie</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, imageUrl: ''})}
                          className="bg-white/10 text-white p-2 rounded-lg hover:bg-white/20 transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      {isExtracting && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                          <Loader2 className="animate-spin text-primary" size={32} />
                          <span className="text-white font-bold animate-pulse">AI leest etiket...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setShowPhotoCapture(true)}
                      className="w-full border-2 border-dashed border-white/10 rounded-xl py-8 flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition-all"
                    >
                      <Camera size={24} />
                      <span className="text-sm font-medium">Foto toevoegen of nemen</span>
                    </button>
                  )}
                </div>
                
                <div className="md:col-span-2 pt-4 flex gap-3">
                  <button 
                    type="submit"
                    disabled={isAnalyzing}
                    className="flex-1 bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>AI Sommelier analyseert...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Start AI Analyse</span>
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Annuleer
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPhotoCapture && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <PhotoCapture 
              onCapture={async (url) => {
                await handleExtractFromImage(url);
                setShowPhotoCapture(false);
              }}
              onCancel={() => setShowPhotoCapture(false)}
              isProcessing={isExtracting}
              className="max-w-md w-full"
            />
          </div>
        )}
      </AnimatePresence>

      {subTab === 'Tasks' && <TaskCenter />}

      {subTab === 'Research' && (
        <div className="mb-8">
          <BeverageDiscovery 
            category="Wine" 
            initialQuery={discoveryQuery}
            initialSearchType={discoverySearchType}
            onAddSuccess={() => {
              // The parent will automatically refresh due to Firestore listeners
            }} 
          />
        </div>
      )}

      {selectedDrink && (
        <div className="fixed inset-0 z-[110] bg-zinc-950 overflow-y-auto p-6 lg:p-12">
          <div className="max-w-5xl mx-auto">
            <WineDetailView 
              wine={selectedDrink} 
              onBack={() => setSelectedDrink(null)}
              onDelete={async () => {
                if (selectedDrink.id) {
                  await deleteDoc(doc(db, 'drinks', selectedDrink.id));
                  setSelectedDrink(null);
                }
              }}
              onMoveToCellar={async () => {
                if (selectedDrink.id) {
                  await updateDoc(doc(db, 'drinks', selectedDrink.id), { subTab: 'Cellar' });
                  setSelectedDrink(null);
                }
              }}
              onDiscoverProducer={(producer) => {
                setDiscoveryQuery(producer);
                setDiscoverySearchType('producer');
                setSelectedDrink(null);
                // Switch to Research tab to show discovery component
                setSubTab('Research');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      )}

      {filteredDrinks.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredDrinks.map((wine) => (
            <motion.div 
              layout
              key={wine.id} 
              onClick={() => setSelectedDrink(wine)}
              className="glass-card rounded-2xl overflow-hidden group cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all flex h-40"
            >
              <div className="w-40 bg-gradient-to-br from-primary/20 to-zinc-900 flex items-center justify-center relative shrink-0">
                {wine.imageUrl ? (
                  <img src={wine.imageUrl} alt={wine.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <Wine size={48} className="text-primary/40 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-primary flex items-center gap-1">
                  <TrendingUp size={10} />
                  {wine.qualityScore}
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{wine.countryFlag}</span>
                      <h4 className="font-bold text-white group-hover:text-primary transition-colors truncate">{wine.brand}</h4>
                    </div>
                    <span className="text-xl shrink-0">{wine.profileIcon}</span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{wine.name}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 line-clamp-2 italic">
                    {wine.zeroToWino?.elevatorPitch ? `"${wine.zeroToWino.elevatorPitch}"` : "Geen elevator pitch beschikbaar"}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/10 px-2 py-1 rounded text-primary whitespace-nowrap">
                      {wine.profile}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-white/5 px-2 py-1 rounded text-zinc-400 whitespace-nowrap">
                      {wine.abv}% ABV
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-white/5 px-2 py-1 rounded text-zinc-400 truncate">
                      {wine.year || 'N.V.'} • {wine.region}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 glass-card rounded-2xl">
          <Wine size={48} className="opacity-10 mb-4" />
          <p className="text-lg font-medium">Geen wijnen gevonden</p>
          <p className="text-sm">Probeer een andere zoekterm of voeg een nieuwe wijn toe.</p>
        </div>
      )}
    </div>
  );
}

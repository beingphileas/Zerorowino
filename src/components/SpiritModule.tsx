import React, { useState, useMemo } from 'react';
import { Plus, Martini, Flame, Loader2, Sparkles, TrendingUp, Search, Info, Filter, Camera, X, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getCountryFlag } from '../lib/utils';
import { SubTab, SpiritAnalysis, Drink, Category } from '../types';
import SpiritDetailView from './SpiritDetailView';
import PhotoCapture from './PhotoCapture';
import BeverageDiscovery from './BeverageDiscovery';
import { analyzeDrinkImage } from '../services/aiService';

// Firebase
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface SpiritModuleProps {
  category: Category;
  subTab: SubTab;
  setSubTab: (tab: SubTab) => void;
  drinks: Drink[];
  setDrinks: (drinks: Drink[]) => void;
}

export default function SpiritModule({ category, subTab, setSubTab, drinks, setDrinks }: SpiritModuleProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<SpiritAnalysis | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'abv'>('score');
  const [filterProfile, setFilterProfile] = useState<string | null>(null);
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoverySearchType, setDiscoverySearchType] = useState<'product' | 'producer'>('producer');

  // Mock form state
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    region: '',
    country: '',
    age: '',
    abv: '',
    imageUrl: '',
    tasteNotes: '',
    primaryAromas: [] as string[],
    profile: 'Fresh & Botanical' as any,
    profileDescription: '',
    profileIcon: '🥃',
    matchIcon: 'Veggie' as any,
    zeroToWino: {
      elevatorPitch: '',
      whyPairing: '',
      productionMethod: '',
      productionType: 'Classic' as any
    },
    countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
  });

  const profiles = useMemo(() => {
    const allProfiles = drinks.filter(d => d.category === category).map(d => d.profile);
    return Array.from(new Set(allProfiles)).filter(Boolean);
  }, [drinks, category]);

  const filteredDrinks = useMemo(() => {
    let result = drinks.filter(d => 
      d.category === category && 
      (d.subTab || 'Cellar') === subTab &&
      (d.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
       d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ) as SpiritAnalysis[];

    if (filterProfile) {
      result = result.filter(d => d.profile === filterProfile);
    }

    return result.sort((a, b) => {
      if (sortBy === 'score') return (b.qualityScore || 0) - (a.qualityScore || 0);
      if (sortBy === 'name') return a.brand.localeCompare(b.brand);
      if (sortBy === 'abv') return (b.abv || 0) - (a.abv || 0);
      return 0;
    });
  }, [drinks, category, subTab, searchQuery, sortBy, filterProfile]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsAnalyzing(true);
    
    const country = formData.country || 'Onbekend';
    const newSpiritData = {
      uid: auth.currentUser.uid,
      category: category as any,
      brand: formData.brand || 'Nieuw Merk',
      name: formData.name || 'Nieuwe Expressie',
      region: formData.region || 'Onbekende Regio',
      country: country,
      abv: parseFloat(formData.abv) || 0,
      qualityScore: Math.floor(Math.random() * 15) + 80,
      profile: formData.profile,
      profileDescription: formData.profileDescription || '',
      profileIcon: formData.profileIcon,
      matchIcon: formData.matchIcon,
      zeroToWino: formData.zeroToWino,
      countryFlag: getCountryFlag(country),
      entryMethod: subTab === 'Cellar' ? 'scan' : 'manual',
      subTab: subTab,
      imageUrl: formData.imageUrl || '',
      tasteNotes: formData.tasteNotes || "Een karaktervolle spirit met een gebalanceerd smaakprofiel en een verrassende diepgang.",
      radarData: [
        { subject: category === 'Gin' ? 'Floraal' : 'Rook', A: Math.floor(Math.random() * 6) + 4, fullMark: 10 },
        { subject: category === 'Gin' ? 'Kruidig' : 'Hout', A: Math.floor(Math.random() * 6) + 4, fullMark: 10 },
        { subject: 'Complexiteit', A: Math.floor(Math.random() * 5) + 5, fullMark: 10 },
        { subject: 'Zoetheid', A: Math.floor(Math.random() * 4) + 2, fullMark: 10 },
        { subject: 'Afdronk', A: Math.floor(Math.random() * 5) + 5, fullMark: 10 },
      ],
      foodPairings: {
        classic: ['Premium Mixer'],
        modern: ['Charcuterie'],
        budget: ['Nootjes']
      },
      createdAt: new Date().toISOString()
    };
    
    try {
      await addDoc(collection(db, 'drinks'), newSpiritData);
      setIsAnalyzing(false);
      setShowForm(false);
      setFormData({ brand: '', name: '', region: '', country: '', age: '', abv: '', imageUrl: '', tasteNotes: '', primaryAromas: [] });
    } catch (error) {
      console.error("Error adding spirit:", error);
      setIsAnalyzing(false);
    }
  };

  const handleExtractFromImage = async (imageUrl: string) => {
    setIsExtracting(true);
    const data = await analyzeDrinkImage(imageUrl);
    if (data) {
      setFormData({
        ...formData,
        imageUrl,
        brand: data.brand,
        name: data.name,
        region: data.region,
        country: data.country,
        abv: data.abv?.toString() || '',
        tasteNotes: data.tasteNotes,
        primaryAromas: data.primaryAromas,
        profile: data.profile as any,
        profileDescription: data.profileDescription,
        profileIcon: data.profileIcon || '🥃',
        matchIcon: data.matchIcon || 'Veggie',
        zeroToWino: data.zeroToWino || {
          elevatorPitch: 'Een verfijnde spirit met een rijke historie.',
          whyPairing: 'De diepe smaken gaan uitstekend samen met pure chocolade.',
          productionMethod: 'Klassieke pot-still distillatie met lange rijping.',
          productionType: 'Classic'
        },
        countryFlag: getCountryFlag(data.country)
      });
    }
    setIsExtracting(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'drinks', id));
      setSelectedDrink(null);
    } catch (error) {
      console.error("Error deleting spirit:", error);
    }
  };

  const handleMoveToCellar = async (id: string) => {
    try {
      await updateDoc(doc(db, 'drinks', id), { subTab: 'Cellar' });
      setSelectedDrink(null);
    } catch (error) {
      console.error("Error moving spirit:", error);
    }
  };

  const Icon = category === 'Gin' ? Martini : Flame;

  if (selectedDrink) {
    return (
      <SpiritDetailView 
        spirit={selectedDrink} 
        onBack={() => setSelectedDrink(null)} 
        onDelete={() => handleDelete(selectedDrink.id)}
        onMoveToCellar={() => handleMoveToCellar(selectedDrink.id)}
        onDiscoverProducer={(producer) => {
          setDiscoveryQuery(producer);
          setDiscoverySearchType('producer');
          setSelectedDrink(null);
          setSubTab('Research');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {category} {subTab === 'Cellar' ? 'Collectie' : 'Research'}
          </h2>
          <p className="text-sm text-zinc-400">
            {filteredDrinks.length} items gevonden.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder={`Zoek ${category.toLowerCase()}...`}
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
              <option value="abv">ABV %</option>
            </select>
          </div>

          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="font-medium">Nieuwe {category}</span>
          </button>
        </div>
      </div>

      {profiles.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
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
                <h3 className="text-lg font-bold text-white">AI {category} Analyse</h3>
              </div>

              <form onSubmit={handleAnalyze} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Merk / Distilleerderij</label>
                  <input 
                    type="text" 
                    placeholder="bijv. Hendrick's"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Naam / Expressie</label>
                  <input 
                    type="text" 
                    placeholder="bijv. Lunar Gin"
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
                    placeholder="bijv. Islay"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.region}
                    onChange={e => setFormData({...formData, region: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Land</label>
                  <input 
                    type="text" 
                    placeholder="bijv. Schotland"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ABV %</label>
                  <input 
                    type="number" 
                    placeholder="44"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.abv}
                    onChange={e => setFormData({...formData, abv: e.target.value})}
                  />
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

      {subTab === 'Research' && (
        <div className="mb-8">
          <BeverageDiscovery 
            category={category as any} 
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
            <SpiritDetailView 
              spirit={selectedDrink} 
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
                setSubTab('Research');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      )}

      {filteredDrinks.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredDrinks.map((spirit) => (
            <motion.div 
              layout
              key={spirit.id} 
              onClick={() => setSelectedDrink(spirit)}
              className="glass-card rounded-2xl overflow-hidden group cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all flex h-40"
            >
              <div className="w-40 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative shrink-0">
                {spirit.imageUrl ? (
                  <img src={spirit.imageUrl} alt={spirit.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <Icon size={48} className="text-zinc-600 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                  <TrendingUp size={10} className="text-primary" />
                  {spirit.qualityScore}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{spirit.countryFlag}</span>
                      <h4 className="font-bold text-white group-hover:text-primary transition-colors truncate">{spirit.brand}</h4>
                    </div>
                    <span className="text-xl shrink-0">{spirit.profileIcon}</span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{spirit.name}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 line-clamp-2 italic">
                    {spirit.zeroToWino?.elevatorPitch ? `"${spirit.zeroToWino.elevatorPitch}"` : "Geen elevator pitch beschikbaar"}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/10 px-2 py-1 rounded text-primary whitespace-nowrap">
                      {spirit.profile}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-white/5 px-2 py-1 rounded text-zinc-400 whitespace-nowrap">
                      {spirit.abv}% ABV
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-white/5 px-2 py-1 rounded text-zinc-400 truncate">
                      {spirit.region}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 glass-card rounded-2xl">
          <Icon size={48} className="opacity-10 mb-4" />
          <p className="text-lg font-medium">Geen {category.toLowerCase()} gevonden</p>
          <p className="text-sm">Voeg een nieuwe {category.toLowerCase()} toe om je collectie te starten.</p>
        </div>
      )}
    </div>
  );
}

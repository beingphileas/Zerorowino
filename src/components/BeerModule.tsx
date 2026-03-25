import React, { useState, useMemo } from 'react';
import { Plus, Beer, Loader2, Sparkles, TrendingUp, Search, Filter, Camera, X, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SubTab, BeerAnalysis, Drink } from '../types';
import BeerDetailView from './BeerDetailView';
import PhotoCapture from './PhotoCapture';
import BeverageDiscovery from './BeverageDiscovery';
import TaskCenter from './TaskCenter';
import { analyzeDrinkImage } from '../services/aiService';

// Firebase
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface BeerModuleProps {
  subTab: SubTab;
  setSubTab: (tab: SubTab) => void;
  drinks: Drink[];
  setDrinks: (drinks: Drink[]) => void;
}

export default function BeerModule({ subTab, setSubTab, drinks, setDrinks }: BeerModuleProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<BeerAnalysis | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'abv'>('score');
  const [filterProfile, setFilterProfile] = useState<string | null>(null);
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoverySearchType, setDiscoverySearchType] = useState<'product' | 'producer'>('producer');

  // Form state
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    region: '',
    country: '',
    style: '',
    abv: '',
    ibu: '',
    imageUrl: '',
    tasteNotes: '',
    primaryAromas: [] as string[],
    profile: 'For the thirst of a long day' as any,
    profileDescription: '',
    profileIcon: '🍺',
    matchIcon: 'Veggie' as any,
    zeroToWino: {
      elevatorPitch: '',
      whyPairing: '',
      productionMethod: '',
      productionType: 'Classic' as any
    },
    countryFlag: '🇧🇪'
  });

  const profiles = useMemo(() => {
    const allProfiles = drinks.filter(d => d.category === 'Beer').map(d => d.profile);
    return Array.from(new Set(allProfiles)).filter(Boolean);
  }, [drinks]);

  const filteredDrinks = useMemo(() => {
    let result = drinks.filter(d => 
      d.category === 'Beer' && 
      (d.subTab || 'Cellar') === subTab &&
      (d.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
       d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       d.region.toLowerCase().includes(searchQuery.toLowerCase()))
    ) as BeerAnalysis[];

    if (filterProfile) {
      result = result.filter(d => d.profile === filterProfile);
    }

    return result.sort((a, b) => {
      if (sortBy === 'score') return (b.qualityScore || 0) - (a.qualityScore || 0);
      if (sortBy === 'name') return a.brand.localeCompare(b.brand);
      if (sortBy === 'abv') return (b.abv || 0) - (a.abv || 0);
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
        label: `Analyse: ${formData.brand} ${formData.name}`,
        payload: {
          productName: `${formData.brand} ${formData.name}`.trim(),
          category: 'Beer'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setSubTab('Tasks');
      setShowForm(false);
      
      // Reset form
      setFormData({ 
        brand: '', name: '', region: '', country: '', style: '', abv: '', ibu: '', 
        imageUrl: '', tasteNotes: '', primaryAromas: [], 
        profile: 'For the thirst of a long day', profileDescription: '', profileIcon: '🍺', 
        matchIcon: 'Veggie', zeroToWino: { elevatorPitch: '', whyPairing: '', productionMethod: '', productionType: 'Classic' }, 
        countryFlag: '🇧🇪' 
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
        label: "Bier Etiket Analyse",
        payload: { base64Image: imageUrl },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setSubTab('Tasks');
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
      console.error("Error deleting beer:", error);
    }
  };

  const handleMoveToCellar = async (id: string) => {
    try {
      await updateDoc(doc(db, 'drinks', id), { subTab: 'Cellar' });
      setSelectedDrink(null);
    } catch (error) {
      console.error("Error moving beer:", error);
    }
  };

  if (selectedDrink) {
    return (
      <BeerDetailView 
        beer={selectedDrink} 
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
            {subTab === 'Cellar' ? 'Mijn Biercollectie' : subTab === 'Research' ? 'Bier Research' : 'Bierhandelaars'}
          </h2>
          <p className="text-sm text-zinc-400">
            {filteredDrinks.length} {filteredDrinks.length === 1 ? 'bier' : 'bieren'} gevonden.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Zoek bier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-full md:w-64 transition-all"
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
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-amber-600/20 whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="font-medium">Nieuw Bier</span>
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
                ? "bg-amber-600 text-white" 
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
                  ? "bg-amber-600 text-white" 
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
                <div className="bg-amber-500/20 p-2 rounded-lg">
                  <Sparkles className="text-amber-500 w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">AI Bier Analyse</h3>
              </div>

              <form onSubmit={handleAnalyze} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Brouwerij</label>
                  <input 
                    type="text" 
                    placeholder="bijv. Westvleteren"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Naam / Type</label>
                  <input 
                    type="text" 
                    placeholder="bijv. 12"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Stijl</label>
                  <input 
                    type="text" 
                    placeholder="bijv. Quadrupel"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={formData.style}
                    onChange={e => setFormData({...formData, style: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Land</label>
                  <input 
                    type="text" 
                    placeholder="bijv. België"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ABV %</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="10.2"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={formData.abv}
                    onChange={e => setFormData({...formData, abv: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">IBU</label>
                  <input 
                    type="number" 
                    placeholder="38"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={formData.ibu}
                    onChange={e => setFormData({...formData, ibu: e.target.value})}
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
                          className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg disabled:opacity-50"
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
                          <Loader2 className="animate-spin text-amber-500" size={32} />
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
            category="Beer" 
            initialQuery={discoveryQuery}
            initialSearchType={discoverySearchType}
            onAddSuccess={() => {
              // The parent will automatically refresh due to Firestore listeners
            }} 
          />
        </div>
      )}

      {filteredDrinks.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredDrinks.map((beer) => (
            <motion.div 
              layout
              key={beer.id} 
              onClick={() => setSelectedDrink(beer)}
              className="glass-card rounded-2xl overflow-hidden group cursor-pointer hover:ring-1 hover:ring-amber-500/50 transition-all flex h-40"
            >
              <div className="w-40 bg-gradient-to-br from-amber-500/20 to-zinc-900 flex items-center justify-center relative shrink-0">
                {beer.imageUrl ? (
                  <img src={beer.imageUrl} alt={beer.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <Beer size={48} className="text-amber-500/40 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-amber-500 flex items-center gap-1">
                  <TrendingUp size={10} />
                  {beer.qualityScore}
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{beer.countryFlag}</span>
                      <h4 className="font-bold text-white group-hover:text-amber-500 transition-colors truncate">{beer.brand}</h4>
                    </div>
                    <span className="text-xl shrink-0">{beer.profileIcon}</span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{beer.name}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 line-clamp-2 italic">
                    {beer.zeroToWino?.elevatorPitch ? `"${beer.zeroToWino.elevatorPitch}"` : "Geen elevator pitch beschikbaar"}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-500/10 px-2 py-1 rounded text-amber-500 whitespace-nowrap">
                      {beer.profile}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-white/5 px-2 py-1 rounded text-zinc-400 whitespace-nowrap">
                      {beer.abv}% ABV
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-white/5 px-2 py-1 rounded text-zinc-400 truncate">
                      {beer.style}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 glass-card rounded-2xl">
          <Beer size={48} className="opacity-10 mb-4" />
          <p className="text-lg font-medium">Geen bieren gevonden</p>
          <p className="text-sm">Voeg een nieuw bier toe aan je collectie.</p>
        </div>
      )}
    </div>
  );
}

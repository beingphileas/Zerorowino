import React, { useState } from 'react';
import { Search, Sparkles, Loader2, Plus, Globe, TrendingUp, ChevronRight, Wine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { discoverProducerByProduct, discoverProductsByProducer, ExtractedDrinkData } from '../services/aiService';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { getCountryFlag } from '../lib/utils';

interface BeverageDiscoveryProps {
  category: 'Wine' | 'Beer' | 'Gin' | 'Whiskey' | 'Cognac' | 'Rum';
  onAddSuccess?: () => void;
  initialQuery?: string;
  initialSearchType?: 'product' | 'producer';
}

export default function BeverageDiscovery({ 
  category, 
  onAddSuccess, 
  initialQuery = '', 
  initialSearchType = 'product' 
}: BeverageDiscoveryProps) {
  const [searchType, setSearchType] = useState<'product' | 'producer'>(initialSearchType);
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ExtractedDrinkData[]>([]);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-trigger search if initialQuery is provided
  React.useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setSearchType(initialSearchType);
      
      const triggerSearch = async () => {
        setIsSearching(true);
        setResults([]);
        try {
          if (initialSearchType === 'product') {
            const results = await discoverProducerByProduct(initialQuery, category);
            setResults(results);
          } else {
            const results = await discoverProductsByProducer(initialQuery, category);
            setResults(results);
          }
        } catch (error) {
          console.error("Discovery error:", error);
        } finally {
          setIsSearching(false);
        }
      };
      triggerSearch();
    }
  }, [initialQuery, initialSearchType]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || !auth.currentUser) return;

    setIsSearching(true);
    setResults([]);
    setError(null);

    try {
      if (searchType === 'product') {
        const results = await discoverProducerByProduct(query, category);
        setResults(results);
      } else {
        // Create background task for exhaustive search
        await addDoc(collection(db, 'tasks'), {
          uid: auth.currentUser.uid,
          type: 'portfolio_search',
          status: 'pending',
          progress: 0,
          label: `Portfolio Search: ${query}`,
          payload: {
            producerName: query,
            category: category
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        setError("De uitgebreide zoektocht is gestart op de achtergrond. Je kunt de voortgang volgen in het tabblad 'Projecten'.");
      }
    } catch (error) {
      console.error("Discovery error:", error);
      setError("Er is een fout opgetreden bij het zoeken.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddDrink = async (data: ExtractedDrinkData) => {
    if (!auth.currentUser) return;
    
    const id = `${data.brand}-${data.name}`;
    setIsAdding(id);

    try {
      const newDrink = {
        ...data,
        uid: auth.currentUser.uid,
        entryMethod: 'url',
        subTab: 'Research',
        createdAt: new Date().toISOString(),
        radarData: [
          { subject: 'Zuurtegraad', A: 5, fullMark: 10 },
          { subject: 'Tannines', A: 5, fullMark: 10 },
          { subject: 'Body', A: 5, fullMark: 10 },
          { subject: 'Zoetheid', A: 2, fullMark: 10 },
          { subject: 'Alcohol', A: 6, fullMark: 10 },
        ],
        foodPairings: {
          classic: ['Gegrilde Zeebaars', 'Oesters'],
          modern: ['Ceviche met Passievrucht', 'Sushi'],
          budget: ['Fish & Chips', 'Pasta Vongole'],
          matchIcon: 'Fish'
        }
      };

      await addDoc(collection(db, 'drinks'), newDrink);
      onAddSuccess?.();
    } catch (error) {
      console.error("Error adding discovered drink:", error);
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Sparkles className="text-primary w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Beverage Discovery</h3>
            <p className="text-xs text-zinc-400">Vind producenten of hun volledige portfolio via AI</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setSearchType('product')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                searchType === 'product' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Zoek Producent via Product
            </button>
            <button
              type="button"
              onClick={() => setSearchType('producer')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                searchType === 'producer' ? 'bg-primary text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Zoek Portfolio via Producent
            </button>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === 'product' ? "bijv. Sassicaia 2018" : "bijv. Tenuta San Guido"}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="bg-white text-black font-bold px-6 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              <span>Ontdek</span>
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {error && (
        <div className={cn(
          "mb-6 p-4 rounded-xl text-sm",
          error.includes('achtergrond') ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
        )}>
          {error}
        </div>
      )}

      {isSearching ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <Loader2 className="animate-spin text-primary" size={40} />
            <div className="text-center">
              <p className="text-white font-bold">AI Sommelier is aan het zoeken...</p>
              <p className="text-xs text-zinc-500">We scannen het web voor de beste resultaten.</p>
            </div>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {results.map((item, idx) => (
              <div key={idx} className="glass-card rounded-2xl overflow-hidden flex h-40 group">
                <div className="w-40 bg-zinc-900 flex items-center justify-center relative shrink-0">
                  <Wine size={48} className="text-zinc-700 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                    <TrendingUp size={10} className="text-primary" />
                    {item.qualityScore}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0">{item.countryFlag}</span>
                        <h4 className="font-bold text-white truncate">{item.brand}</h4>
                      </div>
                      <button
                        onClick={() => handleAddDrink(item)}
                        disabled={isAdding === `${item.brand}-${item.name}`}
                        className="bg-primary/20 text-primary p-1.5 rounded-lg hover:bg-primary/30 transition-all disabled:opacity-50"
                      >
                        {isAdding === `${item.brand}-${item.name}` ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{item.name}</p>
                  </div>

                  <div className="space-y-2">
                    {item.zeroToWino?.elevatorPitch && (
                      <p className="text-[10px] text-zinc-500 line-clamp-2 italic leading-tight">
                        "{item.zeroToWino.elevatorPitch}"
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] uppercase tracking-wider font-bold bg-primary/10 px-1.5 py-0.5 rounded text-primary whitespace-nowrap">
                        {item.profile}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-bold bg-white/5 px-1.5 py-0.5 rounded text-zinc-400 whitespace-nowrap">
                        {item.abv}% ABV
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-bold bg-white/5 px-1.5 py-0.5 rounded text-zinc-400 whitespace-nowrap">
                        {item.year || 'N.V.'}
                      </span>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500 truncate">
                        <Globe size={8} />
                        <span className="truncate">{item.region}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : query && !isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-zinc-500"
          >
            <p>Geen resultaten gevonden voor deze zoekopdracht.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

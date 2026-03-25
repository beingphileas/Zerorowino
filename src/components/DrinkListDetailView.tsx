import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Store, 
  Calendar, 
  CheckCircle2, 
  TrendingUp,
  ChevronRight,
  Wine,
  Beer,
  Flame,
  Martini,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { DrinkList, Drink } from '../types';
import { cn } from '../lib/utils';

interface DrinkListDetailViewProps {
  list: DrinkList;
  onBack: () => void;
  onSelectItem: (item: Drink) => void;
}

export default function DrinkListDetailView({ list, onBack, onSelectItem }: DrinkListDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'category'>('score');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const allCategories = list.items?.map(d => d.category) || [];
    return Array.from(new Set(allCategories)).filter(Boolean);
  }, [list.items]);

  const filteredItems = useMemo(() => {
    let result = (list.items || []).filter(item => 
      (item.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
       item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (filterCategory) {
      result = result.filter(item => item.category === filterCategory);
    }

    return result.sort((a, b) => {
      if (sortBy === 'score') return (b.qualityScore || 0) - (a.qualityScore || 0);
      if (sortBy === 'name') return a.brand.localeCompare(b.brand);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return 0;
    });
  }, [list.items, searchQuery, sortBy, filterCategory]);

  const getIcon = (category: string) => {
    switch (category) {
      case 'Wine': return <Wine size={20} />;
      case 'Beer': return <Beer size={20} />;
      case 'Gin': return <Martini size={20} />;
      default: return <Flame size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Terug naar overzicht</span>
      </button>

      <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 blur-3xl rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-white/5 p-4 rounded-2xl">
              <FileText className="text-primary" size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{list.name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <Store size={16} className="text-zinc-500" />
                  {list.source}
                </span>
                <span className="text-zinc-700">•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-zinc-500" />
                  {list.dateScanned}
                </span>
                <span className="text-zinc-700">•</span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-zinc-500" />
                  {list.itemCount} Items gevonden
                </span>
              </div>
            </div>
          </div>
          
          <div className={cn(
            "px-4 py-2 rounded-xl border font-bold flex items-center gap-2 self-start md:self-center",
            list.status === 'Analyzed' 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
          )}>
            {list.status === 'Analyzed' && <CheckCircle2 size={18} />}
            {list.status}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Geanalyseerde Dranken
            <span className="text-xs font-normal text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
              {filteredItems.length} items
            </span>
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Zoek in lijst..."
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
                <option value="category">Categorie</option>
              </select>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setFilterCategory(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                filterCategory === null 
                  ? "bg-primary text-white" 
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              )}
            >
              Alle Categorieën
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  filterCategory === cat 
                    ? "bg-primary text-white" 
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="glass-card rounded-2xl p-4 flex items-center justify-between group hover:ring-1 hover:ring-primary/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="bg-white/5 p-2.5 rounded-xl shrink-0">
                  {getIcon(item.category)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white group-hover:text-primary transition-colors truncate">{item.brand}</h4>
                    <span className="text-sm shrink-0">{item.countryFlag}</span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{item.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-primary font-black">
                    <TrendingUp size={14} />
                    <span>{item.qualityScore}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{item.category}</p>
                </div>
                <ChevronRight size={18} className="text-zinc-600 group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-zinc-500">Geen dranken gevonden die voldoen aan je zoekopdracht.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

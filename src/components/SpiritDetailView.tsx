import React from 'react';
import { 
  ArrowLeft, 
  Martini, 
  Flame,
  Globe, 
  Droplets, 
  Utensils, 
  Tag, 
  ChevronRight,
  Award,
  Zap,
  CheckCircle2,
  Beaker,
  Sparkles
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';
import { SpiritAnalysis } from '../types';

interface SpiritDetailViewProps {
  spirit: SpiritAnalysis;
  onBack: () => void;
  onDelete: () => void;
  onMoveToCellar: () => void;
  onDiscoverProducer?: (producer: string) => void;
}

export default function SpiritDetailView({ spirit, onBack, onDelete, onMoveToCellar, onDiscoverProducer }: SpiritDetailViewProps) {
  const Icon = spirit.category === 'Gin' ? Martini : Flame;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Terug naar overzicht</span>
        </button>
        <div className="flex gap-3">
          {spirit.subTab === 'Research' && (
            <button 
              onClick={onMoveToCellar}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 transition-all text-sm font-medium"
            >
              Verplaats naar Kelder
            </button>
          )}
          <button 
            onClick={onDelete}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl border border-red-500/20 transition-all text-sm font-medium"
          >
            Verwijder
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Visual & Score */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-zinc-500/10 blur-3xl rounded-full" />
            
            <div className="w-full aspect-square bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10">
              {spirit.imageUrl ? (
                <img src={spirit.imageUrl} alt={spirit.brand} className="w-full h-full object-cover" />
              ) : (
                <Icon size={80} className="text-zinc-400" />
              )}
            </div>
            
            <div className="w-full">
              <h2 className="text-3xl font-bold text-white">{spirit.brand}</h2>
              <p className="text-lg text-zinc-400">{spirit.name}</p>
              <button 
                onClick={() => onDiscoverProducer?.(spirit.brand)}
                className="mt-2 text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <Sparkles size={12} />
                Ontdek meer van deze producent
              </button>
            </div>

            <div className="flex items-center gap-4 w-full pt-4">
              <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">AI Score</p>
                <p className="text-3xl font-black text-white">{spirit.qualityScore}</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Type</p>
                <div className="flex items-center justify-center gap-1 text-primary font-bold">
                  <span>{spirit.category}</span>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3 pt-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <Globe size={18} className="text-zinc-500" />
                <span className="text-sm">{spirit.region}, {spirit.country}</span>
              </div>
              {spirit.abv && (
                <div className="flex items-center gap-3 text-zinc-300">
                  <Droplets size={18} className="text-zinc-500" />
                  <span className="text-sm">{spirit.abv}% ABV</span>
                </div>
              )}
            </div>
          </div>

          {/* Radar Chart Card */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                Smaakprofiel
              </h3>
              <p className="text-primary font-bold text-sm">{spirit.profile}</p>
              {spirit.profileDescription && (
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  {spirit.profileDescription}
                </p>
              )}
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={spirit.radarData}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar
                    name="Intensity"
                    dataKey="A"
                    stroke="#722f37"
                    fill="#722f37"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Analysis Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Zero to Wino Assessment */}
          {spirit.zeroToWino && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <Sparkles className="text-primary w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Zero to Wino Assessment</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-2xl space-y-3 border-primary/20">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest">The Elevator Pitch</h4>
                  <p className="text-zinc-300 leading-relaxed italic">
                    "{spirit.zeroToWino.elevatorPitch}"
                  </p>
                </div>

                <div className="glass-card p-6 rounded-2xl space-y-3 border-primary/20">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest">The 'Why' in Pairing</h4>
                  <p className="text-zinc-300 leading-relaxed">
                    {spirit.zeroToWino.whyPairing}
                  </p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-3 border-primary/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Production Method</h4>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {spirit.zeroToWino.productionType}
                  </span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {spirit.zeroToWino.productionMethod}
                </p>
              </div>
            </div>
          )}

          {/* Taste Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Award size={18} />
              Expert Analyse
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              {spirit.tasteNotes}
            </p>
          </div>

          {/* Botanicals / Cask */}
          {(spirit.botanicals || spirit.caskType) && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Beaker size={16} />
                {spirit.category === 'Gin' ? 'Botanicals' : 'Vatrijping'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(spirit.botanicals || spirit.caskType || []).map((item) => (
                  <span 
                    key={item}
                    className="bg-zinc-800 text-zinc-300 border border-white/10 px-4 py-1.5 rounded-full text-sm font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pairings */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Utensils size={16} />
              Suggesties
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Classic</p>
                <ul className="space-y-2">
                  {spirit.foodPairings.classic.map(item => (
                    <li key={item} className="text-sm text-zinc-300 flex items-center gap-2">
                      <ChevronRight size={12} className="text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Modern</p>
                <ul className="space-y-2">
                  {spirit.foodPairings.modern.map(item => (
                    <li key={item} className="text-sm text-zinc-300 flex items-center gap-2">
                      <ChevronRight size={12} className="text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Budget</p>
                <ul className="space-y-2">
                  {spirit.foodPairings.budget.map(item => (
                    <li key={item} className="text-sm text-zinc-300 flex items-center gap-2">
                      <ChevronRight size={12} className="text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

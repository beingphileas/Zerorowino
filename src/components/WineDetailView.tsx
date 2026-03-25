import React from 'react';
import { 
  ArrowLeft, 
  Wine, 
  Globe, 
  Calendar, 
  Utensils, 
  Tag, 
  ChevronRight,
  Award,
  Zap,
  CheckCircle2,
  Droplets,
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
import { WineAnalysis } from '../types';

interface WineDetailViewProps {
  wine: WineAnalysis;
  onBack: () => void;
  onDelete: () => void;
  onMoveToCellar: () => void;
  onDiscoverProducer?: (producer: string) => void;
}

export default function WineDetailView({ wine, onBack, onDelete, onMoveToCellar, onDiscoverProducer }: WineDetailViewProps) {
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
          {wine.subTab === 'Research' && (
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
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full" />
            
            <div className="w-full aspect-square bg-primary/10 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10">
              {wine.imageUrl ? (
                <img src={wine.imageUrl} alt={wine.brand} className="w-full h-full object-cover" />
              ) : (
                <Wine size={80} className="text-primary" />
              )}
            </div>
            
            <div className="w-full">
              <h2 className="text-3xl font-bold text-white">{wine.brand}</h2>
              <p className="text-lg text-zinc-400">{wine.name}</p>
              <button 
                onClick={() => onDiscoverProducer?.(wine.brand)}
                className="mt-2 text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <Sparkles size={12} />
                Ontdek meer van deze producent
              </button>
            </div>

            <div className="flex items-center gap-4 w-full pt-4">
              <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">AI Score</p>
                <p className="text-3xl font-black text-primary">{wine.qualityScore}</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Rating</p>
                <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold">
                  {wine.personalRating ? (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Sparkles 
                          key={star} 
                          size={12} 
                          fill={wine.personalRating! >= star ? "currentColor" : "none"} 
                          className={wine.personalRating! >= star ? "text-yellow-500" : "text-zinc-700"}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-xs italic">Geen</span>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full space-y-3 pt-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <Globe size={18} className="text-zinc-500" />
                <span className="text-sm">{wine.region}, {wine.country}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <Calendar size={18} className="text-zinc-500" />
                <span className="text-sm">{wine.year || 'N.V.'}</span>
              </div>
              {wine.abv && (
                <div className="flex items-center gap-3 text-zinc-300">
                  <Droplets size={18} className="text-zinc-500" />
                  <span className="text-sm">{wine.abv}% ABV</span>
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
              <p className="text-primary font-bold text-sm">{wine.profile}</p>
              {wine.profileDescription && (
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  {wine.profileDescription}
                </p>
              )}
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={wine.radarData}>
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
          {wine.zeroToWino && (
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
                    "{wine.zeroToWino.elevatorPitch}"
                  </p>
                </div>

                <div className="glass-card p-6 rounded-2xl space-y-3 border-primary/20">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest">The 'Why' in Pairing</h4>
                  <p className="text-zinc-300 leading-relaxed">
                    {wine.zeroToWino.whyPairing}
                  </p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-3 border-primary/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Production Method</h4>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {wine.zeroToWino.productionType}
                  </span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {wine.zeroToWino.productionMethod}
                </p>
              </div>
            </div>
          )}

          {/* Taste Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Award size={18} />
              Sommelier Notities
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              {wine.tasteNotes}
            </p>
          </div>

          {/* Grapes */}
          {wine.grapes && wine.grapes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                Druivensoorten
              </h3>
              <div className="flex flex-wrap gap-2">
                {wine.grapes.map((grape) => (
                  <span 
                    key={grape}
                    className="bg-white/5 text-zinc-300 border border-white/10 px-4 py-1.5 rounded-full text-sm font-medium"
                  >
                    {grape}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Aromas */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={16} />
              Primaire Aroma's
            </h3>
            <div className="flex flex-wrap gap-2">
              {wine.primaryAromas.map((aroma) => (
                <span 
                  key={aroma}
                  className="bg-primary/10 text-primary-foreground border border-primary/20 px-4 py-1.5 rounded-full text-sm font-medium"
                >
                  {aroma}
                </span>
              ))}
            </div>
          </div>

          {/* Pairings */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Utensils size={16} />
              Food Pairings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Classic</p>
                <ul className="space-y-2">
                  {wine.foodPairings.classic.map(item => (
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
                  {wine.foodPairings.modern.map(item => (
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
                  {wine.foodPairings.budget.map(item => (
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

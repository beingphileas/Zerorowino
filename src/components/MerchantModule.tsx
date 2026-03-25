import React, { useState } from 'react';
import { Store, ExternalLink, MapPin, Plus, Search, ChevronRight, Wine } from 'lucide-react';
import { motion } from 'motion/react';
import { Merchant } from '../types';
import { MOCK_MERCHANTS } from '../mockData';

export default function MerchantModule() {
  const [merchants, setMerchants] = useState<Merchant[]>(MOCK_MERCHANTS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMerchants = merchants.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Handelaars</h2>
          <p className="text-sm text-zinc-400">Beheer je favoriete winkels en importeurs.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Zoek handelaar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-64 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary/20">
            <Plus size={18} />
            <span className="font-medium">Nieuwe Handelaar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMerchants.map((merchant) => (
          <motion.div 
            key={merchant.id}
            whileHover={{ y: -4 }}
            className="glass-card rounded-2xl p-6 space-y-4 group cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Store className="text-primary" size={24} />
              </div>
              <a 
                href={merchant.websiteUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-zinc-500 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={18} />
              </a>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{merchant.name}</h3>
              <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                <MapPin size={14} />
                <span>{merchant.location || 'Online'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wine size={16} className="text-zinc-500" />
                <span className="text-sm font-medium text-zinc-300">{merchant.drinkCount} Items</span>
              </div>
              <ChevronRight size={18} className="text-zinc-600 group-hover:text-primary transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

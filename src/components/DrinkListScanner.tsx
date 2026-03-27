import React, { useState, useRef } from 'react';
import { 
  ClipboardList, 
  Upload, 
  Link as LinkIcon, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  FileText,
  TrendingUp,
  Search,
  Store,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { DrinkList, Drink } from '../types';
import { MOCK_LISTS } from '../mockData';
import { analyzeDrinkList, analyzeDrinkListUrl, discoverLinks, analyzeMultipleUrls } from '../services/aiService';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import DrinkListDetailView from './DrinkListDetailView';
import WineDetailView from './WineDetailView';
import BeerDetailView from './BeerDetailView';
import SpiritDetailView from './SpiritDetailView';

import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export default function DrinkListScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanUrl, setScanUrl] = useState('');
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ step: string; percent: number }>({ step: '', percent: 0 });
  const [scanError, setScanError] = useState<string | null>(null);
  const [lists, setLists] = useState<DrinkList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedList, setSelectedList] = useState<DrinkList | null>(null);
  const [selectedItem, setSelectedItem] = useState<Drink | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'drink_lists'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DrinkList[];
      // Sort in memory to avoid index requirement
      setLists(listData.sort((a, b) => b.dateScanned.localeCompare(a.dateScanned)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'drink_lists');
    });

    return () => unsubscribe();
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanUrl || !auth.currentUser) return;
    
    setIsScanning(true);
    setScanError(null);
    
    try {
      const sourceName = new URL(scanUrl).hostname;
      
      // Create background task
      await addDoc(collection(db, 'tasks'), {
        uid: auth.currentUser.uid,
        type: 'menu_analysis',
        status: 'pending',
        progress: 0,
        label: `Scan: ${sourceName}`,
        payload: { 
          sourceName,
          url: scanUrl,
          isDeepScan 
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setShowScanner(false);
      setScanUrl('');
      // Show a message or redirect to Tasks tab
      setScanError("De scan is gestart op de achtergrond. Je kunt de voortgang volgen in het tabblad 'Projecten'.");
    } catch (error: any) {
      console.error("Scan error:", error);
      setScanError("Er is een fout opgetreden bij het starten van de scan.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        await addDoc(collection(db, 'tasks'), {
          uid: auth.currentUser.uid,
          type: 'menu_analysis',
          status: 'pending',
          progress: 0,
          label: `Scan: ${file.name}`,
          payload: { 
            sourceName: file.name,
            images: [base64]
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        setShowScanner(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsScanning(false);
    }
  };

  if (selectedItem) {
    return (
      <div className="relative">
        <button 
          onClick={() => setSelectedItem(null)}
          className="absolute -top-12 left-0 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <X size={20} />
          <span>Terug naar lijst</span>
        </button>
        {selectedItem.category === 'Wine' && (
          <WineDetailView 
            wine={selectedItem} 
            onBack={() => setSelectedItem(null)} 
            onDelete={() => setSelectedItem(null)}
            onMoveToCellar={() => setSelectedItem(null)}
          />
        )}
        {selectedItem.category === 'Beer' && (
          <BeerDetailView 
            beer={selectedItem} 
            onBack={() => setSelectedItem(null)} 
            onDelete={() => setSelectedItem(null)}
            onMoveToCellar={() => setSelectedItem(null)}
          />
        )}
        {['Gin', 'Whiskey', 'Rum', 'Cognac'].includes(selectedItem.category) && (
          <SpiritDetailView 
            spirit={selectedItem as any} 
            onBack={() => setSelectedItem(null)} 
            onDelete={() => setSelectedItem(null)}
            onMoveToCellar={() => setSelectedItem(null)}
          />
        )}
      </div>
    );
  }

  if (selectedList) {
    return (
      <DrinkListDetailView 
        list={selectedList} 
        onBack={() => setSelectedList(null)} 
        onSelectItem={(item) => setSelectedItem(item)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Drankkaarten & Scanners</h2>
          <p className="text-sm text-zinc-400">Scan menu's of assortimenten van restaurants en handelaars.</p>
        </div>
        <button 
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-xl transition-all font-bold"
        >
          <Sparkles size={18} />
          <span>Nieuwe Scan</span>
        </button>
      </div>

      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-8 rounded-3xl max-w-3xl mx-auto relative overflow-hidden"
          >
            <button 
              onClick={() => setShowScanner(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors z-20"
            >
              <X size={24} />
            </button>

            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 blur-3xl rounded-full" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-3 rounded-2xl">
                  <Sparkles className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AI Drink List Crawler</h3>
                  <p className="text-sm text-zinc-400">Plak een URL of upload een PDF/Foto van een menu.</p>
                </div>
              </div>

              <form onSubmit={handleScan} className="space-y-4">
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                  <input 
                    type="url" 
                    placeholder="https://restaurant.nl/wijnkaart"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg"
                    value={scanUrl}
                    onChange={(e) => setScanUrl(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3 px-2">
                  <button
                    type="button"
                    onClick={() => setIsDeepScan(!isDeepScan)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      isDeepScan 
                        ? "bg-primary/20 text-primary ring-1 ring-primary/50" 
                        : "bg-white/5 text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 transition-all",
                      isDeepScan ? "bg-primary border-primary" : "border-zinc-600"
                    )} />
                    Deep Scan (Volledige Site)
                  </button>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                    {isDeepScan ? "Analyseert alle onderliggende pagina's" : "Analyseert alleen deze pagina"}
                  </span>
                </div>

                {isScanning && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span className="text-primary animate-pulse">{scanProgress.step}</span>
                      <span className="text-zinc-500">{scanProgress.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress.percent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {scanError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <X size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-200">{scanError}</p>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button 
                    type="submit"
                    disabled={isScanning || !scanUrl}
                    className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl shadow-primary/20"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span>AI extraheert dranken...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp size={24} />
                        <span>Start Analyse</span>
                      </>
                    )}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition-all cursor-pointer group h-[60px]"
                  >
                    <Upload size={24} className="group-hover:-translate-y-1 transition-transform" />
                    <span className="font-medium">Upload Menu</span>
                  </div>
                </div>
              </form>

              <div className="bg-white/5 rounded-2xl p-4 flex items-start gap-3">
                <Info size={18} className="text-primary mt-0.5" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Onze AI Sommelier zal de kaart scannen, elke fles identificeren en een rapport genereren over de beste prijs/kwaliteit verhoudingen en de balans van het assortiment.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {lists.map((list) => (
          <div 
            key={list.id}
            onClick={() => setSelectedList(list)}
            className="glass-card rounded-2xl p-5 flex items-center justify-between group hover:ring-1 hover:ring-primary/50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/5 p-3 rounded-xl">
                <FileText className="text-zinc-400" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white group-hover:text-primary transition-colors">{list.name}</h4>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Store size={12} />
                    {list.source}
                  </span>
                  <span>•</span>
                  <span>{list.dateScanned}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{list.itemCount} Items</p>
                <div className={cn(
                  "text-[10px] font-bold uppercase tracking-widest flex items-center justify-end gap-1",
                  list.status === 'Analyzed' ? 'text-emerald-500' : 'text-amber-500'
                )}>
                  {list.status === 'Analyzed' && <CheckCircle2 size={10} />}
                  {list.status}
                </div>
              </div>
              <ChevronRight size={20} className="text-zinc-600 group-hover:text-primary transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ size, className }: { size: number, className?: string }) {
  return (
    <div className={cn("bg-primary/20 p-1 rounded-full", className)}>
      <Sparkles size={size - 4} className="text-primary" />
    </div>
  );
}

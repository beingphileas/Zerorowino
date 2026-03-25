import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Wine as WineIcon, 
  Beer, 
  Martini, 
  Flame, 
  Cherry, 
  Droplets, 
  ClipboardList,
  GlassWater,
  LogOut,
  Search,
  Plus,
  LayoutGrid,
  Store,
  LogIn,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Category, SubTab, Drink } from './types';
import WineModule from './components/WineModule';
import SpiritModule from './components/SpiritModule';
import BeerModule from './components/BeerModule';
import MerchantModule from './components/MerchantModule';
import DrinkListScanner from './components/DrinkListScanner';
import TaskRunner from './components/TaskRunner';
import { RefreshCw } from 'lucide-react';

// Firebase
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  setDoc
} from 'firebase/firestore';

const CATEGORIES = [
  { id: 'Lists' as Category, label: 'Drankkaart', icon: ClipboardList, color: 'text-zinc-400' },
  { id: 'Wine' as Category, label: 'Wijn', icon: WineIcon, color: 'text-primary' },
  { id: 'Beer' as Category, label: 'Bier', icon: Beer, color: 'text-amber-500' },
  { id: 'Gin' as Category, label: 'Gin', icon: Martini, color: 'text-emerald-400' },
  { id: 'Whiskey' as Category, label: 'Whiskey', icon: Flame, color: 'text-orange-400' },
  { id: 'Cognac' as Category, label: 'Cognac', icon: Cherry, color: 'text-amber-700' },
  { id: 'Rum' as Category, label: 'Rum', icon: Droplets, color: 'text-yellow-600' },
];

const SUB_TABS = [
  { id: 'Cellar' as SubTab, label: 'My Cellar', icon: LayoutGrid },
  { id: 'Research' as SubTab, label: 'Research', icon: Search },
  { id: 'Merchants' as SubTab, label: 'Handelaars', icon: Store },
  { id: 'Tasks' as SubTab, label: 'Projecten', icon: RefreshCw },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Scanner' | 'Cellar' | 'Lists'>('Cellar');
  const [activeCategory, setActiveCategory] = useState<Category>('Wine');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Cellar');
  const [drinks, setDrinks] = useState<Drink[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Sync user profile
        setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          lastLogin: new Date().toISOString()
        }, { merge: true });

        // Sync drinks
        const q = query(collection(db, 'drinks'), where('uid', '==', currentUser.uid));
        const unsubDrinks = onSnapshot(q, (snapshot) => {
          const drinksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Drink[];
          setDrinks(drinksData);
        }, (error) => {
          console.error("Firestore Error (Drinks):", error);
        });

        return () => unsubDrinks();
      } else {
        setDrinks([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const content = useMemo(() => {
    if (activeTab === 'Scanner') {
      return (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">Magic Scanner</h2>
            <p className="text-zinc-400">Scan een etiket of plak een URL voor AI analyse.</p>
          </div>
          <div className="max-w-md mx-auto">
            <WineModule subTab="Research" setSubTab={setActiveSubTab} drinks={drinks} setDrinks={setDrinks} forceShowForm={true} />
          </div>
        </div>
      );
    }

    if (activeTab === 'Lists') {
      return <DrinkListScanner />;
    }

    return (
      <div className="space-y-8">
        <nav className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.filter(c => c.id !== 'Lists').map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-full transition-all whitespace-nowrap",
                activeCategory === cat.id 
                  ? "bg-white/10 text-white ring-1 ring-white/20" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              <cat.icon className={cn("w-5 h-5", cat.color)} />
              <span className="font-medium">{cat.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl w-fit">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeSubTab === tab.id
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeCategory === 'Wine' && <WineModule subTab={activeSubTab} setSubTab={setActiveSubTab} drinks={drinks} setDrinks={setDrinks} />}
          {activeCategory === 'Beer' && <BeerModule subTab={activeSubTab} setSubTab={setActiveSubTab} drinks={drinks} setDrinks={setDrinks} />}
          {['Gin', 'Whiskey', 'Rum', 'Cognac'].includes(activeCategory) && (
            <SpiritModule category={activeCategory as any} subTab={activeSubTab} setSubTab={setActiveSubTab} drinks={drinks} setDrinks={setDrinks} />
          )}
        </div>
      </div>
    );
  }, [activeTab, activeCategory, activeSubTab, drinks, setActiveSubTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 rounded-3xl max-w-md w-full space-y-8"
        >
          <div className="bg-primary p-4 rounded-2xl w-fit mx-auto">
            <GlassWater className="text-white w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">From Zero to Wino</h1>
            <p className="text-zinc-400">Word een expert met BramBrass Beverage Intelligence.</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-xl"
          >
            <LogIn size={20} />
            <span>Inloggen met Google</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TaskRunner />
      <header className="sticky top-0 z-50 glass-morphism px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <GlassWater className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Zero to Wino</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-4 border-r border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white leading-none">{user.displayName}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Lid sinds 2024</p>
            </div>
            <img 
              src={user.photoURL || ''} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border border-white/20"
              referrerPolicy="no-referrer"
            />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 pb-24 space-y-8">
        {activeTab === 'Cellar' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welkom terug, {user.displayName?.split(' ')[0]}!</h2>
            <p className="text-zinc-400 text-sm">Je hebt momenteel {drinks.length} items in je collectie.</p>
          </div>
        )}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${activeCategory}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-morphism border-t border-white/10 px-6 py-3 flex items-center justify-around">
        <button 
          onClick={() => setActiveTab('Scanner')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'Scanner' ? "text-primary" : "text-zinc-500"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'Scanner' ? "bg-primary/20" : ""
          )}>
            <Search size={24} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Scanner</span>
        </button>

        <button 
          onClick={() => setActiveTab('Cellar')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'Cellar' ? "text-primary" : "text-zinc-500"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'Cellar' ? "bg-primary/20" : ""
          )}>
            <LayoutGrid size={24} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">My Cellar</span>
        </button>

        <button 
          onClick={() => setActiveTab('Lists')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'Lists' ? "text-primary" : "text-zinc-500"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'Lists' ? "bg-primary/20" : ""
          )}>
            <ClipboardList size={24} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Wine Lists</span>
        </button>
      </nav>
    </div>
  );
}

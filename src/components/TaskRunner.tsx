import React, { useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { AITask, Drink } from '../types';
import { analyzeDrinkImage, discoverProducerByProduct, discoverProductsByProducer, analyzeDrinkList } from '../services/aiService';
import { getCountryFlag } from '../lib/utils';

// Helper to generate radar data
const generateRadarData = (profile: string, category: string = 'Wine') => {
  if (category === 'Beer') {
    return [
      { subject: 'Bitterheid', A: Math.floor(Math.random() * 6) + 4, fullMark: 10 },
      { subject: 'Zoetheid', A: Math.floor(Math.random() * 5) + 3, fullMark: 10 },
      { subject: 'Body', A: Math.floor(Math.random() * 5) + 4, fullMark: 10 },
      { subject: 'Koolzuur', A: Math.floor(Math.random() * 4) + 5, fullMark: 10 },
      { subject: 'Hop', A: Math.floor(Math.random() * 6) + 4, fullMark: 10 },
    ];
  }

  const base = [
    { subject: 'Zuurtegraad', A: 5, fullMark: 10 },
    { subject: 'Tannines', A: 5, fullMark: 10 },
    { subject: 'Body', A: 5, fullMark: 10 },
    { subject: 'Zoetheid', A: 2, fullMark: 10 },
    { subject: 'Alcohol', A: 6, fullMark: 10 },
  ];
  if (profile.includes('Light & Fresh')) { base[0].A = 8; base[1].A = 2; base[2].A = 3; }
  else if (profile.includes('Powerful & Full') || profile.includes('Powerful & Complex')) { base[0].A = 6; base[1].A = 8; base[2].A = 8; base[4].A = 8; }
  else if (profile.includes('Medium & Smooth')) { base[0].A = 5; base[1].A = 5; base[2].A = 6; }
  else if (profile.includes('Bubbles')) { base[0].A = 8; base[1].A = 1; base[2].A = 4; }
  return base.map(p => ({ ...p, A: Math.max(1, Math.min(10, p.A + (Math.floor(Math.random() * 3) - 1))) }));
};

const generateFoodPairings = (profile: string, category: string = 'Wine') => {
  if (category === 'Beer') {
    return { classic: ['Frietjes', 'Stoofvlees'], modern: ['Gekruide Aziatische gerechten', 'Burgers'], budget: ['Nootjes', 'Kaasblokjes'], matchIcon: 'Meat' as const };
  }

  if (profile.startsWith('WIT')) {
    return { classic: ['Gegrilde Zeebaars', 'Oesters'], modern: ['Ceviche met Passievrucht', 'Sushi'], budget: ['Fish & Chips', 'Pasta Vongole'], matchIcon: 'Fish' as const };
  } else if (profile.startsWith('ROOD')) {
    return { classic: ['Lamsbout met Rozemarijn', 'Entrecôte'], modern: ['Geroosterde Eend met Kersen', 'Hertenbiefstuk'], budget: ['Bolognese', 'Pizza met Salami'], matchIcon: 'Meat' as const };
  } else if (profile.includes('Rosé')) {
    return { classic: ['Salade Niçoise', 'Gegrilde Gamba\'s'], modern: ['Watermeloen & Feta Salade', 'Tapas'], budget: ['Quiche', 'Picknick Snacks'], matchIcon: 'Veggie' as const };
  }
  return { classic: ['Kaasplankje', 'Charcuterie'], modern: ['Fusion Tapas', 'Gevulde Portobello'], budget: ['Stokbrood met Dips', 'Hartige Taart'], matchIcon: 'Cheese' as const };
};

const TaskRunner: React.FC = () => {
  const processingTasks = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'tasks'),
      where('uid', '==', auth.currentUser.uid),
      where('status', 'in', ['pending', 'processing'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach(async (taskDoc) => {
        const task = { id: taskDoc.id, ...taskDoc.data() } as AITask;
        
        if (processingTasks.current.has(task.id)) return;
        
        // Mark as processing locally to avoid duplicate triggers
        processingTasks.current.add(task.id);
        
        try {
          await runTask(task);
        } catch (error) {
          console.error(`Task ${task.id} failed:`, error);
          await updateDoc(doc(db, 'tasks', task.id), {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
            updatedAt: new Date().toISOString()
          });
        } finally {
          processingTasks.current.delete(task.id);
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const runTask = async (task: AITask) => {
    const taskRef = doc(db, 'tasks', task.id);
    
    // Update status to processing if it was pending
    if (task.status === 'pending') {
      await updateDoc(taskRef, { status: 'processing', progress: 10, updatedAt: new Date().toISOString() });
    }

    switch (task.type) {
      case 'portfolio_search': {
        const { producerName, category } = (task as any).payload;
        
        // Stage 1: Get names
        await updateDoc(taskRef, { progress: 20, updatedAt: new Date().toISOString() });
        const results = await discoverProductsByProducer(producerName, category);
        
        // Stage 2: Save results to drinks collection for the user to see in Research tab
        await updateDoc(taskRef, { progress: 50, updatedAt: new Date().toISOString() });
        
        for (const drink of results) {
          const profile = drink.profile || 'WIT: Medium & Smooth';
          const country = drink.country || 'Onbekend Land';
          
          const newDrink = {
            ...drink,
            uid: auth.currentUser!.uid,
            category: category,
            country: country,
            countryFlag: drink.countryFlag || getCountryFlag(country),
            qualityScore: 80,
            personalRating: 0,
            entryMethod: 'url',
            subTab: 'Research',
            foodPairings: generateFoodPairings(profile, category),
            radarData: generateRadarData(profile, category),
            createdAt: new Date().toISOString()
          };
          
          await addDoc(collection(db, 'drinks'), newDrink);
        }
        
        await updateDoc(taskRef, { 
          status: 'completed', 
          progress: 100, 
          resultCount: results.length,
          updatedAt: new Date().toISOString() 
        });
        break;
      }

      case 'product_search': {
        const { productName, category } = (task as any).payload;
        await updateDoc(taskRef, { progress: 30, updatedAt: new Date().toISOString() });
        
        const aiData = await discoverProducerByProduct(productName, category);
        if (aiData && aiData.length > 0) {
          const data = aiData[0];
          const profile = data.profile || 'WIT: Medium & Smooth';
          const country = data.country || 'Onbekend Land';
          
          const newDrink = {
            uid: auth.currentUser!.uid,
            category: category,
            brand: data.brand || 'Nieuwe Producent',
            name: data.name || 'Nieuw Product',
            region: data.region || 'Onbekende Regio',
            country: country,
            countryFlag: data.countryFlag || getCountryFlag(country),
            year: data.year || new Date().getFullYear(),
            abv: data.abv || 0,
            qualityScore: 80, // Default
            personalRating: 0,
            entryMethod: 'manual',
            subTab: 'Cellar',
            imageUrl: data.imageUrl || '',
            tasteNotes: data.tasteNotes || "Een prachtig voorbeeld van vakmanschap.",
            primaryAromas: data.primaryAromas || ['Fruit'],
            grapes: (data as any).grapes || [],
            profile: profile,
            profileDescription: data.profileDescription || '',
            profileIcon: data.profileIcon || '🍷',
            zeroToWino: data.zeroToWino || {
              elevatorPitch: "Een toegankelijke drank die verrast.",
              whyPairing: "De structuur balanceert perfect.",
              productionMethod: "Traditionele methode.",
              productionType: 'Classic'
            },
            radarData: generateRadarData(profile, category),
            foodPairings: generateFoodPairings(profile, category),
            createdAt: new Date().toISOString()
          };
          
          await addDoc(collection(db, 'drinks'), newDrink);
          
          await updateDoc(taskRef, { 
            status: 'completed', 
            progress: 100, 
            resultCount: 1,
            updatedAt: new Date().toISOString() 
          });
        } else {
          throw new Error("Geen resultaten gevonden voor dit product.");
        }
        break;
      }

      case 'image_analysis': {
        const { base64Image } = (task as any).payload;
        await updateDoc(taskRef, { progress: 30, updatedAt: new Date().toISOString() });
        
        const result = await analyzeDrinkImage(base64Image);
        if (result) {
          // Auto-add to cellar if it was a scan
          const newDrink = {
            ...result,
            uid: auth.currentUser!.uid,
            entryMethod: 'scan',
            subTab: 'Cellar',
            personalRating: 0,
            foodPairings: generateFoodPairings(result.profile, result.category),
            radarData: generateRadarData(result.profile, result.category),
            createdAt: new Date().toISOString()
          };
          await addDoc(collection(db, 'drinks'), newDrink);
          
          await updateDoc(taskRef, { 
            status: 'completed', 
            progress: 100, 
            resultCount: 1,
            updatedAt: new Date().toISOString() 
          });
        } else {
          throw new Error("Geen drank herkend op de afbeelding.");
        }
        break;
      }

      case 'menu_analysis': {
        const { images, sourceName } = (task as any).payload;
        await updateDoc(taskRef, { progress: 20, updatedAt: new Date().toISOString() });
        
        const results = await analyzeDrinkList(images);
        
        // Save to drink_lists collection
        const newList = {
          uid: auth.currentUser!.uid,
          name: `Scan van ${sourceName || 'geüpload bestand'}`,
          source: sourceName || 'Geüpload bestand',
          dateScanned: new Date().toISOString().split('T')[0],
          itemCount: results.length,
          status: 'Analyzed',
          items: results.map(item => ({
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            qualityScore: item.qualityScore || 80,
            entryMethod: 'scan',
            subTab: 'Research',
            radarData: generateRadarData(item.profile || '', item.category),
            foodPairings: generateFoodPairings(item.profile || '', item.category)
          })),
          createdAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'drink_lists'), newList);
        
        await updateDoc(taskRef, { 
          status: 'completed', 
          progress: 100, 
          resultCount: results.length,
          updatedAt: new Date().toISOString() 
        });
        break;
      }

      default:
        await updateDoc(taskRef, { status: 'completed', progress: 100, updatedAt: new Date().toISOString() });
    }
  };

  return null; // Invisible component
};

export default TaskRunner;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, XCircle, Clock, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { AITask } from '../types';
import { cn } from '../lib/utils';

const TaskCenter: React.FC = () => {
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'tasks'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AITask[];
      setTasks(taskList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getStatusIcon = (status: AITask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-green-500" size={20} />;
      case 'failed': return <XCircle className="text-red-500" size={20} />;
      case 'processing': return <Loader2 className="text-primary animate-spin" size={20} />;
      default: return <Clock className="text-zinc-500" size={20} />;
    }
  };

  const getStatusText = (status: AITask['status']) => {
    switch (status) {
      case 'completed': return 'Voltooid';
      case 'failed': return 'Gefaald';
      case 'processing': return 'Bezig...';
      default: return 'In wachtrij';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-zinc-400">Projecten laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">AI Projecten & Taken</h2>
        <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded text-zinc-400">
          {tasks.length} Totaal
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <RefreshCw size={48} className="text-zinc-700 mb-4 opacity-20" />
          <p className="text-zinc-400 font-medium">Geen actieve of recente projecten</p>
          <p className="text-sm text-zinc-500 max-w-xs mt-2">
            Start een AI Sommelier analyse of een portfolio scan om hier taken te zien.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card rounded-2xl p-4 flex items-center gap-4 group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  task.status === 'completed' ? "bg-green-500/10" : 
                  task.status === 'failed' ? "bg-red-500/10" : "bg-primary/10"
                )}>
                  {getStatusIcon(task.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-white truncate">{task.label}</h3>
                    <span className={cn(
                      "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                      task.status === 'completed' ? "bg-green-500/20 text-green-500" :
                      task.status === 'failed' ? "bg-red-500/20 text-red-500" :
                      "bg-primary/20 text-primary"
                    )}>
                      {getStatusText(task.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>{new Date(task.createdAt).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className="capitalize">{task.type.replace('_', ' ')}</span>
                    {task.resultCount !== undefined && (
                      <>
                        <span>•</span>
                        <span>{task.resultCount} resultaten</span>
                      </>
                    )}
                  </div>

                  {task.status === 'processing' && (
                    <div className="mt-3 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}

                  {task.error && (
                    <p className="mt-2 text-[10px] text-red-400 line-clamp-1">{task.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TaskCenter;

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Power } from 'lucide-react';

interface OSSimulationProps {
  onPowerOff: () => void;
  startState?: 'post' | 'os';
}

export default function OSSimulation({ onPowerOff, startState = 'post' }: OSSimulationProps) {
  const [stage, setStage] = useState<'post' | 'os'>(startState);
  const [logIndex, setLogIndex] = useState(0);

  const logs = [
    "BIOS Date 05/09/2026 07:15:22 Ver 1.00",
    "CPU: AMD Ryzen Processor - Detected",
    "Memory: 32768MB OK",
    "Initializing USB Controllers.. Done.",
    "Auto-Detecting NVMe M.2 SSD... Found.",
    "Auto-Detecting SATA Port 0... 2TB HDD Found.",
    "GPU: NVIDIA RTX Series VGA BIOS - Loaded",
    "System Power... OK (850W PSU)",
    "Checking NVRAM.. Update OK",
    "Booting OS..."
  ];

  useEffect(() => {
    if (stage === 'post') {
      const timer = setInterval(() => {
        setLogIndex(prev => {
          if (prev < logs.length - 1) return prev + 1;
          clearInterval(timer);
          setTimeout(() => setStage('os'), 1000);
          return prev;
        });
      }, 500);
      return () => clearInterval(timer);
    }
  }, [stage]);

  return (
    <div className="flex flex-col h-screen text-slate-300 w-full font-mono bg-[#080809] select-none overflow-hidden relative items-center justify-center p-8">
      {/* Monitor Bezel */}
      <div className="w-full max-w-5xl aspect-video bg-[#0c0c0e] border-[16px] border-[#141415] rounded-xl shadow-2xl overflow-hidden relative flex flex-col z-10">
        {stage === 'post' && (
          <div className="p-8 flex flex-col gap-2 flex-1 pt-12">
            <AnimatePresence>
              {logs.slice(0, logIndex + 1).map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-emerald-400 text-sm md:text-base font-bold"
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {logIndex === logs.length - 1 && stage === 'post' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 text-emerald-400 text-sm md:text-base animate-pulse font-bold"
                >
                  _
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {stage === 'os' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 1 }}
            className="flex-1 bg-gradient-to-br from-blue-900 to-slate-900 flex flex-col relative"
          >
            {/* Desktop Icons */}
            <div className="p-6 flex flex-col gap-6">
              <div className="w-20 h-20 flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg group-hover:bg-indigo-400 transition-colors">
                  <div className="w-6 h-6 bg-white rounded-sm"></div>
                </div>
                <span className="text-xs font-sans font-medium text-white drop-shadow-md">My PC</span>
              </div>
              <div className="w-20 h-20 flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg group-hover:bg-emerald-400 transition-colors">
                  <div className="w-7 h-5 bg-white rounded-sm"></div>
                </div>
                <span className="text-xs font-sans font-medium text-white drop-shadow-md">Browser</span>
              </div>
            </div>

            {/* Taskbar */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/60 backdrop-blur-md flex items-center px-4 justify-between border-t border-white/10">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-md bg-blue-500 flex items-center justify-center hover:bg-blue-400 cursor-pointer transition-colors shadow-inner drop-shadow-md">
                  <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                    <div className="bg-white rounded-sm"></div>
                    <div className="bg-white rounded-sm"></div>
                    <div className="bg-white rounded-sm"></div>
                    <div className="bg-white rounded-sm"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-sm font-sans font-medium text-white drop-shadow">{new Date().toLocaleTimeString()}</div>
                <button 
                  onClick={onPowerOff}
                  className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all shadow-lg active:scale-95"
                  title="Shut Down"
                >
                  <Power className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Monitor Stand */}
      <div className="flex flex-col items-center z-0 -mt-2">
        <div className="w-32 h-24 bg-gradient-to-b from-[#141415] to-[#0c0c0e] shadow-2xl"></div>
        <div className="w-80 h-3 bg-gradient-to-r from-[#141415] via-[#1a1a1c] to-[#141415] rounded-full shadow-2xl"></div>
      </div>
    </div>
  );
}

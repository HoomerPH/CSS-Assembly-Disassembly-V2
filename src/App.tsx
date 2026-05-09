import React, { useState } from 'react';
import { Monitor, Cpu, ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';
import RearPanelView from './RearPanelView';
import AssemblyView from './AssemblyView';

import OSSimulation from './OSSimulation';

type SimulationMode = 'menu' | 'rear-assembly' | 'rear-disassembly' | 'pc-assembly' | 'pc-disassembly' | 'full-assembly' | 'full-disassembly';

export default function App() {
  const [mode, setMode] = useState<SimulationMode>('menu');
  const [fullStage, setFullStage] = useState<number>(0);

  const changeMode = (newMode: SimulationMode) => {
    setMode(newMode);
    setFullStage(0);
  };

  if (mode === 'full-assembly') {
    if (fullStage === 0) {
      return <RearPanelView mode="assembly" onBack={() => setMode('menu')} onNext={() => setFullStage(1)} nextLabel="Proceed to Components Assembly" />;
    }
    if (fullStage === 1) {
      // After assembly, they power up (handled in AssemblyView), and when OS turns off, it returns to Menu
      return <AssemblyView mode="assembly" onBack={() => setMode('menu')} onNext={() => setMode('menu')} nextLabel="Simulation Complete - Return to Menu" />;
    }
  }

  if (mode === 'full-disassembly') {
    if (fullStage === 0) {
      return (
        <div className="relative">
          <button 
            onClick={() => setMode('menu')}
            className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#1f1f23] text-white rounded-md transition-colors border border-[#333] hover:bg-[#2a2a30]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </button>
          <OSSimulation startState="os" onPowerOff={() => setFullStage(1)} />
        </div>
      );
    }
    if (fullStage === 1) {
      return <AssemblyView mode="disassembly" onBack={() => setMode('menu')} onNext={() => setFullStage(2)} nextLabel="Proceed to Rear Panel Disassembly" />;
    }
    if (fullStage === 2) {
      return <RearPanelView mode="disassembly" onBack={() => setMode('menu')} onNext={() => setMode('menu')} nextLabel="Simulation Complete - Return to Menu" />;
    }
  }

  if (mode === 'rear-assembly') {
    return <RearPanelView mode="assembly" onBack={() => setMode('menu')} />;
  }

  if (mode === 'rear-disassembly') {
    return <RearPanelView mode="disassembly" onBack={() => setMode('menu')} />;
  }

  if (mode === 'pc-assembly') {
    return <AssemblyView mode="assembly" onBack={() => setMode('menu')} />;
  }

  if (mode === 'pc-disassembly') {
    return <AssemblyView mode="disassembly" onBack={() => setMode('menu')} />;
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#d1d1d1] font-sans flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0c0c0e] to-[#0c0c0e] relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMEg0MFY0MEgwWiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDQwTDQwIDQwIiBzdHJva2U9IiMxZjFmMjMiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik00MCAwTDQwIDQwIiBzdHJva2U9IiMxZjFmMjMiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-30" />
      
      <div className="z-10 text-center max-w-3xl w-full">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 text-sm font-mono mb-8">
          <BookOpen className="w-4 h-4 text-[#a88d5e]" />
          <span>hardware_fundamentals_v2.5A</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6 drop-shadow-2xl">
          PC Hardware Simulator
        </h1>
        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Learn how computers are put together, from core components to external peripherals. Choose a simulation scenario to begin.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* Card: PC Assembly */}
          <button 
            onClick={() => setMode('pc-assembly')}
            className="group relative bg-[#141415] hover:bg-slate-800 border border-[#222] hover:border-emerald-500/50 p-6 rounded-2xl text-left transition-all duration-300 shadow-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-[#1f1f23] w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">PC Assembly</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Construct a complete system unit by installing the CPU, RAM, GPU, and connecting power supplies to the motherboard.
            </p>
            <div className="flex items-center text-emerald-500 text-sm font-medium mt-auto group-hover:translate-x-2 transition-transform">
              Start Simulation <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>

          {/* Card: PC Disassembly */}
          <button 
            onClick={() => setMode('pc-disassembly')}
            className="group relative bg-[#141415] hover:bg-slate-800 border border-[#222] hover:border-red-500/50 p-6 rounded-2xl text-left transition-all duration-300 shadow-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-[#1f1f23] w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">PC Disassembly</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Carefully remove all components from a fully built PC. Learn the correct order for safely disconnecting parts.
            </p>
            <div className="flex items-center text-red-500 text-sm font-medium mt-auto group-hover:translate-x-2 transition-transform">
              Start Simulation <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>

          {/* Card: Rear Panel Assembly */}
          <button 
            onClick={() => setMode('rear-assembly')}
            className="group relative bg-[#141415] hover:bg-slate-800 border border-[#222] hover:border-[#3b82f6]/50 p-6 rounded-2xl text-left transition-all duration-300 shadow-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-[#1f1f23] w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Monitor className="w-6 h-6 text-[#3b82f6]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Rear Panel Assembly</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Connect external peripherals and power cables to the rear I/O shield and an external AVR setup.
            </p>
            <div className="flex items-center text-[#3b82f6] text-sm font-medium mt-auto group-hover:translate-x-2 transition-transform">
              Start Simulation <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>

          {/* Card: Rear Panel Disconnection */}
          <button 
            onClick={() => setMode('rear-disassembly')}
            className="group relative bg-[#141415] hover:bg-slate-800 border border-[#222] hover:border-amber-500/50 p-6 rounded-2xl text-left transition-all duration-300 shadow-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-[#1f1f23] w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Monitor className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Rear Panel Disconnection</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Safely disconnect all power and data cables from the workstation and AVR to prepare for relocation.
            </p>
            <div className="flex items-center text-amber-500 text-sm font-medium mt-auto group-hover:translate-x-2 transition-transform">
              Start Simulation <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </button>

        {/* Card: Full Assembly Scene */}
          <button 
            onClick={() => changeMode('full-assembly')}
            className="group relative bg-[#141415] hover:bg-slate-800 border border-[#222] hover:border-emerald-400/50 p-6 rounded-2xl text-left transition-all duration-300 shadow-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-400/50 md:col-span-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-start gap-6">
              <div className="bg-[#1f1f23] w-14 h-14 shrink-0 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Monitor className="w-6 h-6 text-emerald-400 absolute opacity-50 translate-x-1 translate-y-1" />
                <Cpu className="w-6 h-6 text-emerald-400 relative z-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Full Assembly Scenario</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-xl">
                  Complete end-to-end setup. Start by connecting cables on the Rear Panel, then proceed to assemble internal components, and finally power on the PC to verify success.
                </p>
                <div className="flex items-center text-emerald-400 text-sm font-medium mt-auto group-hover:translate-x-2 transition-transform">
                  Start Full Scenario <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>
          </button>

          {/* Card: Full Disassembly Scene */}
          <button 
            onClick={() => changeMode('full-disassembly')}
            className="group relative bg-[#141415] hover:bg-slate-800 border border-[#222] hover:border-red-400/50 p-6 rounded-2xl text-left transition-all duration-300 shadow-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-400/50 md:col-span-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-start gap-6">
              <div className="bg-[#1f1f23] w-14 h-14 shrink-0 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Cpu className="w-6 h-6 text-red-400 absolute opacity-50 translate-x-1 translate-y-1" />
                <Monitor className="w-6 h-6 text-red-400 relative z-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Full Disassembly Scenario</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-xl">
                  Complete end-to-end teardown. Start by safely turning off the running PC, disassemble all internal components, and finish by disconnecting external cables.
                </p>
                <div className="flex items-center text-red-400 text-sm font-medium mt-auto group-hover:translate-x-2 transition-transform">
                  Start Full Scenario <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}

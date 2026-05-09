import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, ArrowLeft, CheckCircle2 } from 'lucide-react';

import OSSimulation from './OSSimulation';

interface ComponentItem {
  id: string;
  name: string;
  description: string;
  type: string;
  color: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
}

const PC_COMPONENTS: ComponentItem[] = [
  { id: 'cpu', name: 'CPU', description: 'The brain of the computer, performs calculations and instructions.', type: 'cpu', color: '#94a3b8', startX: 1040, startY: 315, targetX: 530, targetY: 230, width: 60, height: 60 },
  { id: 'cpuFan', name: 'CPU Fan', description: 'Cools the CPU to prevent overheating during operation.', type: 'cooler', color: '#3b82f6', startX: 910, startY: 300, targetX: 515, targetY: 215, width: 90, height: 90 },
  { id: 'ram1', name: 'RAM Stick 1', description: 'Provides fast, temporary memory for running applications.', type: 'ram', color: '#f59e0b', startX: 920, startY: 420, targetX: 650, targetY: 210, width: 10, height: 130 },
  { id: 'ram2', name: 'RAM Stick 2', description: 'Provides fast, temporary memory for running applications.', type: 'ram', color: '#f59e0b', startX: 960, startY: 420, targetX: 670, targetY: 210, width: 10, height: 130 },
  { id: 'nvme', name: 'NVMe M.2 SSD', description: 'High-speed permanent storage for OS and files.', type: 'storage', color: '#8b5cf6', startX: 1010, startY: 480, targetX: 530, targetY: 340, width: 90, height: 15 },
  { id: 'gpu', name: 'Graphics Card (GPU)', description: 'Handles rendering of graphics, videos, and 3D applications.', type: 'gpu', color: '#ef4444', startX: 900, startY: 220, targetX: 430, targetY: 508, width: 260, height: 40 },
  { id: 'psu', name: 'ATX Power Supply', description: 'Converts wall power into usable power for all components.', type: 'power', color: '#64748b', startX: 910, startY: 80, targetX: 200, targetY: 650, width: 120, height: 100 },
  { id: 'hdd', name: 'Hard Disk Drive (HDD)', description: 'Mass storage drive for large files and backups.', type: 'storage', color: '#ec4899', startX: 1060, startY: 75, targetX: 180, targetY: 420, width: 80, height: 110 },
];

export default function AssemblyView({ mode, onBack, onNext, nextLabel }: { mode: 'assembly' | 'disassembly', onBack: () => void, onNext?: () => void, nextLabel?: string }) {
  const [installed, setInstalled] = useState<Record<string, boolean>>(() => {
    if (mode === 'disassembly') {
      const all: Record<string, boolean> = {};
      PC_COMPONENTS.forEach(c => all[c.id] = true);
      return all;
    }
    return {};
  });
  const [cables, setCables] = useState(() => ({
    eps: mode === 'disassembly',
    atx: mode === 'disassembly',
    sata: mode === 'disassembly',
  }));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [chassisClosed, setChassisClosed] = useState(false);
  const [powerOnStage, setPowerOnStage] = useState<'idle' | 'post' | 'os'>('idle');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const getSVGPoint = (e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse() as DOMMatrix);
  };

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    if (chassisClosed) return; // Cannot modify components if chassis is closed

    setWarningMessage(null); // Clear any previous warning

    if (mode === 'assembly') {
      if (id === 'cpuFan' && !installed['cpu']) return; // Must install CPU first
    } else {
      if (id === 'cpu' && installed['cpuFan']) {
        setWarningMessage('The CPU Cooler must be removed before the CPU.');
        return;
      }
      if (id === 'psu' && (cables.eps || cables.atx)) {
        setWarningMessage('Please disconnect the 4-pin and 24-pin cables before removing the Power Supply.');
        return;
      }
      if (id === 'hdd' && cables.sata) {
        setWarningMessage('Please disconnect the SATA cable before removing the HDD.');
        return;
      }
    }

    setDraggingId(id);
    setDragPos(getSVGPoint(e));
    if (id === 'cable-eps') setCables(prev => ({ ...prev, eps: false }));
    else if (id === 'cable-atx') setCables(prev => ({ ...prev, atx: false }));
    else if (id === 'cable-sata') setCables(prev => ({ ...prev, sata: false }));
    else if (installed[id]) setInstalled(prev => ({ ...prev, [id]: false }));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId) {
      setDragPos(getSVGPoint(e));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      if (mode === 'assembly') {
        if (draggingId === 'cable-eps') {
          if (Math.hypot(dragPos.x - 465, dragPos.y - 177) < 50) {
            setCables(prev => ({ ...prev, eps: true }));
          }
        } else if (draggingId === 'cable-atx') {
          if (Math.hypot(dragPos.x - 760, dragPos.y - 390) < 50) {
            setCables(prev => ({ ...prev, atx: true }));
          }
        } else if (draggingId === 'cable-sata') {
          if (Math.hypot(dragPos.x - 770, dragPos.y - 570) < 50) {
            setCables(prev => ({ ...prev, sata: true }));
          }
        } else {
          const component = PC_COMPONENTS.find(c => c.id === draggingId);
          if (component) {
            const dist = Math.hypot(dragPos.x - (component.targetX + component.width / 2), dragPos.y - (component.targetY + component.height / 2));
            if (dist < 60) { // snap threshold
              setInstalled(prev => ({ ...prev, [draggingId]: true }));
            }
          }
        }
      } else {
        if (draggingId === 'cable-eps') {
          if (dragPos.x > 750) setCables(prev => ({ ...prev, eps: false }));
        } else if (draggingId === 'cable-atx') {
          if (dragPos.x > 750) setCables(prev => ({ ...prev, atx: false }));
        } else if (draggingId === 'cable-sata') {
          if (dragPos.x > 750) setCables(prev => ({ ...prev, sata: false }));
        }

        const component = PC_COMPONENTS.find(c => c.id === draggingId);
        if (component) {
          const distToDropArea = dragPos.x > 750; // simple visual check
          if (distToDropArea) {
            setInstalled(prev => ({ ...prev, [draggingId]: false }));
          }
        }
      }
      setDraggingId(null);
    }
  };

  const allInstalled = PC_COMPONENTS.every(c => installed[c.id]);
  const isComplete = mode === 'assembly'
    ? allInstalled && cables.eps && cables.atx && cables.sata
    : Object.values(installed).every(val => !val) && !cables.eps && !cables.atx && !cables.sata;

  const getTooltipContent = (id: string) => {
    if (id.startsWith('cable-')) {
      if (id === 'cable-eps') return { name: '4-Pin CPU Power', desc: 'Delivers dedicated power to the CPU.' };
      if (id === 'cable-atx') return { name: '24-Pin ATX Power', desc: 'Supplies main power to the motherboard and components.' };
      if (id === 'cable-sata') return { name: 'SATA Data Cable', desc: 'Transfers data between the motherboard and storage drives.' };
      return { name: 'Cable', desc: 'Connects components.' };
    }
    const comp = PC_COMPONENTS.find(c => c.id === id);
    return { name: comp?.name || '', desc: comp?.description || '' };
  };

  const isRemovable = (id: string) => {
    if (mode !== 'disassembly') return false;
    
    if (id === 'cable-eps') return cables.eps;
    if (id === 'cable-atx') return cables.atx;
    if (id === 'cable-sata') return cables.sata;

    if (!installed[id as keyof typeof installed]) return false;

    if (id === 'cpu') return !installed['cpuFan'];
    if (id === 'psu') return !cables.eps && !cables.atx;
    if (id === 'hdd') return !cables.sata;
    
    return true;
  };

  if (powerOnStage === 'post' || powerOnStage === 'os') {
    return <OSSimulation onPowerOff={() => {
      setPowerOnStage('idle');
      if (onNext) onNext();
    }} />;
  }

  return (
    <div className="flex flex-col h-screen text-slate-300 w-full font-sans select-none overflow-hidden relative">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 bg-[#080809]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="assembly-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f1f23" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#assembly-grid)" />
        </svg>
      </div>

      <header className="p-4 border-b border-[#1f1f23] flex flex-col md:flex-row items-center justify-between gap-4 bg-[#080809]/80 backdrop-blur-md z-10 w-full relative">
        <div className="flex items-center gap-4 w-full md:w-1/3">
          <div className="p-2 bg-[#1f1f23] rounded-md">
            <Cpu className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-xl font-semibold text-white tracking-tight">{mode === 'assembly' ? 'PC Assembly' : 'PC Disassembly'}</h1>
            <p className="text-base md:text-sm text-slate-500">{mode === 'assembly' ? 'Install the components onto the motherboard.' : 'Remove all components from the motherboard.'}</p>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center px-4 z-20 w-full md:w-auto">
          {mode === 'assembly' && installed.hdd && !cables.sata && (
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-base md:text-sm font-semibold animate-pulse text-center shadow-[0_0_15px_rgba(16,185,129,0.2)] w-full max-w-md">
              Connect the SATA data cable from the HDD to the motherboard!
            </div>
          )}
          {mode === 'assembly' && installed.psu && (!cables.eps || !cables.atx) && (
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-base md:text-sm font-semibold animate-pulse text-center shadow-[0_0_15px_rgba(16,185,129,0.2)] w-full max-w-md">
              Connect the 4-pin CPU power and 24-pin ATX power cables from the PSU!
            </div>
          )}
          {mode === 'disassembly' && warningMessage && (
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-base md:text-sm font-semibold animate-pulse text-center shadow-[0_0_15px_rgba(239,68,68,0.2)] w-full max-w-md">
              {warningMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 w-full md:w-1/3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-base md:text-sm font-medium hover:bg-[#1f1f23] rounded-md transition-colors border border-[#1f1f23]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </button>
        </div>
      </header>

      <main className="flex-1 relative z-0 flex flex-col lg:flex-row overflow-hidden" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        {/* Left Side: Assembly Canvas */}
        <div className="flex-1 relative lg:border-r border-b lg:border-b-0 border-[#1f1f23] min-h-[40vh] lg:min-h-0">
          <svg
            ref={svgRef}
            className="w-full h-full absolute inset-0"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* The PC Case / Chassis */}
            <g transform="translate(150, 50)">
              <rect x="0" y="0" width="700" height="730" fill="#141415" stroke="#222" strokeWidth="4" rx="10" />
              <rect x="20" y="20" width="660" height="690" fill="none" stroke="#1f1f23" strokeWidth="2" rx="4" />
              <text x="350" y="705" fill="#333" fontSize="24" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ATX CHASSIS</text>
            </g>



            {/* ATX Power Supply Bay */}
            <g transform="translate(200, 650)">
              <rect x="-10" y="-10" width="140" height="120" fill={draggingId === 'psu' ? 'rgba(59,130,246,0.1)' : 'none'} stroke={draggingId === 'psu' ? '#3b82f6' : '#444'} strokeDasharray={draggingId === 'psu' ? 'none' : '4 4'} strokeWidth={draggingId === 'psu' ? '2' : '1'} rx="2" className={draggingId === 'psu' ? 'animate-pulse' : ''} />
              <text x="60" y="-15" fill="#666" fontSize="12" fontFamily="monospace" textAnchor="middle">PSU BAY</text>
            </g>

            {/* HDD Bay Area */}
            <g transform="translate(180, 420)">
              <rect x="-10" y="-10" width="100" height="130" fill={draggingId === 'hdd' ? 'rgba(59,130,246,0.1)' : 'none'} stroke={draggingId === 'hdd' ? '#3b82f6' : '#444'} strokeDasharray={draggingId === 'hdd' ? 'none' : '4 4'} strokeWidth={draggingId === 'hdd' ? '2' : '1'} rx="2" className={draggingId === 'hdd' ? 'animate-pulse' : ''} />
              <text x="40" y="-15" fill="#666" fontSize="12" fontFamily="monospace" textAnchor="middle">DRIVE CAGE</text>
            </g>

            {/* Motherboard (Standard ATX approx 305x244mm scaled) */}
            <g transform="translate(350, 150)">
              {/* Main PCB Base */}
              <rect x="0" y="0" width="450" height="550" fill="#08080a" rx="4" />

              {/* PCB Trace Patterns (More Realistic) */}
              <path d="M 20 180 L 100 180 L 120 200 L 120 300 M 430 450 L 350 450 L 330 430 L 330 350" fill="none" stroke="#1c1c22" strokeWidth="2" />
              <path d="M 20 190 L 100 190 L 120 210 L 120 310 M 430 460 L 350 460 L 330 440 L 330 360" fill="none" stroke="#1c1c22" strokeWidth="2" />
              <path d="M 20 200 L 100 200 L 120 220 L 120 320 M 430 470 L 350 470 L 330 450 L 330 370" fill="none" stroke="#1c1c22" strokeWidth="2" />
              <path d="M 250 500 L 250 520 M 260 500 L 260 520 M 270 500 L 270 520 M 280 500 L 280 520" fill="none" stroke="#1c1c22" strokeWidth="1" />
              <path d="M 200 120 L 200 140 M 210 120 L 210 140 M 220 120 L 220 140 M 230 120 L 230 140" fill="none" stroke="#1c1c22" strokeWidth="1" />

              {/* Gold Accents (Audio Path & Branding) */}
              <path d="M 0 350 Q 50 350 50 450 T 0 500" fill="none" stroke="#b45309" strokeWidth="1" strokeDasharray="4 2" />
              <text x="25" y="450" fill="#b45309" fontSize="10" fontFamily="sans-serif" textAnchor="middle" transform="rotate(-90 25 450)" fontWeight="bold">AUDIO BOOST</text>

              <rect x="0" y="0" width="450" height="550" fill="none" stroke="#222" strokeWidth="3" rx="4" />
              <text x="225" y="535" fill="#333" fontSize="24" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MOTHERBOARD (ATX)</text>

              {/* Mounting Holes with Silver Rings */}
              {[
                [20, 20], [225, 20], [430, 20],
                [20, 275], [225, 275], [430, 275],
                [20, 530], [225, 530], [430, 530]
              ].map(([cx, cy], i) => (
                <g key={`hole-${i}`}>
                  <circle cx={cx} cy={cy} r="6" fill="silver" />
                  <circle cx={cx} cy={cy} r="4" fill="#080809" />
                  <circle cx={cx} cy={cy} r="6" fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="1 3" />
                </g>
              ))}

              {/* VRM Heatsinks & Capacitors */}
              {/* Top VRM */}
              <rect x="140" y="15" width="140" height="25" fill="#18181b" stroke="#333" rx="2" />
              {Array.from({ length: 13 }).map((_, i) => <line key={`vrmt-${i}`} x1={145 + i * 10} y1="15" x2={145 + i * 10} y2="40" stroke="#27272a" strokeWidth="3" />)}
              {/* Left VRM */}
              <rect x="90" y="60" width="30" height="120" fill="#18181b" stroke="#333" rx="2" />
              {Array.from({ length: 11 }).map((_, i) => <line key={`vrml-${i}`} x1="90" y1={65 + i * 10} x2="120" y2={65 + i * 10} stroke="#27272a" strokeWidth="3" />)}

              {/* CPU Capacitors */}
              {Array.from({ length: 8 }).map((_, i) => (
                <g key={`cap-${i}`} transform={`translate(135, ${65 + i * 12})`}>
                  <circle cx="0" cy="0" r="4" fill="#9ca3af" stroke="#4b5563" />
                  <path d="M-4,0 A4,4 0 0,0 4,0" fill="#facc15" />
                </g>
              ))}

              {/* Rear I/O Shield */}
              <rect x="-10" y="50" width="10" height="180" fill="#9ca3af" stroke="#4b5563" strokeWidth="2" rx="1" />
              <rect x="-5" y="60" width="5" height="15" fill="#111" />
              <rect x="-5" y="85" width="5" height="15" fill="#111" />
              <rect x="-5" y="110" width="5" height="15" fill="#111" />
              <rect x="-5" y="140" width="5" height="40" fill="#111" />

              {/* CPU Socket Area (LGA Detail) */}
              <g transform="translate(160, 60)">
                <rect x="0" y="0" width="100" height="100" fill={draggingId === 'cpu' || draggingId === 'cpuFan' ? 'rgba(59,130,246,0.1)' : '#18181b'} stroke={draggingId === 'cpu' || draggingId === 'cpuFan' ? '#3b82f6' : '#27272a'} strokeWidth="3" rx="4" className={draggingId === 'cpu' || draggingId === 'cpuFan' ? 'animate-pulse' : ''} />
                <rect x="5" y="5" width="90" height="90" fill="#000" stroke="#333" strokeWidth="2" rx="2" />
                <rect x="15" y="15" width="70" height="70" fill="none" stroke="#666" strokeDasharray="1 1" />
                {/* Retention Arm */}
                <path d="M 105 10 L 115 10 L 115 90 L 100 90" fill="none" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="115" cy="10" r="2" fill="#d1d5db" />
                <circle cx="100" cy="90" r="2" fill="#d1d5db" />
              </g>
              <text x="210" y="45" fill="#9ca3af" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">LGA 1700</text>

              {/* 4/8-pin CPU Power Connector */}
              <g transform="translate(100, 20)">
                <rect x="0" y="0" width="30" height="15" fill={draggingId === 'cable-eps' ? 'rgba(59,130,246,0.2)' : '#1f1f23'} stroke={draggingId === 'cable-eps' ? '#3b82f6' : '#444'} rx="1" className={draggingId === 'cable-eps' ? 'animate-pulse' : ''} />
                <rect x="2" y="2" width="12" height="11" fill="#000" rx="1" />
                <rect x="16" y="2" width="12" height="11" fill="#000" rx="1" />
                <circle cx="8" cy="7.5" r="2" fill="#f87171" />
                <circle cx="22" cy="7.5" r="2" fill="#f87171" />
                <path d="M 10 -2 L 20 -2 L 20 0 L 10 0 Z" fill="#444" /> {/* Clip */}
              </g>
              <text x="115" y="12" fill="#9ca3af" fontSize="8" fontFamily="sans-serif" textAnchor="middle">4-PIN EPS</text>

              {/* RAM Slots (DIMM) */}
              <g transform="translate(300, 50)">
                <rect x="0" y="0" width="12" height="140" fill={draggingId === 'ram1' ? 'rgba(59,130,246,0.2)' : '#18181b'} stroke={draggingId === 'ram1' ? '#3b82f6' : '#27272a'} rx="1" className={draggingId === 'ram1' ? 'animate-pulse' : ''} />
                <rect x="25" y="0" width="12" height="140" fill={draggingId === 'ram2' ? 'rgba(59,130,246,0.2)' : '#18181b'} stroke={draggingId === 'ram2' ? '#3b82f6' : '#27272a'} rx="1" className={draggingId === 'ram2' ? 'animate-pulse' : ''} />
                {/* Channel A / Channel B colored slots */}
                <rect x="2" y="5" width="8" height="130" fill="#0a0a0b" />
                <rect x="27" y="5" width="8" height="130" fill="#0a0a0b" />
                {/* Clips */}
                <path d="M -2 0 L 14 0 M 23 0 L 39 0 M -2 140 L 14 140 M 23 140 L 39 140" stroke="#d1d5db" strokeWidth="2" />
                <line x1="2" y1="85" x2="10" y2="85" stroke="#facc15" strokeWidth="2" /> {/* Key */}
                <line x1="27" y1="85" x2="35" y2="85" stroke="#facc15" strokeWidth="2" /> {/* Key */}
                <text x="18.5" y="-10" fill="#9ca3af" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">DDR5 DIMM</text>
              </g>

              {/* 24-pin ATX Power Connector */}
              <g transform="translate(400, 200)">
                <rect x="0" y="0" width="20" height="80" fill={draggingId === 'cable-atx' ? 'rgba(59,130,246,0.2)' : '#1f1f23'} stroke={draggingId === 'cable-atx' ? '#3b82f6' : '#444'} rx="1" className={draggingId === 'cable-atx' ? 'animate-pulse' : ''} />
                {Array.from({ length: 12 }).map((_, i) => (
                  <rect key={`atx1-${i}`} x="2" y={2 + i * 6.5} width="7" height="4.5" fill="#000" rx="0.5" />
                ))}
                {Array.from({ length: 12 }).map((_, i) => (
                  <rect key={`atx2-${i}`} x="11" y={2 + i * 6.5} width="7" height="4.5" fill="#000" rx="0.5" />
                ))}
                <path d="M 20 30 L 23 30 L 23 50 L 20 50 Z" fill="#444" /> {/* Clip */}
              </g>
              <text x="410" y="190" fill="#9ca3af" fontSize="8" fontFamily="sans-serif" textAnchor="middle">24-PIN ATX</text>

              {/* M.2 NVMe Slot(s) */}
              <g transform="translate(180, 190)">
                <rect x="0" y="0" width="90" height="15" fill={draggingId === 'nvme' ? 'rgba(59,130,246,0.2)' : '#18181b'} stroke={draggingId === 'nvme' ? '#3b82f6' : '#27272a'} rx="1" className={draggingId === 'nvme' ? 'animate-pulse' : ''} />
                <rect x="-5" y="0" width="10" height="15" fill="#111" rx="1" stroke="#333" /> {/* M.2 connector */}
                {/* Stand-offs */}
                <circle cx="30" cy="7.5" r="2" fill="#d1d5db" />
                <circle cx="50" cy="7.5" r="2" fill="#d1d5db" />
                <circle cx="85" cy="7.5" r="3" fill="#d1d5db" stroke="#9ca3af" /> {/* Primary standoff */}
              </g>
              <text x="225" y="185" fill="#9ca3af" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">M.2 PCIe 4.0 x4</text>

              {/* PCIe x16 Slot (GPU) */}
              <g transform="translate(80, 370)">
                <rect x="0" y="0" width="260" height="15" fill={draggingId === 'gpu' ? 'rgba(59,130,246,0.2)' : '#18181b'} stroke={draggingId === 'gpu' ? '#3b82f6' : '#27272a'} strokeWidth="2" rx="2" className={draggingId === 'gpu' ? 'animate-pulse' : ''} />
                <rect x="0" y="-1" width="260" height="17" fill="none" stroke="#d1d5db" strokeWidth="1" rx="2" /> {/* Steel armor */}
                <rect x="2" y="2" width="60" height="11" fill="#000" />
                <rect x="64" y="2" width="194" height="11" fill="#000" />
                {/* PCIe Retention Clip */}
                <path d="M 260 2 L 270 2 L 275 7.5 L 270 13 L 260 13 Z" fill="#444" stroke="#222" />
              </g>
              <text x="210" y="360" fill="#9ca3af" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">PCIe 4.0 x16 (STEEL ARMOR)</text>

              {/* PCIe x1 Slot */}
              <rect x="80" y="420" width="100" height="10" fill="#18181b" stroke="#27272a" rx="1" />
              <rect x="82" y="422" width="20" height="6" fill="#000" />
              <rect x="104" y="422" width="74" height="6" fill="#000" />

              {/* SATA Ports */}
              <g transform="translate(410, 420)">
                <rect x="0" y="0" width="15" height="10" fill={draggingId === 'cable-sata' ? 'rgba(59,130,246,0.2)' : '#18181b'} stroke={draggingId === 'cable-sata' ? '#3b82f6' : '#333'} rx="1" className={draggingId === 'cable-sata' ? 'animate-pulse' : ''} />
                <rect x="0" y="15" width="15" height="10" fill={draggingId === 'cable-sata' ? 'rgba(59,130,246,0.2)' : '#18181b'} stroke={draggingId === 'cable-sata' ? '#3b82f6' : '#333'} rx="1" className={draggingId === 'cable-sata' ? 'animate-pulse' : ''} />
                <rect x="20" y="0" width="15" height="10" fill="#18181b" stroke="#333" rx="1" />
                <rect x="20" y="15" width="15" height="10" fill="#18181b" stroke="#333" rx="1" />
                {/* L-Shape connectors inside */}
                <path d="M 12 3 L 12 7 L 3 7" fill="none" stroke="#000" strokeWidth="2" />
                <path d="M 12 18 L 12 22 L 3 22" fill="none" stroke="#000" strokeWidth="2" />
                <path d="M 32 3 L 32 7 L 23 7" fill="none" stroke="#000" strokeWidth="2" />
                <path d="M 32 18 L 32 22 L 23 22" fill="none" stroke="#000" strokeWidth="2" />
                <text x="17" y="-8" fill="#9ca3af" fontSize="8" fontFamily="sans-serif" textAnchor="middle">SATA III 6Gb/s</text>
              </g>

              {/* Southbridge / Chipset Heatsink (Aesthetic Upgrade) */}
              <g transform="translate(320, 420)">
                <rect x="0" y="0" width="60" height="60" fill="#18181b" stroke="#27272a" strokeWidth="2" rx="4" />
                <polygon points="0,0 60,0 30,60" fill="#27272a" />
                <polygon points="60,60 0,60 30,0" fill="#111" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <line key={`hs-${i}`} x1="5" y1={10 + i * 10} x2="55" y2={10 + i * 10} stroke="#3f3f46" strokeWidth="2" />
                ))}
                <circle cx="30" cy="30" r="10" fill="#dc2626" />
                <circle cx="30" cy="30" r="6" fill="#000" />
                <text x="30" y="33" fill="#fff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">X</text>
              </g>

              {/* Motherboard Battery (CMOS) */}
              <circle cx="280" cy="460" r="14" fill="#18181b" stroke="#27272a" strokeWidth="2" />
              <circle cx="280" cy="460" r="12" fill="#e5e7eb" stroke="#9ca3af" />
              <circle cx="280" cy="460" r="10" fill="none" stroke="#d1d5db" />
              <text x="280" y="462" fill="#6b7280" fontSize="6" fontFamily="sans-serif" textAnchor="middle">CR2032</text>
              <text x="280" y="468" fill="#6b7280" fontSize="4" fontFamily="sans-serif" textAnchor="middle">3V</text>

              {/* Front Panel Headers (Bonus realism) */}
              <g transform="translate(300, 520)">
                <rect x="0" y="0" width="60" height="15" fill="#18181b" stroke="#27272a" rx="1" />
                {Array.from({ length: 9 }).map((_, i) => (
                  <circle key={`fpanel-${i}`} cx={6 + i * 6} cy="4" r="1" fill="#facc15" />
                ))}
                {Array.from({ length: 8 }).map((_, i) => (
                  <circle key={`fpanel2-${i}`} cx={6 + i * 6} cy="11" r="1" fill="#facc15" />
                ))}
                <text x="30" y="-4" fill="#9ca3af" fontSize="6" fontFamily="sans-serif" textAnchor="middle">F_PANEL</text>
              </g>

              {/* Audio Capacitors */}
              <g transform="translate(30, 480)">
                {Array.from({ length: 5 }).map((_, i) => (
                  <circle key={`acap-${i}`} cx={i * 15} cy={i % 2 === 0 ? 0 : 10} r="5" fill="#eab308" stroke="#ca8a04" />
                ))}
                {Array.from({ length: 5 }).map((_, i) => (
                  <path key={`acaph-${i}`} d={`M ${i * 15 - 5} ${i % 2 === 0 ? 0 : 10} A 5 5 0 0 1 ${i * 15 + 5} ${i % 2 === 0 ? 0 : 10}`} fill="#000" />
                ))}
              </g>
            </g>

            {/* Render Cables if PSU is installed */}
            {installed['psu'] && (
              <g>
                {/* EPS 4-pin Cable */}
                {(!chassisClosed || cables.eps) && (
                  <g>
                    <path
                      d={`M 320 670 Q 350 400 ${cables.eps ? '465 177' : (draggingId === 'cable-eps' ? `${dragPos.x} ${dragPos.y}` : '340 600')}`}
                      fill="none" stroke="#f87171" strokeWidth="6" strokeLinecap="round"
                    />
                    <motion.g
                      animate={{ x: cables.eps ? 465 : (draggingId === 'cable-eps' ? dragPos.x : 340), y: cables.eps ? 177 : (draggingId === 'cable-eps' ? dragPos.y : 600) }}
                      onPointerDown={(e: any) => handlePointerDown('cable-eps', e)}
                      style={{ cursor: draggingId === 'cable-eps' ? 'grabbing' : 'grab' }}
                      className={isRemovable('cable-eps') ? 'animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}
                    >
                      <rect x="-15" y="-10" width="30" height="20" fill="#0f172a" stroke="#f87171" rx="2" />
                      <text x="0" y="3" fill="#fff" fontSize="8" fontFamily="sans-serif" textAnchor="middle">4-PIN</text>
                    </motion.g>
                  </g>
                )}

                {/* ATX 24-pin Cable */}
                {(!chassisClosed || cables.atx) && (
                  <g>
                    <path
                      d={`M 345 685 Q 550 650 ${cables.atx ? '760 390' : (draggingId === 'cable-atx' ? `${dragPos.x} ${dragPos.y}` : '380 620')}`}
                      fill="none" stroke="#facc15" strokeWidth="8" strokeLinecap="round"
                    />
                    <motion.g
                      animate={{ x: cables.atx ? 760 : (draggingId === 'cable-atx' ? dragPos.x : 380), y: cables.atx ? 390 : (draggingId === 'cable-atx' ? dragPos.y : 620) }}
                      onPointerDown={(e: any) => handlePointerDown('cable-atx', e)}
                      style={{ cursor: draggingId === 'cable-atx' ? 'grabbing' : 'grab' }}
                      className={isRemovable('cable-atx') ? 'animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}
                    >
                      <rect x="-10" y="-40" width="20" height="80" fill="#0f172a" stroke="#facc15" rx="2" />
                      <text x="0" y="3" fill="#fff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" transform="rotate(-90 0 0)">24-PIN ATX</text>
                    </motion.g>
                  </g>
                )}
              </g>
            )}

            {/* Render Cables if HDD is installed */}
            {installed['hdd'] && (
              <g>
                {/* SATA Cable */}
                {(!chassisClosed || cables.sata) && (
                  <g>
                    <path
                      d={`M 240 470 Q 400 650 ${cables.sata ? '770 570' : (draggingId === 'cable-sata' ? `${dragPos.x} ${dragPos.y}` : '300 550')}`}
                      fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round"
                    />
                    <motion.g
                      animate={{ x: cables.sata ? 770 : (draggingId === 'cable-sata' ? dragPos.x : 300), y: cables.sata ? 570 : (draggingId === 'cable-sata' ? dragPos.y : 550) }}
                      onPointerDown={(e: any) => handlePointerDown('cable-sata', e)}
                      style={{ cursor: draggingId === 'cable-sata' ? 'grabbing' : 'grab' }}
                      className={isRemovable('cable-sata') ? 'animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}
                    >
                      <rect x="-10" y="-5" width="20" height="10" fill="#0f172a" stroke="#ef4444" rx="1" />
                      <text x="0" y="2" fill="#fff" fontSize="6" fontFamily="sans-serif" textAnchor="middle">SATA</text>
                    </motion.g>
                  </g>
                )}
              </g>
            )}

            {/* Render Components */}
            {PC_COMPONENTS.map((comp) => {
              // Hide components if they are on the workbench but the workbench is hidden (chassis is closed)
              const isInstalled = installed[comp.id];
              const isDragging = draggingId === comp.id;

              if (chassisClosed && !isInstalled && !isDragging) return null;

              const currentX = isDragging ? dragPos.x - comp.width / 2 : (isInstalled ? comp.targetX : comp.startX);
              const currentY = isDragging ? dragPos.y - comp.height / 2 : (isInstalled ? comp.targetY : comp.startY);

              return (
                <motion.g
                  key={comp.id}
                  animate={{ x: currentX, y: currentY, scale: isDragging ? 1.05 : 1 }}
                  transition={{ type: isDragging ? "tween" : "spring", duration: isDragging ? 0 : 0.3 }}
                  style={{ cursor: (mode === 'assembly' && comp.id === 'cpuFan' && !installed['cpu']) || (mode === 'disassembly' && comp.id === 'cpu' && installed['cpuFan']) ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab') }}
                  onPointerDown={(e: any) => handlePointerDown(comp.id, e)}
                  className={isRemovable(comp.id) ? 'animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}
                >
                  {/* Drop Shadow when dragging */}
                  {isDragging && <rect x={5} y={10} width={comp.width} height={comp.height} fill="rgba(0,0,0,0.5)" rx="4" />}

                  {comp.id === 'cpu' && (
                    <g>
                      <rect width={comp.width} height={comp.height} fill="#94a3b8" stroke="#475569" strokeWidth="2" rx="2" />
                      <rect x="5" y="5" width="50" height="50" fill="#e2e8f0" />
                      <text x="30" y="30" fill="#475569" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">RYZEN</text>
                      <circle cx="5" cy="55" r="2" fill="#eab308" /> {/* Pin indicator */}
                    </g>
                  )}
                  {comp.id === 'cpuFan' && (
                    <g style={{ opacity: installed['cpu'] || isInstalled ? 1 : 0.5 }}>
                      {/* Radiator/Heatsink block */}
                      <rect width={comp.width} height={comp.height} fill="#1e293b" stroke="#0f172a" strokeWidth="2" rx="45" />
                      {/* Outer Ring */}
                      <circle cx="45" cy="45" r="42" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      {/* Inner Ring */}
                      <circle cx="45" cy="45" r="38" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                      <circle cx="45" cy="45" r="12" fill="#334155" stroke="#94a3b8" />
                      <g stroke="#94a3b8" strokeWidth="4" strokeLinecap="round">
                        {Array.from({ length: 9 }).map((_, i) => {
                          const angle = (i * 40 * Math.PI) / 180;
                          return (
                            <line
                              key={i}
                              x1={45 + Math.cos(angle) * 15} y1={45 + Math.sin(angle) * 15}
                              x2={45 + Math.cos(angle + 0.3) * 35} y2={45 + Math.sin(angle + 0.3) * 35}
                            />
                          );
                        })}
                      </g>
                      <circle cx="45" cy="45" r="8" fill="#1e293b" />
                      {isInstalled && cables.eps && cables.atx ? (
                        <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="6" className="animate-pulse" />
                      ) : null}
                    </g>
                  )}
                  {(comp.id === 'ram1' || comp.id === 'ram2') && (
                    <g>
                      <rect width={comp.width} height={comp.height} fill="#1e293b" rx="1" />
                      <rect x="0" y="5" width="2" height={comp.height - 10} fill="#eab308" /> {/* Gold pins */}
                      <rect x="2" y="10" width="6" height="30" fill="#334155" rx="1" />
                      <rect x="2" y="50" width="6" height="30" fill="#334155" rx="1" />
                      <rect x="2" y="90" width="6" height="30" fill="#334155" rx="1" />
                    </g>
                  )}
                  {comp.id === 'nvme' && (
                    <g>
                      <rect width={comp.width} height={comp.height} fill="#020617" stroke="#334155" rx="1" />
                      {/* Chips */}
                      <rect x="15" y="2" width="18" height="11" fill="#1e293b" />
                      <rect x="38" y="2" width="18" height="11" fill="#1e293b" />
                      <rect x="61" y="2" width="18" height="11" fill="#1e293b" />
                      {/* Gold pins */}
                      <rect x="0" y="-1" width="3" height="17" fill="#eab308" />
                      <rect x="-1" y="4" width="4" height="3" fill="#020617" /> {/* Notch */}
                    </g>
                  )}
                  {comp.id === 'gpu' && (
                    <g>
                      {/* GPU Backplate / Block */}
                      <rect width={comp.width} height={comp.height} fill="#0f172a" rx="4" />
                      {/* Detail */}
                      <rect x="10" y="5" width="240" height="30" fill="#1e293b" rx="2" />
                      <circle cx="60" cy="20" r="12" fill="#334155" stroke="#0f172a" />
                      <circle cx="130" cy="20" r="12" fill="#334155" stroke="#0f172a" />
                      <circle cx="200" cy="20" r="12" fill="#334155" stroke="#0f172a" />
                      <rect x="220" y="10" width="30" height="20" fill="none" stroke="#ef4444" strokeWidth="2" rx="2" />
                      <text x="235" y="24" fill="#ef4444" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">RTX</text>
                    </g>
                  )}
                  {comp.id === 'psu' && (
                    <g>
                      <rect width={comp.width} height={comp.height} fill="#1e293b" stroke="#0f172a" strokeWidth="4" rx="4" />
                      {/* Fan Grille */}
                      <circle cx="60" cy="50" r="35" fill="#0f172a" />
                      <path d="M 25 50 L 95 50 M 60 15 L 60 85" stroke="#334155" strokeWidth="2" />
                      <circle cx="60" cy="50" r="10" fill="#334155" />
                      {/* Cables coming out */}
                      <path d="M 120 20 L 150 20 M 120 30 L 140 30" stroke="#f87171" strokeWidth="4" />
                      <path d="M 120 25 L 145 25 M 120 35 L 145 35" stroke="#facc15" strokeWidth="4" />
                      <path d="M 120 40 L 150 40" stroke="#000" strokeWidth="4" />
                      <rect x="10" y="10" width="30" height="15" fill="#0f172a" />
                      <text x="25" y="20" fill="#fff" fontSize="8" fontFamily="sans-serif" textAnchor="middle">850W</text>
                    </g>
                  )}
                  {comp.id === 'hdd' && (
                    <g>
                      <rect width={comp.width} height={comp.height} fill="#64748b" stroke="#334155" strokeWidth="2" rx="2" />
                      <rect x="5" y="5" width="70" height="80" fill="#e2e8f0" rx="2" />
                      <circle cx="40" cy="40" r="25" fill="#94a3b8" />
                      <circle cx="40" cy="40" r="10" fill="#cbd5e1" />
                      <path d="M 40 40 L 60 20" stroke="#cbd5e1" strokeWidth="2" />
                      <rect x="10" y="95" width="60" height="10" fill="#1e293b" rx="1" />
                      <text x="40" y="102" fill="#fff" fontSize="6" fontFamily="sans-serif" textAnchor="middle">2TB SATA</text>
                    </g>
                  )}

                </motion.g>
              );
            })}

            {/* Tooltip for dragging item */}
            <AnimatePresence>
              {draggingId && (
                <motion.g
                  key="drag-tooltip"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, x: dragPos.x + 80, y: dragPos.y }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ pointerEvents: 'none' }}
                >
                  <foreignObject x="18" y="-35" width="200" height="100">
                    <div className="bg-[#020617] border-2 border-[#334155] rounded-md p-2 text-slate-100 flex flex-col shadow-xl">
                      <div className="text-xs font-bold mb-1">
                        {getTooltipContent(draggingId).name}
                      </div>
                      <div className="text-[10px] leading-tight text-slate-400">
                        {getTooltipContent(draggingId).desc}
                      </div>
                    </div>
                  </foreignObject>
                  {/* Tooltip Arrow */}
                  <polygon points="12,-6 12,6 6,0" fill="#334155" />
                  <polygon points="17,-4 17,4 10,0" fill="#020617" />
                </motion.g>
              )}
            </AnimatePresence>
            {/* Glass Panel overlay if closed */}
            <AnimatePresence>
              {chassisClosed && (
                <g transform="translate(150, 50)">
                  <motion.g
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                  >
                    <rect x="18" y="18" width="664" height="694" fill="rgba(10, 10, 12, 0.85)" stroke="#334155" strokeWidth="4" rx="6" />

                    {/* Reflections */}
                    <path d="M 20 20 L 300 600 L 20 600 Z" fill="rgba(255, 255, 255, 0.02)" />
                    <path d="M 600 20 L 680 20 L 680 700 L 500 700 Z" fill="rgba(255, 255, 255, 0.01)" />

                    {/* Glass Panel Screws */}
                    <circle cx="35" cy="35" r="8" fill="#1e293b" stroke="#0f172a" />
                    <circle cx="665" cy="35" r="8" fill="#1e293b" stroke="#0f172a" />
                    <circle cx="35" cy="695" r="8" fill="#1e293b" stroke="#0f172a" />
                    <circle cx="665" cy="695" r="8" fill="#1e293b" stroke="#0f172a" />

                    {/* Power Button */}
                    <g transform="translate(620, 60)" style={{ cursor: 'pointer' }} onClick={() => setPowerOnStage('post')}>
                      <circle cx="0" cy="0" r="25" fill="#1e293b" stroke="#334155" strokeWidth="2" className="hover:fill-[#334155] transition-colors" />
                      <circle cx="0" cy="0" r="18" fill="#0f172a" />
                      {/* Power icon */}
                      <path d="M -8 -8 A 12 12 0 1 0 8 -8 M 0 -12 L 0 2" fill="none" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
                      <text x="0" y="40" fill="#eab308" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">POWER ON</text>
                    </g>
                  </motion.g>
                </g>
              )}
            </AnimatePresence>
          </svg>

          {/* Success Overlay when all built */}
          <AnimatePresence>
            {isComplete && !chassisClosed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-emerald-500/10 backdrop-blur-sm z-20 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-[#0c0c0e] p-8 rounded-xl border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-center max-w-md pointer-events-auto">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">{mode === 'assembly' ? 'Build Complete!' : 'Disassembly Complete!'}</h2>
                  <p className="text-slate-400 mb-6">{mode === 'assembly' ? 'You\'ve successfully installed all critical components onto the motherboard.' : 'You\'ve successfully removed all components.'}</p>
                  {mode === 'assembly' && (
                    <button
                      onClick={() => setChassisClosed(true)}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors w-full"
                    >
                      Close Chassis & Power Up
                    </button>
                  )}
                  <button
                    onClick={onNext || onBack}
                    className="mt-4 px-6 py-3 bg-transparent hover:bg-[#141415] border border-slate-700 text-slate-300 font-semibold rounded-lg transition-colors w-full"
                  >
                    {nextLabel || 'Return to Menu'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Component Tray */}
        <AnimatePresence>
          {!chassisClosed && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full lg:w-64 h-[40vh] lg:h-full shrink-0 bg-[#0c0c0e] lg:border-l border-t lg:border-t-0 border-[#1f1f23] flex flex-col p-4 z-10 overflow-y-auto"
            >
              <h2 className="text-base md:text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1f1f23] pb-2">Component Tray</h2>
              <div className="flex flex-col gap-3">
                {PC_COMPONENTS.map((comp) => {
                  const isInstalled = installed[comp.id];
                  const isSuccess = mode === 'assembly' ? isInstalled : !isInstalled;
                  return (
                    <div
                      key={`tray-${comp.id}`}
                      className={`p-3 rounded-md border flex items-center gap-3 transition-colors ${isSuccess ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#141415] border-[#1f1f23]'
                        }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full shadow-inner flex items-center justify-center shrink-0"
                        style={{ backgroundColor: comp.color }}
                      >
                        {isSuccess && <CheckCircle2 className="w-3 h-3 text-[#0c0c0e]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base md:text-sm font-medium text-slate-200 truncate">{comp.name}</div>
                        <div className="text-sm md:text-xs text-slate-500">
                          {mode === 'assembly'
                            ? (isInstalled ? 'Installed' : 'Pending')
                            : (!isInstalled ? 'Removed' : 'Installed')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 p-4 bg-[#141415] border border-[#1f1f23] rounded-md text-sm md:text-xs text-slate-400 leading-relaxed">
                <strong>Hint:</strong> {mode === 'assembly' ? 'Drag components from the canvas area on the right into their corresponding slots on the motheroard. The CPU must be installed before the CPU Cooler can be attached.' : 'Click and drag components away from the motherboard to remove them. The CPU Cooler must be removed before the CPU.'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

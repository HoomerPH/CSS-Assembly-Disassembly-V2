import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, RotateCcw, CheckCircle2 } from 'lucide-react';

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

export default function AssemblyView({ onBack }: { onBack: () => void }) {
  const [installed, setInstalled] = useState<Record<string, boolean>>({});
  const [cables, setCables] = useState({ eps: false, atx: false, sata: false });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [chassisClosed, setChassisClosed] = useState(false);
  const [powerOnStage, setPowerOnStage] = useState<'idle' | 'post' | 'os'>('idle');
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
    if (id === 'cpuFan' && !installed['cpu']) return; // Must install CPU first
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
          const dist = Math.hypot(dragPos.x - (component.targetX + component.width/2), dragPos.y - (component.targetY + component.height/2));
          if (dist < 60) { // snap threshold
            setInstalled(prev => ({ ...prev, [draggingId]: true }));
          }
        }
      }
      setDraggingId(null);
    }
  };

  const allInstalled = PC_COMPONENTS.every(c => installed[c.id]);
  const isComplete = allInstalled && cables.eps && cables.atx && cables.sata;

  const getTooltipContent = (id: string) => {
    if (id.startsWith('cable-')) {
      if (id === 'cable-eps') return { name: '8-Pin CPU Power', desc: 'Delivers dedicated power to the CPU.' };
      if (id === 'cable-atx') return { name: '24-Pin ATX Power', desc: 'Supplies main power to the motherboard and components.' };
      if (id === 'cable-sata') return { name: 'SATA Data Cable', desc: 'Transfers data between the motherboard and storage drives.' };
      return { name: 'Cable', desc: 'Connects components.' };
    }
    const comp = PC_COMPONENTS.find(c => c.id === id);
    return { name: comp?.name || '', desc: comp?.description || '' };
  };

  if (powerOnStage === 'post' || powerOnStage === 'os') {
    return <OSSimulation onPowerOff={() => {
      setPowerOnStage('idle');
      // maybe we stay in closed chassis, idle power state
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

      <header className="p-4 border-b border-[#1f1f23] flex items-center justify-between bg-[#080809]/80 backdrop-blur-md z-10 w-full relative">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[#1f1f23] rounded-md">
            <Cpu className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">PC Assembly</h1>
            <p className="text-sm text-slate-500">Install the components onto the motherboard.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setInstalled({});
              setCables({ eps: false, atx: false, sata: false });
              setChassisClosed(false);
              setPowerOnStage('idle');
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-md transition-colors border border-red-500/30"
          >
            <RotateCcw className="w-4 h-4" /> Disassemble
          </button>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-[#1f1f23] rounded-md transition-colors border border-[#1f1f23]"
          >
            <RotateCcw className="w-4 h-4" /> Switch to Architecture
          </button>
        </div>
      </header>

      <main className="flex-1 relative z-0 flex" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        {/* Left Side: Assembly Canvas */}
        <div className="flex-1 relative border-r border-[#1f1f23]">
          <svg 
            ref={svgRef} 
            className="w-full h-full absolute inset-0" 
            viewBox="0 0 1200 800" 
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Parts Tray */}
            <AnimatePresence>
              {!chassisClosed && (
                <motion.g 
                  transform="translate(880, 50)"
                  initial={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                >
                  <rect x="0" y="0" width="290" height="730" fill="#141415" stroke="#1f1f23" strokeWidth="2" rx="10" />
                  <text x="145" y="30" fill="#666" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">COMPONENT WORKBENCH</text>
                </motion.g>
              )}
            </AnimatePresence>

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
              <rect x="0" y="0" width="450" height="550" fill="#0c0c0e" rx="4" />
              {/* Motherboard Trace Patterns (decorative) */}
              <path d="M 20 20 L 50 50 L 50 100 M 430 530 L 400 500 L 350 500" fill="none" stroke="#1f1f23" strokeWidth="2" />
              <rect x="0" y="0" width="450" height="550" fill="none" stroke="#333" strokeWidth="2" rx="4" />
              <text x="225" y="530" fill="#333" fontSize="20" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MOTHERBOARD (ATX)</text>

              {/* Rear I/O Shield */}
              <rect x="-10" y="50" width="10" height="180" fill="#444" rx="1" />

              {/* CPU Socket Area */}
              <rect x="160" y="60" width="100" height="100" fill={draggingId === 'cpu' || draggingId === 'cpuFan' ? 'rgba(59,130,246,0.1)' : '#141415'} stroke={draggingId === 'cpu' || draggingId === 'cpuFan' ? '#3b82f6' : '#333'} strokeWidth="2" rx="2" className={draggingId === 'cpu' || draggingId === 'cpuFan' ? 'animate-pulse' : ''} />
              <rect x="165" y="65" width="90" height="90" fill="none" stroke="#444" strokeDasharray="2 2" />
              <text x="210" y="50" fill="#666" fontSize="10" fontFamily="sans-serif" textAnchor="middle">CPU SOCKET (LGA)</text>

              {/* 4/8-pin CPU Power Connector */}
              <rect x="100" y="20" width="30" height="15" fill={draggingId === 'cable-eps' ? 'rgba(59,130,246,0.2)' : '#1f1f23'} stroke={draggingId === 'cable-eps' ? '#3b82f6' : '#444'} rx="1" className={draggingId === 'cable-eps' ? 'animate-pulse' : ''} />
              <circle cx="105" cy="27" r="2" fill="#000" /><circle cx="115" cy="27" r="2" fill="#000" /><circle cx="125" cy="27" r="2" fill="#000" />
              <text x="115" y="15" fill="#666" fontSize="8" fontFamily="sans-serif" textAnchor="middle">8-PIN EPS</text>

              {/* RAM Slots (DIMM) */}
              <g transform="translate(300, 60)">
                <rect x="0" y="0" width="10" height="130" fill={draggingId === 'ram1' ? 'rgba(59,130,246,0.2)' : '#111'} stroke={draggingId === 'ram1' ? '#3b82f6' : '#333'} rx="1" className={draggingId === 'ram1' ? 'animate-pulse' : ''} />
                <rect x="20" y="0" width="10" height="130" fill={draggingId === 'ram2' ? 'rgba(59,130,246,0.2)' : '#111'} stroke={draggingId === 'ram2' ? '#3b82f6' : '#333'} rx="1" className={draggingId === 'ram2' ? 'animate-pulse' : ''} />
                <text x="15" y="-10" fill="#666" fontSize="10" fontFamily="sans-serif" textAnchor="middle">DDR4/5 DIMM SLOTS</text>
              </g>

              {/* 24-pin ATX Power Connector */}
              <rect x="400" y="200" width="20" height="80" fill={draggingId === 'cable-atx' ? 'rgba(59,130,246,0.2)' : '#1f1f23'} stroke={draggingId === 'cable-atx' ? '#3b82f6' : '#444'} rx="1" className={draggingId === 'cable-atx' ? 'animate-pulse' : ''} />
              <text x="410" y="190" fill="#666" fontSize="8" fontFamily="sans-serif" textAnchor="middle">24-PIN ATX</text>

              {/* M.2 NVMe Slot(s) */}
              <rect x="180" y="190" width="90" height="15" fill={draggingId === 'nvme' ? 'rgba(59,130,246,0.2)' : '#111'} stroke={draggingId === 'nvme' ? '#3b82f6' : '#333'} rx="1" className={draggingId === 'nvme' ? 'animate-pulse' : ''} />
              <rect x="175" y="190" width="10" height="15" fill="#444" rx="1" /> {/* M.2 connector */}
              <text x="225" y="185" fill="#666" fontSize="10" fontFamily="sans-serif" textAnchor="middle">M.2 PCIe 4.0 x4</text>

              {/* PCIe x16 Slot (GPU) */}
              <rect x="80" y="370" width="260" height="15" fill={draggingId === 'gpu' ? 'rgba(59,130,246,0.2)' : '#1f1f23'} stroke={draggingId === 'gpu' ? '#3b82f6' : '#555'} strokeWidth="2" rx="2" className={draggingId === 'gpu' ? 'animate-pulse' : ''} />
              <text x="210" y="360" fill="#666" fontSize="10" fontFamily="sans-serif" textAnchor="middle">PCIe x16 (GPU)</text>

              {/* PCIe x1 Slot */}
              <rect x="80" y="420" width="100" height="10" fill="#1f1f23" stroke="#444" rx="1" />

              {/* SATA Ports */}
              <g transform="translate(410, 420)">
                <rect x="0" y="0" width="15" height="10" fill={draggingId === 'cable-sata' ? 'rgba(59,130,246,0.2)' : '#111'} stroke={draggingId === 'cable-sata' ? '#3b82f6' : '#444'} rx="1" className={draggingId === 'cable-sata' ? 'animate-pulse' : ''} />
                <rect x="0" y="15" width="15" height="10" fill={draggingId === 'cable-sata' ? 'rgba(59,130,246,0.2)' : '#111'} stroke={draggingId === 'cable-sata' ? '#3b82f6' : '#444'} rx="1" className={draggingId === 'cable-sata' ? 'animate-pulse' : ''} />
                <rect x="20" y="0" width="15" height="10" fill="#111" stroke="#444" rx="1" /><rect x="20" y="15" width="15" height="10" fill="#111" stroke="#444" rx="1" />
                <text x="17" y="-8" fill="#666" fontSize="8" fontFamily="sans-serif" textAnchor="middle">SATA III</text>
              </g>

              {/* Southbridge / Chipset Heatsink */}
              <rect x="320" y="420" width="60" height="60" fill="#1a1a1c" stroke="#222" rx="2" />
              {Array.from({length: 6}).map((_, i) => (
                <line key={`hs-${i}`} x1="320" y1={425 + i * 10} x2="380" y2={425 + i * 10} stroke="#333" strokeWidth="2" />
              ))}

              {/* Motherboard Battery (CMOS) */}
              <circle cx="280" cy="460" r="12" fill="#ccc" stroke="#888" />
              <circle cx="280" cy="460" r="8" fill="none" stroke="#aaa" />
            </g>

            {/* Render Cables if PSU is installed */}
            {installed['psu'] && (
              <g>
                {/* EPS 8-pin Cable */}
                <path 
                  d={`M 320 670 Q 350 400 ${cables.eps ? '465 177' : (draggingId === 'cable-eps' ? `${dragPos.x} ${dragPos.y}` : '340 600')}`} 
                  fill="none" stroke="#f87171" strokeWidth="6" strokeLinecap="round" 
                />
                <motion.g 
                  animate={{ x: cables.eps ? 465 : (draggingId === 'cable-eps' ? dragPos.x : 340), y: cables.eps ? 177 : (draggingId === 'cable-eps' ? dragPos.y : 600) }}
                  onPointerDown={(e: any) => handlePointerDown('cable-eps', e)}
                  style={{ cursor: draggingId === 'cable-eps' ? 'grabbing' : 'grab' }}
                >
                  <rect x="-15" y="-10" width="30" height="20" fill="#0f172a" stroke="#f87171" rx="2" />
                  <text x="0" y="3" fill="#fff" fontSize="8" fontFamily="sans-serif" textAnchor="middle">8-PIN</text>
                </motion.g>

                {/* ATX 24-pin Cable */}
                <path 
                  d={`M 345 685 Q 550 650 ${cables.atx ? '760 390' : (draggingId === 'cable-atx' ? `${dragPos.x} ${dragPos.y}` : '380 620')}`} 
                  fill="none" stroke="#facc15" strokeWidth="8" strokeLinecap="round" 
                />
                <motion.g 
                  animate={{ x: cables.atx ? 760 : (draggingId === 'cable-atx' ? dragPos.x : 380), y: cables.atx ? 390 : (draggingId === 'cable-atx' ? dragPos.y : 620) }}
                  onPointerDown={(e: any) => handlePointerDown('cable-atx', e)}
                  style={{ cursor: draggingId === 'cable-atx' ? 'grabbing' : 'grab' }}
                >
                  <rect x="-10" y="-40" width="20" height="80" fill="#0f172a" stroke="#facc15" rx="2" />
                  <text x="0" y="3" fill="#fff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" transform="rotate(-90 0 0)">24-PIN ATX</text>
                </motion.g>
              </g>
            )}

            {/* Render Cables if HDD is installed */}
            {installed['hdd'] && (
              <g>
                {/* SATA Cable */}
                <path 
                  d={`M 240 470 Q 400 650 ${cables.sata ? '770 570' : (draggingId === 'cable-sata' ? `${dragPos.x} ${dragPos.y}` : '300 550')}`} 
                  fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" 
                />
                <motion.g 
                  animate={{ x: cables.sata ? 770 : (draggingId === 'cable-sata' ? dragPos.x : 300), y: cables.sata ? 570 : (draggingId === 'cable-sata' ? dragPos.y : 550) }}
                  onPointerDown={(e: any) => handlePointerDown('cable-sata', e)}
                  style={{ cursor: draggingId === 'cable-sata' ? 'grabbing' : 'grab' }}
                >
                  <rect x="-10" y="-5" width="20" height="10" fill="#0f172a" stroke="#ef4444" rx="1" />
                  <text x="0" y="2" fill="#fff" fontSize="6" fontFamily="sans-serif" textAnchor="middle">SATA</text>
                </motion.g>
              </g>
            )}

            {/* Render Components */}
            {PC_COMPONENTS.map((comp) => {
              const isInstalled = installed[comp.id];
              const isDragging = draggingId === comp.id;
              
              const currentX = isDragging ? dragPos.x - comp.width/2 : (isInstalled ? comp.targetX : comp.startX);
              const currentY = isDragging ? dragPos.y - comp.height/2 : (isInstalled ? comp.targetY : comp.startY);

              return (
                <motion.g
                  key={comp.id}
                  animate={{ x: currentX, y: currentY, scale: isDragging ? 1.05 : 1 }}
                  transition={{ type: isDragging ? "tween" : "spring", duration: isDragging ? 0 : 0.3 }}
                  style={{ cursor: comp.id === 'cpuFan' && !installed['cpu'] ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab') }}
                  onPointerDown={(e: any) => handlePointerDown(comp.id, e)}
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
                    <h2 className="text-2xl font-bold text-white mb-2">Build Complete!</h2>
                    <p className="text-slate-400 mb-6">You've successfully installed all critical components onto the motherboard.</p>
                    <button 
                      onClick={() => setChassisClosed(true)}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors w-full"
                    >
                      Close Chassis & Power Up
                    </button>
                    <button 
                      onClick={onBack}
                      className="mt-4 px-6 py-3 bg-transparent hover:bg-[#141415] border border-slate-700 text-slate-300 font-semibold rounded-lg transition-colors w-full"
                    >
                      Return to Architecture View
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
              initial={{ opacity: 1, width: 256 }} // 64 * 4 = 256px
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3 }}
              className="w-64 shrink-0 bg-[#0c0c0e] border-l border-[#1f1f23] flex flex-col p-4 z-10 overflow-y-auto"
            >
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1f1f23] pb-2">Component Tray</h2>
              <div className="flex flex-col gap-3">
                {PC_COMPONENTS.map((comp) => {
                  const isInstalled = installed[comp.id];
                  return (
                    <div 
                      key={`tray-${comp.id}`} 
                      className={`p-3 rounded-md border flex items-center gap-3 transition-colors ${
                        isInstalled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#141415] border-[#1f1f23]'
                      }`}
                    >
                       <div 
                         className="w-4 h-4 rounded-full shadow-inner flex items-center justify-center shrink-0" 
                         style={{ backgroundColor: comp.color }}
                       >
                         {isInstalled && <CheckCircle2 className="w-3 h-3 text-[#0c0c0e]" />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-sm font-medium text-slate-200 truncate">{comp.name}</div>
                         <div className="text-xs text-slate-500">{isInstalled ? 'Installed' : 'Pending'}</div>
                       </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-8 p-4 bg-[#141415] border border-[#1f1f23] rounded-md text-xs text-slate-400 leading-relaxed">
                <strong>Hint:</strong> Drag components from the canvas area on the right into their corresponding slots on the motheroard. 
                The CPU must be installed before the CPU Cooler can be attached.
                {installed.hdd && !cables.sata && (
                  <div className="mt-4 text-emerald-400 font-semibold animate-pulse">
                    Connect the SATA data cable from the HDD to the motherboard!
                  </div>
                )}
                {installed.psu && (!cables.eps || !cables.atx) && (
                  <div className="mt-4 text-emerald-400 font-semibold animate-pulse">
                    Connect the 8-pin CPU power and 24-pin ATX power cables from the PSU to the motherboard!
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

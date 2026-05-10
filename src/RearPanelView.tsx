import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Cpu, Keyboard, Mouse, Plug, MousePointer2, Info, CheckCircle2, ArrowLeft } from 'lucide-react';

// --- Types ---
interface ObliqueBaseParams {
  x: number;
  y: number;
  w: number;
  h: number;
  d: number; // Depth (applies to X and -Y axes for oblique projection)
  colors: {
    front: string;
    top: string;
    side: string;
    stroke?: string;
  };
  children?: React.ReactNode;
}

// --- 2.5D Box primitive ---
const ObliqueBox = ({ x, y, w, h, d, colors, children }: ObliqueBaseParams) => {
  return (
    <g className="drop-shadow-2xl">
      {/* Top Face */}
      <polygon
        points={`${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}`}
        fill={colors.top}
        stroke={colors.stroke || "#333"}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Right Side Face */}
      <polygon
        points={`${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`}
        fill={colors.side}
        stroke={colors.stroke || "#333"}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Front Face */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={colors.front}
        stroke={colors.stroke || "#333"}
        strokeWidth="1"
      />
      {/* Children for Front Face Elements */}
      {children}
    </g>
  );
};

// --- Animated Cable Component (Static Version) ---
interface CableProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
  controlPoints: { x: number; y: number }[];
  color: string;
  glowId: string;
  width?: number;
  animated?: boolean;
}

const Cable = ({ start, end, controlPoints, color, glowId, width = 4, animated = true }: CableProps) => {
  let dPath = `M ${start.x},${start.y} `;
  if (controlPoints.length === 1) {
    dPath += `Q ${controlPoints[0].x},${controlPoints[0].y} ${end.x},${end.y}`;
  } else if (controlPoints.length === 2) {
    dPath += `C ${controlPoints[0].x},${controlPoints[0].y} ${controlPoints[1].x},${controlPoints[1].y} ${end.x},${end.y}`;
  } else {
    dPath += `L ${end.x},${end.y}`;
  }

  return (
    <g>
      <path d={dPath} stroke="#0a0a0b" strokeWidth={width + 2} fill="none" strokeLinecap="round" />
      <path d={dPath} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" opacity={0.6} />
      {animated && (
         <motion.path
          d={dPath}
          stroke={color}
          strokeWidth={width - 1}
          fill="none"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          strokeDasharray="15 30"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        />
      )}
      <circle cx={start.x} cy={start.y} r={width * 1.5} fill="#0a0a0b" stroke={color} strokeWidth={1.5} />
      <circle cx={end.x} cy={end.y} r={width * 1.5} fill="#0a0a0b" stroke={color} strokeWidth={1.5} />
    </g>
  );
};

interface DraggableCableProps {
  id: string;
  start: { x: number; y: number };
  restEnd: { x: number; y: number };
  targetEnd: { x: number; y: number };
  connectedControlPoints: { x: number; y: number }[];
  disconnectedControlPoints: { x: number; y: number }[];
  color: string;
  glowId: string;
  width?: number;
  isConnected: boolean;
  isDragging: boolean;
  dragPos: { x: number; y: number };
  onPointerDown: (e: React.PointerEvent) => void;
  label: string;
  opacity?: number;
  style?: React.CSSProperties;
}

const DraggableCable = ({
  id, start, restEnd, targetEnd, connectedControlPoints, disconnectedControlPoints,
  color, glowId, width = 4, isConnected, isDragging, dragPos, onPointerDown, label, opacity = 1, style
}: DraggableCableProps) => {
  const currentEnd = isConnected ? targetEnd : (isDragging ? dragPos : restEnd);
  
  let cp;
  if (isDragging) {
    const midY = (start.y + currentEnd.y) / 2 + 50;
    cp = [{ x: start.x, y: midY }, { x: currentEnd.x, y: midY }];
  } else if (isConnected) {
    cp = connectedControlPoints;
  } else {
    cp = disconnectedControlPoints;
  }

  let dPath = `M ${start.x},${start.y} `;
  if (cp.length === 1) {
    dPath += `Q ${cp[0].x},${cp[0].y} ${currentEnd.x},${currentEnd.y}`;
  } else if (cp.length === 2) {
    dPath += `C ${cp[0].x},${cp[0].y} ${cp[1].x},${cp[1].y} ${currentEnd.x},${currentEnd.y}`;
  } else {
    dPath += `L ${currentEnd.x},${currentEnd.y}`;
  }

  return (
    <g style={{ opacity, transition: "opacity 0.3s" }}>
      <motion.path animate={{ d: dPath }} transition={{ duration: isDragging ? 0 : 0.4, ease: "easeOut" }} stroke="#0a0a0b" strokeWidth={width + 2} fill="none" strokeLinecap="round" />
      <motion.path animate={{ d: dPath, stroke: color }} transition={{ duration: isDragging ? 0 : 0.4, ease: "easeOut" }} strokeWidth={width} fill="none" strokeLinecap="round" opacity={0.6} />
      {isConnected && (
         <motion.path
          animate={{ d: dPath, strokeDashoffset: 0, stroke: color }}
          initial={{ strokeDashoffset: 100 }}
          transition={{ d: { duration: 0.4 }, strokeDashoffset: { repeat: Infinity, duration: 1.5, ease: "linear" } }}
          strokeWidth={width - 1}
          fill="none"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          strokeDasharray="15 30"
        />
      )}
      <circle cx={start.x} cy={start.y} r={width * 1.5} fill="#0a0a0b" stroke={color} strokeWidth={1.5} />
      
      {/* Removed Target Hint Indicator and Dragging visual cue per user request */}

      {/* Draggable End */}
      <motion.g 
        animate={{ x: currentEnd.x, y: currentEnd.y }} 
        transition={{ duration: isDragging ? 0 : 0.4, ease: "easeOut" }}
        className="cursor-move"
        onPointerDown={onPointerDown}
        style={style}
      >
        <circle r="24" fill="transparent" /> 
        {id === 'avrPower' && (
          <g>
            <rect x="-12" y="-14" width="24" height="28" fill="#1e1e24" stroke="#444" rx="4" />
            <rect x="-8" y="-2" width="16" height="12" fill="#111" rx="2" />
            <rect x="-6" y="-24" width="4" height="12" fill="#94a3b8" />
            <rect x="2" y="-24" width="4" height="12" fill="#94a3b8" />
          </g>
        )}
        {(id === 'pcPower' || id === 'monitorPower') && (
          <g>
            <path d="M -14,-10 L 14,-10 L 14,2 L 8,10 L -8,10 L -14,2 Z" fill="#1e1e24" stroke="#444" />
            <rect x="-8" y="-4" width="4" height="8" fill="#000" rx="1" />
            <rect x="-2" y="-4" width="4" height="8" fill="#000" rx="1" />
            <rect x="4" y="-4" width="4" height="8" fill="#000" rx="1" />
          </g>
        )}
        {id === 'display' && (
          <g>
            <path d="M -16,-8 L 16,-8 L 12,8 L -12,8 Z" fill="#2563eb" stroke="#1e40af" strokeWidth="1" />
            <circle cx="-16" cy="0" r="2.5" fill="#94a3b8" />
            <circle cx="16" cy="0" r="2.5" fill="#94a3b8" />
            <g fill="#000">
              <circle cx="-8" cy="-2" r="1.5"/><circle cx="-4" cy="-2" r="1.5"/><circle cx="0" cy="-2" r="1.5"/><circle cx="4" cy="-2" r="1.5"/><circle cx="8" cy="-2" r="1.5"/>
              <circle cx="-6" cy="3" r="1.5"/><circle cx="-2" cy="3" r="1.5"/><circle cx="2" cy="3" r="1.5"/><circle cx="6" cy="3" r="1.5"/>
            </g>
            <rect x="-8" y="8" width="16" height="10" fill="#1e1e24" />
          </g>
        )}
        {id === 'keyboard' && (
          <g>
            <rect x="-10" y="0" width="20" height="16" fill="#1e1e24" rx="2" />
            <rect x="-12" y="-8" width="24" height="8" fill="#1e1e24" rx="1" />
            <rect x="-6" y="-18" width="12" height="10" fill="#8b5cf6" stroke="#5b21b6" strokeWidth="1.5" />
            <rect x="-4" y="-16" width="8" height="4" fill="#111" />
            <rect x="-2" y="-14" width="4" height="2" fill="#fff" opacity="0.5" />
          </g>
        )}
        {id === 'mouse' && (
          <g>
            <rect x="-10" y="0" width="20" height="16" fill="#1e1e24" rx="2" />
            <rect x="-12" y="-8" width="24" height="8" fill="#1e1e24" rx="1" />
            <rect x="-6" y="-18" width="12" height="10" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
            <rect x="-4" y="-16" width="8" height="4" fill="#111" />
            <rect x="-2" y="-14" width="4" height="2" fill="#fff" opacity="0.5" />
          </g>
        )}
        {/* Glow when connected */}
        {/* Removed spinning circle highlight per user request */}
      </motion.g>
    </g>
  );
};

// --- Main Application Component ---
export default function RearPanelView({ mode, onBack, onNext, nextLabel }: { mode: 'assembly' | 'disassembly', onBack: () => void, onNext?: () => void, nextLabel?: string }) {
  const [activeLayer, setActiveLayer] = useState<'all' | 'power' | 'data' | 'display'>('all');
  const [connections, setConnections] = useState({
    keyboard: mode === 'disassembly',
    mouse: mode === 'disassembly',
    display: mode === 'disassembly',
    pcPower: mode === 'disassembly',
    avrPower: mode === 'disassembly',
    monitorPower: mode === 'disassembly',
  });
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
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
    setWarningMessage(null);

    if (mode === 'assembly') {
      // AVR Power must be the last cable connected — all others must be done first
      if (id === 'avrPower' && !connections.avrPower) {
        const othersConnected = connections.keyboard && connections.mouse &&
          connections.display && connections.pcPower && connections.monitorPower;
        if (!othersConnected) {
          setWarningMessage('Connect all other cables first before plugging in the AVR Power!');
          return;
        }
      }
    }

    if (mode === 'disassembly') {
      // Cannot remove AVR Power if devices are still connected to it
      if (id === 'avrPower' && (connections.pcPower || connections.monitorPower)) {
        setWarningMessage('Disconnect PC Power and Monitor Power from the AVR first!');
        return;
      }
    }

    setDragging(id);
    setDragPos(getSVGPoint(e));
    if (connections[id as keyof typeof connections]) {
       setConnections(prev => ({...prev, [id]: false}));
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging) {
      setDragPos(getSVGPoint(e));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging) {
      if (mode === 'assembly') {
        let targetX = 0, targetY = 0;
        switch (dragging) {
          case 'keyboard': targetX = 508; targetY = 231; break;
          case 'mouse': targetX = 536; targetY = 231; break;
          case 'display': targetX = 508; targetY = 280; break;
          case 'pcPower': targetX = 523; targetY = 152; break;
          case 'avrPower': targetX = 95; targetY = 155; break;
          case 'monitorPower': targetX = 300; targetY = 413; break;
        }
        
        if (targetX && targetY) {
          const dist = Math.hypot(dragPos.x - targetX, dragPos.y - targetY);
          if (dist < 40) { // snap threshold
            setConnections(prev => ({...prev, [dragging]: true}));
          }
        }
      } else {
        // Disassembly: simply pulling the cable away and releasing it sets it to disconnected, 
        // which was already handled in pointerDown (setting it to false), so we essentially 
        // just let it drop to its disconnected state.
      }
      setDragging(null);
    }
  };

  const getTooltipContent = (id: string) => {
    switch (id) {
      case 'avrPower': return { name: 'AVR Power Connection', desc: 'Supply electricity from the wall outlet to the Automatic Voltage Regulator.' };
      case 'pcPower': return { name: 'PC Power Connection', desc: 'Connect the ATX Power Supply Unit (PSU) to the AVR.' };
      case 'monitorPower': return { name: 'Monitor Power Connection', desc: 'Connect the Display to the AVR so it receives safe power.' };
      case 'display': return { name: 'Display Output Connection', desc: 'Route the HDMI signal from the GPU to the monitor.' };
      case 'keyboard': return { name: 'Keyboard Data Connection', desc: 'Hardwire to the Rear I/O USB ports for minimal input latency.' };
      case 'mouse': return { name: 'Mouse Data Connection', desc: 'Connect straight to the Rear I/O for precise cursor movement.' };
      default: return { name: 'Cable', desc: 'Connects peripherals' };
    }
  };

  const isComplete = mode === 'assembly'
    ? Object.values(connections).every(Boolean)
    : Object.values(connections).every(val => !val);

  // Auto-proceed after completion in assembly mode (with 3-second countdown)
  useEffect(() => {
    if (isComplete && mode === 'assembly' && onNext) {
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownRef.current!);
            onNext();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // Auto-dismiss warning messages after 3 seconds
  useEffect(() => {
    if (warningMessage) {
      const t = setTimeout(() => setWarningMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [warningMessage]);

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#d1d1d1] font-sans flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="p-6 z-10 w-full absolute top-0 left-0 pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto text-slate-400 hover:text-white flex items-center gap-2 text-base md:text-sm font-medium transition-colors bg-[#0c0c0e]/80 px-4 py-2 rounded-full border border-[#1f1f23] backdrop-blur">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>
      </header>

      {/* Diagram Canvas */}
      <main className="flex-1 w-full bg-[#0c0c0e] relative overflow-hidden flex items-center justify-center">
        <svg 
          viewBox="0 0 1200 800" 
          className="w-full h-full block min-h-[50vh] md:min-h-[500px] touch-none select-none"
          ref={svgRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f1f23" strokeWidth="1" />
              <path d="M 0 40 L 40 40 L 40 0" fill="none" stroke="#1f1f23" strokeWidth="1" />
            </pattern>

            {/* Glowing Filters */}
            <filter id="glowPower" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowDisplay" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowData" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="-10" dy="15" stdDeviation="15" floodColor="#000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Environment / Background */}
          {/* Wall */}
          <rect x="0" y="0" width="1200" height="400" fill="url(#grid)" />
          {/* Wall / Desk division line */}
          <line x1="0" y1="400" x2="1200" y2="400" stroke="#1f1f23" strokeWidth="4" />
          <line x1="0" y1="400" x2="1200" y2="400" stroke="#000" strokeWidth="8" opacity="0.6" transform="translate(0, 4)" />
          {/* Desk Surface */}
          <polygon points="0,400 1200,400 1200,800 0,800" fill="#080809" />
          <path d="M0,450 L1200,450 M0,500 L1200,500 M0,550 L1200,550 M0,600 L1200,600 M0,650 L1200,650 M0,700 L1200,700" fill="none" stroke="#1f1f23" strokeWidth="1" opacity="0.2" />

          {/* --- Components Layer --- */}
          
          {/* Wall Socket Plate */}
          <g filter="url(#shadow)">
            <ObliqueBox 
              x={60} y={120} w={70} h={100} d={10} 
              colors={{ front: "#222", top: "#333", side: "#1a1a1c", stroke: "#444" }}
            >
              {/* Inner Outlet area */}
              <rect x="75" y="140" width="40" height="60" rx="4" fill="#0a0a0b" stroke={dragging === 'avrPower' ? "#ffffff" : "#333"} strokeWidth={dragging === 'avrPower' ? 2 : 1} />
              {dragging === 'avrPower' && (
                <rect x="73" y="138" width="44" height="64" fill="transparent" stroke="#ffffff" strokeWidth={2} rx="4" />
              )}
              {/* Three pin holes */}
              <circle cx="88" cy="155" r="3" fill="#000" />
              <circle cx="102" cy="155" r="3" fill="#000" />
              <rect x="91" y="165" width="8" height="6" rx="2" fill="#000" />
            </ObliqueBox>
            <text x="95" y="105" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace" fontWeight="bold">MAIN AC</text>
            {mode === 'assembly' && !connections.avrPower && !(connections.keyboard && connections.mouse && connections.display && connections.pcPower && connections.monitorPower) && (
              <g>
                <rect x="50" y="222" width="90" height="16" rx="3" fill="#7c2d12" stroke="#dc2626" strokeWidth="1" />
                <text x="95" y="233" textAnchor="middle" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold">CONNECT LAST</text>
              </g>
            )}
          </g>

          {/* AVR (Automatic Voltage Regulator) */}
          <g filter="url(#shadow)">
            <ObliqueBox 
              x={120} y={450} w={180} h={80} d={50} 
              colors={{ front: "#1a1a1c", top: "#2a2a2c", side: "#0a0a0b", stroke: "#333" }}
            >
              {/* Front Plate details */}
              <rect x="130" y="470" width="40" height="20" rx="1" fill="#0a0a0b" stroke="#333" strokeWidth="1" />
              <text x="150" y="484" textAnchor="middle" fill="#22c55e" fontSize="10" fontFamily="monospace" fontWeight="bold">220V</text>
              <circle cx="280" cy="480" r="10" fill="#0a0a0b" stroke="#333" strokeWidth="1" />
              <circle cx="280" cy="480" r="4" fill="#22c55e" filter="drop-shadow(0 0 4px #22c55e)" />
              <rect x="185" y="500" width="100" height="15" fill="#0a0a0b" rx="0" stroke="#333" strokeWidth="1" />
              <rect x="185" y="520" width="100" height="5" fill="#0a0a0b" rx="0" stroke="#333" strokeWidth="1" />
            </ObliqueBox>
            {/* Draw Sockets on the Oblique Top Face */}
            {/* Top face polygon: (120,450) -> (170,400) -> (350,400) -> (300,450) */}
            <polygon points="180,418 190,408 210,408 200,418" fill="#0a0a0b" stroke="#000" strokeWidth="1" />
            <text x="195" y="432" textAnchor="middle" fill="#666" fontSize="8" fontFamily="monospace" transform="skewX(-45)">IN</text>

            {/* AVR Output 1 (PC Power) */}
            <g>
              <polygon points="230,418 240,408 260,408 250,418" fill="#0a0a0b" stroke={dragging === 'pcPower' ? "#ffffff" : "#000"} strokeWidth={dragging === 'pcPower' ? 2 : 1} />
              {dragging === 'pcPower' && (
                <polygon points="228,420 239,406 262,406 252,420" fill="transparent" stroke="#ffffff" strokeWidth={2} />
              )}
            </g>

            {/* AVR Output 2 (Monitor Power) */}
            <g>
              <polygon points="280,418 290,408 310,408 300,418" fill="#0a0a0b" stroke={dragging === 'monitorPower' ? "#ffffff" : "#000"} strokeWidth={dragging === 'monitorPower' ? 2 : 1} />
              {dragging === 'monitorPower' && (
                <polygon points="278,420 289,406 312,406 302,420" fill="transparent" stroke="#ffffff" strokeWidth={2} />
              )}
            </g>
            <text x="210" y="560" textAnchor="middle" fill="#a88d5e" fontSize="10" fontFamily="monospace" fontWeight="bold">AVR-PRO</text>
          </g>

          {/* Desktop PC Back Panel */}
          <g filter="url(#shadow)">
            <ObliqueBox 
              x={480} y={100} w={200} h={400} d={60} 
              colors={{ front: "#141415", top: "#1a1a1c", side: "#0a0a0b", stroke: "#333" }}
            >
              {/* PSU at Top */}
              <rect x="490" y="110" width="180" height="90" fill="#1a1a1c" stroke="#333" rx="2" />
              
              {/* PSU Cooling Fan */}
              <circle cx="610" cy="155" r="35" fill="#0a0a0b" stroke="#333" strokeDasharray="4" />
              {/* fan blades/grill */}
              <path d="M 610 120 L 610 190 M 575 155 L 645 155 M 585 130 L 635 180 M 585 180 L 635 130" stroke="#333" strokeWidth="2" />

              {/* Power Connector */}
              <rect x="505" y="140" width="36" height="24" fill="#0a0a0b" stroke={dragging === 'pcPower' ? "#ffffff" : "#444"} strokeWidth={dragging === 'pcPower' ? 2 : 1} rx="2" />
              {dragging === 'pcPower' && (
                <rect x="505" y="140" width="36" height="24" fill="#ffffff" opacity="0.3" rx="2" />
              )}
              <rect x="510" y="145" width="26" height="14" fill="#000" rx="1" />
              <rect x="515" y="148" width="16" height="4" fill="#333" />
              <circle cx="513" cy="150" r="1" fill="#666" />
              <circle cx="523" cy="150" r="1" fill="#666" />
              <circle cx="533" cy="150" r="1" fill="#666" />

              {/* I/O Panel Area (Left) */}
              <rect x="490" y="210" width="65" height="175" fill="#202020" stroke="#444" rx="2" />
              
              {/* Keyboard & Mouse Rectangular Ports */}
              <rect x="497" y="222" width="22" height="18" fill="#8b5cf6" stroke={dragging === 'keyboard' ? "#ffffff" : "#4c1d95"} strokeWidth={dragging === 'keyboard' ? 2 : 1} rx="2" />
              {dragging === 'keyboard' && (
                 <rect x="495" y="220" width="26" height="22" fill="transparent" stroke="#ffffff" strokeWidth={2} rx="2" />
              )}
              <rect x="525" y="222" width="22" height="18" fill="#10b981" stroke={dragging === 'mouse' ? "#ffffff" : "#047857"} strokeWidth={dragging === 'mouse' ? 2 : 1} rx="2" />
              {dragging === 'mouse' && (
                 <rect x="523" y="220" width="26" height="22" fill="transparent" stroke="#ffffff" strokeWidth={2} rx="2" />
              )}
              <rect x="502" y="228" width="12" height="6" fill="#000" />
              <rect x="530" y="228" width="12" height="6" fill="#000" />

              {/* Serial Port */}
              <path d="M 496 255 L 518 255 L 514 265 L 500 265 Z" fill="#0d9488" stroke="#0f766e" />
              
              {/* Display/HDMI Port */}
              <path d="M 498 276 L 518 276 L 518 282 L 515 285 L 501 285 L 498 282 Z" fill="#3b82f6" stroke={dragging === 'display' ? "#ffffff" : "#1d4ed8"} strokeWidth={dragging === 'display' ? 2 : 1} />
              {dragging === 'display' && (
                 <path d="M 496 274 L 520 274 L 520 283 L 516 287 L 500 287 L 496 283 Z" fill="transparent" stroke="#ffffff" strokeWidth={2} />
              )}

              {/* Parallel Port (Pink-ish) next to Serial */}
              <path d="M 526 255 L 546 255 L 542 285 L 530 285 Z" fill="#ec4899" stroke="#be185d" />

              {/* USB Ports + RJ-45 */}
              <rect x="498" y="300" width="18" height="8" fill="#111" stroke="#333" />
              <rect x="498" y="315" width="18" height="8" fill="#111" stroke="#333" />
              <rect x="524" y="300" width="18" height="8" fill="#111" stroke="#333" />
              <rect x="524" y="315" width="18" height="8" fill="#111" stroke="#333" />
              
              <rect x="510" y="335" width="24" height="20" fill="#111" stroke="#333" rx="1" /> {/* RJ-45 */}

              {/* Audio Jacks */}
              <rect x="498" y="363" width="48" height="16" fill="#333" rx="2" />
              <circle cx="508" cy="371" r="4.5" fill="#ec4899" /> {/* Mic Pink */}
              <circle cx="522" cy="371" r="4.5" fill="#10b981" /> {/* Out Green */}
              <circle cx="536" cy="371" r="4.5" fill="#3b82f6" /> {/* Line In Blue */}

              {/* Case Cooling Fan */}
              <rect x="565" y="215" width="95" height="95" fill="#0a0a0b" rx="4" stroke="#222" />
              <circle cx="612" cy="262" r="42" fill="none" stroke="#222" strokeWidth="2" strokeDasharray="3 3" />
              {/* Drill hole effects for fan grill */}
              {[...Array(5)].map((_, i) => 
                [...Array(5)].map((_, j) => (
                  <circle key={`fan-${i}-${j}`} cx={580 + j * 16} cy={230 + i * 16} r="2.5" fill="#222" />
                ))
              )}

              {/* Expansion Slots */}
              <rect x="490" y="395" width="180" height="90" fill="#222" rx="2" stroke="#111" />
              <rect x="500" y="405" width="160" height="15" fill="#111" stroke="#333" />
              <rect x="500" y="425" width="160" height="15" fill="#111" stroke="#333" />
              <rect x="500" y="445" width="160" height="15" fill="#111" stroke="#333" />
              <rect x="500" y="465" width="160" height="15" fill="#111" stroke="#333" />

              {/* Modem port on bottom slot */}
              <rect x="520" y="467" width="12" height="10" fill="#000" rx="1" />
              <rect x="540" y="467" width="12" height="10" fill="#000" rx="1" />

              {/* Label */}
              <rect x="550" y="75" width="130" height="18" fill="#a88d5e" rx="1" />
              <text x="615" y="87" textAnchor="middle" fill="#000" fontSize="9" fontFamily="monospace" fontWeight="bold">SYSTEM UNIT (I/O)</text>
            </ObliqueBox>
          </g>

          {/* Monitor */}
          <g filter="url(#shadow)">
            {/* Monitor Base Plate (Desk level) */}
            <ObliqueBox 
              x={920} y={350} w={160} h={15} d={60} 
              colors={{ front: "#1a1a1c", top: "#222", side: "#0a0a0b", stroke: "#333" }}
            />
            {/* Stand Pole */}
            <ObliqueBox 
              x={980} y={230} w={40} h={120} d={20} 
              colors={{ front: "#1a1a1c", top: "#222", side: "#0a0a0b", stroke: "#333" }}
            />
            {/* Monitor Screen Body (Front view) */}
            <ObliqueBox 
              x={850} y={50} w={300} h={180} d={20} 
              colors={{ front: "#111", top: "#222", side: "#0a0a0b", stroke: "#333" }}
            >
              {/* Screen Bezel */}
              <rect x="855" y="55" width="290" height="170" fill="#000" rx="4" />
              {/* Inner Display */}
              <rect x="860" y="60" width="280" height="155" fill="#0c0c0e" rx="2" />
              
              {/* Simulated Screen Content - only bright if connected, otherwise very dim "NO SIGNAL" */}
              {connections.pcPower && connections.display && connections.monitorPower ? (
                <g>
                  {/* Fake window */}
                  <rect x="870" y="70" width="180" height="100" fill="#141418" stroke="#1f1f23" rx="2" />
                  <rect x="870" y="70" width="180" height="15" fill="#1f1f23" rx="2" />
                  <circle cx="880" cy="77" r="3" fill="#ef4444" />
                  <circle cx="890" cy="77" r="3" fill="#eab308" />
                  <circle cx="900" cy="77" r="3" fill="#22c55e" />
                  <line x1="880" y1="95" x2="1000" y2="95" stroke="#a88d5e" strokeWidth="3" strokeLinecap="round" />
                  <line x1="880" y1="105" x2="1030" y2="105" stroke="#444" strokeWidth="2" strokeLinecap="round" />
                  <line x1="880" y1="115" x2="980" y2="115" stroke="#444" strokeWidth="2" strokeLinecap="round" />
                  <rect x="880" y="130" width="40" height="15" fill="#3b82f6" rx="2" />
                </g>
              ) : (
                <text x="1000" y="140" textAnchor="middle" fill="#222" fontSize="16" fontFamily="monospace" fontWeight="bold">NO SIGNAL</text>
              )}

              {/* Lower Bezel Details (Power LED & Logo) */}
              <rect x="980" y="218" width="40" height="4" fill="#333" rx="1" />
              <circle cx="1130" cy="220" r="2" fill={connections.monitorPower ? "#10b981" : "#555"} />
              
              {/* Label */}
              <rect x="950" y="25" width="100" height="18" fill="#a88d5e" rx="1" />
              <text x="1000" y="37" textAnchor="middle" fill="#000" fontSize="9" fontFamily="monospace" fontWeight="bold">DISPLAY NODE</text>
            </ObliqueBox>

            {/* Ports box hanging below the monitor so cables can still connect to something visible */}
            <g>
               <rect x="930" y="230" width="140" height="15" fill="#0a0a0b" stroke="#333" />
               {/* HDMI Port */}
               <rect x="962" y="230" width="16" height="8" fill="#1a1a1c" stroke="#444" />
               <text x="970" y="245" textAnchor="middle" fill="#555" fontSize="7" fontFamily="sans-serif">HDMI</text>
               {/* AC Power Port */}
               <rect x="1022" y="230" width="16" height="8" fill="#1a1a1c" stroke="#444" />
               <text x="1030" y="245" textAnchor="middle" fill="#555" fontSize="7" fontFamily="sans-serif">AC IN</text>
            </g>
          </g>

          {/* Keyboard (Top oblique view) */}
          <g filter="url(#shadow)">
            <ObliqueBox 
              x={750} y={600} w={220} h={15} d={70} 
              colors={{ front: "#1a1a1c", top: "#0a0a0b", side: "#050505", stroke: "#333" }}
            />
            {/* Map 2D keys onto the top face */}
            <g transform="matrix(1, 0, 1, -1, 750, 600)">
              {/* Base plate */}
              <rect x="4" y="4" width="212" height="62" fill="#111" rx="2" />
              
              {/* RGB Glow Underglow */}
              <rect x="4" y="4" width="212" height="62" fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.3" pointerEvents="none" filter="url(#glowData)" rx="2" />

              {/* Row 5: F-keys (y=56) */}
              {Array.from({ length: 14 }).map((_, i) => <rect key={`r5-${i}`} x={8 + i*9.5} y={56} width="8" height="6" fill="#1a1a1c" stroke="#222" rx="1" />)}
              
              {/* Row 4: Nums (y=46) */}
              {Array.from({ length: 14 }).map((_, i) => <rect key={`r4-${i}`} x={8 + i*9.5} y={46} width="8" height="8" fill="#1a1a1c" stroke="#333" rx="1" />)}
              
              {/* Row 3: QWE (y=36) */}
              <rect x={8} y={36} width={12} height={8} fill="#1a1a1c" stroke="#333" rx={1} />
              {Array.from({ length: 12 }).map((_, i) => <rect key={`r3-${i}`} x={22 + i*9.5} y={36} width="8" height="8" fill="#222" stroke="#444" rx="1" />)}
              <rect x={136} y={36} width={14} height={8} fill="#1a1a1c" stroke="#333" rx={1} />

              {/* Row 2: ASD (y=26) */}
              <rect x={8} y={26} width={14} height={8} fill="#1a1a1c" stroke="#333" rx={1} />
              {Array.from({ length: 11 }).map((_, i) => <rect key={`r2-${i}`} x={24 + i*9.5} y={26} width="8" height="8" fill="#222" stroke="#444" rx="1" />)}
              <rect x={128.5} y={26} width={21.5} height={8} fill="#1a1a1c" stroke="#333" rx={1} />

              {/* Row 1: ZXC (y=16) */}
              <rect x={8} y={16} width={18} height={8} fill="#1a1a1c" stroke="#333" rx={1} />
              {Array.from({ length: 10 }).map((_, i) => <rect key={`r1-${i}`} x={28 + i*9.5} y={16} width="8" height="8" fill="#222" stroke="#444" rx="1" />)}
              <rect x={123} y={16} width={27} height={8} fill="#1a1a1c" stroke="#333" rx={1} />

              {/* Row 0: Space (y=6) */}
              {[8, 18, 28].map((x, i) => <rect key={`mod-l-${i}`} x={x} y={6} width="8" height="8" fill="#1a1a1c" stroke="#333" rx="1" />)}
              <rect x={38} y={6} width={66} height={8} fill="#29292e" stroke="#555" rx={1} />
              {[106, 116, 126, 136].map((x, i) => <rect key={`mod-r-${i}`} x={x} y={6} width="8" height="8" fill="#1a1a1c" stroke="#333" rx="1" />)}

              {/* Nav cluster (x=145..170) */}
              {[145, 155, 165].map((x, i) => <rect key={`nav0-${i}`} x={x} y={56} width="8" height="6" fill="#1a1a1c" stroke="#222" rx="1" />)}
              {[145, 155, 165].map((x, i) => <rect key={`nav1-${i}`} x={x} y={46} width="8" height="8" fill="#1a1a1c" stroke="#333" rx="1" />)}
              {[145, 155, 165].map((x, i) => <rect key={`nav2-${i}`} x={x} y={36} width="8" height="8" fill="#1a1a1c" stroke="#333" rx="1" />)}
              <rect x={155} y={16} width={8} height={8} fill="#1a1a1c" stroke="#333" rx={1} />
              {[145, 155, 165].map((x, i) => <rect key={`arr-${i}`} x={x} y={6} width="8" height="8" fill="#1a1a1c" stroke="#333" rx="1" />)}

              {/* Numpad (x=180..210) */}
              {[180, 190, 200, 210].map((x, i) => <rect key={`np5-${i}`} x={x} y={46} width="8" height="8" fill="#1a1a1c" stroke="#333" rx="1" />)}
              {[180, 190, 200].map((x, i) => <rect key={`np4-${i}`} x={x} y={36} width="8" height="8" fill="#222" stroke="#444" rx="1" />)}
              <rect x={210} y={26} width={8} height={18} fill="#1a1a1c" stroke="#333" rx={1} />
              {[180, 190, 200].map((x, i) => <rect key={`np3-${i}`} x={x} y={26} width="8" height="8" fill="#222" stroke="#444" rx="1" />)}
              {[180, 190, 200].map((x, i) => <rect key={`np2-${i}`} x={x} y={16} width="8" height="8" fill="#222" stroke="#444" rx="1" />)}
              <rect x={210} y={6} width={8} height={18} fill="#1a1a1c" stroke="#333" rx={1} />
              <rect x={180} y={6} width={18} height={8} fill="#222" stroke="#444" rx={1} />
              <rect x={200} y={6} width={8} height={8} fill="#222" stroke="#444" rx={1} />
            </g>
            <text x="880" y="640" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace" fontWeight="bold">KEYBOARD (USB)</text>
          </g>

          {/* Mouse */}
          <g filter="url(#shadow)">
            {/* Base shadow */}
            <ellipse cx="1080" cy="565" rx="35" ry="25" fill="#000" opacity="0.6" transform="rotate(-30 1080 565)" />
            {/* Main Mouse Body rendered as an isometric-ish elliptical pod */}
            <g transform="translate(1080, 560) rotate(-30)">
              <ellipse cx="0" cy="0" rx="35" ry="20" fill="#0a0a0b" stroke="#333" />
              <ellipse cx="-5" cy="-2" rx="30" ry="15" fill="#141415" />
              {/* Scroll wheel */}
              <rect x="5" y="-3" width="10" height="4" fill="#3b82f6" rx="1" filter="url(#glowData)" />
            </g>
            <text x="1080" y="610" textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace" fontWeight="bold">MOUSE (USB)</text>
          </g>

          {/* Cables Layer (Placed in front of components so they are visible over the ports) */}
          <g style={{ opacity: (activeLayer === 'all' || activeLayer === 'power') ? 1 : 0.05, transition: "opacity 0.3s" }}>
            {/* Wall -> AVR Power */}
            <DraggableCable
              id="avrPower"
              start={{ x: 200, y: 418 }}
              restEnd={{ x: 180, y: 350 }}
              targetEnd={{ x: 95, y: 155 }}
              connectedControlPoints={[{ x: 200, y: 300 }, { x: 95, y: 250 }]}
              disconnectedControlPoints={[{ x: 200, y: 380 }, { x: 180, y: 380 }]}
              color="#f59e0b" glowId="glowPower" width={4}
              isConnected={connections.avrPower}
              isDragging={dragging === 'avrPower'}
              dragPos={dragPos}
              onPointerDown={(e: React.PointerEvent) => handlePointerDown('avrPower', e)}
              label="CONNECT AC"
              opacity={(() => {
                if (activeLayer !== 'all' && activeLayer !== 'power') return 0.05;
                if (mode === 'assembly' && !connections.avrPower) {
                  const othersConnected = connections.keyboard && connections.mouse &&
                    connections.display && connections.pcPower && connections.monitorPower;
                  return othersConnected ? 1 : 0.35;
                }
                return 1;
              })()}
              style={{
                cursor: (mode === 'assembly' && !connections.avrPower &&
                  !(connections.keyboard && connections.mouse && connections.display && connections.pcPower && connections.monitorPower))
                  || (mode === 'disassembly' && (connections.pcPower || connections.monitorPower))
                  ? 'not-allowed' : undefined
              }}
            />
            {/* AVR -> PC Power */}
            <DraggableCable
              id="pcPower"
              start={{ x: 250, y: 418 }}
              restEnd={{ x: 450, y: 250 }}
              targetEnd={{ x: 523, y: 152 }}
              connectedControlPoints={[{ x: 250, y: 300 }, { x: 523, y: 250 }]}
              disconnectedControlPoints={[{ x: 250, y: 350 }, { x: 400, y: 250 }]}
              color="#ffffff" glowId="glowPower" width={4}
              isConnected={connections.pcPower}
              isDragging={dragging === 'pcPower'}
              dragPos={dragPos}
              onPointerDown={(e: React.PointerEvent) => handlePointerDown('pcPower', e)}
              label="CONNECT PSU"
              opacity={activeLayer === 'all' || activeLayer === 'power' ? 1 : 0.05}
            />
            {/* Monitor Power -> AVR */}
            <DraggableCable
              id="monitorPower"
              start={{ x: 1030, y: 230 }}
              restEnd={{ x: 950, y: 350 }}
              targetEnd={{ x: 300, y: 418 }}
              connectedControlPoints={[{ x: 1030, y: 500 }, { x: 300, y: 350 }]}
              disconnectedControlPoints={[{ x: 1000, y: 300 }, { x: 950, y: 300 }]}
              color="#ec4899" glowId="glowPower" width={4}
              isConnected={connections.monitorPower}
              isDragging={dragging === 'monitorPower'}
              dragPos={dragPos}
              onPointerDown={(e: React.PointerEvent) => handlePointerDown('monitorPower', e)}
              label="CONNECT MON PWR"
              opacity={activeLayer === 'all' || activeLayer === 'power' ? 1 : 0.05}
            />
          </g>

          <g style={{ opacity: (activeLayer === 'all' || activeLayer === 'display') ? 1 : 0.05, transition: "opacity 0.3s" }}>
            {/* PC HDMI -> Monitor */}
            <DraggableCable
              id="display"
              start={{ x: 970, y: 230 }}
              restEnd={{ x: 900, y: 400 }}
              targetEnd={{ x: 508, y: 280 }}
              connectedControlPoints={[{ x: 800, y: 350 }, { x: 600, y: 280 }]}
              disconnectedControlPoints={[{ x: 970, y: 350 }, { x: 920, y: 395 }]}
              color="#8b5cf6" glowId="glowDisplay" width={5}
              isConnected={connections.display}
              isDragging={dragging === 'display'}
              dragPos={dragPos}
              onPointerDown={(e: React.PointerEvent) => handlePointerDown('display', e)}
              label="CONNECT HW"
              opacity={activeLayer === 'all' || activeLayer === 'display' ? 1 : 0.05}
            />
          </g>

          <g style={{ opacity: (activeLayer === 'all' || activeLayer === 'data') ? 1 : 0.05, transition: "opacity 0.3s" }}>
            {/* PC USB -> Keyboard */}
            <DraggableCable
              id="keyboard"
              start={{ x: 820, y: 530 }}
              restEnd={{ x: 730, y: 480 }}
              targetEnd={{ x: 508, y: 231 }}
              connectedControlPoints={[{ x: 650, y: 530 }, { x: 450, y: 231 }]}
              disconnectedControlPoints={[{ x: 800, y: 530 }, { x: 740, y: 480 }]}
              color="#3b82f6" glowId="glowData" width={3}
              isConnected={connections.keyboard}
              isDragging={dragging === 'keyboard'}
              dragPos={dragPos}
              onPointerDown={(e: React.PointerEvent) => handlePointerDown('keyboard', e)}
              label="CONNECT KB"
              opacity={activeLayer === 'all' || activeLayer === 'data' ? 1 : 0.05}
            />

            {/* PC USB -> Mouse */}
            <DraggableCable
              id="mouse"
              start={{ x: 1040, y: 540 }}
              restEnd={{ x: 920, y: 480 }}
              targetEnd={{ x: 536, y: 231 }}
              connectedControlPoints={[{ x: 850, y: 540 }, { x: 600, y: 231 }]}
              disconnectedControlPoints={[{ x: 1000, y: 540 }, { x: 930, y: 480 }]}
              color="#3b82f6" glowId="glowData" width={3}
              isConnected={connections.mouse}
              isDragging={dragging === 'mouse'}
              dragPos={dragPos}
              onPointerDown={(e: React.PointerEvent) => handlePointerDown('mouse', e)}
              label="CONNECT MS"
              opacity={activeLayer === 'all' || activeLayer === 'data' ? 1 : 0.05}
            />
          </g>

          {/* Tooltip for dragging item */}
          <AnimatePresence>
            {dragging && (
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
                      {getTooltipContent(dragging).name}
                    </div>
                    <div className="text-[10px] leading-tight text-slate-400">
                      {getTooltipContent(dragging).desc}
                    </div>
                  </div>
                </foreignObject>
                {/* Tooltip Arrow */}
                <polygon points="12,-6 12,6 6,0" fill="#334155" />
                <polygon points="17,-4 17,4 10,0" fill="#020617" />
              </motion.g>
            )}
          </AnimatePresence>

        </svg>

      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-[#1f1f23] flex flex-wrap justify-between gap-4 bg-[#080809] z-10 w-full text-[#eee]">
        <div className="flex flex-wrap gap-4 md:gap-12 text-sm md:text-xs font-mono">
          <div className="flex flex-col gap-1">
            <span className="text-xs md:text-[10px] text-[#555] uppercase font-bold tracking-wider">Voltage Input</span>
            <span className="text-[#eee]">220-240V AC</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs md:text-[10px] text-[#555] uppercase font-bold tracking-wider">Peak Load</span>
            <span className="text-[#eee]">2.5 AMP MAX</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs md:text-[10px] text-[#555] uppercase font-bold tracking-wider">Surge Protection</span>
            <span className="text-[#22c55e]">ACTIVE</span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[10px] text-[#444] font-mono">DIAGRAM_ID_REAR_001A</span>
        </div>
      </footer>

      {/* Warning message for ordering constraints */}
      <AnimatePresence>
        {warningMessage && (
          <motion.div
            key="warning-msg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-950/95 backdrop-blur-xl border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] px-6 py-3 rounded-full"
          >
            <p className="text-sm text-red-300 font-semibold whitespace-nowrap">{warningMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 md:bottom-24 md:left-auto md:right-8 z-50 bg-[#0c0c0e]/95 backdrop-blur-xl border border-[#3b82f6]/50 shadow-[0_0_30px_rgba(59,130,246,0.2)] p-6 rounded-xl md:max-w-sm"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-[#3b82f6]/20">
                <CheckCircle2 className="w-6 h-6 text-[#3b82f6]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                  {mode === 'assembly' ? 'External Setup Complete!' : 'Disconnection Complete'}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {mode === 'assembly'
                    ? 'All foundational data and power links are physically established and verified.'
                    : 'All cables have been safely disconnected from the rear panel.'}
                </p>
                {mode === 'assembly' && countdown !== null ? (
                  <div className="w-full bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#3b82f6] font-medium py-2 px-4 rounded-md text-center">
                    Proceeding to internal assembly in {countdown}s…
                  </div>
                ) : (
                  <button
                    onClick={onNext || onBack}
                    className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {nextLabel || 'Return to Menu'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

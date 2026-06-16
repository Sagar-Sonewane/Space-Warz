/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { sound } from "../sound";
import { X, Paintbrush, Flame, Keyboard, RotateCcw, Rocket } from "lucide-react";

interface HangarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: () => void; // custom trigger for game ref update
}

export interface ShipCustomization {
  color: "cyan" | "green" | "red" | "gold" | "violet";
  trail: "classic" | "plasma" | "toxic" | "void" | "gold";
  control: "both" | "arrows" | "wasd";
}

export const SHIP_COLOR_PALETTES = {
  cyan: {
    name: "ELECTRIC CYAN",
    primary: "#22d3ee",
    glow: "#06b6d4",
    fill: "rgba(6, 182, 212, 0.2)",
    core: "#a855f7",
    textColor: "text-cyan-400",
    glowClass: "glow-cyan",
    bgClass: "bg-cyan-500",
    borderClass: "border-cyan-500"
  },
  green: {
    name: "VIPER GREEN",
    primary: "#4ade80",
    glow: "#22c55e",
    fill: "rgba(34, 197, 94, 0.2)",
    core: "#facc15",
    textColor: "text-emerald-400",
    glowClass: "glow-green",
    bgClass: "bg-emerald-500",
    borderClass: "border-emerald-500"
  },
  red: {
    name: "HYPER RED",
    primary: "#f87171",
    glow: "#ef4444",
    fill: "rgba(239, 68, 68, 0.2)",
    core: "#22d3ee",
    textColor: "text-rose-400",
    glowClass: "glow-red",
    bgClass: "bg-rose-500",
    borderClass: "border-rose-500"
  },
  gold: {
    name: "GOLD PHOENIX",
    primary: "#fbbf24",
    glow: "#f59e0b",
    fill: "rgba(245, 158, 11, 0.2)",
    core: "#f43f5e",
    textColor: "text-amber-400",
    glowClass: "glow-orange",
    bgClass: "bg-amber-500",
    borderClass: "border-amber-500"
  },
  violet: {
    name: "NEBULA VIOLET",
    primary: "#c084fc",
    glow: "#a855f7",
    fill: "rgba(168, 85, 247, 0.2)",
    core: "#38bdf8",
    textColor: "text-fuchsia-400",
    glowClass: "glow-fuchsia",
    bgClass: "bg-fuchsia-500",
    borderClass: "border-fuchsia-500"
  }
};

export const ENGINE_TRAIL_PALETTES = {
  classic: {
    name: "PLASMA BLAZE",
    colors: ["#f97316", "#ef4444", "#eab308"],
    colNotes: "Traditional core fuel plasma",
    glowClass: "glow-orange"
  },
  plasma: {
    name: "CYBER PULSAR",
    colors: ["#38bdf8", "#06b6d4", "#22d3ee", "#60a5fa"],
    colNotes: "High-octane particle storm",
    glowClass: "glow-cyan"
  },
  toxic: {
    name: "TOXIC WASTE",
    colors: ["#4ade80", "#22c55e", "#a3e635", "#84cc16"],
    colNotes: "Corrosive acid propulsion",
    glowClass: "glow-green"
  },
  void: {
    name: "DARK VOID",
    colors: ["#c084fc", "#a855f7", "#ec4899", "#db2777"],
    colNotes: "Mystical matter singularity",
    glowClass: "glow-fuchsia"
  },
  gold: {
    name: "STELLAR STARS",
    colors: ["#fbbf24", "#f59e0b", "#d97706", "#fef08a"],
    colNotes: "Compressed asteroid gold-dust",
    glowClass: "glow-orange"
  }
};

export const HangarModal: React.FC<HangarModalProps> = ({ isOpen, onClose, onSettingsChanged }) => {
  const [config, setConfig] = useState<ShipCustomization>({
    color: "cyan",
    trail: "classic",
    control: "both"
  });

  // Load from local storage
  useEffect(() => {
    if (isOpen) {
      sound.playClick();
      const savedColor = localStorage.getItem("space_warz_ship_color") || "cyan";
      const savedTrail = localStorage.getItem("space_warz_engine_trail") || "classic";
      const savedControl = localStorage.getItem("space_warz_control_layout") || "both";

      setConfig({
        color: savedColor as any,
        trail: savedTrail as any,
        control: savedControl as any
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveOption = (key: keyof ShipCustomization, value: any) => {
    sound.playClick();
    const nextConfig = { ...config, [key]: value };
    setConfig(nextConfig);

    // Persist immediately in localStorage
    if (key === "color") localStorage.setItem("space_warz_ship_color", value);
    if (key === "trail") localStorage.setItem("space_warz_engine_trail", value);
    if (key === "control") localStorage.setItem("space_warz_control_layout", value);

    if (onSettingsChanged) {
      onSettingsChanged();
    }
  };

  const resetToDefault = () => {
    sound.playPowerup();
    localStorage.setItem("space_warz_ship_color", "cyan");
    localStorage.setItem("space_warz_engine_trail", "classic");
    localStorage.setItem("space_warz_control_layout", "both");

    setConfig({
      color: "cyan",
      trail: "classic",
      control: "both"
    });

    if (onSettingsChanged) {
      onSettingsChanged();
    }
  };

  const selectedPalette = SHIP_COLOR_PALETTES[config.color];
  const selectedTrail = ENGINE_TRAIL_PALETTES[config.trail];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Background neon radial blur */}
      <div className="absolute w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none -translate-x-24" />
      <div className="absolute w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none translate-x-24" />

      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-cyan-500 rounded-lg p-6 neon-border-glow-blue text-slate-100 overflow-hidden font-sans">
        
        {/* CRT scanlines effect emulation */}
        <div className="absolute inset-0 bg-slate-900/10 pointer-events-none z-10" />

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-cyan-400 hover:text-purple-400 hover:scale-110 active:scale-95 transition-all p-1.5 bg-slate-950/60 rounded-md border border-cyan-900 z-20"
          id="btn-close-hangar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title Grid */}
        <div className="text-center mb-6 border-b border-cyan-900/50 pb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Rocket className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-lg md:text-xl font-retro text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 uppercase tracking-widest leading-none">
              INTERCEPTOR HANGAR
            </h2>
          </div>
          <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
            CALIBRATE VEHICLE SPECIFICATIONS & PILOT MANUAL KEYBOARD INTERFACE
          </p>
        </div>

        {/* Main Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          
          {/* LEFT: Ship Live Schematic Blueprint (Interactive preview) */}
          <div className="md:col-span-5 bg-slate-950/90 border border-slate-800/80 rounded-md p-4 flex flex-col justify-between items-center relative min-h-[220px] shadow-inner select-none md:max-h-[380px]">
            
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
            
            <span className="text-[7px] text-slate-500 font-retro tracking-widest block self-start uppercase">
              // SYS.VEHICLE.RENDER
            </span>

            {/* Simulated Canvas Render of standard ship shape with selected colors */}
            <div className="relative my-auto flex flex-col items-center justify-center translate-y-2">
              
              {/* Ship shape mock */}
              <svg
                width="140"
                height="150"
                viewBox="0 0 100 100"
                className="overflow-visible"
              >
                {/* Glow Filter */}
                <defs>
                  <filter id="vector-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Particle Trails */}
                <g opacity="0.8">
                  {selectedTrail.colors.map((trailCol, i) => {
                    const spreadX = (i - (selectedTrail.colors.length - 1) / 2) * 12;
                    const hOffset = Math.sin(Date.now() * 0.05 + i) * 3;
                    return (
                      <path
                        key={i}
                        d={`M ${50 + spreadX} 82 L ${50 + spreadX + hOffset} 115`}
                        stroke={trailCol}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        opacity={0.8 - i * 0.12}
                        filter="url(#vector-glow)"
                        className="animate-pulse"
                      />
                    );
                  })}
                </g>

                {/* Vector Ship Body */}
                <polygon
                  points="50,15 85,80 68,68 32,68 15,80"
                  stroke={selectedPalette.primary}
                  strokeWidth="3"
                  fill={selectedPalette.fill}
                  strokeLinejoin="round"
                  filter="url(#vector-glow)"
                />

                {/* Engine core */}
                <polygon
                  points="50,45 62,65 38,65"
                  stroke={selectedPalette.core}
                  strokeWidth="2"
                  fill="rgba(168, 85, 247, 0.1)"
                  strokeLinejoin="round"
                />

                {/* Tactical thruster brackets */}
                <line x1="38" y1="65" x2="35" y2="80" stroke={selectedPalette.primary} strokeWidth="2.5" />
                <line x1="62" y1="65" x2="65" y2="80" stroke={selectedPalette.primary} strokeWidth="2.5" />
              </svg>

              {/* Holographic detail labels */}
              <div className="text-center mt-6">
                <span className={`text-[10px] font-bold font-retro tracking-widest ${selectedPalette.textColor}`}>
                  {selectedPalette.name}
                </span>
                <p className="text-[7px] text-slate-500 font-mono tracking-widest mt-1 uppercase">
                  TRAIL: {selectedTrail.name}
                </p>
              </div>
            </div>

            <div className="w-full flex justify-between items-center text-[7px] text-slate-500 font-mono mt-4 pt-2 border-t border-slate-900">
              <span>HULL NO: NX-2026</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full inline-block animate-ping" />
                DOCK SAFE
              </span>
            </div>
          </div>

          {/* RIGHT: Option Choices Category */}
          <div className="md:col-span-7 flex flex-col justify-between gap-5">
            
            {/* Customization Slates */}
            <div className="space-y-4">
              
              {/* Category 1: Ship Color Paintbrush */}
              <div className="bg-slate-950/80 p-3 rounded border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-300 font-retro uppercase flex items-center gap-1.5 leading-none">
                    <Paintbrush className="w-3.5 h-3.5 text-cyan-400" />
                    VESSEL HULL PAINT
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">5 OPTIONS</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                  {(Object.keys(SHIP_COLOR_PALETTES) as Array<keyof typeof SHIP_COLOR_PALETTES>).map((colKey) => {
                    const isSelected = config.color === colKey;
                    const p = SHIP_COLOR_PALETTES[colKey];
                    return (
                      <button
                        key={colKey}
                        onClick={() => saveOption("color", colKey)}
                        className={`flex-1 min-w-[55px] p-2 rounded border text-center transition-all flex flex-col items-center justify-center gap-1.5 relative group ${
                          isSelected
                            ? `${p.borderClass} ${p.bgClass}/10 ${p.textColor} neon-border-glow-${colKey === 'violet' ? 'purple' : colKey === 'gold' ? 'orange' : colKey}`
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                        style={{ contentVisibility: "auto" }}
                      >
                        {/* Swatch Dot */}
                        <div
                          className={`w-4 h-4 rounded-full border border-black/40 shadow-sm ${p.bgClass} ${isSelected ? 'scale-110 ring-2 ring-white/10' : ''}`}
                        />
                        <span className="text-[7px] font-retro tracking-tighter block whitespace-nowrap">
                          {colKey.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Engine Trail selection */}
              <div className="bg-slate-950/80 p-3 rounded border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-300 font-retro uppercase flex items-center gap-1.5 leading-none">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    ENGINE ION TRAIL
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">ENGINE CORE SPARK</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1">
                  {(Object.keys(ENGINE_TRAIL_PALETTES) as Array<keyof typeof ENGINE_TRAIL_PALETTES>).map((trailKey) => {
                    const isSelected = config.trail === trailKey;
                    const tr = ENGINE_TRAIL_PALETTES[trailKey];
                    return (
                      <button
                        key={trailKey}
                        onClick={() => saveOption("trail", trailKey)}
                        className={`p-2 rounded border text-center transition-all flex flex-col items-center justify-center gap-1.5 relative ${
                          isSelected
                            ? `border-cyan-500 bg-cyan-500/10 text-cyan-200 neon-border-glow-blue`
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                        title={tr.colNotes}
                      >
                        {/* Gradient Preview Line */}
                        <div className="flex gap-1 h-1.5 w-8 rounded-sm overflow-hidden bg-slate-950">
                          {tr.colors.map((c, idx) => (
                            <div key={idx} className="flex-1" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <span className="text-[7px] font-retro tracking-tighter block truncate max-w-full">
                          {trailKey.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-[7px] text-slate-400/90 font-mono italic">
                  Propulsion signature: <span className="text-cyan-400">{selectedTrail.colNotes}</span>.
                </span>
              </div>

              {/* Category 3: Control Layout scheme */}
              <div className="bg-slate-950/80 p-3 rounded border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-300 font-retro uppercase flex items-center gap-1.5 leading-none">
                    <Keyboard className="w-3.5 h-3.5 text-purple-400" />
                    KEYBOARD CONTROLS SCHEME
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">INTERCEPTOR NAVIGATION</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { key: "both", label: "WASD + ARROWS", notes: "Standard layout" },
                    { key: "arrows", label: "ARROW KEYS ONLY", notes: "No WASD response" },
                    { key: "wasd", label: "WASD KEYS ONLY", notes: "No arrow response" }
                  ].map((item) => {
                    const isSelected = config.control === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => saveOption("control", item.key as any)}
                        className={`p-2 rounded border text-left transition-all flex flex-col justify-between h-[52px] ${
                          isSelected
                            ? "border-purple-500 bg-purple-500/10 text-purple-200 neon-border-glow-purple"
                            : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-[8px] font-retro tracking-tighter block leading-tight">
                          {item.label}
                        </span>
                        <span className="text-[7px] text-slate-500 leading-tight block">
                          {item.notes}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Panel Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
              <button
                onClick={resetToDefault}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded text-[9px] font-retro text-slate-450 tracking-wider hover:text-slate-200 transition-all hover:border-slate-700"
                id="btn-hangar-reset"
              >
                <RotateCcw className="w-3 h-3" />
                RESET CONFIG
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 border border-cyan-400/40 rounded font-retro text-[9px] tracking-wider text-white shadow-lg active:scale-95 transition-all text-center leading-normal"
                id="btn-hangar-accept"
              >
                INITIALIZE SHIP SYSTEMS
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

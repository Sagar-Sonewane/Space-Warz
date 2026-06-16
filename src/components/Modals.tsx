/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { sound } from "../sound";
import { X, Volume2, VolumeX, Trophy, Shield, HelpCircle, Swords } from "lucide-react";

interface HighScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HighScoreModal: React.FC<HighScoreModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState({
    highScore: 0,
    bestRun: 0,
    totalDestroyed: 0,
  });

  useEffect(() => {
    if (isOpen) {
      sound.playClick();
      const highScore = parseInt(localStorage.getItem("space_warz_highscore") || "0", 10);
      const bestRun = parseInt(localStorage.getItem("space_warz_bestrun") || "0", 10);
      const totalDestroyed = parseInt(localStorage.getItem("space_warz_totaldestroyed") || "0", 10);
      setStats({ highScore, bestRun, totalDestroyed });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Glow background */}
      <div className="absolute w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none translate-x-20" />

      <div className="relative w-full max-w-md bg-slate-900 border-2 border-purple-500 rounded-lg p-6 neon-border-glow-purple retro-grid text-slate-100 overflow-hidden">
        {/* CRT Overlay on index */}
        <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-purple-400 hover:text-cyan-400 hover:scale-110 active:scale-95 transition-all p-1 bg-slate-950/60 rounded-md border border-purple-900"
          id="btn-close-highscore"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6 border-b border-purple-920/60 pb-3 justify-center">
          <Trophy className="w-6 h-6 text-yellow-400 animate-bounce" />
          <h2 className="text-xl font-retro text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-center uppercase tracking-wider neon-text-glow-purple">
            WARZ RECORDS
          </h2>
        </div>

        {/* Scores */}
        <div className="space-y-4 my-6 font-retro text-xs md:text-sm">
          <div className="bg-slate-950/80 p-4 border border-cyan-800/40 rounded-md flex flex-col gap-1 hover:border-cyan-500/60 transition-all">
            <span className="text-cyan-400 text-[10px] uppercase">High Score</span>
            <span className="text-2xl font-bold tracking-widest text-cyan-200 neon-text-glow-blue font-mono">
              {stats.highScore.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/80 p-4 border border-purple-800/40 rounded-md flex flex-col gap-1 hover:border-purple-500/60 transition-all">
            <span className="text-purple-400 text-[10px] uppercase">Best Run</span>
            <span className="text-xl font-bold tracking-widest text-purple-200 neon-text-glow-purple font-mono">
              {stats.bestRun.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/80 p-4 border border-emerald-800/40 rounded-md flex flex-col gap-1 hover:border-emerald-500/60 transition-all">
            <span className="text-emerald-400 text-[10px] uppercase">Enemies Vaporized</span>
            <span className="text-xl font-bold tracking-widest text-slate-100 font-mono flex items-center gap-2">
              <Swords className="w-4 h-4 text-emerald-400 inline" />
              {stats.totalDestroyed.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Controls Guide */}
        <div className="mt-6 border-t border-purple-900/60 pt-4 text-[10px] text-slate-400 leading-relaxed font-sans flex items-start gap-2">
          <Shield className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            System status: <span className="text-emerald-400 font-mono">ONLINE</span>. Clean gameplay score counters generated local-only. Good luck pilot!
          </div>
        </div>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onOpenHangar?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  onOpenHangar,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playClick();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="absolute w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-cyan-500 rounded-lg p-6 neon-border-glow-blue retro-grid text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-cyan-400 hover:text-purple-400 hover:scale-110 active:scale-95 transition-all p-1 bg-slate-950/60 rounded-md border border-cyan-900"
          id="btn-close-settings"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-cyan-900/60 pb-3 justify-center">
          <HelpCircle className="w-6 h-6 text-cyan-400 animate-pulse" />
          <h2 className="text-xl font-retro text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 text-center uppercase tracking-wider neon-text-glow-blue">
            PILOT OPTIONS
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-4 my-6">
          <div className="flex items-center justify-between p-4 bg-slate-950/80 rounded-md border border-slate-800">
            <div className="flex flex-col gap-1">
              <span className="font-retro text-xs text-cyan-300">Retro Audio</span>
              <span className="text-[10px] text-slate-400 font-sans">Toggle Web Audio Synthesizer</span>
            </div>
            <button
              onClick={() => {
                const nextVal = !soundEnabled;
                onToggleSound(nextVal);
                if (nextVal) {
                  // Instant sound feedback
                  setTimeout(() => sound.playPowerup(), 50);
                } else {
                  sound.playClick();
                }
              }}
              className={`flex items-center justify-center p-3 rounded-md transition-all font-mono font-bold w-16 border uppercase ${
                soundEnabled
                  ? "bg-cyan-950/60 text-cyan-400 border-cyan-500 neon-border-glow-blue"
                  : "bg-slate-950 text-slate-550 border-slate-800"
              }`}
              id="toggle-sound-effects"
            >
              {soundEnabled ? (
                <div className="flex flex-col items-center">
                  <Volume2 className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] font-retro">ON</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <VolumeX className="w-5 h-5 mb-0.5 text-slate-500" />
                  <span className="text-[8px] font-retro text-slate-500">OFF</span>
                </div>
              )}
            </button>
          </div>

          {/* Config Hangar */}
          <div className="flex items-center justify-between p-4 bg-slate-950/80 rounded-md border border-slate-800">
            <div className="flex flex-col gap-1">
              <span className="font-retro text-xs text-fuchsia-400">VEHICLE HANGAR</span>
              <span className="text-[10px] text-slate-400 font-sans">Set Ship Paint & Engine Ions</span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
                if (onOpenHangar) onOpenHangar();
              }}
              className="flex items-center justify-center py-2 px-3 bg-fuchsia-950/60 text-fuchsia-400 border border-fuchsia-500 rounded-md font-mono font-bold text-[10px] tracking-wider transition-all hover:scale-105 active:scale-95 neon-border-glow-purple uppercase"
              id="settings-trigger-hangar"
            >
              CONFIGURE
            </button>
          </div>

          {/* Guide Controls */}
          <div className="bg-slate-950/85 p-4 border border-violet-950/50 rounded-md">
            <span className="font-retro text-[8px] text-purple-400 block mb-2 uppercase">Keyboard Controls</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-relaxed text-slate-300">
              <div className="flex items-center gap-1.5 border-r border-slate-800 pr-1">
                <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-cyan-300">W,A,S,D</span>
                <span>or Arrows</span>
              </div>
              <div className="flex items-center gap-1.5 pl-1">
                <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-cyan-300">Spacebar</span>
                <span>Shoot</span>
              </div>
            </div>
            
            <span className="font-retro text-[8px] text-purple-400 block mt-4 mb-2 uppercase">Mobile Controls</span>
            <div className="text-[10px] font-mono leading-relaxed text-slate-300">
              Drag <span className="text-cyan-300">Virtual Joystick</span> to move, press <span className="text-cyan-300">Fire Button</span> to blast.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[9px] text-slate-500 font-mono mt-4">
          SPACE WARZ v1.0.0 • SINCE 2026
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { sound } from "../sound";
import { Play, Trophy, Settings as SettingsIcon, ShieldAlert, Rocket, GraduationCap, Swords, ChevronLeft } from "lucide-react";

interface WelcomeScreenProps {
  onStartGame: (mode: "tutorial" | "playing") => void;
  onOpenHighScores: () => void;
  onOpenSettings: () => void;
  onOpenHangar: () => void;
  isTransitioning: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartGame,
  onOpenHighScores,
  onOpenSettings,
  onOpenHangar,
  isTransitioning,
}) => {
  const [isHoveredBtn, setIsHoveredBtn] = useState<string | null>(null);
  const [showModeSelect, setShowModeSelect] = useState<boolean>(false);

  const handleHover = (buttonId: string) => {
    setIsHoveredBtn(buttonId);
    sound.playHover();
  };

  const handleLeave = () => {
    setIsHoveredBtn(null);
  };

  const handleStartWarp = (mode: "tutorial" | "playing") => {
    sound.playClick();
    onStartGame(mode);
  };

  const handleStartClick = () => {
    sound.playClick();
    setShowModeSelect(true);
  };

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col justify-between items-center py-16 px-6 transition-all duration-1000 ease-in-out ${
        isTransitioning
          ? "-translate-y-full opacity-0 scale-110 blur-sm pointer-events-none"
          : "translate-y-0 opacity-100 scale-100"
      }`}
    >
      {/* Decorative Top Bar */}
      <div className="w-full max-w-lg flex items-center justify-between border-b border-purple-500/30 pb-3 text-slate-400 font-mono text-[9px] tracking-widest uppercase">
        <span>Sector: 4205-F4CE</span>
        <span className="flex items-center gap-1 text-emerald-400 animate-pulse">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
          Cabinet Online
        </span>
      </div>

      {/* Main Title Area */}
      <div className="flex flex-col items-center justify-center my-auto transition-transform duration-700">
        <div className="relative mb-2 select-none group">
          {/* Subtle logo background glow */}
          <div className="absolute inset-0 -m-6 bg-purple-500/5 rounded-full blur-[50px] animate-pulse" />
          
          {/* Main Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-retro uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-300 to-purple-600 tracking-tighter text-center neon-title-glow neon-flicker">
            SPACE
            <br />
            <span className="text-purple-400">WARZ</span>
          </h1>

          {/* Subtitle / Insert Coin */}
          <p className="text-center font-retro text-[8px] md:text-[10px] tracking-widest text-cyan-400/80 mt-4 md:mt-6 uppercase animate-pulse">
            ★ TACTICAL DEEP-SPACE DEFENSE PROTOCOL ★
          </p>
        </div>
      </div>

      {/* Interactive Arcade Panel (Buttons) */}
      <div className="w-full max-w-sm flex flex-col gap-3 relative z-30">
        {!showModeSelect ? (
          <>
            {/* Play BUTTON */}
            <button
              onClick={handleStartClick}
              onMouseEnter={() => handleHover("start")}
              onMouseLeave={handleLeave}
              className={`group relative flex items-center justify-center gap-3 px-8 py-3.5 bg-slate-900 border-2 border-cyan-400 rounded-md font-retro text-xs text-cyan-400 font-bold overflow-hidden transition-all duration-300 transform shadow-lg hover:shadow-cyan-400/20 ${
                isHoveredBtn === "start" ? "scale-105 border-purple-400 text-purple-300 neon-border-glow-purple" : "neon-border-glow-blue"
              }`}
              id="btn-start-game"
            >
              {/* Scanline element inside the button */}
              <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Play className={`w-4 h-4 transition-transform ${isHoveredBtn === "start" ? "rotate-90 text-purple-400 scale-125" : "text-cyan-400"}`} />
              <span className="tracking-widest">START SIMULATOR</span>
            </button>

            {/* Hangar Customization BUTTON */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenHangar();
              }}
              onMouseEnter={() => handleHover("hangar")}
              onMouseLeave={handleLeave}
              className={`group relative flex items-center justify-center gap-3 px-8 py-3.5 bg-slate-950 border-2 border-fuchsia-500 rounded-md font-retro text-xs text-fuchsia-400 font-bold overflow-hidden transition-all duration-300 transform shadow-lg hover:shadow-fuchsia-500/20 ${
                isHoveredBtn === "hangar" ? "scale-105 border-cyan-400 text-cyan-300 neon-border-glow-blue" : "neon-border-glow-purple"
              }`}
              id="btn-custom-hangar"
            >
              <div className="absolute inset-0 bg-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Rocket className={`w-4 h-4 transition-transform ${isHoveredBtn === "hangar" ? "-rotate-45 text-cyan-400 scale-125" : "text-fuchsia-400"}`} />
              <span className="tracking-widest">VESSEL HANGAR</span>
            </button>

            {/* Lower Row Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* High Scores Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenHighScores();
                }}
                onMouseEnter={() => handleHover("scores")}
                onMouseLeave={handleLeave}
                className={`group flex items-center justify-center gap-2 py-3 px-4 bg-slate-950 border border-purple-500/70 rounded-md font-retro text-[9px] text-purple-400 uppercase tracking-wider transition-all duration-300 hover:scale-102 hover:text-purple-300 hover:border-purple-400 ${
                  isHoveredBtn === "scores" ? "neon-border-glow-purple shadow-purple-500/10" : ""
                }`}
                id="btn-highscores"
              >
                <Trophy className="w-3.5 h-3.5 text-purple-400" />
                <span>RECORDS</span>
              </button>

              {/* Settings Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenSettings();
                }}
                onMouseEnter={() => handleHover("settings")}
                onMouseLeave={handleLeave}
                className={`group flex items-center justify-center gap-2 py-3 px-4 bg-slate-950 border border-slate-700 rounded-md font-retro text-[9px] text-slate-400 uppercase tracking-wider transition-all duration-300 hover:scale-102 hover:text-slate-300 hover:border-cyan-500/70 ${
                  isHoveredBtn === "settings" ? "text-cyan-400 border-cyan-500 neon-border-glow-blue" : ""
                }`}
                id="btn-settings"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
                <span>OPTIONS</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            <h3 className="font-retro text-[9px] text-cyan-400 text-center tracking-wider mb-1 uppercase">
              INITIALIZE INTERCEPTOR
            </h3>
            
            {/* Flight Academy Mode */}
            <button
              onClick={() => handleStartWarp("tutorial")}
              onMouseEnter={() => handleHover("academy")}
              onMouseLeave={handleLeave}
              className={`group relative flex flex-col items-start gap-1 p-4 bg-slate-900/90 border-2 border-emerald-400 rounded-md font-sans text-left transition-all duration-300 transform shadow-lg hover:shadow-emerald-400/25 ${
                isHoveredBtn === "academy" ? "scale-102 border-emerald-300 neon-border-glow-green" : ""
              }`}
              id="btn-academy-tutorial"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span className="font-retro text-[10px] text-emerald-400 tracking-wider">1. FLIGHT ACADEMY</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal font-mono uppercase tracking-tight">
                Recommended. Sandbox training to master movement, firing mechanics, and collectible powerups.
              </p>
            </button>

            {/* Campaign Mode */}
            <button
              onClick={() => handleStartWarp("playing")}
              onMouseEnter={() => handleHover("combat")}
              onMouseLeave={handleLeave}
              className={`group relative flex flex-col items-start gap-1 p-4 bg-slate-900/90 border-2 border-cyan-400 rounded-md font-sans text-left transition-all duration-300 transform shadow-lg hover:shadow-cyan-400/25 ${
                isHoveredBtn === "combat" ? "scale-102 border-cyan-300 neon-border-glow-blue" : ""
              }`}
              id="btn-active-combat"
            >
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-cyan-400" />
                <span className="font-retro text-[10px] text-cyan-400 tracking-wider">2. ACTIVE CAMPAIGN</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal font-mono uppercase tracking-tight">
                Skip simulation exercises and deploy straight into standard deep-space hostile warfare.
              </p>
            </button>

            {/* Back Button */}
            <button
              onClick={() => {
                sound.playClick();
                setShowModeSelect(false);
              }}
              onMouseEnter={() => handleHover("back")}
              onMouseLeave={handleLeave}
              className="flex items-center justify-center gap-2 mt-1 py-1 text-[10px] text-slate-500 hover:text-white font-mono uppercase tracking-wider transition-all"
              id="btn-mode-back"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Systems</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Floating Cabinet Details */}
      <div className="mt-8 text-center select-none opacity-50 text-[8px] font-mono tracking-wide text-slate-500">
        PRESS <kbd className="bg-slate-900 border border-slate-700 px-1 py-0.5 rounded text-cyan-400">SPACEBAR</kbd> TO FIRE • USE <kbd className="bg-slate-900 border border-slate-700 px-1 py-0.5 rounded text-cyan-400">WASD / ARROW KEYS</kbd> TO INTERCEPT
      </div>
    </div>
  );
};
export default WelcomeScreen;

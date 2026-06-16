/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { sound } from "./sound";
import { GameState } from "./types";
import { GameCanvas } from "./components/GameCanvas";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { GameOverOverlay } from "./components/GameOverOverlay";
import { HighScoreModal, SettingsModal } from "./components/Modals";
import { HangarModal } from "./components/HangarModal";
import { Volume2, VolumeX, Swords, Award, CircleHelp, Shield } from "lucide-react";

export default function App() {
  const [gameState, setGameState] = useState<GameState>("welcome");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.getEnabled());
  const [finalScore, setFinalScore] = useState<number>(0);
  const [isHighScoresOpen, setIsHighScoresOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHangarOpen, setIsHangarOpen] = useState(false);

  // Manage background music based on game state
  useEffect(() => {
    if (gameState === "welcome") {
      sound.playMusic();

      const startMusicOnInteraction = () => {
        if (gameState === "welcome") {
          sound.playMusic();
        }
        window.removeEventListener("click", startMusicOnInteraction);
        window.removeEventListener("keydown", startMusicOnInteraction);
        window.removeEventListener("touchstart", startMusicOnInteraction);
      };

      window.addEventListener("click", startMusicOnInteraction);
      window.addEventListener("keydown", startMusicOnInteraction);
      window.addEventListener("touchstart", startMusicOnInteraction);

      return () => {
        window.removeEventListener("click", startMusicOnInteraction);
        window.removeEventListener("keydown", startMusicOnInteraction);
        window.removeEventListener("touchstart", startMusicOnInteraction);
      };
    } else {
      sound.pauseMusic();
    }
  }, [gameState]);

  // Sync sound settings across context
  const handleToggleSound = (enabled: boolean) => {
    sound.setEnabled(enabled);
    setSoundEnabled(enabled);
  };

  const handleStartGame = (mode: "tutorial" | "playing" = "playing") => {
    if (mode === "tutorial") {
      setGameState("tutorial");
    } else {
      setGameState("transitioning");
    }
  };

  const handleGameStarted = () => {
    setGameState("playing");
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setGameState("gameover");
  };

  // Quick mute button bar helper on index
  const handleQuickMute = () => {
    const nextVal = !soundEnabled;
    handleToggleSound(nextVal);
    sound.playClick();
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex shadow-inner justify-center items-center overflow-hidden font-sans select-none text-slate-100 immersive-bg">
      {/* Deep-Space Ambient Lighting in behind-screen bezel */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0a0a24]/40 to-black/80 opacity-90 z-0 pointer-events-none" />

      {/* Main Arcade Cabinet Framework Container */}
      <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row items-stretch justify-center z-10">
        
        {/* Left Side: Desktop decorative marquee stats column */}
        <div className="w-64 bg-slate-900/60 border-r border-slate-800/40 p-6 flex-col justify-between hidden xl:flex text-slate-400 font-mono text-xs">
          <div className="space-y-6">
            <div className="border-b border-purple-900/50 pb-4">
              <h3 className="font-retro text-purple-400 text-[10px] tracking-wider mb-2">SYSTEM PROTOCOL</h3>
              <span className="text-slate-500 text-[10px]">CODENAME:</span> 
              <p className="text-white text-sm font-bold tracking-widest mt-1">SPACE WARZ</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-500">TACTICAL TIPS</span>
                <p className="text-slate-350 leading-relaxed mt-1 text-[11px]">
                  Scout ships are rapid but fragile. Vaporize them quickly before Destroyer ships spawn!
                </p>
              </div>
              <div>
                <p className="text-slate-350 leading-relaxed text-[11px]">
                  Kamikaze drones home directly on you. Swipe or strafe aggressively!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-[10px] border-t border-slate-800/40 pt-4">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>CORE SYSTEM STATUS: <b className="text-emerald-400">NOMINAL</b></span>
            </div>
            <div className="text-[9px] text-slate-500">
              © Google AI Studio Build.
            </div>
          </div>
        </div>

        {/* Central screen stage cabinet */}
        <div className="relative flex-1 flex flex-col items-center justify-center bg-black relative max-h-screen">
          
          {/* Main simulator rendering container */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            
            {/* Core Game Canvas */}
            <GameCanvas
              gameState={gameState}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              onGameStarted={handleGameStarted}
              onGameOver={handleGameOver}
            />

            {/* Welcome Hangar Intro overlay */}
            {gameState === "welcome" && (
              <WelcomeScreen
                onStartGame={handleStartGame}
                onOpenHighScores={() => setIsHighScoresOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenHangar={() => setIsHangarOpen(true)}
                isTransitioning={false}
              />
            )}

            {/* Warp-engine slide up clone for transition animation */}
            {gameState === "transitioning" && (
              <WelcomeScreen
                onStartGame={() => {}}
                onOpenHighScores={() => {}}
                onOpenSettings={() => {}}
                onOpenHangar={() => {}}
                isTransitioning={true}
              />
            )}

            {/* Game Over statistics Panel overlay */}
            {gameState === "gameover" && (
              <GameOverOverlay
                score={finalScore}
                onPlayAgain={handleStartGame}
                onMainMenu={() => setGameState("welcome")}
              />
            )}

            {/* Classic CRT Phosphor Vignette screen shader overlay */}
            <div className="crt-overlay" />
          </div>

          {/* Sub-Footer control panel row on desktop */}
          <div className="w-full bg-slate-950/95 border-t border-slate-800/40 py-3.5 px-6 flex justify-between items-center text-[10px] text-slate-500 font-mono tracking-wider">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              <span>CAB CABINET LINK OK</span>
            </div>
            
            {/* Quick action buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleQuickMute}
                className="hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                title={soundEnabled ? "Mute Game" : "Unmute Game"}
                id="btn-quick-mute"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>MUT</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    <span>UNMUT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Keyboard guide stats marquee column */}
        <div className="w-64 bg-slate-900/60 border-l border-slate-800/40 p-6 flex-col justify-between hidden xl:flex text-slate-400 font-mono text-xs">
          <div className="space-y-6">
            <div className="border-b border-purple-900/50 pb-4">
              <h3 className="font-retro text-cyan-400 text-[10px] tracking-wider mb-2">PILOT INTERFACE</h3>
              <span className="text-slate-500 text-[10px]">STATION:</span>
              <p className="text-white text-sm font-bold tracking-widest mt-1">INTERCEPTOR</p>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-800 rounded">
              <span className="text-[10px] text-purple-400 font-retro tracking-wider block mb-1">ARMAMENT GUIDE</span>
              <div className="space-y-2 text-[11px] leading-relaxed">
                <div>
                  <b className="text-cyan-300">LASER BLASTER:</b>
                  <p className="text-slate-400 text-[10px]">Precision central bolts</p>
                </div>
                <div>
                  <b className="text-blue-300">DOUBLE SHOT:</b>
                  <p className="text-slate-400 text-[10px]">Increases forward spray coverage</p>
                </div>
                <div>
                  <b className="text-yellow-400">PLASMA CANNON:</b>
                  <p className="text-slate-400 text-[10px]">Destructive piercing plasma density</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 border-t border-slate-800/40 pt-4">
            FLIGHT SIMULATOR ENGINE EMULATION V1.0.0
          </div>
        </div>
      </div>

      {/* High Scores Modal */}
      <HighScoreModal
        isOpen={isHighScoresOpen}
        onClose={() => setIsHighScoresOpen(false)}
      />

      {/* Settings Options Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenHangar={() => setIsHangarOpen(true)}
      />

      {/* Ship Hangar Customization Modal */}
      <HangarModal
        isOpen={isHangarOpen}
        onClose={() => setIsHangarOpen(false)}
      />
    </div>
  );
}

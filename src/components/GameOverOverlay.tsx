/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { sound } from "../sound";
import { RefreshCw, Home, Swords, Award } from "lucide-react";

interface GameOverOverlayProps {
  score: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  score,
  onPlayAgain,
  onMainMenu,
}) => {
  const [highScore, setHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    // Play Game Over synthesized sound sequence
    sound.playGameOver();

    // Check high score
    const savedHighScore = parseInt(localStorage.getItem("space_warz_highscore") || "0", 10);
    
    // Save best run score
    try {
      localStorage.setItem("space_warz_bestrun", score.toString());
    } catch (e) {
      // Storage error safeguard
    }

    if (score > savedHighScore) {
      setIsNewRecord(true);
      setHighScore(score);
      try {
        localStorage.setItem("space_warz_highscore", score.toString());
      } catch (e) {
        // Storage error safeguard
      }
    } else {
      setIsNewRecord(false);
      setHighScore(savedHighScore);
    }
  }, [score]);

  return (
    <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex flex-col justify-center items-center p-6 text-slate-100">
      {/* Background neon light aura */}
      <div className={`absolute w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none ${
        isNewRecord ? "bg-cyan-500/10 animate-pulse" : "bg-red-500/10"
      }`} />

      {/* Frame panel */}
      <div className={`w-full max-w-sm p-6 rounded-lg border-2 bg-slate-900/90 text-center relative overflow-hidden retro-grid ${
        isNewRecord ? "border-cyan-400 neon-border-glow-blue" : "border-red-500/80 neon-border-glow-red"
      }`}>
        
        {/* Dynamic header stamp */}
        <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mb-2">
          Simulator session terminated
        </div>

        {/* Title */}
        <h2 className={`text-3xl font-retro text-center uppercase tracking-wider mb-6 ${
          isNewRecord ? "text-cyan-400 neon-text-glow-blue" : "text-red-500 neon-text-glow-red"
        }`}>
          GAME OVER
        </h2>

        {/* High Score Celebration */}
        {isNewRecord && (
          <div className="my-4 p-3 bg-cyan-950/50 border border-cyan-400/50 rounded-md animate-bounce">
            <span className="font-retro text-[10px] text-cyan-200 block neon-text-glow-blue tracking-wider">
              ★ NEW HIGH SCORE ★
            </span>
            <span className="text-xs text-slate-300 font-sans mt-1 block">
              You are the champion of this quadrant!
            </span>
          </div>
        )}

        {/* Stats Table */}
        <div className="space-y-3 my-6 text-left font-retro text-xs bg-slate-950/80 p-4 border border-slate-800/60 rounded-md">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-1.5 text-[10px]">
              <Swords className="w-3.5 h-3.5 text-purple-400" />
              FINAL SCORE
            </span>
            <span className="text-sm font-bold text-white font-mono">{score.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-400 flex items-center gap-1.5 text-[10px]">
              <Award className="w-3.5 h-3.5 text-yellow-500" />
              HIGH SCORE
            </span>
            <span className="text-sm font-bold text-yellow-400 font-mono neon-text-glow-yellow">{highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="flex items-center justify-center gap-3 w-full py-3.5 bg-slate-950 border-2 border-emerald-500 rounded text-emerald-400 font-retro text-[10px] tracking-wider transition-all hover:bg-emerald-950/30 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            id="btn-play-again"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onMainMenu();
            }}
            className="flex items-center justify-center gap-3 w-full py-3 bg-slate-950 border border-slate-700 rounded text-slate-400 font-retro text-[10px] tracking-wider transition-all hover:bg-slate-900 hover:text-slate-200"
            id="btn-gameover-menu"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default GameOverOverlay;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { sound } from "../sound";
import { GameState, WeaponType, EnemyType, Player, Enemy, Bullet, PowerUp, Particle, GameStar, ShootingStar, ScorePopup } from "../types";
import { Volume2, VolumeX, Swords, Heart, Zap, Trophy, GraduationCap } from "lucide-react";

interface GameCanvasProps {
  gameState: GameState;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onGameStarted: () => void;
  onGameOver: (score: number) => void;
}

// Fixed workspace coordinate system (3:4 retro ratio container)
const V_WIDTH = 600;
const V_HEIGHT = 800;

export interface LevelConfig {
  number: number;
  name: string;
  subtitle: string;
  bossName: string;
  bossScoreThreshold: number;
  bossHp: number;
  bossWidth: number;
  bossHeight: number;
  bossColor: string;
  scoutColor: string;
  fighterColor: string;
  kamikazeColor: string;
}

export const LEVEL_CONFIGS: { [key: number]: LevelConfig } = {
  1: {
    number: 1,
    name: "LEVEL 1: ALPHA SECTOR",
    subtitle: "STRIKE DOWN COGNITIVE INTRUDERS",
    bossName: "VOID SENTINEL",
    bossScoreThreshold: 1500,
    bossHp: 150,
    bossWidth: 90,
    bossHeight: 75,
    bossColor: "#10b981", // emerald green
    scoutColor: "#67e8f9", // cyan
    fighterColor: "#ff4545", // red
    kamikazeColor: "#ff8c00", // dark orange
  },
  2: {
    number: 2,
    name: "LEVEL 2: VORTEX DRIFT",
    subtitle: "TACTICAL ACCELERATION - SPEED ENHANCED",
    bossName: "PHANTOM GOLIATH",
    bossScoreThreshold: 4500,
    bossHp: 280,
    bossWidth: 110,
    bossHeight: 90,
    bossColor: "#a855f7", // purple
    scoutColor: "#f472b6", // pink
    fighterColor: "#a3e635", // lime green
    kamikazeColor: "#fbbf24", // yellow
  },
  3: {
    number: 3,
    name: "LEVEL 3: SUPERNOVA CORE",
    subtitle: "DANGER LEVEL CRITICAL - MASS FIREPOWER",
    bossName: "OMEGA DREADNOUGHT",
    bossScoreThreshold: 9000,
    bossHp: 750, // Strengthened Level 3 Boss HP for ultimate challenge
    bossWidth: 135,
    bossHeight: 105,
    bossColor: "#f43f5e", // crimson rose
    scoutColor: "#eab308", // gold yellow
    fighterColor: "#fb923c", // bright orange
    kamikazeColor: "#d946ef", // bright magenta
  }
};

export const getLevelConfig = (lvl: number): LevelConfig => {
  if (LEVEL_CONFIGS[lvl]) return LEVEL_CONFIGS[lvl];
  return {
    number: lvl,
    name: `LEVEL ${lvl}: DEEP GALAXY VOYAGE`,
    subtitle: "APEX SECTOR - ULTIMATE PROGRESSIVE CRUSADE",
    bossName: `APEX TERMINATOR v${lvl}`,
    bossScoreThreshold: 9000 + (lvl - 3) * 6000,
    bossHp: 500 + (lvl - 3) * 150,
    bossWidth: 145,
    bossHeight: 115,
    bossColor: "#fb7185",
    scoutColor: "#fb7185",
    fighterColor: "#22d3ee",
    kamikazeColor: "#c084fc",
  };
};

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  soundEnabled,
  onToggleSound,
  onGameStarted,
  onGameOver,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic dimensions state for scaling
  const [scale, setScale] = useState(1);
  const [hudScore, setHudScore] = useState(0);
  const [hudHighScore, setHudHighScore] = useState(0);
  const [hudHealth, setHudHealth] = useState(100);
  const [hudWeapon, setHudWeapon] = useState<WeaponType>(WeaponType.Laser);
  const [hudShield, setHudShield] = useState(0);

  // Leveling and Boss stats state
  const [hudLevel, setHudLevel] = useState<number>(1);
  const [hudSonicBoomCooldown, setHudSonicBoomCooldown] = useState<number>(0);
  const [hudBossActive, setHudBossActive] = useState<boolean>(false);
  const [hudBossName, setHudBossName] = useState<string>("");
  const [hudBossHp, setHudBossHp] = useState<number>(0);
  const [hudBossMaxHp, setHudBossMaxHp] = useState<number>(0);
  const [levelAnnounceMsg, setLevelAnnounceMsg] = useState<string>("");
  const [levelAnnounceSub, setLevelAnnounceSub] = useState<string>("");
  const [levelAnnounceTimer, setLevelAnnounceTimer] = useState<number>(0);

  // Local storage high score cached read
  const [cachedHighScore, setCachedHighScore] = useState(0);

  // Flight Academy Tutorial dynamic prompt messages
  const [tutorialMessage, setTutorialMessage] = useState<string>("");
  const [tutorialSubMessage, setTutorialSubMessage] = useState<string>("");
  const [showTutorialPopup, setShowTutorialPopup] = useState<boolean>(true);

  // Reference variables for physical game elements (to keep rendering at 60fps without lag)
  const playerRef = useRef<Player>({
    x: V_WIDTH / 2 - 25,
    y: V_HEIGHT - 100,
    width: 50,
    height: 50,
    health: 100,
    maxHealth: 100,
    score: 0,
    speed: 6.5,
    weapon: WeaponType.Laser,
    weaponTimer: 0,
    shield: false,
    shieldHp: 0,
  });

  const shipColorRef = useRef<string>(localStorage.getItem("space_warz_ship_color") || "cyan");
  const engineTrailRef = useRef<string>(localStorage.getItem("space_warz_engine_trail") || "classic");
  const controlLayoutRef = useRef<string>(localStorage.getItem("space_warz_control_layout") || "both");

  // Flight academy tutorial physics control references
  const tutorialStepRef = useRef<number>(0);
  const tutorialCountRef = useRef<number>(0);
  const tutorialTargetPosRef = useRef<{ x: number; y: number } | null>(null);
  const tutorialPopupTimerRef = useRef<number>(6500);

  // Leveling and Boss battle system references
  const levelRef = useRef<number>(1);
  const bossSpawnedThisLevelRef = useRef<boolean>(false);
  const bossActiveRef = useRef<boolean>(false);
  const bossHpRef = useRef<number>(0);
  const bossMaxHpRef = useRef<number>(0);
  const bossNameRef = useRef<string>("");
  const levelAnnounceTimerRef = useRef<number>(0); // countdown in ms
  const postBossSafetyTimerRef = useRef<number>(0); // 5 sec safety duration after beating a boss

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const powerupsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<GameStar[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);

  // Mobile virtual joystick references
  const isMobileRef = useRef(false);
  const [isMobileUi, setIsMobileUi] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickOffset, setJoystickOffset] = useState({ x: 0, y: 0 });

  // Game loop tracking references
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const nextEnemyId = useRef(0);
  const nextBulletId = useRef(0);
  const nextPowerupId = useRef(0);
  const nextPopupId = useRef(0);

  // Difficulty managers
  const playtimeRef = useRef(0);
  const spawnCooldownRef = useRef(0);
  const playerShootCooldownRef = useRef(0);

  // Sonic Boom super weapon & Pre-boss wave managers
  const sonicBoomCooldownRef = useRef<number>(0);
  const preBossWaveActiveRef = useRef<boolean>(false);
  const preBossWaveNumberRef = useRef<number>(0);

  // Warp screen animation effects
  const warpMultiplierRef = useRef<number>(1);
  const flashOverlayRef = useRef<number>(0); // 0 to 1 value
  const screenShakeRef = useRef<number>(0); // Shaking factor in px

  // Read high score immediately from LocalStorage on mount
  useEffect(() => {
    const score = parseInt(localStorage.getItem("space_warz_highscore") || "0", 10);
    setHudHighScore(score);
    setCachedHighScore(score);

    // Check if touch device is active
    const checkTouch = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      isMobileRef.current = coarsePointer;
      setIsMobileUi(coarsePointer);
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, [gameState]);

  // Handle key listeners for moving starship and firing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser from scrolling on arrow keys and spacebar
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed.current[e.code] = true;
      keysPressed.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Set up stars
  useEffect(() => {
    const stars: GameStar[] = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * V_WIDTH,
        y: Math.random() * V_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.5,
        color: ["#ffffff", "#cbd5e1", "#bae6fd", "#fef08a", "#e9d5ff"][Math.floor(Math.random() * 5)],
      });
    }
    starsRef.current = stars;
  }, []);

  // Fit canvas dynamically inside parent retaining 3:4 aspect ratio with Bezel borders on desktop
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const contW = container.clientWidth;
      const contH = container.clientHeight;

      // Fit to container preserving 3:4 aspect ratio
      let dWidth = contW;
      let dHeight = (contW * 4) / 3;

      if (dHeight > contH) {
        dHeight = contH;
        dWidth = (contH * 3) / 4;
      }

      canvas.style.width = `${dWidth}px`;
      canvas.style.height = `${dHeight}px`;

      // Scale calculations relative to virtual workspace (600x800)
      setScale(dWidth / V_WIDTH);

      // Set internal buffer dimensions to virtual dimensions for consistent rendering coordinate logic
      canvas.width = V_WIDTH;
      canvas.height = V_HEIGHT;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Helper: Trigger screen shake
  const shakeScreen = (intensity: number) => {
    screenShakeRef.current = Math.min(screenShakeRef.current + intensity, 25);
  };

  // Helper: Create score popup text
  const addScorePopup = (x: number, y: number, text: string, color = "#22d3ee") => {
    const id = `popup_${nextPopupId.current++}`;
    popupsRef.current.push({ id, x, y, text, color, life: 1.0 });
  };

  // Helper: Trigger Flight Academy tutorial steps and handle popups visibility reset
  const triggerTutorialStepText = (msg: string, sub: string) => {
    setTutorialMessage(msg);
    setTutorialSubMessage(sub);
    setShowTutorialPopup(true);
    tutorialPopupTimerRef.current = 6500; // auto-dismiss dialogue card after 6.5s
  };

  // Helper: Run step-by-step Flight Academy tutorial physics
  const updateTutorialPhysics = (dt: number) => {
    const player = playerRef.current;
    const step = tutorialStepRef.current;

    // Handle tutorial message popup timer decay
    if (tutorialPopupTimerRef.current > 0) {
      tutorialPopupTimerRef.current -= dt;
      if (tutorialPopupTimerRef.current <= 0) {
        setShowTutorialPopup(false);
      }
    }

    // Phase 0: Init & movement to Alfa
    if (step === 0) {
      if (tutorialTargetPosRef.current) {
        const dx = (player.x + player.width / 2) - tutorialTargetPosRef.current.x;
        const dy = (player.y + player.height / 2) - tutorialTargetPosRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 40) {
          // Success!
          sound.playPowerup();
          addScorePopup(tutorialTargetPosRef.current.x, tutorialTargetPosRef.current.y, "ALFA SECURED! +100", "#10b981");
          createExplosionBurst(tutorialTargetPosRef.current.x, tutorialTargetPosRef.current.y, "#10b981", 4, 15, 3);
          
          // Go to step 1 (Beta)
          tutorialStepRef.current = 1;
          tutorialTargetPosRef.current = { x: V_WIDTH * 0.75, y: V_HEIGHT * 0.35 };
          triggerTutorialStepText(
            "NAVPOINT ALFA ZONE SECURED! TACTICAL PLOTTING SUCCESSFUL.",
            "PROCEED RAPIDLY UNTIL YOU ALIGN WITHIN NAVPOINT BETA."
          );
        }
      }
    }

    // Phase 1: movement to Beta
    else if (step === 1) {
      if (tutorialTargetPosRef.current) {
        const dx = (player.x + player.width / 2) - tutorialTargetPosRef.current.x;
        const dy = (player.y + player.height / 2) - tutorialTargetPosRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 40) {
          // Success!
          sound.playPowerup();
          addScorePopup(tutorialTargetPosRef.current.x, tutorialTargetPosRef.current.y, "BETA SECURED! +200", "#10b981");
          createExplosionBurst(tutorialTargetPosRef.current.x, tutorialTargetPosRef.current.y, "#10b981", 4, 15, 3);
          
          // Go to step 2 (Weapons Init)
          tutorialStepRef.current = 2;
          tutorialTargetPosRef.current = null;
          tutorialCountRef.current = 0;
        }
      }
    }

    // Phase 2: Weapons Init - practice shots
    else if (step === 2) {
      tutorialStepRef.current = 3;
      
      const spawnTargetDrone = (x: number, y: number) => {
        enemiesRef.current.push({
          id: `tut_${nextEnemyId.current++}`,
          type: "scout",
          x: x - 18,
          y: 0, // starts at top and rolls in
          width: 36,
          height: 36,
          hp: 1,
          maxHp: 1,
          speedX: 0,
          speedY: 1.5, // floats in nicely
          shootCooldown: 999999,
          scoreValue: 50,
        });
      };

      spawnTargetDrone(V_WIDTH / 4, 180);
      spawnTargetDrone(V_WIDTH / 2, 140);
      spawnTargetDrone(V_WIDTH * 0.75, 180);

      triggerTutorialStepText(
        "SIMULATION TARGET DRONES SEEDED! CALIBRATE MAIN CANNON.",
        "PRESS SPACEBAR (OR TOUCH TO AUTO-FIRE) TO DESTROY ALL 3 DRONES."
      );
    }

    // Phase 3: Shoot 3 sim drones
    else if (step === 3) {
      // Keep static target drones from falling off screen entirely in the sandbox
      enemiesRef.current.forEach(e => {
        if (e.id.startsWith("tut_")) {
          if (e.y < 160) e.y += 1.5;
          else e.y = 160;
        }
      });

      const countTutLeft = enemiesRef.current.filter((e) => e.id.startsWith("tut_")).length;
      if (countTutLeft === 0) {
        tutorialStepRef.current = 4;
        
        // Spawn Powerup floating in
        powerupsRef.current.push({
          id: `pu_${nextPowerupId.current++}`,
          type: WeaponType.Plasma,
          x: V_WIDTH / 2 - 15,
          y: 100,
          width: 30,
          height: 30,
          speedY: 1.5,
          color: "#fbbf24",
          pulse: 0,
        });

        triggerTutorialStepText(
          "TARGET LOCK CONFIRMED! MARKS MANEUVER DECLARED OPTIMAL.",
          "COLLECT THE FLOATING CHROME-POLISHED PLASMA CANNON POWERUP."
        );
      }
    }

    // Phase 4: Wait for collecting Plasma upgrade
    else if (step === 4) {
      if (player.weapon === WeaponType.Plasma) {
        tutorialStepRef.current = 5;
        
        // Spawn durable shielded target destroyer
        enemiesRef.current.push({
          id: `tutdur_${nextEnemyId.current++}`,
          type: "destroyer",
          x: V_WIDTH / 2 - 30,
          y: -50,
          width: 60,
          height: 60,
          hp: 3,
          maxHp: 3,
          speedX: 0,
          speedY: 1.2,
          shootCooldown: 999999,
          scoreValue: 500,
        });

        triggerTutorialStepText(
          "PLASMA ENHANCER ENGAGED! PIERCING WEAPON CHANNELS INTEGRATED.",
          "DESTROY THE HEAVILY REINFORCED DESTROYER DUMMY TARGET."
        );
      }
    }

    // Phase 5: Destroy durable trainer
    else if (step === 5) {
      // Keep static destroyer from falling down
      enemiesRef.current.forEach(e => {
        if (e.id.startsWith("tutdur_")) {
          if (e.y < 180) e.y += 1.5;
          else e.y = 180;
        }
      });

      const countDurLeft = enemiesRef.current.filter(e => e.id.startsWith("tutdur_")).length;
      if (countDurLeft === 0) {
        // Clear powerups
        powerupsRef.current = [];
        player.weapon = WeaponType.Laser;

        // SUCCESS! Graduation transition
        tutorialStepRef.current = 6;
        tutorialCountRef.current = 3000; // 3 seconds count delay
        
        sound.playPowerup();
        addScorePopup(V_WIDTH / 2, V_HEIGHT / 2 - 20, "CADET GRADUATED!", "#10b981");
        triggerTutorialStepText(
          "CONGRATULATIONS PILOT! FLIGHT TRAINING COMPLETION APPROVED.",
          "PREPARING HYPERSPACE JUMP TO HOSTILE SECTOR IN 3 SECONDS..."
        );
      }
    }

    // Phase 6: Graduation countdown delay
    else if (step === 6) {
      tutorialCountRef.current -= dt;
      const secsLeft = Math.ceil(tutorialCountRef.current / 1000);
      setTutorialSubMessage(`PREPARING HYPERSPACE JUMP TO HOSTILE SECTOR IN ${secsLeft} SECONDS...`);

      if (tutorialCountRef.current <= 0) {
        handleStartWarpIn();
      }
    }
  };

  // Helper: Spawn particle system bursts
  const createExplosionBurst = (x: number, y: number, color: string, size = 3, count = 15, speed = 4) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = Math.random() * speed + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        color,
        size: Math.random() * size + 1.5,
        life: 1,
        maxLife: Math.random() * 30 + 20,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015,
        glow: true,
      });
    }
  };

  // Helper: Create small impact sparks
  const createHitSparks = (x: number, y: number, color = "#ffffff") => {
    for (let i = 0; i < 4; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI; // upwards scatter
      const sp = Math.random() * 2 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        color,
        size: Math.random() * 1.5 + 1,
        life: 1,
        maxLife: 15,
        alpha: 1,
        decay: 0.07,
      });
    }
  };

  // Helper: Trigger spectacular celebratory screen-wide fireworks and upward confetti fountain particles
  const triggerLevelCompleteHypeParticles = () => {
    // 1. Massive center-outward rainbow expanding firework shockwave
    for (let angle = 0; angle < Math.PI * 2; angle += 0.06) {
      const speed = Math.random() * 5 + 4;
      particlesRef.current.push({
        x: V_WIDTH / 2,
        y: V_HEIGHT / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: ["#22d3ee", "#e879f9", "#34d399", "#facc15", "#f43f5e", "#a855f7"][Math.floor(Math.random() * 6)],
        size: Math.random() * 4.5 + 2.5,
        life: 1,
        maxLife: Math.random() * 60 + 50,
        alpha: 1.0,
        decay: Math.random() * 0.012 + 0.008,
        glow: true,
      });
    }

    // 2. High-volume bottom-left corner diagonal fountain
    for (let j = 0; j < 40; j++) {
      const angle = -Math.PI / 4 + (Math.random() * 0.4 - 0.2); // diagonal upwards right
      const speed = Math.random() * 10 + 7;
      particlesRef.current.push({
        x: 10,
        y: V_HEIGHT - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: "#22d3ee", // cyan
        size: Math.random() * 3.5 + 2.0,
        life: 1,
        maxLife: 90,
        alpha: 1.0,
        decay: 0.01,
        glow: true,
      });
    }

    // 3. High-volume bottom-right corner diagonal fountain
    for (let j = 0; j < 40; j++) {
      const angle = -Math.PI * 3 / 4 + (Math.random() * 0.4 - 0.2); // diagonal upwards left
      const speed = Math.random() * 10 + 7;
      particlesRef.current.push({
        x: V_WIDTH - 10,
        y: V_HEIGHT - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: "#e879f9", // magenta
        size: Math.random() * 3.5 + 2.0,
        life: 1,
        maxLife: 90,
        alpha: 1.0,
        decay: 0.01,
        glow: true,
      });
    }

    // 4. Repeated, staggered screen-filling majestic fireworks burst layers across the full 5.0 seconds transition!
    const delayTimes = [350, 750, 1150, 1550, 1950, 2350, 2750, 3150, 3550, 3950, 4350];
    const burstColors = ["#f43e5e", "#00f0ff", "#34d399", "#facc15", "#e879f9", "#a855f7", "#ec4899", "#10b981"];

    delayTimes.forEach((delay, index) => {
      setTimeout(() => {
        // Only trigger if level announcement is genuinely active
        if (levelAnnounceTimerRef.current <= 0) return;

        // Random x coordinates across width (with 60px padding)
        const rx = Math.random() * (V_WIDTH - 120) + 60;
        // Random y coordinates focused across top & middle sections
        const ry = Math.random() * (V_HEIGHT / 2) + 90;
        const color = burstColors[index % burstColors.length];

        // Explode rings
        for (let a = 0; a < Math.PI * 2; a += 0.12) {
          const s = Math.random() * 6 + 3.5;
          particlesRef.current.push({
            x: rx,
            y: ry,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            color,
            size: Math.random() * 3.8 + 1.8,
            life: 1,
            maxLife: 70,
            alpha: 1.0,
            decay: Math.random() * 0.018 + 0.011,
            glow: true,
          });
        }

        // Drop elegant trailing gravity-affected glowing rain
        for (let s = 0; s < 15; s++) {
          particlesRef.current.push({
            x: rx + (Math.random() * 50 - 25),
            y: ry + (Math.random() * 30 - 15),
            vx: Math.random() * 2.5 - 1.25,
            vy: Math.random() * 3.5 + 1.5, // descending
            color: "#ffffff",
            size: 1.5,
            life: 1,
            maxLife: 45,
            alpha: 0.9,
            decay: 0.022,
            glow: false,
          });
        }
      }, delay);
    });
  };

  // Helper: Trigger screen-wide dramatic threat warning sonar lines, gravitational implosion swirls, and bottom alarm beams
  const triggerBossIncomingHypeParticles = (bossColor: string) => {
    const dangerColor = bossColor || "#ef4444";

    // 1. Double Sonar Red Screen scan sweeps rushing from top to bottom
    const sonarDelays = [0, 450, 900, 1350];
    sonarDelays.forEach((delay) => {
      setTimeout(() => {
        if (levelAnnounceTimerRef.current <= 0) return;

        // Draw horizontal beam of sparks falling fast down the grid
        for (let xCol = 0; xCol < V_WIDTH; xCol += 12) {
          particlesRef.current.push({
            x: xCol,
            y: 0,
            vx: (Math.random() - 0.5) * 0.4,
            vy: Math.random() * 7 + 8, // fast swipe down
            color: dangerColor,
            size: Math.random() * 2.8 + 1.2,
            life: 1,
            maxLife: 95,
            alpha: 0.95,
            decay: 0.012,
            glow: true,
          });
        }
      }, delay);
    });

    // 2. Swirling high-intensity gravitational cosmic warning vortex pulling inward directly to the boss descent position
    const vortexTargetX = V_WIDTH / 2;
    const vortexTargetY = 110;

    for (let wave = 0; wave < 6; wave++) {
      setTimeout(() => {
        if (levelAnnounceTimerRef.current <= 0) return;

        const count = 45;
        for (let i = 0; i < count; i++) {
          const spawnRadius = Math.random() * 140 + 220;
          const angle = Math.random() * Math.PI * 2;
          const spawnX = vortexTargetX + Math.cos(angle) * spawnRadius;
          const spawnY = vortexTargetY + Math.sin(angle) * spawnRadius;

          const dx = vortexTargetX - spawnX;
          const dy = vortexTargetY - spawnY;
          const dist = Math.hypot(dx, dy) || 1;

          // Swirling pull physics vectors
          const pullSpeed = 5.5;
          const orbitSpeed = 3.8;
          const tangentX = -Math.sin(angle) * orbitSpeed;
          const tangentY = Math.cos(angle) * orbitSpeed;

          particlesRef.current.push({
            x: spawnX,
            y: spawnY,
            vx: (dx / dist) * pullSpeed + tangentX,
            vy: (dy / dist) * pullSpeed + tangentY,
            color: dangerColor,
            size: Math.random() * 3.0 + 1.0,
            life: 1,
            maxLife: 65,
            alpha: 1.0,
            decay: 0.015,
            glow: true,
          });
        }
      }, wave * 380);
    }

    // 3. Continuous fiery upward alert jets from bottom of viewport simulating core thruster overload warning
    const alarmColors = [dangerColor, "#f97316", "#ef4444", "#ffffff"];
    for (let t = 0; t < 12; t++) {
      setTimeout(() => {
        if (levelAnnounceTimerRef.current <= 0) return;

        for (let i = 0; i < 12; i++) {
          particlesRef.current.push({
            x: Math.random() * V_WIDTH,
            y: V_HEIGHT + 10,
            vx: (Math.random() - 0.5) * 2.0,
            vy: -(Math.random() * 6.0 + 7.5), // fast upward jet
            color: alarmColors[Math.floor(Math.random() * alarmColors.length)],
            size: Math.random() * 3.2 + 1.2,
            life: 1,
            maxLife: 105,
            alpha: 1.0,
            decay: 0.011,
            glow: true,
          });
        }
      }, t * 250);
    }
  };

  // Spawn dynamic weapon powerups
  const spawnPowerUp = (x: number, y: number) => {
    const id = `pu_${nextPowerupId.current++}`;
    const types: (WeaponType | "HEAL" | "SHIELD")[] = [
      WeaponType.Double,
      WeaponType.Triple,
      WeaponType.Plasma,
      WeaponType.Rapid,
      "HEAL",
      "SHIELD",
    ];
    // Random selection
    const type = types[Math.floor(Math.random() * types.length)];
    let color = "#38bdf8"; // blue

    if (type === WeaponType.Double) color = "#60a5fa";
    else if (type === WeaponType.Triple) color = "#a78bfa";
    else if (type === WeaponType.Plasma) color = "#facc15";
    else if (type === WeaponType.Rapid) color = "#f87171";
    else if (type === "HEAL") color = "#34d399";
    else if (type === "SHIELD") color = "#e879f9";

    powerupsRef.current.push({
      id,
      type,
      x,
      y,
      width: 28,
      height: 28,
      speedY: 2.0,
      color,
      pulse: 0,
    });
  };

  // Main Loop logic handles updates & paints
  useEffect(() => {
    let lastTime = performance.now();
    let isTerminated = false;

    // Reset player details on first load / game states changes
    const setupRun = () => {
      shipColorRef.current = localStorage.getItem("space_warz_ship_color") || "cyan";
      engineTrailRef.current = localStorage.getItem("space_warz_engine_trail") || "classic";
      controlLayoutRef.current = localStorage.getItem("space_warz_control_layout") || "both";

      playerRef.current = {
        x: V_WIDTH / 2 - 25,
        y: V_HEIGHT - 120,
        width: 50,
        height: 50,
        health: 100,
        maxHealth: 100,
        score: 0,
        speed: 6.5,
        weapon: WeaponType.Laser,
        weaponTimer: 0,
        shield: false,
        shieldHp: 0,
      };

      enemiesRef.current = [];
      bulletsRef.current = [];
      powerupsRef.current = [];
      particlesRef.current = [];
      popupsRef.current = [];
      playtimeRef.current = 0;
      spawnCooldownRef.current = 0;
      playerShootCooldownRef.current = 0;
      warpMultiplierRef.current = 1;
      flashOverlayRef.current = 0;
      screenShakeRef.current = 0;

      // Reset Sonic Boom, pre-boss wave trackers & post-boss safety timer
      sonicBoomCooldownRef.current = 0;
      setHudSonicBoomCooldown(0);
      preBossWaveActiveRef.current = false;
      preBossWaveNumberRef.current = 0;
      postBossSafetyTimerRef.current = 0;

      // Level and boss system reset
      levelRef.current = 1;
      bossSpawnedThisLevelRef.current = false;
      bossActiveRef.current = false;
      bossHpRef.current = 0;
      bossMaxHpRef.current = 0;
      bossNameRef.current = "";
      levelAnnounceTimerRef.current = 2500; // brief level 1 intro text
      setLevelAnnounceMsg("LEVEL 1: ALPHA SECTOR");
      setLevelAnnounceSub("STRIKE DOWN COGNITIVE INTRUDERS");
      setLevelAnnounceTimer(2500);

      setHudScore(0);
      setHudHealth(100);
      setHudWeapon(WeaponType.Laser);
      setHudShield(0);
      setHudLevel(1);
      setHudBossActive(false);
      setHudBossName("");
      setHudBossHp(0);
      setHudBossMaxHp(0);
    };

    if (gameState === "playing" || gameState === "tutorial") {
      setupRun();
      if (gameState === "tutorial") {
        tutorialStepRef.current = 0;
        tutorialCountRef.current = 0;
        tutorialTargetPosRef.current = { x: V_WIDTH / 4, y: V_HEIGHT / 2 };
        triggerTutorialStepText(
          "WELCOME CADET TO FLIGHT ACADEMY! FLY TO THE PULSING EMERALD NAVPOINT ALFA.",
          "USE WASD / ARROWS (OR TOUCH JOYSTICK DRAG) TO MANEUVER STARSHIP."
        );
      }
    }

    const runLoop = (now: number) => {
      if (isTerminated) return;
      
      const dt = now - lastTime;
      lastTime = now;

      updateGame(dt);
      renderGame();

      animFrameId.current = requestAnimationFrame(runLoop);
    };

    animFrameId.current = requestAnimationFrame(runLoop);

    return () => {
      isTerminated = true;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [gameState]);

  // React state sync in playing loop (updates health, scores, weapons to top level overlays once a brief rate to prevent React lag state update spam)
  const syncTimer = useRef<number>(0);
  const syncHud = (player: Player) => {
    setHudScore(player.score);
    setHudHealth(player.health);
    setHudWeapon(player.weapon);
    setHudShield(player.shieldHp);
    setHudLevel(levelRef.current);
    
    // Sync Sonic Boom cooldown seconds remaining
    setHudSonicBoomCooldown(Math.ceil(sonicBoomCooldownRef.current / 1000));

    // Sync boss battle parameters safely
    setHudBossActive(bossActiveRef.current);
    setHudBossName(bossNameRef.current);
    setHudBossHp(bossHpRef.current);
    setHudBossMaxHp(bossMaxHpRef.current);

    if (player.score > hudHighScore) {
      setHudHighScore(player.score);
    }
  };

  // CORE ENGINE UPDATE FUNCTION
  const updateGame = (dt: number) => {
    playtimeRef.current += dt;

    // Decrement Sonic Boom cooldown milliseconds remaining
    if (sonicBoomCooldownRef.current > 0) {
      sonicBoomCooldownRef.current -= dt;
      if (sonicBoomCooldownRef.current < 0) {
        sonicBoomCooldownRef.current = 0;
      }
    }

    // Decrement post-boss safety timer remaining
    if (postBossSafetyTimerRef.current > 0) {
      postBossSafetyTimerRef.current -= dt;
      if (postBossSafetyTimerRef.current < 0) {
        postBossSafetyTimerRef.current = 0;
      }
    }

    // 1. UPDATE STARS BACKGROUND
    const warpMult = warpMultiplierRef.current;
    starsRef.current.forEach((star) => {
      star.y += star.speed * warpMult;
      if (star.y > V_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * V_WIDTH;
      }
    });

    // Shooting Star logic
    if (Math.random() < 0.008 && shootingStarsRef.current.length < 2) {
      shootingStarsRef.current.push({
        x: Math.random() * V_WIDTH,
        y: 0,
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 4 + 4,
        length: Math.random() * 60 + 20,
        life: 0,
        maxLife: Math.random() * 40 + 20,
        color: ["#38bdf8", "#e9d5ff", "#ffffff"][Math.floor(Math.random() * 3)],
      });
    }

    shootingStarsRef.current = shootingStarsRef.current.filter((ss) => {
      ss.x += ss.vx * warpMult;
      ss.y += ss.vy * warpMult;
      ss.life++;
      return ss.life < ss.maxLife;
    });

    // Decaying Screen Shake
    if (screenShakeRef.current > 0) {
      screenShakeRef.current *= 0.9;
      if (screenShakeRef.current < 0.2) screenShakeRef.current = 0;
    }

    // Decaying transition flash overlay
    if (flashOverlayRef.current > 0) {
      flashOverlayRef.current -= 0.03;
      if (flashOverlayRef.current < 0) flashOverlayRef.current = 0;
    }

    // Handle states
    if (gameState === "welcome") {
      warpMultiplierRef.current = 1.0;
      // Handle simple particle drift
      updateParticles();
      return;
    }

    if (gameState === "transitioning") {
      // Warp acceleration
      if (warpMultiplierRef.current < 26) {
        warpMultiplierRef.current += 0.5;
      }
      
      // Update particles
      updateParticles();
      return;
    }

    // Only playing or tutorial triggers updates
    if (gameState !== "playing" && gameState !== "tutorial") return;

    // Bring warp multiplier back to normal 1.0 smoothly if entering playing or tutorial
    if (warpMultiplierRef.current > 1.0) {
      warpMultiplierRef.current -= 0.4;
      if (warpMultiplierRef.current < 1.0) warpMultiplierRef.current = 1.0;
    }

    const player = playerRef.current;

    // Decrement level announcement timer
    if (levelAnnounceTimerRef.current > 0) {
      levelAnnounceTimerRef.current -= dt;
      if (levelAnnounceTimerRef.current <= 0) {
        levelAnnounceTimerRef.current = 0;
        setLevelAnnounceTimer(0);
        setLevelAnnounceMsg("");
        setLevelAnnounceSub("");
      } else {
        setLevelAnnounceTimer(levelAnnounceTimerRef.current);

        // Dynamic transition during post-boss safe period: transition from "Sector Secured" to "LEVEL [X]"
        const safety = postBossSafetyTimerRef.current;
        if (safety > 0 && safety <= 2500) {
          const nextLvl = levelRef.current;
          const nextLvlConfig = getLevelConfig(nextLvl);
          if (levelAnnounceMsg && levelAnnounceMsg.includes("SECURED")) {
            setLevelAnnounceMsg(`🛸 LEVEL ${nextLvl} 🛸`);
            setLevelAnnounceSub(`PREPARE COGNITIVE DRIVE FOR: ${nextLvlConfig.name.toUpperCase()}`);
          }
        }
      }
    }

    // Wave state check: advances pre-boss squadrons when they are fully cleared
    if (gameState === "playing" && preBossWaveActiveRef.current) {
      if (enemiesRef.current.length === 0) {
        const lvl = levelRef.current;
        if (lvl === 2) {
          // Squadron cleared, summon boss
          preBossWaveActiveRef.current = false;
          bossSpawnedThisLevelRef.current = true;
          spawnLevelBoss(2);
        } else if (lvl >= 3) {
          if (preBossWaveNumberRef.current === 2) {
            // Wave 1 cleared, advance to Wave 2/2
            preBossWaveNumberRef.current = 1;

            setLevelAnnounceMsg("⚠️ GUARD DEFENSE: WAVE 2/2 ⚠️");
            setLevelAnnounceSub("SURVIVE FAST INTERCEPTORS BEFORE CONTINUING DIRECT APEX ASSAULT!");
            setLevelAnnounceTimer(4500);
            levelAnnounceTimerRef.current = 4500;
            flashOverlayRef.current = 1.0;
            shakeScreen(15.0);
            sound.playPowerup();

            spawnPreBossWave(lvl, 2);
          } else {
            // Both waves cleared, summon actual level boss
            preBossWaveActiveRef.current = false;
            bossSpawnedThisLevelRef.current = true;
            spawnLevelBoss(lvl);
          }
        }
      }
    }

    // Spawn Level Boss Fight or Pre-Boss Squadron Ambush Wave
    if (gameState === "playing" && !bossSpawnedThisLevelRef.current && !preBossWaveActiveRef.current) {
      const currentConfig = getLevelConfig(levelRef.current);
      if (player.score >= currentConfig.bossScoreThreshold) {
        const lvl = levelRef.current;
        if (lvl === 1) {
          bossSpawnedThisLevelRef.current = true;
          spawnLevelBoss(1);
        } else if (lvl === 2) {
          preBossWaveActiveRef.current = true;
          preBossWaveNumberRef.current = 1;
          
          // Clear any current random small enemies
          enemiesRef.current = [];

          setLevelAnnounceMsg("⚠️ AMBUSH: COGNITIVE GUARD ⚠️");
          setLevelAnnounceSub("SUMMON BOSS BY ANNIHILATING FIGHTER SQUADRON PRE-WAVE!");
          setLevelAnnounceTimer(4500);
          levelAnnounceTimerRef.current = 4500;
          flashOverlayRef.current = 1.0;
          shakeScreen(18.0);
          sound.playPowerup();

          spawnPreBossWave(2, 1);
        } else {
          // Level 3 & above: Multiple elite waves before boss
          preBossWaveActiveRef.current = true;
          preBossWaveNumberRef.current = 2; // survival required for 2 heavy squads
          
          enemiesRef.current = [];

          setLevelAnnounceMsg("⚠️ 2 COGNITIVE ELITE WAVES ⚠️");
          setLevelAnnounceSub("WARNING: OUTLAST ADVANCED INTERCEPTORS TO EXPOSE CAPITAL SHIP!");
          setLevelAnnounceTimer(4800);
          levelAnnounceTimerRef.current = 4800;
          flashOverlayRef.current = 1.0;
          shakeScreen(20.0);
          sound.playPowerup();

          spawnPreBossWave(lvl, 1);
        }
      }
    }

    // Decrement powerup timer
    if (player.weapon !== WeaponType.Laser) {
      player.weaponTimer -= dt;
      if (player.weaponTimer <= 0) {
        player.weapon = WeaponType.Laser;
        addScorePopup(player.x + 25, player.y - 10, "WEAPON EXPIRED", "#f87171");
        sound.playHit();
      }
    }

    // Continuous shoot trails for moving starship
    if (Math.random() < 0.45) {
      // Add thrust fire engine particles with dynamic colors
      let trailColors = ["#f97316", "#ef4444", "#eab308"]; // classic default
      const trStr = engineTrailRef.current;
      if (trStr === "plasma") {
        trailColors = ["#38bdf8", "#06b6d4", "#22d3ee", "#60a5fa"];
      } else if (trStr === "toxic") {
        trailColors = ["#4ade80", "#22c55e", "#a3e635", "#84cc16"];
      } else if (trStr === "void") {
        trailColors = ["#c084fc", "#a855f7", "#ec4899", "#db2777"];
      } else if (trStr === "gold") {
        trailColors = ["#fbbf24", "#f59e0b", "#d97706", "#fef08a"];
      }

      particlesRef.current.push({
        x: player.x + player.width / 2 + (Math.random() * 8 - 4),
        y: player.y + player.height - 4,
        vx: Math.random() * 1 - 0.5,
        vy: Math.random() * 2 + 3,
        color: player.shieldHp > 0 ? "#e879f9" : trailColors[Math.floor(Math.random() * trailColors.length)],
        size: Math.random() * 3 + 1.5,
        life: 1,
        maxLife: Math.random() * 15 + 10,
        alpha: 0.9,
        decay: 0.07,
      });
    }

    // 2. PLAYER MOVEMENT & CONTROLS
    let moveDX = 0;
    let moveDY = 0;

    // Keyboard values mapping (allows Arrow keys or WASD options)
    const layout = controlLayoutRef.current;
    const allowWASD = layout === "both" || layout === "wasd";
    const allowArrows = layout === "both" || layout === "arrows";

    if ((allowArrows && keysPressed.current["ArrowLeft"]) || (allowWASD && keysPressed.current["a"])) moveDX = -1;
    if ((allowArrows && keysPressed.current["ArrowRight"]) || (allowWASD && keysPressed.current["d"])) moveDX = 1;
    if ((allowArrows && keysPressed.current["ArrowUp"]) || (allowWASD && keysPressed.current["w"])) moveDY = -1;
    if ((allowArrows && keysPressed.current["ArrowDown"]) || (allowWASD && keysPressed.current["s"])) moveDY = 1;

    // Apply mobile touch offsets if active
    if (joystickActive) {
      const dist = Math.hypot(joystickOffset.x, joystickOffset.y);
      if (dist > 5) {
        moveDX = joystickOffset.x / 50; // max length 50
        moveDY = joystickOffset.y / 50;
      }
    }

    // Constrain player coordinates in sandbox workspace boundary
    player.x += moveDX * player.speed;
    player.y += moveDY * player.speed;

    if (player.x < 10) player.x = 10;
    if (player.x > V_WIDTH - player.width - 10) player.x = V_WIDTH - player.width - 10;
    if (player.y < 100) player.y = 100; // Keep space on hud
    if (player.y > V_HEIGHT - player.height - 15) player.y = V_HEIGHT - player.height - 15;

    // Fire mechanics loop trigger
    if (playerShootCooldownRef.current > 0) {
      playerShootCooldownRef.current -= dt;
    }

    // Keyboard combo Shift + Space for Sonic Boom superweapon
    const hasPressedShift = keysPressed.current["ShiftLeft"] || keysPressed.current["ShiftRight"] || keysPressed.current["shift"];
    const hasPressedSpace = keysPressed.current["Space"] || keysPressed.current["space"];
    if (hasPressedShift && hasPressedSpace && sonicBoomCooldownRef.current <= 0) {
      triggerSonicBoom();
      keysPressed.current["Space"] = false;
      keysPressed.current["space"] = false;
    }

    // Auto-fire is extremely comfortable for simple touch screen and classic arcade shoot keys
    const isPressingFire = keysPressed.current["Space"] || keysPressed.current["space"] || isMobileUi;
    if (isPressingFire && playerShootCooldownRef.current <= 0) {
      triggerPlayerShoot();
    }

    // 3. BULLETS MOVEMENT
    bulletsRef.current.forEach((b) => {
      b.x += b.speedX;
      b.y += b.speedY;
    });

    // Filter off-screen bullets
    bulletsRef.current = bulletsRef.current.filter((b) => b.y > -20 && b.y < V_HEIGHT + 30);

    // 4. POWERUPS FLOAT DOWN
    powerupsRef.current.forEach((pu) => {
      pu.y += pu.speedY;
      pu.pulse += 0.08;
      
      // Distinct Particle Trails for weapon powerups and utility packages
      const px = pu.x + pu.width / 2;
      const py = pu.y + pu.height / 2;

      if (pu.type === WeaponType.Double) {
        // Double Weapon Trail: emit twin blue parallel sparks
        if (Math.random() < 0.3) {
          const sideOffset = 6;
          particlesRef.current.push({
            x: px - sideOffset + (Math.random() * 2 - 1),
            y: py - 4,
            vx: (Math.random() * 0.4 - 0.2),
            vy: -pu.speedY * 0.4 - Math.random() * 0.5,
            color: pu.color,
            size: Math.random() * 2 + 1,
            life: 1,
            maxLife: 20,
            alpha: 0.8,
            decay: 0.05,
            glow: true,
          });
          particlesRef.current.push({
            x: px + sideOffset + (Math.random() * 2 - 1),
            y: py - 4,
            vx: (Math.random() * 0.4 - 0.2),
            vy: -pu.speedY * 0.4 - Math.random() * 0.5,
            color: pu.color,
            size: Math.random() * 2 + 1,
            life: 1,
            maxLife: 20,
            alpha: 0.8,
            decay: 0.05,
            glow: true,
          });
        }
      } else if (pu.type === WeaponType.Triple) {
        // Triple Weapon Trail: emit 3 wide splayed rays
        if (Math.random() < 0.25) {
          const angles = [-0.3, 0, 0.3];
          angles.forEach((ang) => {
            particlesRef.current.push({
              x: px + (Math.random() * 4 - 2),
              y: py,
              vx: Math.sin(ang) * 1.5 + (Math.random() * 0.3 - 0.15),
              vy: -pu.speedY * 0.5 - Math.random() * 0.4,
              color: pu.color,
              size: Math.random() * 1.8 + 1,
              life: 1,
              maxLife: 25,
              alpha: 0.9,
              decay: 0.04,
              glow: true,
            });
          });
        }
      } else if (pu.type === WeaponType.Plasma) {
        // Plasma Weapon Trail: slow orbiting/swirling thick gold bubbles
        if (Math.random() < 0.22) {
          const orbitAngle = pu.pulse * 3;
          const ox = Math.cos(orbitAngle) * 8;
          const oy = Math.sin(orbitAngle) * 8;
          particlesRef.current.push({
            x: px + ox,
            y: py + oy,
            vx: -ox * 0.05 + (Math.random() * 0.2 - 0.1),
            vy: -pu.speedY * 0.3 - Math.random() * 0.3,
            color: "#fbbf24", // bright golden
            size: Math.random() * 3.5 + 1.5,
            life: 1,
            maxLife: 35,
            alpha: 1.0,
            decay: 0.03,
            glow: true,
          });
        }
      } else if (pu.type === WeaponType.Rapid) {
        // Rapid Weapon Trail: super fast streaky red lines
        if (Math.random() < 0.45) {
          particlesRef.current.push({
            x: px + (Math.random() * 12 - 6),
            y: py,
            vx: Math.random() * 0.8 - 0.4,
            vy: -pu.speedY * 1.3 - Math.random() * 0.8,
            color: pu.color,
            size: Math.random() * 1.5 + 1.0,
            life: 1,
            maxLife: 15,
            alpha: 0.9,
            decay: 0.07,
            glow: true,
          });
        }
      } else {
        // Heal or Shield utility trail elements
        if (Math.random() < 0.15) {
          particlesRef.current.push({
            x: px + (Math.random() * 10 - 5),
            y: py,
            vx: Math.random() * 0.6 - 0.3,
            vy: -pu.speedY * 0.4 - Math.random() * 0.4,
            color: pu.color,
            size: Math.random() * 2.2 + 1,
            life: 1,
            maxLife: 22,
            alpha: 0.7,
            decay: 0.04,
            glow: false,
          });
        }
      }
      
      // Collision detection with player starship
      const colliding =
        pu.x < player.x + player.width &&
        pu.x + pu.width > player.x &&
        pu.y < player.y + player.height &&
        pu.y + pu.height > player.y;

      if (colliding) {
        if (pu.type === "HEAL") {
          sound.playPowerup();
          player.health = Math.min(player.maxHealth, player.health + 35);
          addScorePopup(pu.x, pu.y, "+35 HULL REPAIR", "#10b981");
          createExplosionBurst(pu.x, pu.y, "#10b981", 4, 12, 3);
        } else if (pu.type === "SHIELD") {
          sound.playPowerup();
          player.shield = true;
          player.shieldHp = 3; // takes 3 hits
          addScorePopup(pu.x, pu.y, "FORCE FIELD ONLINE", "#e879f9");
          createExplosionBurst(pu.x, pu.y, "#e879f9", 4, 12, 3);
        } else {
          // It's a weapon upgrade!
          sound.playWeaponChange(pu.type);
          player.weapon = pu.type as WeaponType;
          player.weaponTimer = 9000; // Upgraded for 9 seconds
          addScorePopup(pu.x, pu.y, `[ ${pu.type} ] ENABLED`, pu.color);
          createExplosionBurst(pu.x, pu.y, pu.color, 4, 14, 3);
        }
        pu.id = "__expired__"; // mark for filter removal
      }
    });

    powerupsRef.current = powerupsRef.current.filter((pu) => pu.id !== "__expired__" && pu.y < V_HEIGHT + 40);

    // 5. SPAWN ENEMIES
    if (gameState === "tutorial") {
      updateTutorialPhysics(dt);
    } else {
      // Prevent standard enemy spawns while Boss, Pre-boss wave, or Post-boss safety period is active!
      if (!bossActiveRef.current && !preBossWaveActiveRef.current && postBossSafetyTimerRef.current <= 0) {
        spawnCooldownRef.current -= dt;
        if (spawnCooldownRef.current <= 0) {
          triggerEnemySpawn();
        }
      }
    }

    // 6. UPDATE ENEMIES ACTIONS
    enemiesRef.current.forEach((en) => {
      en.pulse = (en.pulse || 0) + 0.1;

      if (en.isBoss) {
        // Boss specialized pattern movement
        if (en.y < 95) {
          en.y += 1.8; // entrance descent
        } else {
          // Floating wave pattern
          en.y = 100 + Math.sin(en.pulse * 0.15) * 45;
          en.x = (V_WIDTH / 2 - en.width / 2) + Math.sin(en.pulse * 0.08) * (V_WIDTH / 2 - en.width / 2 - 12);
        }

        // Firing combat patterns
        en.shootCooldown -= dt;
        if (en.shootCooldown <= 0 && en.y >= 50) {
          const currentLevel = levelRef.current;
          
          if (currentLevel === 1) {
            // Level 1 Boss (Void Sentinel): Destroyer bursts + aimed single laser
            triggerDestroyerBurst(en);
            
            // Aimed heavy laser
            bulletsRef.current.push({
              id: `enbu_${nextBulletId.current++}`,
              x: en.x + en.width / 2 - 4,
              y: en.y + en.height + 4,
              width: 8,
              height: 20,
              speedX: 0,
              speedY: 7.0,
              color: en.color || "#10b981",
              damage: 15,
              fromPlayer: false,
            });
            en.shootCooldown = 1200; // 1.2 seconds repeat
          } else if (currentLevel === 2) {
            // Level 2 Boss (Phantom Goliath): Expanded fan spray + kamikaze spawn
            const centerBossX = en.x + en.width / 2;
            const centerBossY = en.y + en.height;

            // Spawn 7 bullet fan spray
            for (let anglePct = -3; anglePct <= 3; anglePct++) {
              bulletsRef.current.push({
                id: `enbu_${nextBulletId.current++}`,
                x: centerBossX - 3,
                y: centerBossY,
                width: 6,
                height: 12,
                speedX: anglePct * 1.6,
                speedY: 6.0,
                color: en.color || "#a855f7",
                damage: 12,
                fromPlayer: false,
              });
            }

            // Spawn mini kamikaze distraction drone
            if (Math.random() < 0.45 && enemiesRef.current.length < 8) {
              enemiesRef.current.push({
                id: `en_${nextEnemyId.current++}`,
                type: "kamikaze",
                x: centerBossX + (Math.random() * 80 - 40),
                y: centerBossY + 5,
                width: 24,
                height: 24,
                hp: 12,
                maxHp: 12,
                speedX: 2.2,
                speedY: 5.5,
                shootCooldown: 9999,
                scoreValue: 100,
                pulse: 0,
                color: "#f472b6",
              });
            }
            en.shootCooldown = 1100;
          } else {
            // Level 3+ Boss (Omega Dreadnought / Apex Terminators): Full 12-bullet circular spinner!
            const centerBossX = en.x + en.width / 2;
            const centerBossY = en.y + en.height - 10;

            // Radial burst (12 bullets spaced equally around a circle!)
            for (let i = 0; i < 12; i++) {
              const angleRad = (i * Math.PI) / 6;
              bulletsRef.current.push({
                id: `enbu_${nextBulletId.current++}`,
                x: centerBossX,
                y: centerBossY,
                width: 8,
                height: 8,
                speedX: Math.cos(angleRad) * 4.8,
                speedY: Math.sin(angleRad) * 4.8 + 1.5, // slightly pushed downwards
                color: en.color || "#f43f5e",
                damage: 15,
                fromPlayer: false,
              });
            }

            // High pressure targeting blasters
            const targetX = player.x + player.width / 2;
            const bossX = centerBossX;
            const angleToPlayer = Math.atan2(player.y - centerBossY, targetX - bossX);

            bulletsRef.current.push({
              id: `enbu_${nextBulletId.current++}`,
              x: bossX - 4,
              y: centerBossY,
              width: 8,
              height: 16,
              speedX: Math.cos(angleToPlayer) * 7.5,
              speedY: Math.sin(angleToPlayer) * 7.5,
              color: "#eab308", // heavy golden tracking laser
              damage: 18,
              fromPlayer: false,
            });

            // Fast spawn scout
            if (Math.random() < 0.35 && enemiesRef.current.length < 9) {
              enemiesRef.current.push({
                id: `en_${nextEnemyId.current++}`,
                type: "scout",
                x: centerBossX + (Math.random() * 80 - 40),
                y: centerBossY + 5,
                width: 30,
                height: 22,
                hp: 15,
                maxHp: 15,
                speedX: 2.5,
                speedY: 4.8,
                shootCooldown: 1200,
                scoreValue: 120,
                pulse: 0,
                color: "#fb923c",
              });
            }
            en.shootCooldown = 900;
          }
        }
      } else {
        // Unique motion vectors based on ship type
        if (en.type === "scout") {
          en.y += en.speedY;
          // Float in subtle horizontal sine waves
          en.x += Math.sin(en.pulse * 0.4) * en.speedX;

          // Level >= 2 scout firing green blasters
          if (levelRef.current >= 2) {
            en.shootCooldown -= dt;
            if (en.shootCooldown <= 0 && en.y > 60 && en.y < V_HEIGHT / 2) {
              bulletsRef.current.push({
                id: `enbu_${nextBulletId.current++}`,
                x: en.x + en.width / 2 - 3,
                y: en.y + en.height + 2,
                width: 5,
                height: 10,
                speedX: levelRef.current >= 3 ? Math.sin(en.pulse) * 1.5 : 0,
                speedY: 5.2,
                color: "#10b981", // bright emerald green blaster
                damage: 8,
                fromPlayer: false,
              });
              en.shootCooldown = Math.random() * 1400 + 1500; // 1.5 - 2.9 seconds
            }
          }
        } else if (en.type === "fighter") {
          en.y += en.speedY;
          // Fighter shoots back toward player periodically!
          en.shootCooldown -= dt;
          if (en.shootCooldown <= 0 && en.y > 50 && en.y < V_HEIGHT / 2) {
            triggerEnemyBullet(en);
            en.shootCooldown = Math.random() * 1100 + 900; // faster recharges
          }
        } else if (en.type === "destroyer") {
          // Destroyer moves down slowly, stops temporarily to fire, then moves again
          const step = Math.floor(en.pulse * 0.05) % 4;
          if (step === 1 || step === 2) {
            // Stop and fire circular spray
            en.shootCooldown -= dt;
            if (en.shootCooldown <= 0) {
              triggerDestroyerBurst(en);
              // reset cooldown
              en.shootCooldown = 900;
            }
          } else {
            // Move down
            en.y += en.speedY;
          }
        } else if (en.type === "kamikaze") {
          // Direct home logic chasing player X axis while diving down rapidly
          en.y += en.speedY;
          const targetX = player.x + player.width / 2;
          const currentX = en.x + en.width / 2;
          const diffX = targetX - currentX;
          
          // Face player angle
          en.angle = Math.atan2(player.y - en.y, diffX);
          
          // Fast horizontal adjustment homing
          en.x += Math.sign(diffX) * Math.min(Math.abs(diffX), 4.5);
        }
      }

      // Constrain enemy boundaries
      if (en.x < 5) en.x = 5;
      if (en.x > V_WIDTH - en.width - 5) en.x = V_WIDTH - en.width - 5;
    });

    // Collision filter removal checking
    enemiesRef.current = enemiesRef.current.filter((en) => {
      // Out of bounds escape
      if (en.y > V_HEIGHT + 40) {
        // Scrap small points deduction for escapes
        return false;
      }
      return true;
    });

    // 7. BROAD SYSTEM COLLISION DETECTIONS
    detectCollisions();

    // 8. POPUPS & ENGINE PARTICLES UPDATES
    updateParticles();
    popupsRef.current.forEach((pop) => {
      pop.y -= 0.8;
      pop.life -= 0.02; // fades out in ~50 frames
    });
    popupsRef.current = popupsRef.current.filter((pop) => pop.life > 0);

    // Sync state for HUD to display top level
    syncTimer.current += dt;
    if (syncTimer.current > 100) {
      syncHud(player);
      syncTimer.current = 0;
    }
  };

  // Separated particle physics update
  const updateParticles = () => {
    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life += p.vx * 0.05; // tiny drift
      p.alpha -= p.decay;
    });
    particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);
  };

  // TRIGGER PLAYER FIRING
  const triggerPlayerShoot = () => {
    const player = playerRef.current;
    const wType = player.weapon;
    const bulletSpeed = 15;

    sound.playShoot(wType);

    if (wType === WeaponType.Laser) {
      // Single central cyan lazer beam
      bulletsRef.current.push({
        id: `pl_${nextBulletId.current++}`,
        x: player.x + player.width / 2 - 3,
        y: player.y - 12,
        width: 6,
        height: 18,
        speedX: 0,
        speedY: -bulletSpeed,
        color: "#22d3ee",
        damage: 15,
        fromPlayer: true,
      });
      playerShootCooldownRef.current = 200; // 0.2s delay
    } else if (wType === WeaponType.Double) {
      // Dual side firing
      bulletsRef.current.push({
        id: `pl_${nextBulletId.current++}`,
        x: player.x + 4,
        y: player.y,
        width: 4,
        height: 15,
        speedX: 0,
        speedY: -bulletSpeed,
        color: "#60a5fa",
        damage: 12,
        fromPlayer: true,
      });
      bulletsRef.current.push({
        id: `pl_${nextBulletId.current++}`,
        x: player.x + player.width - 8,
        y: player.y,
        width: 4,
        height: 15,
        speedX: 0,
        speedY: -bulletSpeed,
        color: "#60a5fa",
        damage: 12,
        fromPlayer: true,
      });
      playerShootCooldownRef.current = 180;
    } else if (wType === WeaponType.Triple) {
      // Fan layout vectors
      bulletsRef.current.push({
        id: `pl_${nextBulletId.current++}`,
        x: player.x + player.width / 2 - 3,
        y: player.y - 10,
        width: 5,
        height: 14,
        speedX: 0,
        speedY: -bulletSpeed,
        color: "#ca8a04",
        damage: 12,
        fromPlayer: true,
      });
      bulletsRef.current.push({
        id: `pl_${nextBulletId.current++}`,
        x: player.x,
        y: player.y + 5,
        width: 4,
        height: 12,
        speedX: -2.5,
        speedY: -bulletSpeed + 1,
        color: "#eab308",
        damage: 10,
        fromPlayer: true,
      });
      bulletsRef.current.push({
        id: `pl_${nextBulletId.current++}`,
        x: player.x + player.width - 4,
        y: player.y + 5,
        width: 4,
        height: 12,
        speedX: 2.5,
        speedY: -bulletSpeed + 1,
        color: "#eab308",
        damage: 10,
        fromPlayer: true,
      });
      playerShootCooldownRef.current = 240;
    } else if (wType === WeaponType.Plasma) {
      // Massive glowing ball
      bulletsRef.current.push({
        id: `pl_${nextBulletId.current++}`,
        x: player.x + player.width / 2 - 12,
        y: player.y - 25,
        width: 24,
        height: 24,
        speedX: 0,
        speedY: -8,
        color: "#facc15",
        damage: 40,
        fromPlayer: true,
        isPlasma: true,
        size: 24,
      });
      playerShootCooldownRef.current = 450; // slow high-impact
    } else if (wType === WeaponType.Rapid) {
      // Intense hot stream with tiny spray variance
      bulletsRef.current.push({
        id: `pl_${nextBulletId.current++}`,
        x: player.x + player.width / 2 - 2,
        y: player.y - 10,
        width: 4,
        height: 10,
        speedX: Math.random() * 1.5 - 0.75,
        speedY: -bulletSpeed - 2,
        color: "#ef4444",
        damage: 9,
        fromPlayer: true,
      });
      playerShootCooldownRef.current = 80; // extreme speed
    }
  };

  // ENEMY BULLET SPAWNING
  const triggerEnemyBullet = (en: Enemy) => {
    const lvl = levelRef.current;
    // Lower bullet speeds in Level 1, increasing with level
    const bulletSpeedFactor = lvl === 1 ? 0.75 : 1.0 + (lvl - 2) * 0.2;
    
    // Level-specific weapons!
    if (lvl === 1) {
      // Level 1: Normal single straight red bullet
      bulletsRef.current.push({
        id: `enbu_${nextBulletId.current++}`,
        x: en.x + en.width / 2 - 3,
        y: en.y + en.height + 4,
        width: 6,
        height: 12,
        speedX: 0,
        speedY: 5.0 * bulletSpeedFactor,
        color: "#ef4444",
        damage: 8,
        fromPlayer: false,
      });
    } else if (lvl === 2) {
      // Level 2: Double parallel pink blasters!
      bulletsRef.current.push({
        id: `enbu_${nextBulletId.current++}`,
        x: en.x + en.width / 3 - 3,
        y: en.y + en.height + 4,
        width: 5,
        height: 11,
        speedX: 0,
        speedY: 5.8 * bulletSpeedFactor,
        color: "#f472b6",
        damage: 9,
        fromPlayer: false,
      });
      bulletsRef.current.push({
        id: `enbu_${nextBulletId.current++}`,
        x: en.x + (en.width * 2) / 3 - 3,
        y: en.y + en.height + 4,
        width: 5,
        height: 11,
        speedX: 0,
        speedY: 5.8 * bulletSpeedFactor,
        color: "#f472b6",
        damage: 9,
        fromPlayer: false,
      });
    } else {
      // Level 3+: 3-way spread yellow/orange energy plasma!
      const spreadAngles = [-0.15, 0, 0.15];
      spreadAngles.forEach((angle) => {
        bulletsRef.current.push({
          id: `enbu_${nextBulletId.current++}`,
          x: en.x + en.width / 2 - 3,
          y: en.y + en.height + 4,
          width: 7,
          height: 7, // circular
          speedX: Math.sin(angle) * 5.0 * bulletSpeedFactor,
          speedY: Math.cos(angle) * 6.5 * bulletSpeedFactor,
          color: "#eab308",
          damage: 11,
          fromPlayer: false,
        });
      });
    }
  };

  // Destroyer targets shooting bursts
  const triggerDestroyerBurst = (en: Enemy) => {
    const shotCount = 5;
    const baseAngle = Math.PI / 2; // facing down
    
    // Shoot 5 circular spreading balls
    for (let i = 0; i < shotCount; i++) {
      const angle = baseAngle + (i - 2) * 0.25;
      bulletsRef.current.push({
        id: `enbu_${nextBulletId.current++}`,
        x: en.x + en.width / 2 - 4,
        y: en.y + en.height + 4,
        width: 8,
        height: 8,
        speedX: Math.cos(angle) * 4.5,
        speedY: Math.sin(angle) * 4.5,
        color: "#f43f5e",
        damage: 12,
        fromPlayer: false,
      });
    }
  };

  // ENEMY SPAWNER
  const triggerEnemySpawn = () => {
    // Difficulty escalators
    const secsActive = playtimeRef.current / 1000;
    
    // Spawn cool-downs decrease over time
    const baseInterval = Math.max(700, 2100 - secsActive * 18);
    spawnCooldownRef.current = Math.random() * 600 + baseInterval;

    // Pick type based on playtime
    let type: EnemyType = "scout";
    const rand = Math.random();

    if (secsActive < 10) {
      // First 10 seconds: Scout & Kamikazes
      type = rand < 0.75 ? "scout" : "kamikaze";
    } else if (secsActive < 25) {
      // 10-25 seconds: Add Fighter
      if (rand < 0.4) type = "scout";
      else if (rand < 0.8) type = "fighter";
      else type = "kamikaze";
    } else {
      // Fully escalates: Scout, Fighter, Drones, Destonier
      if (rand < 0.25) type = "scout";
      else if (rand < 0.55) type = "fighter";
      else if (rand < 0.8) type = "kamikaze";
      else type = "destroyer";
    }

    // Coordinates calculations
    const id = `en_${nextEnemyId.current++}`;
    let width = 36;
    let height = 30;
    let hp = 15;
    let speedY = 3.2;
    let speedX = 2.0;
    let scoreVal = 100;
    let shootCooldown = Math.random() * 1000 + 400;

    if (type === "scout") {
      width = 32;
      height = 25;
      hp = 10;
      speedY = Math.random() * 1.5 + 3.8;
      speedX = Math.random() * 1.5 + 2.0;
      scoreVal = 100;
    } else if (type === "fighter") {
      width = 44;
      height = 36;
      hp = 25;
      speedY = Math.random() * 1.0 + 2.4;
      scoreVal = 200;
    } else if (type === "destroyer") {
      width = 75;
      height = 65;
      hp = 110;
      speedY = 1.2;
      scoreVal = 600;
    } else if (type === "kamikaze") {
      width = 28;
      height = 28;
      hp = 8;
      speedY = Math.random() * 1.0 + 4.8; // sprint dive!
      scoreVal = 150;
    }

    // Scale HP and speeds with time
    const difficultyScaling = 1.0 + (secsActive * 0.006);
    hp = Math.round(hp * difficultyScaling);
    
    // Low level 1 speeds, gradually increasing as levels increase
    const lvl = levelRef.current;
    const levelSpeedFactor = lvl === 1 ? 0.65 : 1.0 + (lvl - 2) * 0.25;

    speedY = speedY * (1.0 + (secsActive * 0.002)) * levelSpeedFactor;
    speedX = speedX * levelSpeedFactor;

    const x = Math.random() * (V_WIDTH - width - 20) + 10;
    enemiesRef.current.push({
      id,
      type,
      x,
      y: -height - 10,
      width,
      height,
      hp,
      maxHp: hp,
      speedX,
      speedY,
      shootCooldown,
      scoreValue: scoreVal,
      pulse: Math.random() * 5,
    });
  };

  // GAME OVER EXECUTOR
  const triggerGameOver = () => {
    // Large explosion burst around player
    const player = playerRef.current;
    createExplosionBurst(player.x + 25, player.y + 25, "#ef4444", 6, 40, 6);
    createExplosionBurst(player.x + 25, player.y + 25, "#f59e0b", 4, 25, 4);
    shakeScreen(15);

    // Track total cumulated vaporized count in user profile records
    try {
      const curDestroyed = parseInt(localStorage.getItem("space_warz_totaldestroyed") || "0", 10);
      const earnedDestroyed = parseInt(localStorage.getItem("session_vaporized_count") || "0", 10);
      localStorage.setItem("space_warz_totaldestroyed", (curDestroyed + earnedDestroyed).toString());
      localStorage.removeItem("session_vaporized_count"); // flush temp
    } catch (e) {
      // Storage error safeguard
    }

    onGameOver(player.score);
  };

  // Helper: Spawn massive epic level boss fight with unique names, hps, sizes, and colors
  const spawnLevelBoss = (levelNum: number) => {
    const config = getLevelConfig(levelNum);
    const id = `boss_${nextEnemyId.current++}`;
    const x = V_WIDTH / 2 - config.bossWidth / 2;
    const y = -config.bossHeight - 20;

    const hp = config.bossHp;
    bossSpawnedThisLevelRef.current = true;
    bossActiveRef.current = true;
    bossHpRef.current = hp;
    bossMaxHpRef.current = hp;
    bossNameRef.current = config.bossName;

    // Filter normal destroyers to make space for the fight
    enemiesRef.current = enemiesRef.current.filter(en => en.type !== "destroyer");

    // Push Boss Enemy
    enemiesRef.current.push({
      id,
      type: "destroyer",
      x,
      y,
      width: config.bossWidth,
      height: config.bossHeight,
      hp,
      maxHp: hp,
      speedX: 1.6,
      speedY: 1.0,
      scoreValue: 1200 * levelNum,
      shootCooldown: 1200,
      isBoss: true,
      bossName: config.bossName,
      bossPhase: 1,
      pulse: 0,
      color: config.bossColor,
    });

    // Epic alerts visual setups
    flashOverlayRef.current = 1.0;
    shakeScreen(20.0);
    
    addScorePopup(V_WIDTH / 2, 280, `⚠️ ALARM: ${config.bossName} DETECTED ⚠️`, config.bossColor);

    setLevelAnnounceMsg("⚠️ BOSS WARNING ⚠️");
    setLevelAnnounceSub(`COLOSSAL ENEMY TARGET SPOTTED: [${config.bossName}]`);
    setLevelAnnounceTimer(4500);
    levelAnnounceTimerRef.current = 4500;

    // Trigger spectacular Boss Incoming screen-wide particle warning waves
    triggerBossIncomingHypeParticles(config.bossColor);

    // Heavy feedback sound
    sound.playPowerup();
  };

  // Helper: Trigger spectacular boss defeat sequence and level up warp progression
  const handleBossDefeated = (bx: number, by: number, bw: number, bh: number, bColor: string) => {
    bossActiveRef.current = false;
    bossHpRef.current = 0;

    // Instantly wipe all active enemies on screen so the player is safe and can breathe
    enemiesRef.current = [];
    bulletsRef.current = bulletsRef.current.filter((b) => b.fromPlayer); // clear any active enemy hazard bullets

    // Post-boss safe period of 5 seconds (5000 ms)
    postBossSafetyTimerRef.current = 5000;

    // Giant screen flash & heavy vibration
    flashOverlayRef.current = 1.0;
    shakeScreen(26.0);

    const currentLvl = levelRef.current;
    const nextLvl = currentLvl + 1;
    levelRef.current = nextLvl;
    bossSpawnedThisLevelRef.current = false;

    // Reset playtime to 0 so next level scaling scales from baseline
    playtimeRef.current = 0;

    // Setup level-announce message popup
    const nextConfig = getLevelConfig(nextLvl);
    
    // Add heavy score reward for clearing the boss fight
    playerRef.current.score += 2500 * currentLvl;
    
    // Fully restore player health upon defeating a boss
    playerRef.current.health = playerRef.current.maxHealth;
    setHudHealth(playerRef.current.health);
    addScorePopup(playerRef.current.x + playerRef.current.width / 2, playerRef.current.y - 15, "💖 HEALTH RESTORED MAXIMUM", "#10b981");

    setHudScore(playerRef.current.score);
    addScorePopup(bx + bw / 2, by, `🏆 SECTOR SECURED: +${2500 * currentLvl}`, bColor);

    setLevelAnnounceMsg(`🎉 SECTOR ${currentLvl} SECURED! 🎉`);
    setLevelAnnounceSub(`WARPING HYPERDRIVE TO: [${nextConfig.name}]`);
    setLevelAnnounceTimer(5000);
    levelAnnounceTimerRef.current = 5000;

    // Trigger spectacular screen-wide Level Complete hype celebration particles
    triggerLevelCompleteHypeParticles();

    // Create chain reaction explosions
    for (let j = 0; j < 5; j++) {
      setTimeout(() => {
        createExplosionBurst(
          bx + Math.random() * bw,
          by + Math.random() * bh,
          bColor || "#ffffff",
          6.0,
          25,
          5.5
        );
        sound.playExplosion("large");
      }, j * 160);
    }

    // Play warp transition feedback sound
    sound.playPowerup();

    // Spawn massive power-up packages for player survival survival reward
    setTimeout(() => {
      spawnPowerUp(V_WIDTH / 4, 250);
      spawnPowerUp(V_WIDTH * 3 / 4, 220);
      spawnPowerUp(V_WIDTH / 2, 280);
    }, 1000);
  };

  // Helper: Trigger spectacular supersonic "Sonic Boom" weapon clearing all visible normal enemies
  const triggerSonicBoom = () => {
    const player = playerRef.current;
    if (player.health <= 0) return;

    // Put on 90s cooldown (90,000ms)
    sonicBoomCooldownRef.current = 90000;
    setHudSonicBoomCooldown(90);

    // Epic flash and screen-wide vibration feedback
    flashOverlayRef.current = 1.0;
    shakeScreen(28.0);

    // Play powerful sound feedback
    sound.playExplosion("large");
    sound.playPowerup();

    // Create central expanding warp shockwave particles from starship core outwards
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
      const speed = 14.5;
      particlesRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: "#38bdf8", // gorgeous sky-cyan blue
        size: 5.0,
        life: 1,
        maxLife: 50,
        alpha: 1.0,
        decay: 0.02,
        glow: true,
      });
    }

    // Secondary golden spark expansion ring for premium aesthetic
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const speed = 9.5;
      particlesRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: "#facc15", // gold yellow
        size: 3.5,
        life: 1,
        maxLife: 40,
        alpha: 1.0,
        decay: 0.025,
        glow: true,
      });
    }

    // Add visual popup announcement card over center screen
    addScorePopup(px, py - 45, "📢 SONIC BOOM BLAST WAVE!", "#38bdf8");

    // Loop through all currently active enemies on screen and wipe them out!
    const activeEnemies = enemiesRef.current;
    activeEnemies.forEach((en) => {
      if (en.hp <= 0) return;

      if (en.isBoss) {
        // High impact blast on Boss: deals heavy 150 hp damage instead of insta-kill!
        en.hp -= 150;
        createExplosionBurst(en.x + en.width / 2, en.y + en.height / 2, en.color || "#10b981", 6, 30, 5);
        if (en.hp <= 0) {
          en.hp = -999;
          handleBossDefeated(en.x, en.y, en.width, en.height, en.color || "#10b981");
        } else {
          addScorePopup(en.x + en.width / 2, en.y + en.height, "DIRECT BLAST DAMAGE (-150 HP)", en.color || "#10b981");
        }
      } else {
        // Kill normal enemy instantly, reward points, trigger explosions
        en.hp = -999; // mark dead
        player.score += en.scoreValue;
        addScorePopup(en.x + en.width / 2, en.y, `+${en.scoreValue}`, "#38bdf8");

        const color = en.color || (en.type === "destroyer" ? "#a855f7" : (en.type === "scout" ? "#67e8f9" : "#ff4545"));
        createExplosionBurst(en.x + en.width / 2, en.y + en.height / 2, color, 4.0, 20, 4.0);

        // Increments Vaporized Count Session Records
        try {
          const count = parseInt(localStorage.getItem("session_vaporized_count") || "0", 10);
          localStorage.setItem("session_vaporized_count", (count + 1).toString());
        } catch (e) {}
      }
    });

    // Clean up also all normal enemy bullets as part of the sonic boom vacuum!
    bulletsRef.current = bulletsRef.current.filter((b) => b.fromPlayer);
  };

  // Helper: Spawn localized custom pre-boss guard squadron waves
  const spawnPreBossWave = (lvl: number, waveNum: number) => {
    // Wave spawn recipes
    if (lvl === 2) {
      // Level 2 guard wave: A squad of 6 advanced aggressive fighters and scout ships
      const spawnTypes: EnemyType[] = ["fighter", "scout", "fighter", "scout", "kamikaze", "kamikaze"];
      spawnTypes.forEach((type, index) => {
        const id = `en_prep_${nextEnemyId.current++}`;
        const x = 50 + index * 85;
        const width = type === "fighter" ? 44 : (type === "scout" ? 32 : 28);
        const height = type === "fighter" ? 36 : (type === "scout" ? 25 : 28);
        const hp = type === "fighter" ? 45 : 24; // beefier guard units
        const speedY = 3.6;
        const color = "#fca5a5"; // Soft crimson rose for guard squad
        
        enemiesRef.current.push({
          id,
          type,
          x,
          y: -height - (index * 45), // staggered starting row
          width,
          height,
          hp,
          maxHp: hp,
          speedX: Math.random() * 2 - 1,
          speedY,
          shootCooldown: Math.random() * 800 + 400,
          color,
          scoreValue: 250,
          pulse: Math.random() * 5,
        });
      });
    } else if (lvl >= 3) {
      if (waveNum === 1) {
        // Stage 3 Wave 1: Heavy assault group including a Destroyer guard!
        // 1 normal destroyer, 2 fighters, 2 swift kamikaes
        const id1 = `en_prep_${nextEnemyId.current++}`;
        enemiesRef.current.push({
          id: id1,
          type: "destroyer",
          x: V_WIDTH / 2 - 37,
          y: -100,
          width: 75,
          height: 65,
          hp: 130,
          maxHp: 130,
          speedX: 1.5,
          speedY: 1.5,
          shootCooldown: 600,
          color: "#fca5a5",
          scoreValue: 800,
          pulse: 2,
        });

        const sidePositions = [80, V_WIDTH - 120];
        sidePositions.forEach((px, index) => {
          const idK = `en_prep_${nextEnemyId.current++}`;
          enemiesRef.current.push({
            id: idK,
            type: "kamikaze",
            x: px,
            y: index === 0 ? -160 : -200,
            width: 28,
            height: 28,
            hp: 20,
            maxHp: 20,
            speedX: 0,
            speedY: 5.5, // fast divings
            shootCooldown: 99999,
            color: "#fdba74",
            scoreValue: 300,
            pulse: 1,
          });

          const idF = `en_prep_${nextEnemyId.current++}`;
          enemiesRef.current.push({
            id: idF,
            type: "fighter",
            x: px + (index === 0 ? 50 : -50),
            y: index === 0 ? -240 : -280,
            width: 44,
            height: 36,
            hp: 55,
            maxHp: 55,
            speedX: Math.random() * 2 - 1,
            speedY: 3.2,
            shootCooldown: 700,
            color: "#fca5a5",
            scoreValue: 400,
            pulse: 3,
          });
        });
      } else {
        // Stage 3 Wave 2: Speed elite interceptor squad (all over the screen)
        const count = 7;
        for (let i = 0; i < count; i++) {
          const id = `en_prep_${nextEnemyId.current++}`;
          const isFighter = i % 2 === 0;
          const width = isFighter ? 44 : 28;
          const height = isFighter ? 36 : 28;
          const hp = isFighter ? 60 : 35;
          const type: EnemyType = isFighter ? "fighter" : "kamikaze";
          
          enemiesRef.current.push({
            id,
            type,
            x: 40 + i * 75,
            y: -80 - (i * 35),
            width,
            height,
            hp,
            maxHp: hp,
            speedX: Math.random() * 4 - 2,
            speedY: 4.2,
            shootCooldown: isFighter ? 600 : 999999,
            color: "#f472b6",
            scoreValue: 500,
            pulse: Math.random() * 5,
          });
        }
      }
    }
  };

  // COLLISION ENGINE RESOLUTIONS
  const detectCollisions = () => {
    const player = playerRef.current;
    if (player.health <= 0) return;

    const bullets = bulletsRef.current;
    const enemies = enemiesRef.current;

    // Bullet loops collisions
    bullets.forEach((b) => {
      if (b.fromPlayer) {
        // Player's bullet checks against all enemy bullets to destroy them
        bullets.forEach((eb) => {
          if (!eb.fromPlayer && eb.y > -20 && eb.y < V_HEIGHT + 30) {
            if (
              b.x < eb.x + eb.width &&
              b.x + b.width > eb.x &&
              b.y < eb.y + eb.height &&
              b.y + b.height > eb.y
            ) {
              b.y = -100; // kill player bullet
              eb.y = V_HEIGHT + 100; // kill enemy bullet
              createHitSparks((b.x + eb.x) / 2, (b.y + eb.y) / 2, "#22d3ee");
              sound.playHit();
            }
          }
        });

        // Player's bullet checks against all enemies
        enemies.forEach((en) => {
          if (
            b.x < en.x + en.width &&
            b.x + b.width > en.x &&
            b.y < en.y + en.height &&
            b.y + b.height > en.y
          ) {
            if (en.hp <= 0) return; // ignore already-dead elements

            // Hit register!
            en.hp -= b.damage;
            createHitSparks(b.x, b.y, b.isPlasma ? "#facc15" : "#22d3ee");
            sound.playHit();
            
            // Plasma piercing / single pass laser disappear
            if (!b.isPlasma) {
              b.y = -100; // mark bullet as dead
            } else {
              // Plasma scales pierce shake
              shakeScreen(1.8);
            }

            // Exterminated?
            if (en.hp <= 0) {
              en.hp = -999; // mark dead
              
              if (en.isBoss) {
                handleBossDefeated(en.x, en.y, en.width, en.height, en.color || "#10b981");
              } else {
                // Score rewards popups
                player.score += en.scoreValue;
                addScorePopup(en.x + en.width / 2, en.y, `+${en.scoreValue}`, "#22d3ee");

                // Spawns explosion kinetic dust particles dynamically based on enemy ship size
                let explCount = 15;
                let explSize = 3.5;
                let explSpeed = 3.5;
                let soundSize: "small" | "medium" | "large" = "medium";
                let shakeIntensity = 3.5;
                const color = en.color || (en.type === "destroyer" ? "#a855f7" : (en.type === "scout" ? "#67e8f9" : "#ff4545"));

                if (en.type === "destroyer") {
                  explCount = 45;
                  explSize = 5.8;
                  explSpeed = 6.5;
                  soundSize = "large";
                  shakeIntensity = 14.0;
                } else if (en.type === "fighter") {
                  explCount = 24;
                  explSize = 4.2;
                  explSpeed = 4.5;
                  soundSize = "medium";
                  shakeIntensity = 6.5;
                } else if (en.type === "scout") {
                  explCount = 14;
                  explSize = 3.2;
                  explSpeed = 3.5;
                  soundSize = "medium";
                  shakeIntensity = 3.8;
                } else if (en.type === "kamikaze") {
                  explCount = 8;
                  explSize = 2.6;
                  explSpeed = 3.0;
                  soundSize = "small";
                  shakeIntensity = 2.2;
                }

                // Apply minor variance for organic realism
                const finalShake = shakeIntensity * (0.82 + Math.random() * 0.36);

                createExplosionBurst(en.x + en.width / 2, en.y + en.height / 2, color, explSize, explCount, explSpeed);
                sound.playExplosion(soundSize);
                shakeScreen(finalShake);

                // Track session kills for records totalizer
                try {
                  const count = parseInt(localStorage.getItem("session_vaporized_count") || "0", 10);
                  localStorage.setItem("session_vaporized_count", (count + 1).toString());
                } catch (e) {}

                // Drop powerup randomly on enemy death
                const dropPercent = en.type === "destroyer" ? 0.90 : (en.type === "fighter" ? 0.18 : 0.05);
                if (Math.random() < dropPercent) {
                  spawnPowerUp(en.x + en.width / 2 - 14, en.y + en.height / 2);
                }
              }
            }
          }
        });
      } else {
        // Enemy's bullet checks against player starship
        if (
          b.x < player.x + player.width &&
          b.x + b.width > player.x &&
          b.y < player.y + player.height &&
          b.y + b.height > player.y
        ) {
          b.y = V_HEIGHT + 100; // clear bullet
          applyDamageToPlayer(b.damage);
        }
      }
    });

    // Check direct kamikaze or enemy ship crash with player ship
    enemies.forEach((en) => {
      if (
        en.x < player.x + player.width &&
        en.x + en.width > player.x &&
        en.y < player.y + player.height &&
        en.y + en.height > player.y
      ) {
        if (en.hp <= 0) return; // skip items already deactivated

        if (en.isBoss) {
          // Boss doesn't die on crash, just takes player impact damage and deals high damage to player
          applyDamageToPlayer(40);
          en.hp -= 35; // direct ramming deals 35 damage to the boss
          en.y -= 45; // knock boss back upwards
          shakeScreen(15.0);

          createExplosionBurst(player.x + player.width / 2, player.y - 10, "#fb7185", 4.0, 15, 4.5);
          sound.playExplosion("large");

          if (en.hp <= 0) {
            en.hp = -999;
            handleBossDefeated(en.x, en.y, en.width, en.height, en.color || "#10b981");
          } else {
            addScorePopup(en.x + en.width / 2, en.y + en.height, "RAMMED CAPITOL HULL (-35 HP)", en.color || "#10b981");
          }
        } else {
          // Double explosion
          en.hp = -999; // kill enemy instantly on crash
          
          // High crash damage
          const crashDamage = en.type === "destroyer" ? 60 : (en.type === "fighter" ? 35 : 20);
          applyDamageToPlayer(crashDamage);

          // Dynamic crash explosion values proportional to collided ship size:
          let crashCount = 18;
          let crashSize = 4.0;
          let crashSpeed = 5.0;
          let soundType: "small" | "medium" | "large" = "medium";
          let crashShake = 8.0;
          
          if (en.type === "destroyer") {
            crashCount = 45;
            crashSize = 6.0;
            crashSpeed = 7.0;
            soundType = "large";
            crashShake = 16.0;
          } else if (en.type === "fighter") {
            crashCount = 24;
            crashSize = 4.5;
            crashSpeed = 5.5;
            soundType = "medium";
            crashShake = 9.0;
          } else if (en.type === "scout") {
            crashCount = 14;
            crashSize = 3.5;
            crashSpeed = 4.5;
            soundType = "medium";
            crashShake = 6.0;
          } else if (en.type === "kamikaze") {
            crashCount = 10;
            crashSize = 3.0;
            crashSpeed = 4.0;
            soundType = "small";
            crashShake = 4.5;
          }

          const finalCrashShake = crashShake * (0.85 + Math.random() * 0.3);

          createExplosionBurst(en.x + en.width / 2, en.y + en.height / 2, en.color || "#f43f5e", crashSize, crashCount, crashSpeed);
          sound.playExplosion(soundType);
          shakeScreen(finalCrashShake);
        }
      }
    });

    // Clean out dead enemies
    enemiesRef.current = enemiesRef.current.filter((en) => en.hp > 0);
  };

  // Helper helper damage reducer applying shields
  const applyDamageToPlayer = (dmg: number) => {
    const player = playerRef.current;
    if (player.health <= 0) return;

    if (player.shield && player.shieldHp > 0) {
      player.shieldHp--;
      addScorePopup(player.x + 25, player.y - 12, "SHIELD CHARGE ABSORBED", "#e879f9");
      sound.playHit();
      createExplosionBurst(player.x + 25, player.y + 12, "#e879f9", 2, 8, 2);
      shakeScreen(2.5);

      if (player.shieldHp <= 0) {
        player.shield = false;
        addScorePopup(player.x + 25, player.y - 12, "SHIELD COLLAPSED", "#f43f5e");
        sound.playExplosion("small");
      }
    } else {
      player.health -= dmg;
      createExplosionBurst(player.x + 25, player.y + 25, "#ff4d4d", 3, 10, 3);
      sound.playHit();
      shakeScreen(6);

      if (player.health < 0) player.health = 0;
      if (player.health <= 0) {
        triggerGameOver();
      }
    }
  };

  // MAIN DRAW RENDER METHOD
  const renderGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Apply viewport camera shake translation
    ctx.save();
    if (screenShakeRef.current > 0) {
      const shakeX = (Math.random() * 2 - 1) * screenShakeRef.current;
      const shakeY = (Math.random() * 2 - 1) * screenShakeRef.current;
      ctx.translate(shakeX, shakeY);
    }

    // 1. CLEAR VIEWPORT SLATE GRAY BACKPAGE
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Drawer grid background overlay
    ctx.fillStyle = "rgba(139, 92, 246, 0.04)";
    for (let x = 0; x < V_WIDTH; x += 40) {
      ctx.fillRect(x, 0, 1, V_HEIGHT);
    }
    for (let y = 0; y < V_HEIGHT; y += 40) {
      ctx.fillRect(0, y, V_WIDTH, 1);
    }

    // 2. PAINT STARS
    const isWarping = gameState === "transitioning";
    starsRef.current.forEach((star) => {
      ctx.fillStyle = star.color;
      if (isWarping) {
        // Warp stretches star lines
        ctx.strokeStyle = star.color;
        ctx.lineWidth = star.size;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x, star.y - star.speed * warpMultiplierRef.current * 1.5);
        ctx.stroke();
      } else {
        // Normal dots
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 3. PAINT SHOOTING STARS
    shootingStarsRef.current.forEach((ss) => {
      const opacity = 1 - ss.life / ss.maxLife;
      ctx.strokeStyle = ss.color;
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - ss.vx * ss.length * 0.1, ss.y - ss.vy * ss.length * 0.1);
      ctx.stroke();
    });

    // 4. PAINT PARTICLES
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. PAINT POWERUPS
    if (gameState === "playing" || gameState === "tutorial") {
      powerupsRef.current.forEach((pu) => {
        ctx.save();
        ctx.translate(pu.x + pu.width / 2, pu.y + pu.height / 2);
        
        // Spin rotations
        ctx.rotate(pu.pulse * 0.8);

        // Outer rotating glowing octagon
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = pu.color;
        ctx.shadowColor = pu.color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i;
          const rx = (pu.width / 2) * (1.0 + Math.sin(pu.pulse * 2.0) * 0.1);
          const ry = (pu.height / 2) * (1.0 + Math.sin(pu.pulse * 2.0) * 0.1);
          ctx.lineTo(Math.cos(angle) * rx, Math.sin(angle) * ry);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner glowing core & custom rotation animation indicators
        if (pu.type === WeaponType.Double) {
          // Double rotating bars
          ctx.save();
          ctx.rotate(-pu.pulse * 1.5);
          ctx.fillStyle = pu.color;
          ctx.fillRect(-5, -6, 2.5, 12);
          ctx.fillRect(2.5, -6, 2.5, 12);
          ctx.restore();
        } else if (pu.type === WeaponType.Triple) {
          // Triple rotating pointers
          ctx.save();
          ctx.rotate(pu.pulse * 2.2);
          ctx.fillStyle = pu.color;
          for (let idx = 0; idx < 3; idx++) {
            const ang = (Math.PI * 2 / 3) * idx;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * 9, Math.sin(ang) * 9);
            ctx.lineTo(Math.cos(ang) * 8 - Math.sin(ang) * 2, Math.sin(ang) * 8 + Math.cos(ang) * 2);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        } else if (pu.type === WeaponType.Plasma) {
          // Plasma rotating cell core
          ctx.save();
          ctx.rotate(-pu.pulse * 1.2);
          ctx.strokeStyle = pu.color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.stroke();
          // central core
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (pu.type === WeaponType.Rapid) {
          // Rapid spinning fire star crosshair
          ctx.save();
          ctx.rotate(pu.pulse * 4.0); // spin extremely fast
          ctx.strokeStyle = pu.color;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(-9, 0); ctx.lineTo(9, 0);
          ctx.moveTo(0, -9); ctx.lineTo(0, 9);
          ctx.stroke();
          // inner bright mini dot
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (pu.type === "HEAL") {
          // HEAL cross
          ctx.save();
          ctx.fillStyle = pu.color;
          ctx.fillRect(-2, -7, 4, 14);
          ctx.fillRect(-7, -2, 14, 4);
          ctx.restore();
        } else if (pu.type === "SHIELD") {
          // SHIELD hex
          ctx.save();
          ctx.strokeStyle = pu.color;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            ctx.lineTo(Math.cos(angle) * 7, Math.sin(angle) * 7);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        } else {
          // Fallback inner core
          ctx.fillStyle = pu.color;
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Floating indicator text label
        ctx.restore();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px 'JetBrains Mono'";
        ctx.textAlign = "center";
        let lbl = "UPGRADE";
        if (pu.type === "HEAL") lbl = "HP";
        else if (pu.type === "SHIELD") lbl = "SHLD";
        else if (pu.type === WeaponType.Double) lbl = "D-SHT";
        else if (pu.type === WeaponType.Triple) lbl = "T-SHT";
        else if (pu.type === WeaponType.Plasma) lbl = "PLSM";
        else if (pu.type === WeaponType.Rapid) lbl = "RPD";

        ctx.fillText(lbl, pu.x + pu.width / 2, pu.y - 6);
      });
    }

    // 6. PAINT ENEMIES (unique geometry layout and hulls)
    if (gameState === "playing" || gameState === "tutorial") {
      enemiesRef.current.forEach((en) => {
        ctx.save();
        ctx.translate(en.x + en.width / 2, en.y + en.height / 2);
        
        if (en.angle) {
          ctx.rotate(en.angle + Math.PI / 2); // default vertical face alignment
        }

        // Draw glowing vector details
        ctx.shadowBlur =en.type === "destroyer" ? 15 : 6;
        let color = "#ef4444"; // red fighter
        if (en.type === "scout") color = "#06b6d4"; // cyan
        else if (en.type === "destroyer") color = "#a855f7"; // purple boss destroyer
        else if (en.type === "kamikaze") color = "#f97316"; // orange kamikaze drone
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;

        ctx.beginPath();
        if (en.type === "scout") {
          // Sleek wide arrow wings
          ctx.moveTo(0, en.height / 2);
          ctx.lineTo(en.width / 2, -en.height / 3);
          ctx.lineTo(en.width / 4, -en.height / 2);
          ctx.lineTo(0, -en.height / 6);
          ctx.lineTo(-en.width / 4, -en.height / 2);
          ctx.lineTo(-en.width / 2, -en.height / 3);
        } else if (en.type === "fighter") {
          // Sharp horns and twin wings
          ctx.moveTo(0, en.height / 2);
          ctx.lineTo(en.width / 2, -en.height / 2);
          ctx.lineTo(en.width / 6, 0);
          ctx.lineTo(-en.width / 6, 0);
          ctx.lineTo(-en.width / 2, -en.height / 2);
        } else if (en.type === "destroyer") {
          // Large hexagonal dreadnought design
          ctx.moveTo(0, en.height / 2);
          ctx.lineTo(en.width / 2, en.height / 3);
          ctx.lineTo(en.width / 2, -en.height / 3);
          ctx.lineTo(en.width / 4, -en.height / 2);
          ctx.lineTo(-en.width / 4, -en.height / 2);
          ctx.lineTo(-en.width / 2, -en.height / 3);
          ctx.lineTo(-en.width / 2, en.height / 3);
        } else if (en.type === "kamikaze") {
          // Spinning quad star drone
          const r = en.pulse ? en.pulse * 0.4 : 0;
          ctx.rotate(r);
          ctx.moveTo(0, en.height / 2);
          ctx.lineTo(en.width / 3, en.height / 3);
          ctx.lineTo(en.width / 2, 0);
          ctx.lineTo(en.width / 3, -en.height / 3);
          ctx.lineTo(0, -en.height / 2);
          ctx.lineTo(-en.width / 3, -en.height / 3);
          ctx.lineTo(-en.width / 2, 0);
          ctx.lineTo(-en.width / 3, en.height / 3);
        }
        ctx.closePath();
        ctx.stroke();

        // Subtle gradient solid details filled values
        ctx.fillStyle = `${color}20`; // 12% opacity color fill
        ctx.fill();

        // Draw HP bar above Destroyer
        if (en.type === "destroyer" && en.hp > 0) {
          const barW = en.width * 0.9;
          const hpPct = en.hp / en.maxHp;
          ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
          ctx.fillRect(-barW / 2, -en.height / 2 - 12, barW, 4);
          ctx.fillStyle = "#a855f7";
          ctx.fillRect(-barW / 2, -en.height / 2 - 12, barW * hpPct, 4);
        }

        ctx.restore();
      });
    }

    // 7. PAINT BULLETS
    if (gameState === "playing" || gameState === "tutorial") {
      bulletsRef.current.forEach((b) => {
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = b.isPlasma ? 18 : 8;

        if (b.isPlasma && b.size) {
          // Draw plasma glowing orb
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.size, 0, Math.PI * 2);
          ctx.fill();

          // Core lightning detail
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.size / 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard laser beam shape
          ctx.fillRect(b.x, b.y, b.width, b.height);
        }
        ctx.restore();
      });
    }

    // 8. PAINT PLAYER SHIP
    if (gameState === "playing" || gameState === "tutorial") {
      const player = playerRef.current;
      ctx.save();
      ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

      // Tilting effect when moving left/right based on keyboard layout choice
      let tiltAngle = 0;
      const tiltLayout = controlLayoutRef.current;
      const tiltAllowWASD = tiltLayout === "both" || tiltLayout === "wasd";
      const tiltAllowArrows = tiltLayout === "both" || tiltLayout === "arrows";

      if ((tiltAllowArrows && keysPressed.current["ArrowLeft"]) || (tiltAllowWASD && keysPressed.current["a"])) tiltAngle = -0.15;
      if ((tiltAllowArrows && keysPressed.current["ArrowRight"]) || (tiltAllowWASD && keysPressed.current["d"])) tiltAngle = 0.15;
      
      if (joystickActive) {
        tiltAngle = Math.sign(joystickOffset.x) * Math.min(Math.abs(joystickOffset.x) * 0.004, 0.18);
      }
      ctx.rotate(tiltAngle);

      // Load selected customization palette
      const shipColor = shipColorRef.current;
      let strokeCol = "#22d3ee";
      let shadowCol = "#06b6d4";
      let fillCol = "rgba(6, 182, 212, 0.18)";
      let coreCol = "#a855f7";

      if (shipColor === "green") {
        strokeCol = "#4ade80";
        shadowCol = "#22c55e";
        fillCol = "rgba(34, 197, 94, 0.18)";
        coreCol = "#facc15";
      } else if (shipColor === "red") {
        strokeCol = "#f87171";
        shadowCol = "#ef4444";
        fillCol = "rgba(239, 68, 68, 0.18)";
        coreCol = "#22d3ee";
      } else if (shipColor === "gold") {
        strokeCol = "#fbbf24";
        shadowCol = "#f59e0b";
        fillCol = "rgba(245, 158, 11, 0.18)";
        coreCol = "#f43f5e";
      } else if (shipColor === "violet") {
        strokeCol = "#c084fc";
        shadowCol = "#a855f7";
        fillCol = "rgba(168, 85, 247, 0.18)";
        coreCol = "#38bdf8";
      }

      // Draw vector player hull
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 3;
      ctx.shadowColor = shadowCol;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(0, -player.height / 2); // top nose tip
      ctx.lineTo(player.width / 2, player.height / 2); // bottom right wing
      ctx.lineTo(player.width / 4, player.height / 3); // base connector right
      ctx.lineTo(-player.width / 4, player.height / 3); // base connector left
      ctx.lineTo(-player.width / 2, player.height / 2); // bottom left wing
      ctx.closePath();
      ctx.stroke();

      // Half transparent neon body fill
      ctx.fillStyle = fillCol;
      ctx.fill();

      // Inner neon engine core
      ctx.strokeStyle = coreCol;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -player.height / 4);
      ctx.lineTo(player.width / 6, player.height / 4);
      ctx.lineTo(-player.width / 6, player.height / 4);
      ctx.closePath();
      ctx.stroke();

      // Draw Force Field shield dome if active!
      if (player.shield && player.shieldHp > 0) {
        ctx.strokeStyle = "#e879f9";
        ctx.shadowColor = "#e879f9";
        ctx.shadowBlur = 15 + Math.sin(Date.now() * 0.01) * 4;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.width * 0.82, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(232, 121, 249, 0.08)";
        ctx.fill();
      }

      ctx.restore();
    }

    // 9. PAINT SCORE POPUPS INFO OUT
    popupsRef.current.forEach((pop) => {
      ctx.save();
      ctx.globalAlpha = pop.life;
      ctx.fillStyle = pop.color;
      ctx.font = "bold 10px 'Press Start 2P', system-ui";
      ctx.textAlign = "center";
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });

    // PAINT TUTORIAL NAVPOINT TARGETS
    if (gameState === "tutorial" && tutorialTargetPosRef.current) {
      const pos = tutorialTargetPosRef.current;
      const pulseRadius = 38 + Math.sin(Date.now() * 0.01) * 6;
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#10b981"; // emerald navpoint color
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 12;
      
      // Outer rotating hexagon
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(Date.now() * 0.0015);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        ctx.lineTo(Math.cos(angle) * (pulseRadius - 3), Math.sin(angle) * (pulseRadius - 3));
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Inner pulsing circle zone
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Half transparent fill
      ctx.fillStyle = "rgba(16, 185, 129, 0.05)";
      ctx.fill();

      // Text label "NAV ALFA" or "NAV BETA"
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 9px 'Press Start 2P', system-ui";
      ctx.textAlign = "center";
      const lbl = tutorialStepRef.current === 0 ? "NAVPOINT ALFA" : "NAVPOINT BETA";
      ctx.fillText(lbl, pos.x, pos.y - pulseRadius - 10);
      ctx.fillText("ALIGN HERE", pos.x, pos.y + 4);
      
      ctx.restore();
    }

    // 10. HYPERSPACE INTRO START FLASH SCREEN
    if (flashOverlayRef.current > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOverlayRef.current})`;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
    }

    ctx.restore(); // restore viewport shake translation
  };

  // Trigger Warp space Hyperspace to gameplay transition
  const handleStartWarpIn = () => {
    onGameStarted(); // transition callback to parent
    sound.playPowerup();
    
    // Sweep warping hyperspace stars
    flashOverlayRef.current = 1.0; // Flash active is absolute white fading down
    shakeScreen(15);
  };

  // Joystick mobile drags
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const rawX = touch.clientX - rect.left;
    const rawY = touch.clientY - rect.top;

    // Set joystick starting point exactly on dynamic thumb coordinates
    const vX = (rawX / rect.width) * V_WIDTH;
    const vY = (rawY / rect.height) * V_HEIGHT;

    // Only map on lower-half thumb interaction
    if (vY > V_HEIGHT / 2) {
      touchStartPos.current = { x: vX, y: vY };
      setJoystickActive(true);
      setJoystickPos({ x: vX, y: vY });
      setJoystickOffset({ x: 0, y: 0 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickActive || !touchStartPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const rawX = touch.clientX - rect.left;
    const rawY = touch.clientY - rect.top;

    const vX = (rawX / rect.width) * V_WIDTH;
    const vY = (rawY / rect.height) * V_HEIGHT;

    const dx = vX - touchStartPos.current.x;
    const dy = vY - touchStartPos.current.y;

    const dist = Math.hypot(dx, dy);
    const maxLimit = 50; // visual and physics capping max drift range

    if (dist <= maxLimit) {
      setJoystickOffset({ x: dx, y: dy });
    } else {
      const angle = Math.atan2(dy, dx);
      setJoystickOffset({
        x: Math.cos(angle) * maxLimit,
        y: Math.sin(angle) * maxLimit,
      });
    }
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    setJoystickOffset({ x: 0, y: 0 });
    touchStartPos.current = null;
  };

  // Trigger warp from menu
  useEffect(() => {
    if (gameState === "transitioning") {
      const timer = setTimeout(() => {
        handleStartWarpIn();
      }, 1000); // 1.0s warp tracking
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden border-b md:border-b-0"
    >
      {/* Background Deep Space Bezel styling on wider viewports */}
      <div className="absolute inset-y-0 left-0 bg-slate-900 border-r border-cyan-800/20 z-10 hidden lg:block" style={{ width: `calc((100% - ${V_WIDTH * scale}px) / 2)` }}>
        <div className="h-full w-full opacity-10 bg-radial-gradient from-transparent to-slate-950 flex flex-col justify-center items-center font-retro text-[8px] text-cyan-500 origin-center -rotate-90">
          <span>COIN CHUTE ONLINE • FLIGHT ENGAGED</span>
        </div>
      </div>
      
      <div className="absolute inset-y-0 right-0 bg-slate-900 border-l border-cyan-800/20 z-10 hidden lg:block" style={{ width: `calc((100% - ${V_WIDTH * scale}px) / 2)` }}>
        <div className="h-full w-full opacity-10 bg-radial-gradient from-transparent to-slate-950 flex flex-col justify-center items-center font-retro text-[8px] text-purple-500 origin-center rotate-90">
          <span>SPACE WARZ CAB-PRO-9000 • PATENTS 2026</span>
        </div>
      </div>

      {/* RENDER CANVAS CONTAINER */}
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="block bg-slate-950 shadow-[0_0_50px_rgba(139,92,246,0.15)] relative z-20 cursor-crosshair"
      />

      {/* PLAYING HUB SCREEN HUD PANEL IN-GAME (TOP / BOTTOM OVERLAYS) */}
      {(gameState === "playing" || gameState === "tutorial") && (
        <div
          className="absolute pointer-events-none z-30 font-retro"
          style={{
            width: `${V_WIDTH * scale}px`,
            height: `${V_HEIGHT * scale}px`,
          }}
        >
          {/* TOP CONSOLIDATED RETRO HUD OVERLAY */}
          <div className="absolute top-[3%] left-[4%] right-[4%] flex justify-between items-start select-none">
            {/* SCORE & HEALTH STATUS GROUP (Left side) */}
            <div className="flex flex-col gap-1.5 w-[38%] pointer-events-none">
              {/* SCORE Card */}
              <div className="bg-[#050510]/95 border-l-4 border-cyan-500 border-y border-r border-cyan-500/30 px-3 py-1 bg-gradient-to-r from-slate-950/40 via-cyan-950/20 to-transparent rounded-r-md flex flex-col gap-0.5 shadow-[0_0_15px_rgba(34,211,238,0.12)]">
                <span className="text-[6.5px] text-cyan-400 font-retro tracking-widest leading-none">SCORE</span>
                <span className="text-sm font-bold text-slate-100 font-mono tracking-widest leading-none glow-cyan">
                  {hudScore.toLocaleString()}
                </span>
              </div>
              
              {/* HEALTH BAR (Moved to top-left for maximum play area clarity) */}
              <div className="bg-[#050510]/95 border-l-4 border-emerald-500 border-y border-r border-emerald-500/30 px-3 py-1.5 bg-gradient-to-r from-slate-950/40 via-emerald-950/20 to-transparent rounded-r-md flex flex-col gap-1 shadow-[0_0_15px_rgba(74,222,128,0.12)]">
                <div className="flex justify-between items-center text-[6px] md:text-[6.5px] text-slate-400 leading-none">
                  <span className="flex items-center gap-1 font-retro tracking-wide truncate">
                    <Heart className="w-1.5 h-1.5 md:w-2 md:h-2 text-emerald-400 fill-emerald-400 animate-pulse" />
                    HULL STATUS
                  </span>
                  <span className="font-mono font-bold text-emerald-400 glow-green text-[8.5px] md:text-[9.5px]">{hudHealth}%</span>
                </div>
                <div className="h-1.5 bg-slate-950 border border-slate-800 rounded p-[1px] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-150 rounded glow-green"
                    style={{ width: `${hudHealth}%` }}
                  />
                </div>
              </div>
            </div>

            {/* TUTORIAL EXCLUSIVE ASSISTANCE PANEL */}
            {gameState === "tutorial" && (
              <button
                onClick={() => {
                  sound.playClick();
                  setShowTutorialPopup(true);
                  tutorialPopupTimerRef.current = 6500; // keep visible for 6.5s
                }}
                className="bg-slate-950/95 hover:bg-slate-900 border border-emerald-500 hover:border-emerald-400 px-3 py-1.5 rounded font-retro text-[8px] text-emerald-400 tracking-wider flex items-center gap-1.5 pointer-events-auto shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer animate-pulse grow-0 mt-1"
                id="btn-tutorial-help-puck"
              >
                <GraduationCap className="w-3 md:w-3.5 h-3 md:h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">HELP INTEL</span>
                <span className="sm:hidden">HELP</span>
              </button>
            )}

            {/* CENTER SECTOR BADGE */}
            <div className="flex flex-col items-center justify-center mt-1 grow select-none">
              <div 
                className="bg-[#050510]/95 border-t border-x border-cyan-400/80 border-b-2 border-cyan-500 px-2 md:px-3 py-1 bg-gradient-to-b from-slate-950/40 via-cyan-950/25 to-slate-950/40 rounded flex flex-col items-center gap-0.5 shadow-[0_0_15px_rgba(6,182,212,0.22)]"
                id="hud-level-badge"
              >
                <span className="text-[5px] md:text-[6px] text-cyan-400 font-retro tracking-widest leading-none">SECTOR</span>
                <span className="text-xs md:text-sm font-bold text-slate-100 font-retro leading-none glow-cyan mt-0.5">
                  0{hudLevel}
                </span>
              </div>
            </div>

            {/* HIGH SCORE & WEAPON LOADOUT GROUP (Right side) */}
            <div className="flex flex-col gap-1.5 w-[38%] items-end pointer-events-none">
              {/* HIGH SCORE Card */}
              <div className="bg-[#050510]/95 border-r-4 border-fuchsia-500 border-y border-l border-fuchsia-500/30 px-3 py-1 bg-gradient-to-l from-slate-950/40 via-fuchsia-950/20 to-transparent rounded-l-md flex flex-col gap-0.5 items-end shadow-[0_0_15px_rgba(217,70,239,0.12)] w-full">
                <span className="text-[6.5px] text-fuchsia-400 font-retro tracking-widest leading-none">HIGH SCORE</span>
                <span className="text-sm font-bold text-fuchsia-200 font-mono tracking-widest leading-none glow-fuchsia">
                  {hudHighScore.toLocaleString()}
                </span>
              </div>

              {/* CURRENT WEAPON STATUS (Moved to top-right) */}
              <div className="bg-[#050510]/95 border-r-4 border-amber-500 border-y border-l border-amber-500/30 px-3 py-1.5 bg-gradient-to-l from-slate-950/40 via-amber-950/20 to-transparent rounded-l-md flex flex-col gap-0.5 items-end shadow-[0_0_15px_rgba(245,158,11,0.12)] w-full">
                <div className="flex items-center gap-1 leading-none">
                  <Zap className="w-1.5 h-1.5 md:w-2 md:h-2 text-amber-400 fill-amber-400" />
                  <span className="text-[6px] text-amber-400 tracking-wider font-retro">WEAPON</span>
                </div>
                <span className="text-[7.5px] md:text-[8px] font-bold text-amber-300 tracking-widest uppercase font-retro truncate max-w-full glow-orange">
                  {hudWeapon}
                </span>
                
                {/* Optional Shield status indicators */}
                {hudShield > 0 && (
                  <span className="text-[5.5px] text-fuchsia-400 font-mono font-bold tracking-wider leading-none mt-0.5">
                    SHIELD: {hudShield}/3
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BOSS ACTIVE BATTLE HEALTH BAR */}
          {hudBossActive && (
            <div
              className="absolute top-[13%] left-1/2 -translate-x-1/2 bg-[#050510]/95 border border-red-500 p-2 rounded-md flex flex-col gap-1 text-center backdrop-blur-md shadow-[0_0_25px_rgba(239,68,68,0.3)] z-[45] pointer-events-auto"
              style={{
                width: `${V_WIDTH * scale * 0.76}px`,
              }}
              id="boss-health-card"
            >
              <div className="flex justify-between items-center text-[6px] sm:text-[7.5px] font-retro text-red-400 leading-none pb-0.5 border-b border-red-500/20">
                <span className="tracking-widest animate-pulse flex items-center gap-1">
                  🚨 COGNITIVE BOSS ALERT
                </span>
                <span className="tracking-wider uppercase font-bold text-red-500 glow-red">
                  {hudBossName}
                </span>
                <span className="font-mono tracking-widest text-slate-200">
                  HP: {hudBossHp}/{hudBossMaxHp}
                </span>
              </div>
              
              <div className="h-1.5 bg-slate-950 border border-slate-900 rounded p-[1px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-400 transition-all duration-150 rounded"
                  style={{ width: `${Math.max(0, Math.min(100, (hudBossHp / hudBossMaxHp) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* GAME SECTOR PROGRESSIVE HAZARD ANNOUNCEMENTS */}
          {levelAnnounceMsg && (
            <div
              className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center select-none z-[45] flex flex-col items-center gap-2 px-5 py-3.5 bg-slate-950/85 max-w-[85%] border-y-2 border-cyan-500/35 shadow-[inset_0_0_20px_rgba(6,182,212,0.18)] backdrop-blur-xs rounded"
              style={{
                width: `${V_WIDTH * scale * 0.85}px`,
              }}
              id="level-hazard-card"
            >
              <h2 className="font-retro text-[12px] sm:text-[14px] tracking-[0.2em] text-cyan-400 uppercase font-extrabold leading-tight glow-cyan mb-0.5">
                {levelAnnounceMsg}
              </h2>
              {levelAnnounceSub && (
                <p className="font-retro text-[7px] sm:text-[8px] text-slate-300 uppercase tracking-widest leading-relaxed">
                  {levelAnnounceSub}
                </p>
              )}
            </div>
          )}

          {/* Touch visualizer nodes (Rendered overlay dynamically when joystick active) */}
          {joystickActive && (
            <div
              className="absolute z-40 rounded-full border border-cyan-400/30 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center pointer-events-none"
              style={{
                left: `${joystickPos.x * scale - 40}px`,
                top: `${joystickPos.y * scale - 40}px`,
                width: "80px",
                height: "80px",
              }}
            >
              {/* Center thumb stick */}
              <div
                className="absolute rounded-full bg-cyan-400/80 w-8 h-8 flex items-center justify-center"
                style={{
                  transform: `translate(${joystickOffset.x * scale}px, ${joystickOffset.y * scale}px)`,
                  boxShadow: "0 0 10px rgba(6, 182, 212, 0.8)",
                }}
              />
            </div>
          )}

          {/* FLOATING SONIC BOOM HUD WEAPON MODULE */}
          {gameState === "playing" && (
            <div 
              className="absolute bottom-6 right-6 pointer-events-auto z-[40]"
              id="sonic-boom-overlay"
            >
              <button
                onClick={() => {
                  if (hudSonicBoomCooldown === 0) {
                    triggerSonicBoom();
                  } else {
                    sound.playHit();
                  }
                }}
                disabled={hudSonicBoomCooldown > 0}
                className={`w-14 h-14 rounded-full border-2 flex flex-col justify-center items-center gap-0.5 shadow-lg backdrop-blur-md cursor-pointer select-none transition-all duration-200 active:scale-95 ${
                  hudSonicBoomCooldown === 0 
                  ? "bg-cyan-950/90 hover:bg-cyan-900/90 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.45)] animate-pulse" 
                  : "bg-slate-950/95 border-slate-800 text-slate-500 cursor-not-allowed"
                }`}
                title="Sonic Boom [Shift+Space] - Instantly Clears Enemy Armada"
              >
                <Zap className={`w-5 h-5 ${hudSonicBoomCooldown === 0 ? "text-cyan-400" : "text-slate-600"}`} />
                <span className="text-[5px] font-retro tracking-tighter leading-none">
                  {hudSonicBoomCooldown === 0 ? "BOOM" : `${hudSonicBoomCooldown}s`}
                </span>
              </button>
              {/* Desktop hint text overlay */}
              <div className="absolute right-0 top-full mt-1.5 text-center w-28 -translate-x-[25%] opacity-70 hidden sm:block pointer-events-none">
                <span className="text-[5.5px] text-slate-400 font-retro leading-none whitespace-nowrap bg-slate-950/70 py-0.5 px-1 rounded border border-slate-900">
                  SHIFT + SPACE
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLIGHT ACADEMY TUTORIAL DIALOG CARD */}
      {gameState === "tutorial" && showTutorialPopup && (
        <div
          className="absolute top-[22%] left-1/2 -translate-x-1/2 bg-slate-950/95 border-2 border-emerald-500 hover:border-emerald-400 p-4 rounded-lg flex flex-col items-center gap-2 text-center pointer-events-auto backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.25)] select-none animate-fade-in z-50 max-w-[85%]"
          style={{
            width: `${V_WIDTH * scale * 0.85}px`,
          }}
          id="tutorial-dialog-card"
        >
          <div className="flex items-center gap-2 border-b border-emerald-500/30 pb-2 w-full justify-center">
            <GraduationCap className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="font-retro text-[9px] md:text-[10px] tracking-widest text-emerald-400 uppercase">
              FLIGHT ACADEMY PROTOCOL
            </span>
          </div>
          <p className="text-[10px] md:text-[11px] text-slate-100 font-mono tracking-tight leading-normal uppercase my-1">
            {tutorialMessage}
          </p>
          {tutorialSubMessage && (
            <p className="text-[8px] md:text-[9px] text-emerald-400 font-retro leading-relaxed uppercase animate-pulse">
              {tutorialSubMessage}
            </p>
          )}
          
          <div className="mt-3 flex gap-2 w-full justify-center">
            <button
              onClick={() => {
                sound.playClick();
                setShowTutorialPopup(false);
              }}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/45 hover:border-emerald-400 text-emerald-400 font-retro text-[7px] tracking-wider rounded transition-all cursor-pointer uppercase shadow"
              id="btn-dismiss-intel"
            >
              DISMISS INTEL (X)
            </button>
            <button
              onClick={() => {
                sound.playClick();
                handleStartWarpIn();
              }}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-emerald-400 hover:text-emerald-300 text-[7px] text-slate-400 font-retro rounded transition-all cursor-pointer uppercase tracking-wider shadow"
              id="btn-skip-tutorial"
            >
              SKIP TRAINING »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default GameCanvas;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum WeaponType {
  Laser = "LASER BLASTER",
  Double = "DOUBLE SHOT",
  Triple = "TRIPLE SHOT",
  Plasma = "PLASMA CANNON",
  Rapid = "RAPID FIRE"
}

export type GameState = "welcome" | "transitioning" | "playing" | "gameover" | "tutorial";

export type EnemyType = "scout" | "fighter" | "destroyer" | "kamikaze";

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  score: number;
  speed: number;
  weapon: WeaponType;
  weaponTimer: number; // For timed powerups (in milliseconds/frames or seconds)
  shield: boolean;     // Optional visual shield
  shieldHp: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speedX: number;
  speedY: number;
  shootCooldown: number;
  scoreValue: number;
  angle?: number; // for wave movement or kamikaze rotations
  pulse?: number; // visual effect pulse
  isBoss?: boolean; // is it a level boss?
  bossName?: string; // unique boss name
  bossPhase?: number; // current combat action phase
  color?: string; // custom enemy color
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speedX: number;
  speedY: number;
  color: string;
  damage: number;
  fromPlayer: boolean;
  isPlasma?: boolean;
  size?: number; // for plasma radius
}

export interface PowerUp {
  id: string;
  type: WeaponType | "HEAL" | "SHIELD";
  x: number;
  y: number;
  width: number;
  height: number;
  speedY: number;
  color: string;
  pulse: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  decay: number;
  glow?: boolean;
}

export interface GameStar {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
}

export interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface ScorePopup {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // 0 to 1 scaling
}

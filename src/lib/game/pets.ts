// ============================================
// 灵宠系统：捕获 / 成长 / 出战加成
// ============================================

import { PetInstance } from '@/types/game';
import { MONSTER_MAP } from './monsters';
import { xpToNext } from './skills';
import { genUid } from './items';

export const MAX_PET_LEVEL = 200;
export const MAX_PETS = 12; // 灵宠栏上限
export const MAX_PET_STAGE = 3; // 进化阶段上限
export const MAX_PET_STARS = 5; // 融合星级上限

// 进化阶段定义：名称前缀与属性倍率
export const PET_STAGES: { prefix: string; name: string; desc: string; mult: number }[] = [
  { prefix: '', name: '凡兽', desc: '初通灵性的妖兽幼体', mult: 1 },
  { prefix: '灵·', name: '灵兽', desc: '褪凡脱骨，灵性大开', mult: 1.6 },
  { prefix: '仙·', name: '仙兽', desc: '沾得仙气，腾云驾雾', mult: 2.3 },
  { prefix: '神·', name: '神兽', desc: '血脉返祖，威压如渊', mult: 3.2 },
];

// 进化需求：每阶段需宠物等级 + 金币 + 妖丹（stage 从 0→1，1→2，2→3）
// 数值平衡 v2：金币 = (基础 + 阶位×系数) × 阶段指数，低阶妖兽不再白给、高阶略有回落；
// 妖丹按妖兽阶位缩放（tier 50 时 ×2），高血脉进化更贵重
export function petEvolveReq(pet: PetInstance): { level: number; gold: number; core: number; gems: number } {
  const m = MONSTER_MAP[pet.monsterId];
  const tier = Math.max(1, m.tier);
  const nextStage = pet.stage + 1;
  return {
    level: [30, 60, 100][pet.stage] ?? 999,
    gold: Math.round((1500 + tier * 900) * Math.pow(2.5, pet.stage)),
    core: Math.max(1, Math.round(([3, 8, 15][pet.stage] ?? 999) * (1 + tier / 50))),
    gems: nextStage >= 3 ? 25 : 0,
  };
}

export function canEvolve(pet: PetInstance): boolean {
  return pet.stage < MAX_PET_STAGE;
}

// 融合：吞噬同族妖兽，星级 +1，每星 +6% 全属性
export const STAR_BONUS_PER = 0.06;

export function makePet(monsterId: string): PetInstance {
  return { uid: genUid(), monsterId, level: 1, xp: 0, capturedAt: Date.now(), stage: 0, stars: 0 };
}

// 宠物自身战斗属性（随等级、进化阶段、融合星级成长）
export function petStats(pet: PetInstance) {
  const m = MONSTER_MAP[pet.monsterId];
  const lv = pet.level;
  const stageMult = PET_STAGES[pet.stage]?.mult ?? 1;
  const starMult = 1 + pet.stars * STAR_BONUS_PER;
  const mult = stageMult * starMult;
  return {
    atk: Math.round(m.atk * (1 + lv * 0.05) * mult),
    def: Math.round(m.def * (1 + lv * 0.04) * mult),
    hp: Math.round(m.hp * (1 + lv * 0.08) * mult),
  };
}

// 灵宠显示名（含进化前缀）
export function petDisplayName(pet: PetInstance): string {
  const m = MONSTER_MAP[pet.monsterId];
  return `${PET_STAGES[pet.stage]?.prefix ?? ''}${m.name}`;
}

// 出战宠物给玩家的属性加成（随宠物等级与本体强度成长）
export function petBonus(pet: PetInstance | null): { atk: number; def: number; hp: number } {
  if (!pet) return { atk: 0, def: 0, hp: 0 };
  const s = petStats(pet);
  return {
    atk: Math.round(s.atk * 0.3),
    def: Math.round(s.def * 0.3),
    hp: Math.round(s.hp * 0.4),
  };
}

// 灵宠经验曲线：基础曲线 × 1.5（宠物升级略慢于战斗技能）
export function petXpToNext(level: number): number {
  return Math.round(xpToNext(level) * 1.5);
}

// 给宠物加经验（返回新实例；不修改原对象）
export function grantPetXp(pet: PetInstance, amount: number): {
  pet: PetInstance; levelsGained: number;
} {
  if (pet.level >= MAX_PET_LEVEL) return { pet, levelsGained: 0 };
  let xp = pet.xp + Math.max(1, Math.round(amount));
  let level = pet.level;
  let guard = 0;
  while (level < MAX_PET_LEVEL && xp >= petXpToNext(level) && guard < 500) {
    xp -= petXpToNext(level);
    level += 1;
    guard++;
  }
  if (level >= MAX_PET_LEVEL) xp = 0;
  return { pet: { ...pet, level, xp }, levelsGained: level - pet.level };
}

// 放生收益（金币；进化/星级越高越值钱）
export function releaseGold(pet: PetInstance): number {
  const m = MONSTER_MAP[pet.monsterId];
  const stageBonus = [1, 2.2, 5, 12][pet.stage] ?? 1;
  const starBonus = 1 + pet.stars * 0.5;
  return Math.round((m.tier * 600 + pet.level * 120) * stageBonus * starBonus);
}

// 兼容旧存档：补齐 stage / stars 字段，并夹紧越界数值（防损坏/篡改造档属性爆炸）
export function normalizePet(p: PetInstance): PetInstance {
  const level = Math.min(MAX_PET_LEVEL, Math.max(1, Math.floor(p.level ?? 1) || 1));
  return {
    ...p,
    level,
    xp: level >= MAX_PET_LEVEL ? 0 : Math.max(0, Math.floor(p.xp ?? 0) || 0),
    stage: Math.min(MAX_PET_STAGE, Math.max(0, Math.floor(p.stage ?? 0) || 0)),
    stars: Math.min(MAX_PET_STARS, Math.max(0, Math.floor(p.stars ?? 0) || 0)),
  };
}

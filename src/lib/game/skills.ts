// ============================================
// 技能、活动、称号、经验曲线
// 对标 Harpagia 的 16 技能体系（修仙化映射）
// ============================================

import { SkillDef, SkillId, ActivityDef, ActivityId, MAX_SKILL_LEVEL } from '@/types/game';

// ---------- 经验曲线 ----------
// 升到 L+1 级所需经验：15 × L^2.5
export function xpToNext(level: number): number {
  return Math.round(15 * Math.pow(level, 2.5));
}

// 综合战斗等级（5 项战斗技能之和）
export function combatLevelSum(skills: Record<SkillId, { level: number }>): number {
  return (['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[])
    .reduce((sum, id) => sum + (skills[id]?.level ?? 0), 0);
}

// 全技能总等级
export function totalSkillLevel(skills: Record<SkillId, { level: number }>): number {
  return (Object.keys(skills) as SkillId[])
    .reduce((sum, id) => sum + (skills[id]?.level ?? 0), 0);
}

// ---------- 境界称号（由战斗技能总等级决定，纯荣誉） ----------
export const TITLES: { min: number; name: string }[] = [
  { min: 0, name: '凡人' },
  { min: 15, name: '练气' },
  { min: 40, name: '筑基' },
  { min: 80, name: '金丹' },
  { min: 140, name: '元婴' },
  { min: 220, name: '化神' },
  { min: 320, name: '炼虚' },
  { min: 440, name: '合体' },
  { min: 580, name: '大乘' },
  { min: 750, name: '渡劫' },
  { min: 950, name: '散仙' },
  { min: 1250, name: '真仙' },
  { min: 1650, name: '金仙' },
  { min: 2100, name: '大罗' },
  { min: 2600, name: '道祖' },
];

export function getTitle(combatSum: number): string {
  let title = TITLES[0].name;
  for (const t of TITLES) {
    if (combatSum >= t.min) title = t.name;
  }
  return title;
}

// ---------- 16 项技能定义 ----------
export const SKILLS: SkillDef[] = [
  // ===== 战斗系：通过战斗训练 =====
  {
    id: 'hp', name: '气血', icon: '❤️', category: 'combat',
    description: '修炼肉身气血，提升生命上限。',
    img: '/scenes/skill-hp.png',
    xpPerTick: 0, effectKey: 'hp',
  },
  {
    id: 'power', name: '神力', icon: '💪', category: 'combat',
    description: '淬炼法力神通，提升基础攻击。',
    img: '/scenes/skill-power.png',
    xpPerTick: 0, effectKey: 'power',
  },
  {
    id: 'weaponry', name: '神兵', icon: '⚔️', category: 'combat',
    description: '精研兵器之道，提升武器伤害。',
    img: '/scenes/skill-weaponry.png',
    xpPerTick: 0, effectKey: 'weaponry',
  },
  {
    id: 'defence', name: '御体', icon: '🛡️', category: 'combat',
    description: '锤炼护体罡气，提升防御。',
    img: '/scenes/skill-defence.png',
    xpPerTick: 0, effectKey: 'defence',
  },
  {
    id: 'speed', name: '遁速', icon: '💨', category: 'combat',
    description: '修炼身法遁术，提升速度与闪避。',
    img: '/scenes/skill-speed.png',
    xpPerTick: 0, effectKey: 'speed',
  },
  // ===== 采集系：挂机活动 =====
  {
    id: 'mining', name: '采矿', icon: '⛏️', category: 'gather',
    description: '开采灵矿，产出锻造所需的矿石。等级越高，采得越高级的矿石。',
    img: '/scenes/act-mining.jpg',
    xpPerTick: 20, activityId: 'mining', effectKey: 'mining',
  },
  {
    id: 'fishing', name: '垂钓', icon: '🎣', category: 'gather',
    description: '静心垂钓灵鱼。灵鱼是炼丹的重要辅材。',
    img: '/scenes/act-fishing.jpg',
    xpPerTick: 20, activityId: 'fishing', effectKey: 'fishing',
  },
  {
    id: 'begging', name: '化缘', icon: '🙏', category: 'gather',
    description: '沿门托钵化缘，稳定获取金币。',
    img: '/scenes/act-begging.jpg',
    xpPerTick: 18, activityId: 'begging', effectKey: 'begging',
  },
  {
    id: 'archaeology', name: '寻宝', icon: '🏺', category: 'gather',
    description: '探秘上古遗迹，寻找宝物与装备。提升装备掉落率。',
    img: '/scenes/act-archaeology.jpg',
    xpPerTick: 22, activityId: 'archaeology', effectKey: 'archaeology',
  },
  // ===== 生产系 =====
  {
    id: 'cooking', name: '炼丹', icon: '🧪', category: 'craft',
    description: '以药材炼制丹药：回春散、狂暴丹、铁骨丹。',
    img: '/scenes/act-cooking.jpg',
    xpPerTick: 0, effectKey: 'cooking',
  },
  {
    id: 'forging', name: '锻造', icon: '🔨', category: 'craft',
    description: '熔炼矿石锻造装备，等级越高装备品质越好。',
    img: '/scenes/act-forging.jpg',
    xpPerTick: 0, effectKey: 'forging',
  },
  // ===== 支援系 =====
  {
    id: 'intellect', name: '悟道', icon: '📖', category: 'support',
    description: '参悟天道。每级 +1% 全部经验获取。',
    img: '/scenes/act-intellect.jpg',
    xpPerTick: 0, effectKey: 'intellect',
  },
  {
    id: 'focus', name: '定力', icon: '🧘', category: 'support',
    description: '禅定入微。每级 +0.2% 离线效率与 6 分钟离线上限。',
    img: '/scenes/act-focus.jpg',
    xpPerTick: 0, effectKey: 'focus',
  },
  {
    id: 'luck', name: '气运', icon: '🍀', category: 'support',
    description: '气运加身。每级 +0.5% 掉落率。',
    img: '/scenes/act-luck.jpg',
    xpPerTick: 0, effectKey: 'luck',
  },
  {
    id: 'imbibing', name: '灵酒', icon: '🍶', category: 'support',
    description: '以灵酒淬体。每级 +1% 丹药效果。',
    img: '/scenes/act-imbibing.jpg',
    xpPerTick: 0, effectKey: 'imbibing',
  },
  {
    id: 'insight', name: '灵识', icon: '👁️', category: 'support',
    description: '神识敏锐。每级 +0.15% 暴击率。',
    img: '/scenes/act-insight.jpg',
    xpPerTick: 0, effectKey: 'insight',
  },
];

export const SKILL_MAP: Record<string, SkillDef> = Object.fromEntries(
  SKILLS.map(s => [s.id, s])
);

// ---------- 挂机活动（每个非战斗技能均有对应训练活动；同一时间进行一个） ----------
export const ACTIVITIES: ActivityDef[] = [
  // ===== 采集产出型 =====
  {
    id: 'mining', name: '灵山采矿', icon: '⛏️', skillId: 'mining',
    description: '在灵山矿脉开采矿石，矿石用于锻造装备。等级越高，采得越高级的矿石。',
    intervalSec: 30,
    reward: { itemId: 'ore_dynamic', itemQty: 1 },
    skillXp: 20, minSkillLevel: 1,
  },
  {
    id: 'fishing', name: '灵潭垂钓', icon: '🎣', skillId: 'fishing',
    description: '在灵潭垂钓，钓获灵鱼可出售换金。',
    intervalSec: 25,
    reward: { itemId: 'fish_dynamic', itemQty: 1 },
    skillXp: 20, minSkillLevel: 1,
  },
  {
    id: 'begging', name: '下山化缘', icon: '🙏', skillId: 'begging',
    description: '托钵化缘，广结善缘，稳定获得金币。',
    intervalSec: 20,
    reward: { gold: 25 },
    skillXp: 18, minSkillLevel: 1,
  },
  {
    id: 'archaeology', name: '遗迹寻宝', icon: '🏺', skillId: 'archaeology',
    description: '探索上古遗迹，获得宝物与金币，偶尔有惊喜。',
    intervalSec: 60,
    reward: { itemId: 'treasure_dynamic', itemQty: 1, gemChance: 0.04 },
    skillXp: 30, minSkillLevel: 1,
  },
  // ===== 生产演习型 =====
  {
    id: 'cooking', name: '研习丹方', icon: '🧪', skillId: 'cooking',
    description: '研读丹方药理，提升炼丹造诣。实际炼丹可获得更多经验。',
    intervalSec: 12,
    reward: {},
    skillXp: 8, minSkillLevel: 1,
  },
  {
    id: 'forging', name: '锻造演习', icon: '🔨', skillId: 'forging',
    description: '反复锤炼凡铁，提升锻造手感。实际锻造可获得更多经验。',
    intervalSec: 12,
    reward: {},
    skillXp: 8, minSkillLevel: 1,
  },
  // ===== 支援修行型 =====
  {
    id: 'intellect', name: '参悟道经', icon: '📖', skillId: 'intellect',
    description: '静室参悟上古道经，明悟天地至理。',
    intervalSec: 12,
    reward: {},
    skillXp: 8, minSkillLevel: 1,
  },
  {
    id: 'focus', name: '打坐凝神', icon: '🧘', skillId: 'focus',
    description: '禅定凝神，锤炼心性，离线修行更加高效。',
    intervalSec: 12,
    reward: {},
    skillXp: 8, minSkillLevel: 1,
  },
  {
    id: 'luck', name: '祈福气运', icon: '🍀', skillId: 'luck',
    description: '在道观上香祈福，气运悄然增长。',
    intervalSec: 12,
    reward: {},
    skillXp: 8, minSkillLevel: 1,
  },
  {
    id: 'imbibing', name: '灵酒淬体', icon: '🍶', skillId: 'imbibing',
    description: '小酌灵酒淬炼体魄，丹药之力更易吸收。',
    intervalSec: 12,
    reward: {},
    skillXp: 8, minSkillLevel: 1,
  },
  {
    id: 'insight', name: '夜观星象', icon: '👁️', skillId: 'insight',
    description: '夜观天象，神识愈发敏锐。',
    intervalSec: 12,
    reward: {},
    skillXp: 8, minSkillLevel: 1,
  },
];

export const ACTIVITY_MAP: Record<string, ActivityDef> = Object.fromEntries(
  ACTIVITIES.map(a => [a.id, a])
);

// ---------- 悟道/定力等支援效果 ----------
export function xpMultiplier(intellectLevel: number): number {
  return 1 + intellectLevel * 0.01;
}

export function offlineEfficiency(focusLevel: number): number {
  return Math.min(1, 0.6 + focusLevel * 0.002);
}

export function offlineCapSeconds(focusLevel: number): number {
  return 12 * 3600 + focusLevel * 6 * 60;
}

export function dropMultiplier(luckLevel: number): number {
  return 1 + luckLevel * 0.005;
}

export function pillMultiplier(imbibingLevel: number): number {
  return 1 + imbibingLevel * 0.01;
}

export function critBonus(insightLevel: number): number {
  return insightLevel * 0.0015;
}

export function equipDropBonus(archaeologyLevel: number): number {
  return archaeologyLevel * 0.002;
}

// 采矿/垂钓产出阶级：1 + floor(level/25)，上限 8
export function gatherTier(skillLevel: number): number {
  return Math.min(8, 1 + Math.floor(skillLevel / 25));
}

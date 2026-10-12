// ============================================
// 物品、品质、随机词条装备生成
// 对标 Harpagia 的 Randomized gear stats
// ============================================

import { BaseItem, Equipment, EquipSlot, ItemQuality, AffixKey } from '@/types/game';

// ---------- 品质 ----------
export const QUALITY_ORDER: ItemQuality[] = ['common', 'fine', 'rare', 'epic', 'legendary', 'mythic'];

export const QUALITY_NAMES: Record<ItemQuality, string> = {
  common: '凡品', fine: '良品', rare: '上品', epic: '珍品', legendary: '仙品', mythic: '神品',
};

export const QUALITY_COLORS: Record<ItemQuality, string> = {
  common: 'text-stone-400 border-stone-600',
  fine: 'text-emerald-400 border-emerald-700',
  rare: 'text-cyan-300 border-cyan-700',
  epic: 'text-purple-400 border-purple-700',
  legendary: 'text-amber-400 border-amber-600',
  mythic: 'text-rose-400 border-rose-600',
};

export const QUALITY_TEXT: Record<ItemQuality, string> = {
  common: 'text-stone-400',
  fine: 'text-emerald-400',
  rare: 'text-cyan-300',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
  mythic: 'text-rose-400',
};

// 品质属性倍率
export const QUALITY_MULT: Record<ItemQuality, number> = {
  common: 1.0, fine: 1.35, rare: 1.8, epic: 2.5, legendary: 3.6, mythic: 5.2,
};

// 品质卖价倍率
export const QUALITY_PRICE: Record<ItemQuality, number> = {
  common: 1, fine: 2.2, rare: 4.5, epic: 10, legendary: 26, mythic: 70,
};

// 品质掉落权重（会被气运修正）
export const QUALITY_WEIGHTS: { q: ItemQuality; w: number }[] = [
  { q: 'common', w: 520 },
  { q: 'fine', w: 270 },
  { q: 'rare', w: 130 },
  { q: 'epic', w: 55 },
  { q: 'legendary', w: 20 },
  { q: 'mythic', w: 5 },
];

// ---------- 基础物品 ----------
export const BASE_ITEMS: BaseItem[] = [
  // ===== 矿石（采矿 tier 1-8）=====
  { id: 'ore_1', name: '铁矿石', type: 'material', icon: '🪨', description: '最常见的灵矿，可锻造凡品装备。', quality: 'common', sellPrice: 12, tier: 1 },
  { id: 'ore_2', name: '铜矿石', type: 'material', icon: '🪨', description: '泛着铜光的矿石，品质尚可。', quality: 'common', sellPrice: 30, tier: 2 },
  { id: 'ore_3', name: '银矿石', type: 'material', icon: '🪨', description: '银光流转，蕴含微弱灵气。', quality: 'fine', sellPrice: 75, tier: 3 },
  { id: 'ore_4', name: '金矿石', type: 'material', icon: '🪨', description: '金光灿灿的灵矿。', quality: 'fine', sellPrice: 180, tier: 4 },
  { id: 'ore_5', name: '玄铁矿', type: 'material', icon: '🌑', description: '沉重异常，是锻造上品兵器的材料。', quality: 'rare', sellPrice: 420, tier: 5 },
  { id: 'ore_6', name: '寒晶矿', type: 'material', icon: '❄️', description: '终年寒气逼人的晶石。', quality: 'rare', sellPrice: 950, tier: 6 },
  { id: 'ore_7', name: '雷晶石', type: 'material', icon: '⚡', description: '内蕴雷霆之力，偶尔噼啪作响。', quality: 'epic', sellPrice: 2200, tier: 7 },
  { id: 'ore_8', name: '星辰砂', type: 'material', icon: '✨', description: '陨落星辰的碎片，传说可炼仙器。', quality: 'epic', sellPrice: 5000, tier: 8 },

  // ===== 灵鱼（垂钓 tier 1-8）=====
  { id: 'fish_1', name: '灵鲫', type: 'material', icon: '🐟', description: '溪涧中常见的灵鱼。', quality: 'common', sellPrice: 14, tier: 1 },
  { id: 'fish_2', name: '银鳞鲤', type: 'material', icon: '🐟', description: '鳞片银亮，可入药膳。', quality: 'common', sellPrice: 34, tier: 2 },
  { id: 'fish_3', name: '青纹鲈', type: 'material', icon: '🐠', description: '背有青纹，肉身蕴灵。', quality: 'fine', sellPrice: 85, tier: 3 },
  { id: 'fish_4', name: '金目鲈', type: 'material', icon: '🐠', description: '双目如金，夜里发光。', quality: 'fine', sellPrice: 200, tier: 4 },
  { id: 'fish_5', name: '冰海鲟', type: 'material', icon: '🐋', description: '生于寒潭，鱼肉温润。', quality: 'rare', sellPrice: 480, tier: 5 },
  { id: 'fish_6', name: '月光鱼', type: 'material', icon: '🌙', description: '月光下才现身，通体透明。', quality: 'rare', sellPrice: 1100, tier: 6 },
  { id: 'fish_7', name: '雷鳗', type: 'material', icon: '⚡', description: '会放电的凶猛灵鱼。', quality: 'epic', sellPrice: 2500, tier: 7 },
  { id: 'fish_8', name: '龙须鱼', type: 'material', icon: '🐲', description: '须如龙须，传为龙裔。', quality: 'epic', sellPrice: 5800, tier: 8 },

  // ===== 药材（炼丹材料，怪物掉落）=====
  { id: 'herb_1', name: '灵草', type: 'material', icon: '🌿', description: '基础炼丹药材。', quality: 'common', sellPrice: 10, tier: 1 },
  { id: 'herb_2', name: '灵芝', type: 'material', icon: '🍄', description: '百年灵芝，药性温和。', quality: 'fine', sellPrice: 60, tier: 3 },
  { id: 'herb_3', name: '雪莲果', type: 'material', icon: '🌺', description: '生于极寒之地，药力精纯。', quality: 'rare', sellPrice: 300, tier: 5 },
  { id: 'herb_4', name: '紫金参', type: 'material', icon: '🥕', description: '千年紫金参，一株难求。', quality: 'epic', sellPrice: 1500, tier: 7 },

  // ===== 妖兽材料（怪物掉落）=====
  { id: 'pelt_1', name: '兽皮', type: 'material', icon: '🟫', description: '普通妖兽的皮毛。', quality: 'common', sellPrice: 15, tier: 1 },
  { id: 'bone_1', name: '妖骨', type: 'material', icon: '🦴', description: '坚硬的妖兽骸骨。', quality: 'common', sellPrice: 25, tier: 2 },
  { id: 'core_1', name: '妖丹', type: 'material', icon: '🔮', description: '妖兽体内凝结的内丹，炼丹妙药。', quality: 'rare', sellPrice: 120, tier: 3 },

  // ===== 妖王 / 世界 BOSS 专属掉落 =====
  { id: 'r9_abyss_scale', name: '渊主逆鳞', type: 'material', icon: '🐉', description: '归墟之主逆生的玄黑鳞片，刀剑不侵，可售天价奇珍。', quality: 'epic', sellPrice: 6000, tier: 9 },
  { id: 'r10_immortal_shard', name: '仙骸残片', type: 'material', icon: '⚱️', description: '仙帝残影消散后落下的碎屑，贴耳可闻大道之音。', quality: 'legendary', sellPrice: 15000, tier: 10 },
  { id: 'wb_whale_pearl', name: '沧海鲛珠', type: 'material', icon: '💠', description: '归墟鲸祖丹田内孕育万年的定海神珠，宝光可照彻幽海。', quality: 'legendary', sellPrice: 12000, tier: 9 },
  { id: 'wb_emperor_jade', name: '仙帝残玉', type: 'material', icon: '🟡', description: '葬天仙帝崩解后遗留的帝玉，触之仍有浩瀚仙威压体。', quality: 'mythic', sellPrice: 36000, tier: 10 },

  // ===== 丹药 =====
  { id: 'pill_heal_s', name: '回气散', type: 'pill', icon: '💚', description: '恢复少量气血。', quality: 'common', sellPrice: 30, tier: 1, pillEffect: 'heal', pillValue: 80 },
  { id: 'pill_heal_m', name: '回春散', type: 'pill', icon: '💚', description: '恢复中量气血。', quality: 'fine', sellPrice: 150, tier: 4, pillEffect: 'heal', pillValue: 400 },
  { id: 'pill_heal_l', name: '九转还魂丹', type: 'pill', icon: '💗', description: '恢复大量气血。', quality: 'rare', sellPrice: 800, tier: 7, pillEffect: 'heal', pillValue: 1600 },
  { id: 'pill_atk', name: '狂暴丹', type: 'pill', icon: '🔴', description: '10 分钟内攻击提升 30%。', quality: 'rare', sellPrice: 400, tier: 3, pillEffect: 'buffAtk', pillValue: 30 },
  { id: 'pill_def', name: '铁骨丹', type: 'pill', icon: '🔵', description: '10 分钟内防御提升 40%。', quality: 'rare', sellPrice: 400, tier: 3, pillEffect: 'buffDef', pillValue: 40 },
  { id: 'pill_exp', name: '悟道丹', type: 'pill', icon: '🌟', description: '服用后 5 项战斗技能各获得大量经验。', quality: 'epic', sellPrice: 1200, tier: 5, pillEffect: 'exp', pillValue: 600 },
  { id: 'pill_spd', name: '疾风丹', type: 'pill', icon: '💨', description: '10 分钟内速度提升 30%，出手更快闪避更高。', quality: 'rare', sellPrice: 450, tier: 4, pillEffect: 'buffSpd', pillValue: 30 },
  { id: 'pill_gold', name: '聚财丹', type: 'pill', icon: '🪙', description: '10 分钟内金币收益提升 40%。', quality: 'rare', sellPrice: 500, tier: 4, pillEffect: 'buffGold', pillValue: 40 },
  { id: 'pill_luck', name: '幸运丹', type: 'pill', icon: '🍀', description: '10 分钟内气运 +15，掉落更丰厚。', quality: 'epic', sellPrice: 900, tier: 5, pillEffect: 'buffLuck', pillValue: 15 },
  { id: 'pill_cap', name: '捕灵丹', type: 'pill', icon: '🪤', description: '10 分钟内灵宠捕获率 ×1.6，收妖事半功倍。', quality: 'epic', sellPrice: 1000, tier: 5, pillEffect: 'buffCap', pillValue: 160 },
  { id: 'pill_heal_xl', name: '万年雪参膏', type: 'pill', icon: '💖', description: '恢复巨量气血的传说膏方。', quality: 'epic', sellPrice: 2400, tier: 8, pillEffect: 'heal', pillValue: 4500 },

  // ===== 宝藏（寻宝活动）=====
  { id: 'trea_gold', name: '古币', type: 'treasure', icon: '🪙', description: '前朝修士遗留的灵币，可售高价。', quality: 'fine', sellPrice: 200, tier: 1 },
  { id: 'trea_jade', name: '古玉', type: 'treasure', icon: '🟩', description: '温润的古玉，隐有符文流转。', quality: 'rare', sellPrice: 600, tier: 2 },
  { id: 'trea_scroll', name: '残卷', type: 'treasure', icon: '📜', description: '上古功法残卷，研习可增道行。', quality: 'epic', sellPrice: 1500, tier: 3 },
];

export const ITEM_MAP: Record<string, BaseItem> = Object.fromEntries(
  BASE_ITEMS.map(i => [i.id, i])
);

export function getItem(id: string): BaseItem | undefined {
  return ITEM_MAP[id];
}

// ---------- 装备基底 ----------
interface EquipBase {
  id: string;
  name: string;
  slot: EquipSlot;
  icon: string;
  mainKey: AffixKey;
}

export const EQUIP_BASES: EquipBase[] = [
  // 武器
  { id: 'w_sword', name: '青锋剑', slot: 'weapon', icon: '🗡️', mainKey: 'atk' },
  { id: 'w_saber', name: '寒月刀', slot: 'weapon', icon: '⚔️', mainKey: 'atk' },
  { id: 'w_spear', name: '裂石枪', slot: 'weapon', icon: '🔱', mainKey: 'atk' },
  { id: 'w_fan', name: '芭蕉扇', slot: 'weapon', icon: '🪭', mainKey: 'atk' },
  { id: 'w_bell', name: '摄魂铃', slot: 'weapon', icon: '🔔', mainKey: 'atk' },
  // 护甲
  { id: 'a_robe', name: '道袍', slot: 'armor', icon: '🥋', mainKey: 'def' },
  { id: 'a_armor', name: '山文甲', slot: 'armor', icon: '🛡️', mainKey: 'def' },
  { id: 'a_cloak', name: '斗篷', slot: 'armor', icon: '🧥', mainKey: 'def' },
  { id: 'a_jade', name: '软猬甲', slot: 'armor', icon: '🪖', mainKey: 'def' },
  // 饰品
  { id: 'c_ring', name: '储物戒', slot: 'accessory', icon: '💍', mainKey: 'hp' },
  { id: 'c_pendant', name: '护身符', slot: 'accessory', icon: '🧿', mainKey: 'hp' },
  { id: 'c_belt', name: '束灵带', slot: 'accessory', icon: '🪢', mainKey: 'hp' },
];

export const EQUIP_BASE_MAP: Record<string, EquipBase> = Object.fromEntries(
  EQUIP_BASES.map(b => [b.id, b])
);

// 装备前缀（品质越高越稀有）
export const EQUIP_PREFIX: Record<ItemQuality, string[]> = {
  common: ['粗铁', '凡铁'],
  fine: ['精钢', '百炼'],
  rare: ['寒银', '流云'],
  epic: ['紫金', '玄光'],
  legendary: ['诛仙', '戮神'],
  mythic: ['鸿蒙', '混沌'],
};

// 副词条权重与范围
const AFFIX_POOL: { key: AffixKey; w: number; base: (tier: number) => number }[] = [
  { key: 'atk', w: 22, base: t => Math.max(2, Math.round(1.6 * Math.pow(t, 1.28))) },
  { key: 'def', w: 20, base: t => Math.max(1, Math.round(0.9 * Math.pow(t, 1.22))) },
  { key: 'hp', w: 20, base: t => Math.max(6, Math.round(7 * Math.pow(t, 1.35))) },
  { key: 'crit', w: 12, base: () => 1 },      // 百分比 ×0.1 后处理
  { key: 'dodge', w: 10, base: () => 1 },
  { key: 'speed', w: 9, base: t => Math.max(1, Math.round(0.25 * t)) },
  { key: 'luck', w: 7, base: t => Math.max(1, Math.round(0.3 * t)) },
];

export function rollQuality(luckMult: number, bonusRare: number = 0): ItemQuality {
  // 气运提升稀有品质权重
  const weights = QUALITY_WEIGHTS.map(({ q, w }) => {
    const idx = QUALITY_ORDER.indexOf(q);
    // 越稀有受益越多
    const boost = idx >= 2 ? luckMult * (1 + bonusRare * 0.5) : 1;
    return { q, w: w * boost };
  });
  const total = weights.reduce((s, x) => s + x.w, 0);
  let roll = Math.random() * total;
  for (const { q, w } of weights) {
    roll -= w;
    if (roll <= 0) return q;
  }
  return 'common';
}

let uidCounter = 0;
export function genUid(): string {
  uidCounter += 1;
  return `${Date.now().toString(36)}${uidCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// 生成一件随机装备（Harpagia 式随机词条）
// opts.excludeKeys：从随机副词条池中剔除的属性（炼宝坊专属词条防重复）
export function generateEquipment(
  tier: number,
  quality: ItemQuality,
  slotHint?: EquipSlot,
  opts?: { excludeKeys?: AffixKey[] }
): Equipment {
  const t = Math.max(1, Math.min(120, Math.round(tier)));
  const bases = slotHint ? EQUIP_BASES.filter(b => b.slot === slotHint) : EQUIP_BASES;
  const base = bases[Math.floor(Math.random() * bases.length)];

  const qmul = QUALITY_MULT[quality];
  const variance = 0.85 + Math.random() * 0.3; // 0.85 ~ 1.15

  // 主属性
  let mainValue: number;
  if (base.mainKey === 'atk') mainValue = Math.max(2, Math.round(2.2 * Math.pow(t, 1.3) * qmul * variance));
  else if (base.mainKey === 'def') mainValue = Math.max(1, Math.round(1.4 * Math.pow(t, 1.25) * qmul * variance));
  else mainValue = Math.max(8, Math.round(11 * Math.pow(t, 1.4) * qmul * variance));

  // 副词条数量
  const affixCount =
    quality === 'mythic' ? 4 :
    quality === 'legendary' ? 3 :
    quality === 'epic' ? 3 :
    quality === 'rare' ? 2 :
    quality === 'fine' ? 1 : (Math.random() < 0.3 ? 1 : 0);

  const pool = [...AFFIX_POOL].filter(p => !(opts?.excludeKeys ?? []).includes(p.key));
  const affixes: { key: AffixKey; value: number }[] = [];
  for (let i = 0; i < affixCount && pool.length > 0; i++) {
    const total = pool.reduce((s, x) => s + x.w, 0);
    let roll = Math.random() * total;
    let picked = pool[0];
    for (const p of pool) {
      roll -= p.w;
      if (roll <= 0) { picked = p; break; }
    }
    pool.splice(pool.indexOf(picked), 1);
    if (picked.key === base.mainKey) { i--; continue; }

    let value: number;
    if (picked.key === 'crit') {
      // 百分比词条：0.4% × (1+tier/20) 取 1~3 档
      const step = 0.004 * (1 + t / 25);
      value = Math.round((step * (1 + Math.floor(Math.random() * 3))) * 1000) / 1000;
    } else if (picked.key === 'dodge') {
      const step = 0.003 * (1 + t / 25);
      value = Math.round((step * (1 + Math.floor(Math.random() * 3))) * 1000) / 1000;
    } else {
      value = Math.max(1, Math.round(picked.base(t) * qmul * (0.8 + Math.random() * 0.4)));
    }
    affixes.push({ key: picked.key, value });
  }

  // 命名
  const prefixes = EQUIP_PREFIX[quality];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = ['·初形', '·灵纹', '·精魄', '·道韵', '·天成'][Math.min(4, affixes.length)];

  const sellPrice = Math.round((8 * Math.pow(t, 1.5) + 20) * QUALITY_PRICE[quality]);

  return {
    uid: genUid(),
    baseId: base.id,
    name: `${prefix}${base.name}`,
    slot: base.slot,
    quality,
    tier: t,
    icon: base.icon,
    mainStat: { key: base.mainKey, value: mainValue },
    affixes,
    sellPrice,
    createdAt: Date.now(),
    refine: 0,
  };
}

export const AFFIX_NAMES: Record<AffixKey, string> = {
  atk: '攻击', def: '防御', hp: '生命', crit: '暴击率', dodge: '闪避率', luck: '气运', speed: '速度',
};

export function formatAffix(key: AffixKey, value: number): string {
  if (key === 'crit' || key === 'dodge') return `+${(value * 100).toFixed(1)}%`;
  // 扁平属性取整 + 千分位，避免炼器乘区产生 2464.0000000000005 之类的浮点尾巴
  return `+${Math.round(value).toLocaleString('zh-CN')}`;
}

// ---------- 生产配方 ----------

export interface CraftRecipe {
  id: string;
  name: string;
  icon: string;
  kind: 'cooking' | 'forging';
  outputItemId?: string;          // 炼丹产出固定物品
  materials: { itemId: string; qty: number }[];
  skillXp: number;
  minSkillLevel: number;
  description: string;
}

export const CRAFT_RECIPES: CraftRecipe[] = [
  // ===== 炼丹 =====
  {
    id: 'cook_heal_s', name: '回气散', icon: '💚', kind: 'cooking',
    outputItemId: 'pill_heal_s',
    materials: [{ itemId: 'herb_1', qty: 2 }],
    skillXp: 12, minSkillLevel: 1,
    description: '恢复 80 点气血的基础丹药。',
  },
  {
    id: 'cook_heal_m', name: '回春散', icon: '💚', kind: 'cooking',
    outputItemId: 'pill_heal_m',
    materials: [{ itemId: 'herb_1', qty: 2 }, { itemId: 'herb_2', qty: 1 }],
    skillXp: 45, minSkillLevel: 15,
    description: '恢复 400 点气血，中期主力丹药。',
  },
  {
    id: 'cook_atk', name: '狂暴丹', icon: '🔴', kind: 'cooking',
    outputItemId: 'pill_atk',
    materials: [{ itemId: 'herb_1', qty: 3 }, { itemId: 'herb_2', qty: 1 }],
    skillXp: 45, minSkillLevel: 20,
    description: '10 分钟内攻击 +30%。',
  },
  {
    id: 'cook_def', name: '铁骨丹', icon: '🔵', kind: 'cooking',
    outputItemId: 'pill_def',
    materials: [{ itemId: 'herb_1', qty: 3 }, { itemId: 'core_1', qty: 1 }],
    skillXp: 45, minSkillLevel: 25,
    description: '10 分钟内防御 +40%。',
  },
  {
    id: 'cook_spd', name: '疾风丹', icon: '💨', kind: 'cooking',
    outputItemId: 'pill_spd',
    materials: [{ itemId: 'herb_1', qty: 3 }, { itemId: 'herb_2', qty: 1 }],
    skillXp: 55, minSkillLevel: 30,
    description: '10 分钟内速度 +30%，闪避更高。',
  },
  {
    id: 'cook_gold', name: '聚财丹', icon: '🪙', kind: 'cooking',
    outputItemId: 'pill_gold',
    materials: [{ itemId: 'herb_2', qty: 2 }, { itemId: 'core_1', qty: 1 }],
    skillXp: 75, minSkillLevel: 35,
    description: '10 分钟内金币收益 +40%。',
  },
  {
    id: 'cook_luck', name: '幸运丹', icon: '🍀', kind: 'cooking',
    outputItemId: 'pill_luck',
    materials: [{ itemId: 'herb_3', qty: 1 }, { itemId: 'core_1', qty: 1 }],
    skillXp: 110, minSkillLevel: 45,
    description: '10 分钟内气运 +15，掉落品质与概率双提升。',
  },
  {
    id: 'cook_heal_l', name: '九转还魂丹', icon: '💗', kind: 'cooking',
    outputItemId: 'pill_heal_l',
    // 数值修复：此前 herb_3×2+core_1×2 材料价值 840 金 > 产出卖价 800，
    // 是全配方表唯一炼了必亏的配方；降为 herb_3×1 后成本 540，与同级配方利润率对齐
    materials: [{ itemId: 'herb_3', qty: 1 }, { itemId: 'core_1', qty: 2 }],
    skillXp: 140, minSkillLevel: 50,
    description: '恢复 1600 点气血的高级丹药。',
  },
  {
    id: 'cook_cap', name: '捕灵丹', icon: '🪤', kind: 'cooking',
    outputItemId: 'pill_cap',
    materials: [{ itemId: 'herb_3', qty: 1 }, { itemId: 'herb_1', qty: 5 }],
    skillXp: 150, minSkillLevel: 55,
    description: '10 分钟内灵宠捕获率 ×1.6，收妖必备。',
  },
  {
    id: 'cook_exp', name: '悟道丹', icon: '🌟', kind: 'cooking',
    outputItemId: 'pill_exp',
    materials: [{ itemId: 'herb_4', qty: 1 }, { itemId: 'core_1', qty: 3 }],
    skillXp: 260, minSkillLevel: 70,
    description: '五项战斗技能各获得 600 经验。',
  },
  {
    id: 'cook_heal_xl', name: '万年雪参膏', icon: '💖', kind: 'cooking',
    outputItemId: 'pill_heal_xl',
    materials: [{ itemId: 'herb_4', qty: 1 }, { itemId: 'herb_3', qty: 2 }],
    skillXp: 240, minSkillLevel: 70,
    description: '恢复 4500 点气血的传说膏方。',
  },
  // ===== 锻造（矿石 → 随机装备，等级决定装备阶级） =====
  {
    id: 'forge_common', name: '凡铁锻造', icon: '🔨', kind: 'forging',
    materials: [{ itemId: 'ore_dynamic', qty: 3 }],
    skillXp: 25, minSkillLevel: 1,
    description: '以 3 块矿石锻造装备，品质随机。',
  },
  {
    id: 'forge_refined', name: '百炼锻造', icon: '⚒️', kind: 'forging',
    materials: [{ itemId: 'ore_dynamic', qty: 8 }],
    skillXp: 70, minSkillLevel: 30,
    description: '以 8 块矿石精锻，更易出高品质装备。',
  },
  {
    id: 'forge_master', name: '大师锻造', icon: '🛠️', kind: 'forging',
    materials: [{ itemId: 'ore_dynamic', qty: 16 }],
    skillXp: 180, minSkillLevel: 80,
    description: '以 16 块矿石倾力锻造，出仙品概率大增。',
  },
];

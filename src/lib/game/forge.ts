// ============================================
// 炼宝坊：妖王专属材料 → 专属装备合成
// 4 件专属异宝各有唯一成品，可重复合成（材料为闸门）
// 成品继承随机词条机制（品质/阶级固定，词条随机）
// ============================================

import { Equipment, ItemQuality, EquipSlot, AffixKey } from '@/types/game';
import { generateEquipment, getItem } from './items';

export interface ForgeRecipe {
  id: string;
  name: string;              // 成品专属名
  icon: string;
  slot: EquipSlot;
  quality: ItemQuality;
  tier: number;              // 成品阶级（决定数值强度）
  materialId: string;        // 核心专属材料
  coreQty: number;
  extraMats: { itemId: string; qty: number }[]; // 辅助材料
  gold: number;
  bossName: string;          // 核心材料来源妖王
  desc: string;              // 成品 lore
  sigAffix: { key: AffixKey; value: number; label: string }; // 专属词条（必带，随炼器成长）
}

// 4 件妖王专属装备
export const FORGE_RECIPES: ForgeRecipe[] = [
  {
    id: 'forge_yuanzhu',
    name: '渊主鳞铠',
    icon: '🛡️',
    slot: 'armor',
    quality: 'legendary',
    tier: 100,
    materialId: 'r9_abyss_scale',
    coreQty: 2,
    extraMats: [
      { itemId: 'bone_1', qty: 15 },
    ],
    gold: 30000,
    bossName: '归墟之主（归墟海妖王）',
    desc: '以渊主逆鳞为引锻成的黑鳞宝甲，刀剑不侵，潮声自甲纹间昼夜不息。',
    sigAffix: { key: 'def', value: 1200, label: '玄鳞不侵' },
  },
  {
    id: 'forge_xianhai',
    name: '仙骸残剑',
    icon: '🗡️',
    slot: 'weapon',
    quality: 'legendary',
    tier: 115,
    materialId: 'r10_immortal_shard',
    coreQty: 2,
    extraMats: [
      { itemId: 'ore_8', qty: 6 },
    ],
    gold: 80000,
    bossName: '仙帝残影（仙墟妖王）',
    desc: '半截断剑重铸，剑身犹带仙战余温，出鞘时隐约有大道之音低吟。',
    sigAffix: { key: 'atk', value: 3300, label: '大道剑鸣' },
  },
  {
    id: 'forge_canghai',
    name: '沧海珠链',
    icon: '📿',
    slot: 'accessory',
    quality: 'legendary',
    tier: 110,
    materialId: 'wb_whale_pearl',
    coreQty: 1,
    extraMats: [
      { itemId: 'fish_8', qty: 5 },
    ],
    gold: 60000,
    bossName: '归墟鲸祖（世界 BOSS）',
    desc: '定海神珠串成的链饰，佩之如携沧海，风浪不侵。',
    sigAffix: { key: 'dodge', value: 0.055, label: '沧海无波' },
  },
  {
    id: 'forge_zangtian',
    name: '葬天玉玺',
    icon: '👑',
    slot: 'accessory',
    quality: 'mythic',
    tier: 120,
    materialId: 'wb_emperor_jade',
    coreQty: 1,
    extraMats: [
      { itemId: 'herb_4', qty: 5 },
      { itemId: 'ore_7', qty: 8 },
    ],
    gold: 150000,
    bossName: '葬天仙帝（世界 BOSS）',
    desc: '以仙帝残玉刻成的至高印玺，镇压气运，执之者如承天命。',
    sigAffix: { key: 'luck', value: 250, label: '镇压气运' },
  },
];

export const FORGE_MAP: Record<string, ForgeRecipe> = Object.fromEntries(
  FORGE_RECIPES.map(r => [r.id, r])
);

// 配方全部材料 + 金币的持有量校验
export function forgeCostCheck(
  recipe: ForgeRecipe,
  inventory: { itemId: string; quantity: number }[],
  gold: number
): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  const need: { itemId: string; qty: number }[] = [
    { itemId: recipe.materialId, qty: recipe.coreQty },
    ...recipe.extraMats,
  ];
  for (const m of need) {
    const have = inventory.find(i => i.itemId === m.itemId)?.quantity ?? 0;
    if (have < m.qty) {
      missing.push(`${getItem(m.itemId)?.name ?? m.itemId} ${have}/${m.qty}`);
    }
  }
  if (gold < recipe.gold) {
    missing.push(`金币 ${formatGold(gold)}/${formatGold(recipe.gold)}`);
  }
  return { ok: missing.length === 0, missing };
}

function formatGold(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}万` : `${n}`;
}

// 合成成品：专属词条必带 + 其余随机词条（品质/阶级固定）
export function forgeEquipment(recipe: ForgeRecipe): Equipment {
  const eq = generateEquipment(recipe.tier, recipe.quality, recipe.slot, {
    excludeKeys: [recipe.sigAffix.key],
  });
  eq.name = recipe.name;
  eq.icon = recipe.icon;
  eq.baseId = recipe.id;
  eq.sigAffix = { ...recipe.sigAffix };
  // 卖价折价（修复：此前沿用通用掉落公式，神品百二十阶卖价 ≈ 74 万金，
  // 而合成成本仅 10~21 万，妖王 50% 掉率可无限刷 → 卖专属成了压倒性最优印钞策略）
  eq.sellPrice = forgeSellPrice(recipe);
  return eq;
}

// 专属装备卖价：金币 + 全部材料卖价总和的 30%，向上取整到十位
// 卖出永远净亏损约七成投入，仅保留「淘汰旧专属回收少量资源」的自由，堵死套利
export function forgeSellPrice(recipe: ForgeRecipe): number {
  const mats: { itemId: string; qty: number }[] = [
    { itemId: recipe.materialId, qty: recipe.coreQty },
    ...recipe.extraMats,
  ];
  const matValue = mats.reduce((s, m) => s + (getItem(m.itemId)?.sellPrice ?? 0) * m.qty, 0);
  const raw = (recipe.gold + matValue) * 0.3;
  return Math.max(10, Math.ceil(raw / 10) * 10);
}

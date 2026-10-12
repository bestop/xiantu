// ============================================
// 奇遇系统：行走仙途，机缘巧合
// 参考放置游戏「变率强化 + 选择代理」设计：
//  - 天降宝箱：三选一（玩家自主决策的惊喜）
//  - 神秘商人：限时 5 折（紧迫感与取舍）
//  - 灵气爆发 / 灵兽低语：主动游玩时段增益
// 另含每日签到数值（连续签到奖励递进）
// ============================================

import { EncounterOption, EncounterState, ItemQuality, MerchantItem } from '@/types/game';

// 触发概率与节流
export const ENCOUNTER_BATTLE_CHANCE = 0.04;   // 每次战斗胜利 4%
export const ENCOUNTER_ACTIVITY_CHANCE = 0.02; // 每秒有活动轮次完成时 2%
export const ENCOUNTER_COOLDOWN_MS = 180_000;  // 两次奇遇至少间隔 3 分钟

// 有效期
export const TREASURE_TTL_MS = 600_000;   // 宝箱 10 分钟内不选自动消散
export const MERCHANT_TTL_MS = 90_000;    // 神秘商人停留 90 秒

// buff 增益
export const QI_BURST = { key: 'exp', value: 100, durationMs: 120_000 } as const;  // 经验 +100%
export const BEAST_WHISPER = { key: 'cap', value: 300, durationMs: 120_000 } as const; // 捕获率 ×3

// 奇遇类型权重（treasure 宝箱 / qi 灵气爆发 / beast 灵兽低语 / merchant 商人）
const KIND_WEIGHTS: { kind: 'treasure' | 'qi' | 'beast' | 'merchant'; w: number }[] = [
  { kind: 'treasure', w: 34 },
  { kind: 'qi', w: 26 },
  { kind: 'beast', w: 22 },
  { kind: 'merchant', w: 18 },
];

// 金币类奖励随进程成长（与战斗/化缘收益同量级，避免前期爆富后期鸡肋）
export function encounterGoldScale(avgCombatLevel: number): number {
  return 250 + avgCombatLevel * 65;
}

// 每日签到金币（连续签到不加金币，宝石递进，避免断签惩罚过重）
export function dailyGold(avgCombatLevel: number): number {
  return Math.round(200 * (1 + avgCombatLevel * 0.05));
}
export const DAILY_GEMS = 3;
export const DAILY_STREAK_BONUS_GEMS = 15; // 连续签到每满 7 天额外 +15

function pickWeightedKind(): 'treasure' | 'qi' | 'beast' | 'merchant' {
  const total = KIND_WEIGHTS.reduce((a, k) => a + k.w, 0);
  let roll = Math.random() * total;
  for (const k of KIND_WEIGHTS) {
    roll -= k.w;
    if (roll <= 0) return k.kind;
  }
  return 'treasure';
}

// ---------- 天降宝箱：奖励池（抽 3 个不同选项） ----------

function makeTreasurePool(avgLv: number): EncounterOption[] {
  const tier = Math.max(1, Math.min(120, Math.round(avgLv)));
  return [
    {
      id: 'gold', icon: '💰', label: '金币堆', desc: '路旁散落的遗落行囊',
      reward: { gold: Math.round(encounterGoldScale(avgLv) * (1.1 + Math.random() * 0.6)) },
    },
    {
      id: 'gems', icon: '💎', label: '仙晶', desc: '天地灵气凝结的结晶',
      reward: { gems: 3 + Math.floor(Math.random() * 6) },
    },
    {
      id: 'equip', icon: '🎁', label: '无名剑匣', desc: '内藏一件上品以上随机装备',
      reward: { equipTier: tier, minQuality: 'rare' as ItemQuality },
    },
    {
      id: 'cores', icon: '🔮', label: '妖丹袋', desc: '三颗温养完成的妖兽内丹',
      reward: { itemId: 'core_1', qty: 3 },
    },
    {
      id: 'pill', icon: '🌟', label: '悟道丹', desc: '服之可通晓天地至理',
      reward: { itemId: 'pill_exp', qty: 1 },
    },
  ];
}

function pickDistinct<T>(pool: T[], n: number): T[] {
  const copy = [...pool];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

// ---------- 神秘商人：商品池（原价 5 折，抽 3 件） ----------

function makeMerchantPool(avgLv: number): MerchantItem[] {
  const tier = Math.max(1, Math.min(120, Math.round(avgLv)));
  return [
    { key: 'm_pill_exp', icon: '🌟', label: '悟道丹', price: 15, currency: 'gem', itemId: 'pill_exp', qty: 1 },
    { key: 'm_pill_heal_l', icon: '💗', label: '九转还魂丹', price: 8, currency: 'gem', itemId: 'pill_heal_l', qty: 1 },
    { key: 'm_pill_luck', icon: '🍀', label: '幸运丹', price: 11, currency: 'gem', itemId: 'pill_luck', qty: 1 },
    { key: 'm_pill_cap', icon: '🌀', label: '捕灵丹', price: 12, currency: 'gem', itemId: 'pill_cap', qty: 1 },
    { key: 'm_bag_rare', icon: '🎁', label: '稀有装备袋', price: 10, currency: 'gem', equipTier: tier, minQuality: 'rare' as ItemQuality },
    { key: 'm_bag_leg', icon: '🎑', label: '仙品装备袋', price: 30, currency: 'gem', equipTier: tier, minQuality: 'legendary' as ItemQuality },
  ];
}

// ---------- 生成一次奇遇抽签 ----------

// 抽签结果：宝箱/商人带状态（弹窗交互），灵气/灵兽带 buff（直接生效 + toast）
export type EncounterDraw =
  | { kind: 'treasure'; state: EncounterState }
  | { kind: 'merchant'; state: EncounterState }
  | { kind: 'qi'; buff: { key: 'exp'; value: number; expireAt: number } }
  | { kind: 'beast'; buff: { key: 'cap'; value: number; expireAt: number } };

export function rollEncounterDraw(avgCombatLevel: number, now = Date.now()): EncounterDraw {
  const kind = pickWeightedKind();
  if (kind === 'merchant') {
    return {
      kind,
      state: {
        kind: 'merchant',
        createdAt: now,
        expireAt: now + MERCHANT_TTL_MS,
        items: pickDistinct(makeMerchantPool(avgCombatLevel), 3),
      },
    };
  }
  if (kind === 'qi') {
    return { kind, buff: { key: 'exp', value: QI_BURST.value, expireAt: now + QI_BURST.durationMs } };
  }
  if (kind === 'beast') {
    return { kind, buff: { key: 'cap', value: BEAST_WHISPER.value, expireAt: now + BEAST_WHISPER.durationMs } };
  }
  return {
    kind: 'treasure',
    state: {
      kind: 'treasure',
      createdAt: now,
      expireAt: now + TREASURE_TTL_MS,
      options: pickDistinct(makeTreasurePool(avgCombatLevel), 3),
    },
  };
}

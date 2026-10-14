// ============================================
// 每日修行任务：留存循环
// 参考同类放置游戏「每日任务 + 全勤宝箱」标准设计：
//   - 每日固定 5 个任务，目标值随玩家进度动态成长
//   - 离线挂机的击杀/活动轮次同样计数（放置游戏奖励挂机而非惩罚）
//   - 每任务奖励金币+宝石，全勤额外开修行宝箱
//   - 跨天按 dayKey 重置（与每日签到同机制）
// ============================================

import { DailyQuestsState, GameState } from '@/types/game';
import { todayKey } from './sects';
import { avgCombatLevel } from './engine';
import { dailyGold } from './events';

// 单任务奖励宝石
export const QUEST_GEMS = 2;
// 全勤宝箱：悟道丹 ×1 + 宝石 5
export const QUEST_CHEST = { itemId: 'pill_exp', qty: 1, gems: 5 };

// 每任务金币：与签到金币同源缩放（×0.6），随战斗等级成长
export function questGold(state: GameState): number {
  return Math.round(dailyGold(avgCombatLevel(state)) * 0.6);
}

export interface QuestDef {
  id: string;
  icon: string;
  name: string;
  counter: string;                     // 对应 counters 计数器 key
  target: (state: GameState) => number; // 目标值（随玩家进度成长）
  targetText: (x: number) => string;   // 目标描述
}

// 难度基准：与战斗面板 currentTier 同口径（单项战斗技能均值 / 5）
function questTier(state: GameState): number {
  return Math.max(1, Math.round(avgCombatLevel(state) / 5));
}

export const QUESTS: QuestDef[] = [
  {
    id: 'q_kills', icon: '⚔️', name: '妖兽讨伐', counter: 'kills',
    target: s => 20 + questTier(s) * 2,
    targetText: x => `击杀 ${x} 只妖兽`,
  },
  {
    id: 'q_wins', icon: '🔥', name: '连战连捷', counter: 'wins',
    target: s => 12 + questTier(s),
    targetText: x => `战斗获胜 ${x} 场`,
  },
  {
    id: 'q_rounds', icon: '🧘', name: '修行不辍', counter: 'rounds',
    target: () => 15,
    targetText: x => `完成 ${x} 轮挂机修行`,
  },
  {
    id: 'q_tower', icon: '🗼', name: '塔中试炼', counter: 'tower',
    target: () => 3,
    targetText: x => `首通锁妖塔 ${x} 层`,
  },
  {
    id: 'q_craft', icon: '⚗️', name: '丹炉不熄', counter: 'craft',
    target: () => 2,
    targetText: x => `炼丹或锻造 ${x} 次`,
  },
];

export const QUEST_MAP: Record<string, QuestDef> = Object.fromEntries(QUESTS.map(q => [q.id, q]));

// 当日任务进度初始化
function freshQuests(now: number): DailyQuestsState {
  return { dayKey: todayKey(now), counters: {}, claimed: [], chestClaimed: false };
}

// 跨天/坏档规范化：dayKey 非今日则整包重置；counters 数值钳制、claimed 过滤未知 id
export function ensureQuests(raw: DailyQuestsState | undefined, now: number): DailyQuestsState {
  if (!raw || typeof raw.dayKey !== 'string' || raw.dayKey !== todayKey(now)) {
    return freshQuests(now);
  }
  const counters: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.counters ?? {})) {
    counters[k] = Number.isFinite(v) && (v as number) > 0 ? Math.floor(v as number) : 0;
  }
  const validIds = new Set(QUESTS.map(q => q.id));
  return {
    dayKey: raw.dayKey,
    counters,
    claimed: (raw.claimed ?? []).filter(id => validIds.has(id)),
    chestClaimed: !!raw.chestClaimed,
  };
}

// 计数器累加（纯函数，store 埋点用）
export function bumpCounter(quests: DailyQuestsState, counter: string, delta = 1): DailyQuestsState {
  if (delta <= 0) return quests;
  return {
    ...quests,
    counters: { ...quests.counters, [counter]: (quests.counters[counter] ?? 0) + delta },
  };
}

// 任务是否可领取
export function isQuestReady(quest: QuestDef, quests: DailyQuestsState, state: GameState): boolean {
  if (quests.claimed.includes(quest.id)) return false;
  return (quests.counters[quest.counter] ?? 0) >= quest.target(state);
}

// 是否全勤（5 任务全部完成，无论是否已领取）
export function isQuestsComplete(quests: DailyQuestsState, state: GameState): boolean {
  return QUESTS.every(q => (quests.counters[q.counter] ?? 0) >= q.target(state));
}

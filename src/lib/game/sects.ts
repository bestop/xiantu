// ============================================
// 宗门系统（单机模拟公会）
// 加入宗门获得专属被动；战斗积累贡献；
// 贡献兑换宗门商店物品与弟子位阶称号
// ============================================

import { GameState, SectId, PlayerSectState } from '@/types/game';

export interface SectDef {
  id: SectId;
  name: string;
  icon: string;
  motto: string;
  bonusName: string;
  bonusDesc: string;
  tone: string; // UI 主题色
}

export const SECTS: SectDef[] = [
  {
    id: 'sword', name: '青云剑宗', icon: '⚔️', motto: '一剑破万法',
    bonusName: '剑意通明', bonusDesc: '战斗技能经验 +12%，宗门等级每级再 +1%',
    tone: 'text-cyan-300 bg-cyan-950/60 border-cyan-900/50',
  },
  {
    id: 'alchemy', name: '丹霞谷', icon: '⚗️', motto: '丹火不熄，大道可期',
    bonusName: '丹火温养', bonusDesc: '离线修炼效率 +15%（与定力加成叠加）',
    tone: 'text-emerald-300 bg-emerald-950/60 border-emerald-900/50',
  },
  {
    id: 'beast', name: '万兽门', icon: '🐾', motto: '与兽同行，其利断金',
    bonusName: '兽魂契约', bonusDesc: '灵宠出战属性加成 +30%',
    tone: 'text-amber-300 bg-amber-950/60 border-amber-900/50',
  },
  {
    id: 'vault', name: '万宝楼', icon: '💰', motto: '修仙也要吃饭',
    bonusName: '点石成金', bonusDesc: '金币收益 +25%（战斗与挂机皆生效）',
    tone: 'text-rose-300 bg-rose-950/60 border-rose-900/50',
  },
];

export const SECT_MAP: Record<SectId, SectDef> = Object.fromEntries(
  SECTS.map(s => [s.id, s])
) as Record<SectId, SectDef>;

// 弟子位阶：由累计贡献决定（自动授予/晋升）
export const SECT_RANKS: { min: number; key: string; name: string }[] = [
  { min: 0, key: 'outer', name: '外门弟子' },
  { min: 500, key: 'inner', name: '内门弟子' },
  { min: 2000, key: 'true', name: '真传弟子' },
];

export function sectRank(contrib: number): { key: string; name: string; min: number } {
  let r = SECT_RANKS[0];
  for (const rank of SECT_RANKS) {
    if (contrib >= rank.min) r = rank;
  }
  return { key: r.key, name: r.name, min: r.min };
}

export function sectTitleId(sectId: SectId, rankKey: string): string {
  return `sect_${sectId}_${rankKey}`;
}

// 宗门等级（1-10）：宗门总贡献（含同门 NPC）决定
export const SECT_MAX_LEVEL = 10;
export function sectLevel(totalContribution: number): number {
  return Math.min(SECT_MAX_LEVEL, 1 + Math.floor(Math.sqrt(Math.max(0, totalContribution) / 600)));
}

// 宗门等级带来的额外加成倍率（每级 +1%）
export function sectLevelBonus(level: number): number {
  return (level - 1) * 0.01;
}

// ---------- 贡献获取 ----------

// 战斗胜利 +1，区域妖王 +10，世界 BOSS 挑战 +5
export const CONTRIB_PER_KILL = 1;
export const CONTRIB_PER_BOSS = 10;
export const CONTRIB_PER_WB = 5;

export function todayKey(now = Date.now()): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 战斗后累计贡献（返回新的宗门状态；未入宗门返回 null）
export function grantContribution(
  sect: PlayerSectState,
  amount: number,
  now = Date.now()
): PlayerSectState {
  const key = todayKey(now);
  const dayContrib = sect.dayKey === key ? sect.dayContrib + amount : amount;
  return {
    ...sect,
    contribution: sect.contribution + amount,
    totalContrib: sect.totalContrib + amount,
    dayKey: key,
    dayContrib,
  };
}

// ---------- 宗门商店（贡献点兑换） ----------

export interface SectShopEntry {
  itemId: string;
  price: number;      // 贡献点
  label: string;
  qty?: number;
}

export function getSectShopEntries(): SectShopEntry[] {
  return [
    { itemId: 'herb_1', price: 60, label: '灵草×5', qty: 5 },
    { itemId: 'core_1', price: 80, label: '妖丹×1' },
    { itemId: 'pill_exp', price: 220, label: '悟道丹×1' },
    { itemId: 'ore_5', price: 260, label: '玄铁矿×2', qty: 2 },
    { itemId: 'pill_heal_l', price: 300, label: '九转还魂丹×1' },
    { itemId: 'ore_8', price: 600, label: '星辰砂×1' },
  ];
}

// ---------- 同门师兄弟（NPC 模拟） ----------

const SECT_NPC_NAMES: Record<SectId, string[]> = {
  sword: ['大师兄凌霄', '剑痴叶孤鸿', '小师妹沈青璃', '戒律长老', '藏剑阁主', '守山弟子'],
  alchemy: ['丹房首座', '药童阿吉', '火工道人', '百草仙姑', '守炉真人', '采药弟子'],
  beast: ['驯兽长老', '鹰眼师兄', '牧鹿少女', '兽圈管事', '驭熊壮士', '喂鸡小童'],
  vault: ['大掌柜', '账房先生', '鉴宝师爷', '押镖头领', '库房管事', '跑堂伙计'],
};

export interface SectMemberEntry {
  name: string;
  contribution: number;
  isPlayer: boolean;
}

// 同门贡献榜：NPC 贡献随玩家修行时长成长，可追赶
export function getSectMembers(state: GameState): {
  members: SectMemberEntry[];
  playerRank: number;
  npcTotal: number;
  total: number;
  level: number;
} {
  const sect = state.sect;
  if (!sect) {
    return { members: [], playerRank: 0, npcTotal: 0, total: 0, level: 1 };
  }
  // 坏档硬化：playStart 异常时钳 0 小时（同 leaderboard.ts 口径，防 NaN 污染同门榜/宗门等级）
  const start = Number(state.stats.playStart);
  const hours = start > 0 ? Math.max(0, (Date.now() - start) / 3600000) : 0;
  const names = SECT_NPC_NAMES[sect.sectId] ?? [];
  const npcs: SectMemberEntry[] = names.map((name, i) => ({
    name,
    contribution: Math.round((60 + i * 55) + hours * (4 + (i % 5) * 2.5)),
    isPlayer: false,
  }));
  const player: SectMemberEntry = {
    name: `${state.playerName || '你'}（你）`,
    contribution: sect.totalContrib,
    isPlayer: true,
  };
  const members = [...npcs, player].sort((a, b) => b.contribution - a.contribution);
  const playerRank = members.findIndex(m => m.isPlayer) + 1;
  const npcTotal = npcs.reduce((a, m) => a + m.contribution, 0);
  const total = npcTotal + sect.totalContrib;
  return { members, playerRank, npcTotal, total, level: sectLevel(total) };
}

// 未入宗门时的门派声望氛围数据（供选择界面展示规模）
export function sectScaleHint(sectId: SectId): string {
  const hints: Record<SectId, string> = {
    sword: '天下剑修半出青云，山门剑气冲霄',
    alchemy: '丹香十里，谷中四季如春',
    beast: '万兽朝宗，灵禽走兽皆为同门',
    vault: '修仙界第一商号，灵石开道',
  };
  return hints[sectId];
}

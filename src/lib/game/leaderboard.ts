// ============================================
// 天梯榜：综合实力评分 + NPC 修士模拟排行
// ============================================

import { GameState } from '@/types/game';
import { totalSkillLevel } from './skills';
import { equipTotals } from './engine';
import { countCollectedCards } from './monsters';

// NPC 修士名单（仙侠风）
const NPC_NAMES: { name: string; icon: string }[] = [
  { name: '青云子', icon: '⛰️' }, { name: '玄机道人', icon: '🔮' }, { name: '洛清霜', icon: '❄️' },
  { name: '白眉真人', icon: '🧓' }, { name: '剑痴独孤', icon: '⚔️' }, { name: '丹王孙氏', icon: '⚗️' },
  { name: '御灵散人', icon: '🦅' }, { name: '天机阁主', icon: '📜' }, { name: '赤霄剑仙', icon: '🗡️' },
  { name: '桃花仙子', icon: '🌸' }, { name: '醉月楼主', icon: '🍶' }, { name: '荒古遗民', icon: '🗿' },
  { name: '万兽庄主', icon: '🐯' }, { name: '听雨楼主', icon: '🌧️' }, { name: '百晓生', icon: '📖' },
  { name: '千机变', icon: '🎭' }, { name: '紫薇圣人', icon: '✨' }, { name: '墨家钜子', icon: '⚙️' },
  { name: '琴魔', icon: '🎼' }, { name: '棋圣', icon: '⚫' }, { name: '书狂', icon: '🖋️' },
  { name: '酒剑仙', icon: '🍸' }, { name: '雪域圣女', icon: '🏔️' }, { name: '南海鲛人', icon: '🌊' },
  { name: '北冥老祖', icon: '🐋' }, { name: '炎阳子', icon: '☀️' }, { name: '幽篁居士', icon: '🎋' },
  { name: '阵法宗师', icon: '🪁' }, { name: '傀儡师祖', icon: '🤖' }, { name: '星宿老怪', icon: '🌟' },
];

export interface LeaderEntry {
  name: string;
  icon: string;
  power: number;
  isPlayer: boolean;
}

// 综合实力评分：技能 + 装备（含炼器） + 灵宠（含进化/星级） + 击杀 + 图鉴 + 转生
export function computePowerScore(state: GameState): number {
  const skillSum = totalSkillLevel(state.skills);
  const eq = equipTotals(state.equipped);
  const eqScore = eq.atk * 2 + eq.def * 2 + eq.hp * 0.2 + eq.crit * 8 + eq.dodge * 8 + eq.speed * 4 + eq.luck * 3;
  const petScore = (state.pets ?? []).reduce((a, p) => a + p.level * 8 + (p.stage ?? 0) * 120 + (p.stars ?? 0) * 30, 0);
  const refineScore = Object.values(state.equips).reduce((a, e) => a + (e.refine ?? 0) * 25, 0);
  const wbKills = state.stats.wbKills ?? 0;
  const rebirthScore = (state.rebirth?.points ?? 0) * 6 + (state.rebirth?.count ?? 0) * 200;
  return Math.round(
    skillSum * 4 + eqScore + petScore + refineScore + rebirthScore +
    state.stats.bossKills * 30 + wbKills * 150 +
    // 与图鉴/成就同口径：陈旧卡片 id 不计入评分（防旧档残留 id 虚高战力）
    countCollectedCards(state.cards) * 12 +
    state.stats.totalKills * 0.5
  );
}

// NPC 实力与玩家游玩时长绑定：随玩家成长而成长，保证可追赶、可反超
function npcPower(i: number, hoursOfPlay: number): number {
  const base = 140 + i * i * 2.2 + i * 45;   // 初始分差分布（越靠前越强）
  // 按自身基数乘性成长 1.30% ~ 1.01%/h（越靠前成长越慢）。
  // 修复：此前成长率按 i%7 轮换加性叠加（5~19.4/h），第 3 名 19.4/h 远快于第 1 名
  // 7.4/h，约 28 小时后中游 NPC 即反超登顶，天梯次序随时间翻转、与"越靠前越强"矛盾。
  // 乘性成长下翻转条件为 r_i/r_j > base_j/base_i；相邻最小基数比 1.337 远大于
  // 最大成长率比 1.008，数学上永不翻转，且头部长期保持可追赶的线性外推节奏。
  const rate = (130 - i) / 100; // %/h
  return Math.round(base * (1 + (hoursOfPlay * rate) / 100));
}

export function getLeaderboard(state: GameState): { entries: LeaderEntry[]; playerRank: number } {
  // 坏档硬化：playStart 缺失/被篡改为非数值时 Date.now()-x → NaN，
  // 会沿 npcPower 污染全部 31 条评分与排序（面板整体 NaN），此处钳为 0 小时
  const start = Number(state.stats.playStart);
  const hours = start > 0 ? Math.max(0, (Date.now() - start) / 3600000) : 0;
  const npcs: LeaderEntry[] = NPC_NAMES.map((n, i) => ({
    name: n.name, icon: n.icon, power: npcPower(i, hours), isPlayer: false,
  }));
  const player: LeaderEntry = {
    name: state.playerName || '你', icon: '🧙', power: computePowerScore(state), isPlayer: true,
  };
  const entries = [...npcs, player].sort((a, b) => b.power - a.power);
  const playerRank = entries.findIndex(e => e.isPlayer) + 1;
  return { entries, playerRank };
}

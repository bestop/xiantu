// ============================================
// 成就系统（Harpagia 式永久成就 + 宝石奖励）
// ============================================

import { AchievementDef, GameState, SkillId, COMBAT_SKILLS } from '@/types/game';
import { totalSkillLevel, combatLevelSum } from './skills';
import { TOTAL_MONSTERS, countCollectedCards } from './monsters';

export const ACHIEVEMENTS: AchievementDef[] = [
  // ===== 战斗 =====
  { id: 'battle_10', name: '初入江湖', icon: '🗡️', description: '累计战斗 10 次', metric: 'battles', target: 10, gemReward: 3 },
  { id: 'battle_100', name: '身经百战', icon: '⚔️', description: '累计战斗 100 次', metric: 'battles', target: 100, gemReward: 8 },
  { id: 'battle_1000', name: '千锤百炼', icon: '🛡️', description: '累计战斗 1000 次', metric: 'battles', target: 1000, gemReward: 25 },
  { id: 'battle_5000', name: '战意滔天', icon: '💥', description: '累计战斗 5000 次', metric: 'battles', target: 5000, gemReward: 60 },
  { id: 'kill_50', name: '降妖除魔', icon: '👹', description: '击杀 50 只妖兽', metric: 'kills', target: 50, gemReward: 5 },
  { id: 'kill_500', name: '妖兽克星', icon: '🔫', description: '击杀 500 只妖兽', metric: 'kills', target: 500, gemReward: 15 },
  { id: 'kill_5000', name: '万妖辟易', icon: '🌟', description: '击杀 5000 只妖兽', metric: 'kills', target: 5000, gemReward: 50 },
  { id: 'boss_1', name: '初斩妖王', icon: '👑', description: '击败 1 只区域 BOSS', metric: 'bossKills', target: 1, gemReward: 10 },
  { id: 'boss_10', name: '妖王终结者', icon: '☠️', description: '击败 10 只区域 BOSS', metric: 'bossKills', target: 10, gemReward: 30 },
  { id: 'boss_50', name: '伐天之路', icon: '🌩️', description: '击败 50 只区域 BOSS', metric: 'bossKills', target: 50, gemReward: 80 },
  { id: 'winrate', name: '常胜将军', icon: '🏆', description: '累计获胜 500 场', metric: 'wins', target: 500, gemReward: 20 },

  // ===== 技能 =====
  { id: 'skill_any10', name: '小有所成', icon: '📈', description: '任意技能达到 10 级', metric: 'anySkill10', target: 1, gemReward: 3 },
  { id: 'skill_any25', name: '渐入佳境', icon: '📊', description: '任意技能达到 25 级', metric: 'anySkill25', target: 1, gemReward: 6 },
  { id: 'skill_any50', name: '登堂入室', icon: '🎯', description: '任意技能达到 50 级', metric: 'anySkill50', target: 1, gemReward: 12 },
  { id: 'skill_any100', name: '炉火纯青', icon: '🔮', description: '任意技能达到 100 级', metric: 'anySkill100', target: 1, gemReward: 30 },
  { id: 'skill_any200', name: '登峰造极', icon: '♾️', description: '任意技能达到 200 级', metric: 'anySkill200', target: 1, gemReward: 100 },
  { id: 'skill_total100', name: '博采众长', icon: '📚', description: '技能总等级达到 100', metric: 'totalSkill', target: 100, gemReward: 10 },
  { id: 'skill_total500', name: '五湖四海', icon: '🌐', description: '技能总等级达到 500', metric: 'totalSkill', target: 500, gemReward: 25 },
  { id: 'skill_total1000', name: '全知全能', icon: '🧠', description: '技能总等级达到 1000', metric: 'totalSkill', target: 1000, gemReward: 60 },
  { id: 'skill_total2000', name: '道法通天', icon: '🌌', description: '技能总等级达到 2000', metric: 'totalSkill', target: 2000, gemReward: 150 },
  { id: 'combat_100', name: '武道初成', icon: '🥊', description: '战斗技能总等级达到 100', metric: 'combatSum', target: 100, gemReward: 10 },
  { id: 'combat_500', name: '武道大能', icon: '🦾', description: '战斗技能总等级达到 500', metric: 'combatSum', target: 500, gemReward: 40 },

  // ===== 财富 =====
  { id: 'gold_10k', name: '小有积蓄', icon: '💰', description: '累计获得 1 万金币', metric: 'goldEarned', target: 10000, gemReward: 5 },
  { id: 'gold_100k', name: '富甲一方', icon: '🪙', description: '累计获得 10 万金币', metric: 'goldEarned', target: 100000, gemReward: 15 },
  { id: 'gold_1m', name: '富可敌国', icon: '🏦', description: '累计获得 100 万金币', metric: 'goldEarned', target: 1000000, gemReward: 40 },

  // ===== 收集 =====
  { id: 'card_10', name: '集卡新手', icon: '🃏', description: '收集 10 种怪物卡', metric: 'cardTypes', target: 10, gemReward: 5 },
  { id: 'card_30', name: '集卡行家', icon: '🎴', description: '收集 30 种怪物卡', metric: 'cardTypes', target: 30, gemReward: 15 },
  { id: 'card_all', name: '万物图鉴', icon: '📖', description: '收集全部怪物卡', metric: 'cardTypes', target: TOTAL_MONSTERS, gemReward: 200 },
  { id: 'equip_legendary', name: '仙器在握', icon: '🎆', description: '获得一件仙品装备', metric: 'bestQualityLegendary', target: 1, gemReward: 25 },
  { id: 'equip_mythic', name: '神器降世', icon: '🌠', description: '获得一件神品装备', metric: 'bestQualityMythic', target: 1, gemReward: 80 },

  // ===== 灵宠 =====
  { id: 'pet_1', name: '初结灵缘', icon: '🥚', description: '累计收服 1 只灵宠', metric: 'petsCaptured', target: 1, gemReward: 10 },
  { id: 'pet_5', name: '灵兽成群', icon: '🐣', description: '累计收服 5 只灵宠', metric: 'petsCaptured', target: 5, gemReward: 20 },
  { id: 'pet_12', name: '万灵之友', icon: '🐾', description: '灵宠栏全部占满（12 只）', metric: 'pets', target: 12, gemReward: 60 },
  { id: 'pet_lv50', name: '御兽真传', icon: '🐉', description: '任意灵宠达到 50 级', metric: 'bestPetLevel', target: 50, gemReward: 25 },
  { id: 'pet_lv200', name: '兽神附体', icon: '🐲', description: '任意灵宠达到 200 级', metric: 'bestPetLevel', target: 200, gemReward: 120 },
  { id: 'pet_evo_1', name: '灵性初开', icon: '✨', description: '首次进化灵宠', metric: 'petMaxStage', target: 1, gemReward: 20 },
  { id: 'pet_evo_3', name: '涅槃神宠', icon: '🔥', description: '灵宠进化至神兽阶段', metric: 'petMaxStage', target: 3, gemReward: 80 },
  { id: 'pet_star_3', name: '三星共鸣', icon: '⭐', description: '任意灵宠融合至 3 星', metric: 'petMaxStars', target: 3, gemReward: 20 },
  { id: 'pet_star_5', name: '五星兽王', icon: '🌟', description: '任意灵宠融合至 5 星', metric: 'petMaxStars', target: 5, gemReward: 70 },

  // ===== 炼器 =====
  { id: 'refine_3', name: '炼器入门', icon: '🔨', description: '任意装备炼器至 +3', metric: 'maxRefine', target: 3, gemReward: 10 },
  { id: 'refine_5', name: '炼器小成', icon: '⚒️', description: '任意装备炼器至 +5', metric: 'maxRefine', target: 5, gemReward: 25 },
  { id: 'refine_10', name: '炼器大师', icon: '🛠️', description: '任意装备炼器至 +10', metric: 'maxRefine', target: 10, gemReward: 90 },

  // ===== 宗门 =====
  { id: 'sect_join', name: '拜入山门', icon: '🏯', description: '加入一个宗门', metric: 'sectJoined', target: 1, gemReward: 8 },
  { id: 'sect_contrib_500', name: '宗门新星', icon: '📌', description: '累计宗门贡献 500', metric: 'sectContrib', target: 500, gemReward: 18 },
  { id: 'sect_contrib_2000', name: '宗门栋梁', icon: '🏛️', description: '累计宗门贡献 2000', metric: 'sectContrib', target: 2000, gemReward: 45 },

  // ===== 转生 =====
  { id: 'rebirth_1', name: '轮回初醒', icon: '☸️', description: '首次转生', metric: 'rebirths', target: 1, gemReward: 50 },
  { id: 'rebirth_3', name: '三世轮回', icon: '☯️', description: '转生 3 次', metric: 'rebirths', target: 3, gemReward: 120 },

  // ===== 奇遇 =====
  { id: 'encounter_1', name: '初遇机缘', icon: '🏮', description: '首次触发奇遇', metric: 'encounters', target: 1, gemReward: 10 },
  { id: 'encounter_10', name: '机缘连连', icon: '🎏', description: '累计触发 10 次奇遇', metric: 'encounters', target: 10, gemReward: 25 },
  { id: 'encounter_40', name: '气运加身', icon: '🧧', description: '累计触发 40 次奇遇', metric: 'encounters', target: 40, gemReward: 60 },

  // ===== 世界 BOSS =====
  { id: 'wb_1', name: '世界之敌', icon: '🐍', description: '首次击杀世界 BOSS', metric: 'wbKills', target: 1, gemReward: 15 },
  { id: 'wb_4', name: '诸神黄昏', icon: '💀', description: '累计击杀 4 只世界 BOSS', metric: 'wbKills', target: 4, gemReward: 40 },
  { id: 'wb_all', name: '弑神者', icon: '🌀', description: '集齐 10 大妖王的首杀', metric: 'wbUnique', target: 10, gemReward: 150 },
  { id: 'wb_dmg_10k', name: '伤害之王', icon: '💯', description: '单次挑战世界 BOSS 造成 1 万伤害', metric: 'wbBestDamage', target: 10000, gemReward: 30 },

  // ===== 锁妖塔 =====
  { id: 'tower_10', name: '初入锁妖塔', icon: '🗼', description: '首次首通锁妖塔第 10 层', metric: 'towerFloor', target: 10, gemReward: 10 },
  { id: 'tower_50', name: '塔中豪杰', icon: '🏯', description: '首通锁妖塔第 50 层', metric: 'towerFloor', target: 50, gemReward: 25 },
  { id: 'tower_100', name: '百层塔主', icon: '🗻', description: '首通锁妖塔第 100 层', metric: 'towerFloor', target: 100, gemReward: 60 },
  { id: 'tower_200', name: '锁妖尊者', icon: '🛕', description: '首通锁妖塔第 200 层', metric: 'towerFloor', target: 200, gemReward: 120 },

  // ===== 每日修行 / 洞府 =====
  { id: 'quest_10', name: '勤修不辍', icon: '📋', description: '累计完成 10 次每日修行任务', metric: 'questsDone', target: 10, gemReward: 10 },
  { id: 'quest_50', name: '修行狂人', icon: '🗓️', description: '累计完成 50 次每日修行任务', metric: 'questsDone', target: 50, gemReward: 30 },
  { id: 'spirit_5', name: '聚灵初成', icon: '🔮', description: '聚灵阵升至 5 级', metric: 'spiritLevel', target: 5, gemReward: 10 },
  { id: 'spirit_20', name: '灵气充盈', icon: '🌟', description: '聚灵阵升至 20 级', metric: 'spiritLevel', target: 20, gemReward: 40 },

  // ===== 修行 =====
  { id: 'offline_10', name: '闭关十次', icon: '🌙', description: '离线修行 10 次', metric: 'offlineSessions', target: 10, gemReward: 8 },
  { id: 'offline_50', name: '闭关老僧', icon: '🛏️', description: '离线修行 50 次', metric: 'offlineSessions', target: 50, gemReward: 20 },
  { id: 'drops_100', name: '搬运工', icon: '🎒', description: '累计获得 100 件掉落物', metric: 'drops', target: 100, gemReward: 6 },
  { id: 'drops_1000', name: '仓库管理员', icon: '📦', description: '累计获得 1000 件掉落物', metric: 'drops', target: 1000, gemReward: 20 },
];

// 计算成就当前进度
export function achievementValue(metric: string, state: GameState): number {
  switch (metric) {
    case 'battles': return state.stats.totalBattles;
    case 'wins': return state.stats.totalWins;
    case 'kills': return state.stats.totalKills;
    case 'bossKills': return state.stats.bossKills;
    case 'goldEarned': return state.stats.totalGoldEarned;
    case 'drops': return state.stats.totalDrops;
    case 'offlineSessions': return state.stats.offlineSessions;
    case 'totalSkill': return totalSkillLevel(state.skills);
    case 'combatSum': return combatLevelSum(state.skills);
    case 'cardTypes': {
      // 与图鉴同口径：按妖兽总表扫描，陈旧卡片 id 不计数
      return countCollectedCards(state.cards);
    }
    case 'pets': return (state.pets ?? []).length;
    // 累计收服口径：放生不影响已收服计数（stats.petsCaptured）
    case 'petsCaptured': return state.stats.petsCaptured ?? 0;
    case 'bestPetLevel': return Math.max(0, ...(state.pets ?? []).map(p => p.level));
    case 'petMaxStage': return Math.max(0, ...(state.pets ?? []).map(p => p.stage ?? 0));
    case 'petMaxStars': return Math.max(0, ...(state.pets ?? []).map(p => p.stars ?? 0));
    case 'maxRefine': return Math.max(0, ...Object.values(state.equips).map(e => e.refine ?? 0));
    case 'sectJoined': return state.sect ? 1 : 0;
    // 累计宗门贡献跨宗门口径：离宗时入账 stats.sectContribTotal，不因脱离/换宗清零
    case 'sectContrib':
      return (state.stats.sectContribTotal ?? 0) + (state.sect?.totalContrib ?? 0);
    case 'rebirths': return state.rebirth?.count ?? 0;
    // 奇遇累计触发次数（stats.encounters，宝箱/商人/灵气/灵兽四类同口径）
    case 'encounters': return state.stats.encounters ?? 0;
    case 'wbKills': return state.stats.wbKills ?? 0;
    case 'wbUnique': return (state.stats.wbSlain ?? []).length;
    case 'wbBestDamage': return state.stats.wbBestDamage ?? 0;
    case 'towerFloor': return Math.max(0, state.tower?.bestFloor ?? 0);
    case 'questsDone': return state.stats.questsDone ?? 0;
    case 'spiritLevel': return Math.max(0, state.spiritArray ?? 0);
    case 'anySkill10': return Math.max(...Object.values(state.skills).map(s => s.level)) >= 10 ? 1 : 0;
    case 'anySkill25': return Math.max(...Object.values(state.skills).map(s => s.level)) >= 25 ? 1 : 0;
    case 'anySkill50': return Math.max(...Object.values(state.skills).map(s => s.level)) >= 50 ? 1 : 0;
    case 'anySkill100': return Math.max(...Object.values(state.skills).map(s => s.level)) >= 100 ? 1 : 0;
    case 'anySkill200': return Math.max(...Object.values(state.skills).map(s => s.level)) >= 200 ? 1 : 0;
    case 'bestQualityLegendary': return bestQualityAtLeast(state, 'legendary') ? 1 : 0;
    case 'bestQualityMythic': return bestQualityAtLeast(state, 'mythic') ? 1 : 0;
    default: return 0;
  }
}

const QUALITY_RANK: Record<string, number> = {
  common: 0, fine: 1, rare: 2, epic: 3, legendary: 4, mythic: 5,
};

function bestQualityAtLeast(state: GameState, q: string): boolean {
  return Object.values(state.equips).some(e => QUALITY_RANK[e.quality] >= QUALITY_RANK[q]);
}

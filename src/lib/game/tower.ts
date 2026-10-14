// ============================================
// 锁妖塔：无限爬塔挑战
// 参考同类放置游戏「王座之塔 / 秘境爬塔」长线玩法：
//   - 每层一只塔中妖兽（属性仅由层数决定，玩家成长后自然推进）
//   - 首通发奖励；败北无惩罚；已通层灵气已汲取，不可重复刷收益
//   - 里程碑：每 5 层宝石、每 10 层稀有装备袋、每 25 层悟道丹、每 50 层仙品装备袋
// 塔怪不入 MONSTER_MAP（不产卡片/装备掉落/捕获），与图鉴、灵宠经济完全隔离
// ============================================

import { MonsterDef, PlayerStats } from '@/types/game';
import { MONSTERS } from './monsters';
import { simulateRound } from './engine';
import { Equipment } from '@/types/game';
import { openEquipBag } from './engine';

// 塔怪难度曲线：有效阶级 = 1 + 0.5 × 层数（第 1 层 1.5 阶，第 100 层 51 阶）
export function towerTier(floor: number): number {
  return Math.round((1 + Math.max(1, floor) * 0.5) * 10) / 10;
}

// 塔中凝形乘区：比野外同阶级略强（血 1.25 / 攻 1.15），金币 ×2.4 补偿推进节奏
const TOWER_HP_MULT = 1.25;
const TOWER_ATK_MULT = 1.15;
const TOWER_GOLD_MULT = 2.4;

// 塔怪属性公式（与 monsters.monsterStats 同源系数，不含妖王乘区防难度跳变）
export function towerMonster(floor: number): MonsterDef {
  const f = Math.max(1, Math.floor(floor));
  const tier = towerTier(f);
  const pool = MONSTERS.filter(m => !m.isBoss); // 120 只常规妖兽循环取名
  const base = pool[(f - 1) % pool.length];
  const hp = Math.round(30 * Math.pow(tier, 1.55) * TOWER_HP_MULT);
  const atk = Math.round(1.8 * Math.pow(tier, 1.2) * TOWER_ATK_MULT);
  const def = Math.round(2.6 * Math.pow(tier, 1.12));
  const speed = Math.round(5 + tier * 0.45);
  const exp = Math.round(4 * Math.pow(tier, 1.65));
  const gold = Math.round(5 * Math.pow(tier, 1.4) * TOWER_GOLD_MULT);
  return {
    id: `tower_${f}`,
    name: base.name,
    icon: '🗼',
    region: 'tower',
    tier,
    hp, atk, def, speed, exp, gold,
    isBoss: false,
    drops: [],
    equipDropRate: 0,
    cardDropRate: 0,
  };
}

// ---------- 首通奖励 ----------

// 每 5 层里程碑宝石
export function towerMilestoneGems(floor: number): number {
  return floor % 5 === 0 ? 5 : 0;
}

// 每 25 层赠送悟道丹
export function towerClearItems(floor: number): { itemId: string; qty: number }[] {
  return floor % 25 === 0 ? [{ itemId: 'pill_exp', qty: 1 }] : [];
}

// 每 10 层稀有装备袋、每 50 层仙品装备袋（品质保底由 openEquipBag 保证）
export type TowerBagKind = 'rare' | 'legendary';
export function towerEquipBag(floor: number): TowerBagKind | null {
  if (floor % 50 === 0) return 'legendary';
  if (floor % 10 === 0) return 'rare';
  return null;
}

export interface TowerRewards {
  gold: number;                          // 塔怪金币（已含 ×2.4，未乘全局金币乘区）
  exp: number;                           // 塔怪经验（五项战斗技能各得，未乘乘区）
  gems: number;                          // 里程碑宝石
  items: { itemId: string; qty: number }[];
  bag: { kind: TowerBagKind; tier: number } | null;
}

export function towerClearRewards(floor: number): TowerRewards {
  const m = towerMonster(floor);
  return {
    gold: m.gold,
    exp: m.exp,
    gems: towerMilestoneGems(floor),
    items: towerClearItems(floor),
    bag: towerEquipBag(floor) ? { kind: towerEquipBag(floor) as TowerBagKind, tier: m.tier } : null,
  };
}

// ---------- 塔中战斗模拟（同步快进，逐回合日志） ----------

export interface TowerLogLine {
  kind: 'info' | 'player' | 'crit' | 'dodge' | 'monster' | 'win' | 'lose';
  text: string;
}

export interface TowerBattleResult {
  won: boolean;
  rounds: number;
  log: TowerLogLine[];
  playerHpLeftPct: number;  // 0-100（战报展示）
  monsterHpLeftPct: number;
}

// 挑战报告 = 战斗结果 + 层数 + 收益（败北 gains=null）
export interface TowerChallengeReport extends TowerBattleResult {
  floor: number;
  monster: MonsterDef;
  gains: {
    gold: number;      // 实入账金币（已乘全局金币乘区）
    gems: number;      // 里程碑宝石（不含升级附赠）
    items: { itemId: string; qty: number }[];
    equip: Equipment | null;
    levelUps: number;  // 五项战斗技能升级总次数
  } | null;
}

// 与 CombatPanel 同一战斗内核（simulateRound），回合上限 400 防死循环，超限判负
export function simulateTowerBattle(pStats: PlayerStats, monster: MonsterDef, playerName: string): TowerBattleResult {
  let pHp = pStats.maxHp;
  let mHp = monster.hp;
  const log: TowerLogLine[] = [
    { kind: 'info', text: `你踏入塔层，与封印妖兽「${monster.name}」（${monster.tier} 阶塔影）对峙！` },
  ];
  let round = 0;
  while (pHp > 0 && mHp > 0 && round < 400) {
    round++;
    const r = simulateRound(pStats, pHp, monster, mHp);
    log.push({
      kind: r.playerCrit ? 'crit' : 'player',
      text: `第${round}回合：你挥出 ${r.playerDmg} 点伤害${r.playerCrit ? '（暴击！）' : ''}`,
    });
    mHp = r.monsterHpAfter;
    if (mHp <= 0) {
      log.push({ kind: 'win', text: `⚔️ 你击败了 ${monster.name}（${round} 回合）！` });
      return { won: true, rounds: round, log, playerHpLeftPct: Math.round((pHp / pStats.maxHp) * 100), monsterHpLeftPct: 0 };
    }
    if (r.playerDodge) {
      log.push({ kind: 'dodge', text: `💨 你身形一闪，避开了 ${monster.name} 的攻击！` });
    } else {
      pHp = r.playerHpAfter;
      log.push({
        kind: 'monster',
        text: `${monster.name} 反击造成 ${r.monsterDmg} 点伤害${r.monsterCrit ? '（暴击！）' : ''}`,
      });
      if (pHp <= 0) {
        log.push({ kind: 'lose', text: `💀 你不敌塔影，被护塔灵光送出塔外...（第 ${round} 回合）` });
        return { won: false, rounds: round, log, playerHpLeftPct: 0, monsterHpLeftPct: Math.round((mHp / monster.hp) * 100) };
      }
    }
  }
  // 400 回合打不死 → 视为败北（防御堆到打不动极端情况）
  log.push({ kind: 'lose', text: `⏳ 僵持不下，护塔灵光将你送出（妖兽血厚难破，提升攻击再来）` });
  return { won: false, rounds: round, log, playerHpLeftPct: Math.round((pHp / pStats.maxHp) * 100), monsterHpLeftPct: Math.round((mHp / monster.hp) * 100) };
}

// 生成塔首通装备袋实例（store 入账用；品质保底与宝袋同口径）
export function makeTowerEquip(bag: { kind: TowerBagKind; tier: number }): Equipment {
  return openEquipBag(Math.max(1, Math.round(bag.tier)), bag.kind);
}

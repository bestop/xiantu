// ============================================
// Zustand 游戏状态 Store
// ============================================

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameState, SkillId, ActivityId, TabId, BattleRewards, EquipSlot,
  Equipment, OfflineReport, InvItem, AchievementState, MoreViewId,
  PlayerSectState, SectId, ActiveBuff, ActiveBuffKey, Statistics, WorldBossState,
} from '@/types/game';
import { ACTIVITY_MAP, xpToNext, gatherTier, combatLevelSum, pillMultiplier } from '@/lib/game/skills';
import {
  computePlayerStats, grantSkillXp, computeOfflineReport, resolveDynamicItemId,
  activityRoundReward, pendingOfflineEquips, getShopEntries, openEquipBag,
  stateXpMult, stateGoldMult, avgCombatLevel,
  pickAutoTarget, autoBattleSeconds, computeOfflineEfficiency, rollDrops,
} from '@/lib/game/engine';
import {
  ENCOUNTER_BATTLE_CHANCE, ENCOUNTER_ACTIVITY_CHANCE, ENCOUNTER_COOLDOWN_MS,
  rollEncounterDraw, dailyGold, DAILY_GEMS, DAILY_STREAK_BONUS_GEMS,
} from '@/lib/game/events';
import { getItem, generateEquipment, genUid, CRAFT_RECIPES, rollQuality } from '@/lib/game/items';
import { MONSTER_MAP } from '@/lib/game/monsters';
import { ACHIEVEMENTS, achievementValue } from '@/lib/game/achievements';
import {
  MAX_PETS, makePet, grantPetXp, releaseGold, normalizePet,
  canEvolve, petEvolveReq, petDisplayName, PET_STAGES, MAX_PET_STARS,
} from '@/lib/game/pets';
import {
  initialWorldBoss, checkRotate, WorldBossAttemptResult, WORLD_BOSSES, wbMaxHp,
} from '@/lib/game/worldboss';
import {
  isRefinable, refineCost, refineSuccessRate, refineOreName,
} from '@/lib/game/refine';
import {
  SECT_MAP, getSectShopEntries, grantContribution, todayKey,
  CONTRIB_PER_KILL, CONTRIB_PER_BOSS, CONTRIB_PER_WB, sectTitleId, sectRank,
} from '@/lib/game/sects';
import {
  initialRebirth, normalizeRebirth, canRebirth, rebirthPointsGain, REBIRTH_TITLES,
} from '@/lib/game/rebirth';
import { ALBUM_REWARDS, isAlbumRewardAvailable, TOWER_SCENES } from '@/lib/game/scenes';
import { getTitleDef, currentSectTitleId, normalizeTitles, WB_KILL_TITLES, hasAllWbTitles, HIDDEN_TITLE_HAOLING } from '@/lib/game/titles';
import { FORGE_MAP, forgeCostCheck, forgeEquipment, forgeSellPrice } from '@/lib/game/forge';
import {
  towerMonster, simulateTowerBattle, towerClearRewards, makeTowerEquip,
  TowerChallengeReport,
} from '@/lib/game/tower';
import {
  ensureQuests, bumpCounter, QUEST_MAP, questGold, QUEST_CHEST, QUEST_GEMS, isQuestsComplete,
} from '@/lib/game/quests';
import { spiritArrayCost } from '@/lib/game/spirit';
import { formatNum } from '@/components/game/ui-bits';

const emptySkills = (): Record<SkillId, { level: number; xp: number }> => {
  const ids: SkillId[] = [
    'hp', 'weaponry', 'power', 'defence', 'speed',
    'mining', 'fishing', 'cooking', 'begging', 'forging',
    'intellect', 'focus', 'luck', 'imbibing', 'insight', 'archaeology',
  ];
  return Object.fromEntries(ids.map(id => [id, { level: 1, xp: 0 }])) as Record<SkillId, { level: number; xp: number }>;
};

const initialStats = () => ({
  totalBattles: 0, totalWins: 0, totalKills: 0, bossKills: 0,
  totalGoldEarned: 0, totalExpEarned: 0, totalDrops: 0,
  offlineSessions: 0, playStart: Date.now(),
  petsCaptured: 0, sectContribTotal: 0, wbKills: 0, wbBestDamage: 0,
  questsDone: 0,
});

const initialState: GameState = {
  initialized: false,
  playerName: '',
  lastTick: Date.now(),
  tab: 'home',
  gold: 100,
  gems: 5,
  skills: emptySkills(),
  activeActivity: null,
  activityProgress: 0,
  inventory: [],
  equips: {},
  equipped: { weapon: null, armor: null, accessory: null },
  cards: {},
  lastRegionId: 'r1',
  autoBattleEnabled: false,
  lastBattleMonsterId: null,
  bgBattleAcc: 0,
  bgTargetId: null,
  bgTargetCheckAt: 0,
  bgKills: 0,
  activeBuffs: [],
  achievements: {},
  stats: initialStats(),
  pets: [],
  activePetUid: null,
  worldBoss: initialWorldBoss(),
  sect: null,
  rebirth: initialRebirth(),
  albumClaims: [],
  titles: [],
  activeTitle: null,
  moreView: 'root',
  encounter: null,
  lastEncounterAt: 0,
  winStreak: 0,
  bestWinStreak: 0,
  dailies: { lastDay: '', streak: 0, best: 0 },
  spiritArray: 0,
  tower: { bestFloor: 0 },
  quests: { dayKey: todayKey(), counters: {}, claimed: [], chestClaimed: false },
  pendingOfflineReport: null,
};

export interface GameStore extends GameState {
  hydrated: boolean;
  toast: string | null;
  toastSeq: number;

  // 生命周期
  markHydrated: () => void;
  createCharacter: (name: string) => void;
  resetGame: () => void;
  setTab: (tab: TabId) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;

  // 活动
  startActivity: (id: ActivityId) => void;
  stopActivity: () => void;
  tick: () => void;

  // 战斗
  setRegion: (regionId: string) => void;
  toggleAutoBattle: () => void;
  setLastBattleMonster: (id: string | null) => void;
  applyBattleResult: (monsterId: string, won: boolean, rewards: BattleRewards) => void;

  // 物品
  useItem: (itemId: string) => string | null;
  consumeItem: (itemId: string, qty?: number) => boolean;
  equipGear: (uid: string) => void;
  unequipGear: (slot: EquipSlot) => void;
  sellMaterial: (itemId: string, qty: number) => void;
  sellEquipment: (uid: string) => void;

  // 商店
  buyShopItem: (itemId: string) => string | null;
  buyEquipBag: (kind: 'rare' | 'legendary') => Equipment | null;
  craft: (recipeId: string) => string | null;

  // 成就
  checkAchievements: () => void;
  claimAchievement: (id: string) => void;

  // 灵宠
  setActivePet: (uid: string | null) => void;
  releasePet: (uid: string) => void;
  evolvePet: (uid: string) => string | null;          // 返回错误信息，null 成功
  fusePet: (mainUid: string, sacrificeUid: string) => string | null;

  // 炼器
  refineGear: (uid: string) => string | null;

  // 炼宝坊
  craftForge: (recipeId: string) => string | null;

  // 宗门
  joinSect: (sectId: SectId) => void;
  leaveSect: () => void;
  buySectItem: (itemId: string) => string | null;

  // 转生
  doRebirth: () => void;

  // 画册奖励与称号
  claimAlbumReward: (id: string) => void;
  cycleTitle: () => void;
  syncAutoTitles: (quiet?: boolean) => void;

  // 世界 BOSS
  applyWorldBossResult: (r: WorldBossAttemptResult) => void;

  // 锁妖塔（仅可挑战下一层；返回战报供面板展示）
  challengeTower: (floor: number) => TowerChallengeReport | null;

  // 每日修行任务
  claimQuest: (id: string) => void;
  claimQuestChest: () => void;

  // 洞府聚灵阵
  upgradeSpiritArray: () => void;

  // 更多面板子视图
  setMoreView: (v: MoreViewId) => void;

  // 奇遇（战斗胜利/挂机轮次概率触发；宝箱三选一/神秘商人/临时增益）
  tryTriggerEncounter: (source: 'battle' | 'activity') => void;
  claimEncounter: (optionId: string) => void;
  dismissEncounter: () => void;
  buyEncounterItem: (key: string) => string | null;

  // 离线
  settleOffline: () => void;
  dismissOfflineReport: () => void;
}

function addItem(inventory: InvItem[], itemId: string, qty: number): InvItem[] {
  const idx = inventory.findIndex(i => i.itemId === itemId);
  if (idx >= 0) {
    const next = [...inventory];
    next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
    return next;
  }
  return [...inventory, { itemId, quantity: qty }];
}

function removeItem(inventory: InvItem[], itemId: string, qty: number): InvItem[] {
  const idx = inventory.findIndex(i => i.itemId === itemId);
  if (idx < 0) return inventory;
  const next = [...inventory];
  const q = next[idx].quantity - qty;
  if (q <= 0) return next.filter(i => i.itemId !== itemId);
  next[idx] = { ...next[idx], quantity: q };
  return next;
}

// 世界 BOSS 存档规范化：bossIdx 越界/负数会令面板取到 undefined 直接崩淡，
// hp 与本期伤害夹紧到合法区间，随后再做 24h 轮换检查
function normalizeWorldBoss(wb: WorldBossState): WorldBossState {
  const len = WORLD_BOSSES.length;
  const rawIdx = Number.isFinite(wb.bossIdx) ? Math.trunc(wb.bossIdx) : 0;
  const bossIdx = ((rawIdx % len) + len) % len;
  const maxHp = wbMaxHp(bossIdx);
  const hp = Math.min(Math.max(0, Number.isFinite(wb.hp) ? wb.hp : maxHp), maxHp);
  const seasonDamage = Math.max(0, Number.isFinite(wb.seasonDamage) ? wb.seasonDamage : 0);
  const spawnedAt = Number.isFinite(wb.spawnedAt) ? wb.spawnedAt : Date.now();
  const lastChallengeAt = Number.isFinite(wb.lastChallengeAt) ? wb.lastChallengeAt : 0;
  return checkRotate({ ...wb, bossIdx, hp, seasonDamage, spawnedAt, lastChallengeAt, killed: !!wb.killed }, Date.now());
}

// 宗门状态规范化（旧档兼容 + 跨天贡献日切）
// - dayKey 非今日：今日贡献归零并刷到今日（跨天离线后昨日 dayContrib 不再残留）
// - 旧档缺 dayKey/dayContrib 字段：兜底 0，避免面板 formatNum(undefined) 显示 NaN
function normalizeSect(sect: PlayerSectState | null | undefined, now: number): PlayerSectState | null {
  if (!sect || typeof sect.sectId !== 'string') return null;
  // 坏档防护：sectId 不在宗门总表（篡改档/跨版本残留）时置空回选择界面，
  // 避免 SectPanel 的 SECT_MAP[sectId] 取 undefined 后 def.tone 抛 TypeError 白屏
  // （同源防护口径：133d763 灵宠 monsterId 校验）
  if (!SECT_MAP[sect.sectId as SectId]) return null;
  const num = (v: unknown): number =>
    Number.isFinite(v) && (v as number) > 0 ? Math.floor(v as number) : 0;
  const key = todayKey(now);
  const isToday = sect.dayKey === key;
  return {
    ...sect,
    contribution: num(sect.contribution),
    totalContrib: num(sect.totalContrib),
    dayKey: key,
    dayContrib: isToday ? num(sect.dayContrib) : 0,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      hydrated: false,
      toast: null,
      toastSeq: 0,

      markHydrated: () => {
        // 旧存档兼容：补齐 v2/v3 新增字段
        const s = get();
        const stats = { ...initialStats(), ...s.stats };
        // 旧档迁移：petsCaptured 字段加入前已拥有灵宠的存档，以当前灵宠数兑底
        if ((s.stats as Partial<Statistics> | undefined)?.petsCaptured === undefined) {
          stats.petsCaptured = (s.pets ?? []).length;
        }
        const worldBoss = s.worldBoss ? normalizeWorldBoss(s.worldBoss) : initialWorldBoss();
        // 坏档防护：丢弃 monsterId 未知的灵宠（旧档/损坏档会令 petStats/petDisplayName 读取
        // MONSTER_MAP 时抛错白屏），同源修复口径见 133d763 坏档规范化
        const pets = (s.pets ?? []).map(normalizePet).filter(p => !!MONSTER_MAP[p.monsterId]);
        // 出战灵宠被过滤/不存在时复位，避免悬空引用
        const activePetUid = pets.some(p => p.uid === s.activePetUid) ? s.activePetUid : null;
        const equips: Record<string, Equipment> = {};
        for (const [uid, e0] of Object.entries(s.equips ?? {})) {
          const e = e0 as Equipment;
          // 旧档兼容 + 炼宝坊专属装备卖价归一（修复：旧档合成品仍带通用公式高价卖价，卖出可套利）
          const recipe = e.baseId ? FORGE_MAP[e.baseId] : undefined;
          const normalized = { ...e, refine: e.refine ?? 0 };
          equips[uid] = recipe ? { ...normalized, sellPrice: forgeSellPrice(recipe) } : normalized;
        }
        // 穿戴槽位重绑到装备池对象（修复：反序列化后 equipped 与 equips 池引用脱钩，
        // 此后穿戴中炼器更新池对象时槽位感知不到，属性加成静默失效）
        const equipped = { ...s.equipped };
        for (const slot of ['weapon', 'armor', 'accessory'] as EquipSlot[]) {
          const cur = equipped[slot];
          if (cur && equips[cur.uid]) equipped[slot] = equips[cur.uid];
        }
        const rebirth = normalizeRebirth(s.rebirth);
        const now = Date.now();
        // v6 新增字段兜底：锁妖塔/每日任务/聚灵阵（旧档缺失时钳 0 / 全新一日）
        const tower = {
          bestFloor: Math.max(0, Number.isFinite(s.tower?.bestFloor) ? Math.floor(s.tower!.bestFloor) : 0),
        };
        const quests = ensureQuests(s.quests, now);
        const spiritArray = Math.max(0, Number.isFinite(s.spiritArray) ? Math.floor(s.spiritArray as number) : 0);
        // 奇遇/连胜/签到旧档兼容（缺字段兑底；未知类型或已过期的奇遇直接清理）
        const encounter = s.encounter
          && (s.encounter.kind === 'treasure' || s.encounter.kind === 'merchant')
          && s.encounter.expireAt > now
          ? s.encounter
          : null;
        const winStreak = Math.max(0, Math.floor(s.winStreak ?? 0) || 0);
        const bestWinStreak = Math.max(winStreak, Math.max(0, Math.floor(s.bestWinStreak ?? 0) || 0));
        const dailies = {
          lastDay: typeof s.dailies?.lastDay === 'string' ? s.dailies.lastDay : '',
          streak: Math.max(0, Math.floor(s.dailies?.streak ?? 0) || 0),
          best: Math.max(0, Math.floor(s.dailies?.best ?? 0) || 0),
        };
        // 旧档兼容：技能表新增 id 时从初始值补齐，避免 skills.focus.level 等直接访问 undefined 崩溃
        const skills = { ...emptySkills(), ...(s.skills ?? {}) };
        const tn = normalizeTitles(s);
        // 旧存档 buff 迁移：activeBattleBuffAtk/buffExpireAt → activeBuffs（并丢弃已过期）
        let buffs: ActiveBuff[] = (s.activeBuffs ?? []).filter(b => b && b.expireAt > now);
        const legacyAtk = (s as unknown as { activeBattleBuffAtk?: number }).activeBattleBuffAtk ?? 0;
        const legacyExpire = (s as unknown as { buffExpireAt?: number }).buffExpireAt ?? 0;
        if (legacyAtk > 0 && legacyExpire > now && !buffs.some(b => b.key === 'atk')) {
          buffs = [...buffs, { key: 'atk', value: legacyAtk, expireAt: legacyExpire }];
        }
        set({
          hydrated: true, stats, worldBoss, pets, equips, equipped, rebirth, skills, activePetUid,
          encounter, lastEncounterAt: s.lastEncounterAt ?? 0, winStreak, bestWinStreak, dailies,
          titles: tn.titles, activeTitle: tn.activeTitle,
          albumClaims: s.albumClaims ?? [],
          sect: normalizeSect(s.sect, now),
          activeBuffs: buffs,
          tower, quests, spiritArray,
          // 最近战斗妖兽 id 兼容：坏档/跨版本残留的非法 id 复位为 null（续战入口会自动跳过）
          lastBattleMonsterId: (s.lastBattleMonsterId && MONSTER_MAP[s.lastBattleMonsterId])
            ? s.lastBattleMonsterId : null,
          // 后台战斗瞬态字段不入档，hydrate 时归零（partials 已排除，这里双保险）
          bgBattleAcc: 0, bgTargetId: null, bgTargetCheckAt: 0, bgKills: 0,
          // 已入账的离线报告不持久化：刷新后不再重弹旧报告（收益已在入账时落定）
          pendingOfflineReport: null,
        });
        get().syncAutoTitles(true);
        get().settleOffline();
      },

      createCharacter: (name) => {
        set({
          ...initialState,
          stats: { ...initialStats(), playStart: Date.now() },
          lastTick: Date.now(),
          worldBoss: initialWorldBoss(),
          initialized: true,
          playerName: name || '无名散修',
        });
        get().showToast(`道友 ${name || '无名散修'}，踏上仙途！`);
      },

      resetGame: () => {
        set({ ...initialState, lastTick: Date.now(), hydrated: true });
      },

      setTab: (tab) => set({ tab }),

      showToast: (msg) => set(s => ({ toast: msg, toastSeq: s.toastSeq + 1 })),
      clearToast: () => set({ toast: null }),

      // ---------- 活动 ----------
      startActivity: (id) => set({ activeActivity: id, activityProgress: 0 }),
      stopActivity: () => set({ activeActivity: null, activityProgress: 0 }),

      tick: () => {
        const state = get();
        const now = Date.now();
        if (!state.initialized) { set({ lastTick: now }); return; }

        const deltaSec = Math.max(0, (now - state.lastTick) / 1000);
        // 超过 90 秒的空窗直接走离线结算（修复：此前仅重置 lastTick，导致恢复前台时挂机收益丢失）
        if (deltaSec > 90) { get().settleOffline(); return; }

        // 过期丹药 buff 清理（轻量：仅在确有过期时写回）
        if ((state.activeBuffs ?? []).some(b => b.expireAt <= now)) {
          set({ activeBuffs: state.activeBuffs.filter(b => b.expireAt > now) });
        }

        // 世界 BOSS 24h 自动轮换（修复：此前仅启动时检查，在线挂机到点不轮换，与轮换表文案不符）
        const rotatedBoss = checkRotate(state.worldBoss, now);
        if (rotatedBoss !== state.worldBoss) {
          set({ worldBoss: rotatedBoss });
        }

        let gold = state.gold;
        let gems = state.gems;
        const skills = { ...state.skills };
        let inventory = state.inventory;
        let activityProgress = state.activityProgress;
        let levelUps = 0;
        // 成就统计同源：在线活动金币/产出物也计入累计口径（与离线结算一致）
        let roundGold = 0;
        let roundDrops = 0;
        let roundsDone = 0;
        const xpMult = stateXpMult(state);
        const goldMult = stateGoldMult(state);

        // 每日签到：跨天首秒发放（昨日衔接则连签 +1，否则重置为第 1 天；每满 7 天额外奖励）
        let dailies = state.dailies;
        const tKey = todayKey(now);
        if (dailies.lastDay !== tKey) {
          const yesterday = todayKey(now - 86_400_000);
          const streak = dailies.lastDay === yesterday ? dailies.streak + 1 : 1;
          const bonus = streak % 7 === 0 ? DAILY_STREAK_BONUS_GEMS : 0;
          dailies = { lastDay: tKey, streak, best: Math.max(dailies.best, streak) };
          gems += DAILY_GEMS + bonus;
          gold += dailyGold(avgCombatLevel(state));
          // 延迟到 set 后 toast（下方统一处理）
          setTimeout(() => get().showToast(`📅 每日签到 第 ${streak} 天：+${DAILY_GEMS + bonus}💎${bonus > 0 ? `（连签 ${streak} 天额外 +${bonus}💎）` : ''}`), 50);
        }

        // 每日修行任务：跨天日切（与签到同机制，重置计数/领取状态；markHydrated 已兌底规范化）
        let quests = state.quests;
        if (!quests || quests.dayKey !== tKey) {
          quests = { dayKey: tKey, counters: {}, claimed: [], chestClaimed: false };
        }

        // 过期奇遇清理（宝箱 10 分钟未选 / 商人 90 秒离场）
        const encounter = state.encounter && state.encounter.expireAt > now ? state.encounter : null;
        if (encounter !== state.encounter) {
          set({ encounter });
        }

        // 活动推进（基于真实时间差，兼容后台限流）
        if (state.activeActivity) {
          const act = ACTIVITY_MAP[state.activeActivity];
          if (act) {
            activityProgress += deltaSec / act.intervalSec;
            let guard = 0;
            while (activityProgress >= 1 && guard < 60) {
              activityProgress -= 1;
              guard++;
              roundsDone = guard;
              // 结算一轮
              const r = activityRoundReward(state.activeActivity, state);
              const res = grantSkillXp(skills, act.skillId, r.skillXp, skills.intellect.level, xpMult);
              levelUps += res.levelsGained;
              gems += res.gems;
              if (r.gold > 0) { const g = Math.round(r.gold * goldMult); gold += g; roundGold += g; }
              if (r.itemId && r.itemQty > 0) {
                inventory = addItem(inventory, r.itemId, r.itemQty);
                roundDrops += r.itemQty;
              }
              if (r.gem) { gems += 1; }
            }
            // 每日任务：挂机轮次计数（离线结算同源计入）
            if (roundsDone > 0) {
              quests = bumpCounter(quests, 'rounds', roundsDone);
            }
          }
        }

        set({
          lastTick: now,
          gold, gems, skills, inventory,
          activityProgress,
          dailies,
          ...(quests !== state.quests ? { quests } : {}),
          // 仅在确有收益时写入统计，避免每秒无谓的 stats 对象重建
          ...(roundGold > 0 || roundDrops > 0 ? {
            stats: {
              ...state.stats,
              totalGoldEarned: state.stats.totalGoldEarned + roundGold,
              totalDrops: state.stats.totalDrops + roundDrops,
            },
          } : {}),
        });

        // 挂机活动轮次完成 → 小概率触发奇遇（占用/冷却检查在 action 内）
        if (roundsDone > 0) {
          get().tryTriggerEncounter('activity');
        }

        // 页签后台自动战斗（修复：此前战斗循环全在 CombatPanel 组件局部，切页即卸载中断，
        // 自动战斗只剩离线结算一个入口）。战斗页不在前台时，由 tick 按离线同款模型持续讨伐：
        // 收益路径与在线 UI 战斗完全同源（rollDrops → applyBattleResult：技能经验/宠物经验/
        // 掉落/连胜/宗门贡献/任务计数/成就）。⚠️ 必须在上方主 set 之后执行——
        // applyBattleResult 以最新 state 入账，若在主 set 之前调用会被旧快照覆盖写入。
        if (state.autoBattleEnabled && state.tab !== 'combat') {
          // 目标怪缓存：每 15s 重算一次（3 局稳定胜模拟较重，不能每秒跑）
          let targetId = state.bgTargetId;
          let bgTargetCheckAt = state.bgTargetCheckAt;
          if (!targetId || !MONSTER_MAP[targetId] || now - bgTargetCheckAt > 15000) {
            const t = pickAutoTarget(state);
            targetId = t ? t.id : null;
            bgTargetCheckAt = now;
          }
          const target = targetId ? MONSTER_MAP[targetId] : null;
          if (target) {
            const pStats = computePlayerStats(state);
            const battleSec = autoBattleSeconds(pStats, target);
            let acc = state.bgBattleAcc + deltaSec * computeOfflineEfficiency(state);
            let kills = 0;
            while (acc >= battleSec && kills < 30) { // 单 tick 击杀上限防爆发
              acc -= battleSec;
              kills++;
              const rewards = rollDrops(target, get(), pStats.luck);
              get().applyBattleResult(target.id, true, rewards);
            }
            if (kills > 0) {
              set({ bgKills: get().bgKills + kills });
            }
            set({ bgBattleAcc: acc, bgTargetId: targetId, bgTargetCheckAt });
          } else {
            set({ bgTargetId: null, bgTargetCheckAt: now });
          }
        }

        // 定期检查成就（每 5 秒）
        if (Math.floor(now / 1000) % 5 === 0 || levelUps > 0) {
          get().checkAchievements();
        }
      },

      // 消耗物品（战斗中喝药等场景由 UI 自己处理逻辑）
      consumeItem: (itemId, qty = 1) => {
        const state = get();
        const inv = state.inventory.find(i => i.itemId === itemId);
        if (!inv || inv.quantity < qty) return false;
        set({ inventory: removeItem(state.inventory, itemId, qty) });
        return true;
      },

      // ---------- 战斗 ----------
      setRegion: (regionId) => set({ lastRegionId: regionId }),
      toggleAutoBattle: () => set(s => ({ autoBattleEnabled: !s.autoBattleEnabled })),
      setLastBattleMonster: (id) => set({ lastBattleMonsterId: id }),

      applyBattleResult: (monsterId, won, rewards) => {
        const state = get();
        const monster = MONSTER_MAP[monsterId];
        if (!monster) return;

        const skills = { ...state.skills };
        let gems = state.gems;
        let levelUps = 0;
        const xpMult = stateXpMult(state);

        if (won) {
          // 5 项战斗技能各得经验
          for (const id of ['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[]) {
            const r = grantSkillXp(skills, id, rewards.exp, skills.intellect.level, xpMult);
            gems += r.gems;
            levelUps += r.levelsGained;
          }
          // 战斗宝石掉落入账（修复：此前 rewards.gems 从未加进 gems，UI 却提示获得）
          gems += rewards.gems;
        }

        // 出战灵宠获得经验
        let pets = state.pets;
        if (won && state.activePetUid) {
          const idx = pets.findIndex(p => p.uid === state.activePetUid);
          if (idx >= 0) {
            const { pet, levelsGained } = grantPetXp(pets[idx], rewards.exp * 1.2);
            pets = [...pets];
            pets[idx] = pet;
            if (levelsGained > 0) {
              get().showToast(`🐾 ${petDisplayName(pet)} 升至 ${pet.level} 级！`);
            }
          }
        }

        // 物品入包
        let inventory = state.inventory;
        const equips = { ...state.equips };
        const cards = { ...state.cards };
        let drops = 0;

        for (const it of rewards.items) {
          inventory = addItem(inventory, it.itemId, it.qty);
          drops += it.qty;
        }
        for (const eq of rewards.equips) {
          equips[eq.uid] = eq;
          inventory = addItem(inventory, `equip:${eq.uid}`, 1);
          drops += 1;
        }
        for (const c of rewards.cards) {
          cards[c.monsterId] = (cards[c.monsterId] ?? 0) + 1;
          drops += 1;
        }

        // 灵宠捕获
        let petsCaptured = 0;
        if (won && rewards.petCapture) {
          if (pets.length < MAX_PETS) {
            const pet = makePet(rewards.petCapture);
            pets = [...pets, pet];
            petsCaptured = 1;
            get().showToast(`🥚 妖兽 ${monster.name} 被你感动，自愿随你修行！（灵宠 +1）`);
          } else {
            get().showToast('灵宠栏已满，未能收服该妖兽');
          }
        }

        const goldGain = won ? Math.round(rewards.gold * stateGoldMult(state)) : 0;
        // 连胜：胜 +1 败清零（在线战斗专属，离线不累计）；每 10 连胜发里程碑奖励
        const winStreak = won ? state.winStreak + 1 : 0;
        const bestWinStreak = Math.max(state.bestWinStreak ?? 0, winStreak);
        let streakGold = 0;
        let streakGems = 0;
        if (won && winStreak % 10 === 0) {
          streakGold = Math.round(500 * (1 + avgCombatLevel(state) * 0.1));
          streakGems = 3;
        }
        const gold = state.gold + goldGain + streakGold;

        // 宗门贡献：胜利 +1，妖王 +10
        let sect = state.sect;
        if (sect && won) {
          sect = grantContribution(sect, monster.isBoss ? CONTRIB_PER_BOSS : CONTRIB_PER_KILL);
        }

        // 每日任务：击杀/胜利计数（离线战斗同源计入）
        let quests = state.quests;
        if (won) {
          quests = bumpCounter(quests, 'kills');
          quests = bumpCounter(quests, 'wins');
        }

        const stats = {
          ...state.stats,
          totalBattles: state.stats.totalBattles + 1,
          totalWins: state.stats.totalWins + (won ? 1 : 0),
          totalKills: state.stats.totalKills + (won ? 1 : 0),
          bossKills: state.stats.bossKills + (won && monster.isBoss ? 1 : 0),
          totalGoldEarned: state.stats.totalGoldEarned + goldGain, // 与实际入账同源（含金币加成乘区）
          totalExpEarned: state.stats.totalExpEarned + (won ? rewards.exp : 0),
          totalDrops: state.stats.totalDrops + drops,
          petsCaptured: (state.stats.petsCaptured ?? 0) + petsCaptured,
        };

        set({ skills, gems: gems + streakGems, inventory, equips, cards, gold, stats, pets, sect, winStreak, bestWinStreak, ...(quests !== state.quests ? { quests } : {}) });
        if (won) {
          // 奇遇：战斗胜利小概率触发（冷却/占用检查在 action 内）
          get().tryTriggerEncounter('battle');
          if (streakGems > 0) {
            get().showToast(`🔥 连胜 ${winStreak}！里程碑奖励：+${formatNum(streakGold)} 金币 +${streakGems}💎`);
          }
        } else if (state.winStreak >= 10) {
          get().showToast(`💔 连胜终结（${state.winStreak} 连胜）。重整旗鼓，再战！`);
        }
        get().checkAchievements();
      },

      // ---------- 物品 ----------
      useItem: (itemId) => {
        const state = get();
        const item = getItem(itemId);
        const inv = state.inventory.find(i => i.itemId === itemId);
        if (!item || !inv || item.type !== 'pill') return '该物品无法使用';
        if (item.pillEffect === undefined) return '该物品无法使用';

        const stats = computePlayerStats(state);
        let message = '';
        const skills = { ...state.skills };

        if (item.pillEffect === 'heal') {
          return `${item.name}请在战斗中使用`;
        }
        if (item.pillEffect === 'exp') {
          let gems = state.gems;
          let levelUps = 0;
          const xpMult = stateXpMult(state);
          const pillVal = Math.round((item.pillValue ?? 500) * pillMultiplier(state.skills.imbibing?.level ?? 0));
          for (const id of ['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[]) {
            const r = grantSkillXp(skills, id, pillVal, skills.intellect.level, xpMult);
            gems += r.gems;
            levelUps += r.levelsGained;
          }
          const inventory = removeItem(state.inventory, itemId, 1);
          set({ skills, gems, inventory });
          message = `服下${item.name}，五项战斗技能各涨修为${levelUps > 0 ? `（升级 ${levelUps} 次）` : ''}`;
          get().checkAchievements();
          return message;
        }
        // buff 类：写入多 buff 队列（同类刷新时长；攻防速金为百分比，气运加算，捕获为乘区）
        const buffKeyMap: Record<string, ActiveBuffKey> = {
          buffAtk: 'atk', buffDef: 'def', buffSpd: 'spd',
          buffGold: 'gold', buffLuck: 'luck', buffCap: 'cap',
        };
        const bKey = buffKeyMap[item.pillEffect];
        if (!bKey) return '该物品无法使用';
        // 灵酒加成对全部丹药生效（修复：此前仅战斗喝血吃到乘区）
        const bValue = Math.max(1, Math.round((item.pillValue ?? 30) * pillMultiplier(state.skills.imbibing?.level ?? 0)));
        const now = Date.now();
        const others = (state.activeBuffs ?? []).filter(b => b.expireAt > now && b.key !== bKey);
        const activeBuffs: ActiveBuff[] = [...others, { key: bKey, value: bValue, expireAt: now + 10 * 60 * 1000 }];
        set({ activeBuffs, inventory: removeItem(state.inventory, itemId, 1) });
        const pctDesc = bKey === 'luck' ? `气运 +${bValue}`
          : bKey === 'cap' ? `灵宠捕获率 ×${(bValue / 100).toFixed(1)}`
          : `${{ atk: '攻击', def: '防御', spd: '速度', gold: '金币收益' }[bKey]} +${bValue}%`;
        return `服下${item.name}，${pctDesc}（10 分钟）`;
      },

      equipGear: (uid) => {
        const state = get();
        const eq = state.equips[uid];
        if (!eq) return;
        const equipped = { ...state.equipped };
        const prev = equipped[eq.slot];
        equipped[eq.slot] = eq;
        set({ equipped });
        get().showToast(`已装备 ${eq.name}`);
      },

      unequipGear: (slot) => {
        const state = get();
        if (!state.equipped[slot]) return;
        const equipped = { ...state.equipped };
        equipped[slot] = null;
        set({ equipped });
      },

      sellMaterial: (itemId, qty) => {
        const state = get();
        const item = getItem(itemId);
        const inv = state.inventory.find(i => i.itemId === itemId);
        if (!item || !inv) return;
        const sellQty = Math.min(qty, inv.quantity);
        const goldGain = item.sellPrice * sellQty;
        const inventory = removeItem(state.inventory, itemId, sellQty);
        set({
          inventory,
          gold: state.gold + goldGain,
          stats: { ...state.stats, totalGoldEarned: state.stats.totalGoldEarned + goldGain },
        });
        get().showToast(`售出 ${item.name}×${sellQty}，获得 ${goldGain} 金币`);
      },

      sellEquipment: (uid) => {
        const state = get();
        const eq = state.equips[uid];
        if (!eq) return;
        // 穿戴中的装备禁止出售（防 UI 之外的路径卖出生效中装备）
        if (Object.values(state.equipped).some(e => e?.uid === uid)) {
          get().showToast('已穿戴的装备不可出售，请先卸下');
          return;
        }
        const equips = { ...state.equips };
        delete equips[uid];
        const inventory = removeItem(state.inventory, `equip:${uid}`, 1);
        set({
          equips,
          inventory,
          gold: state.gold + eq.sellPrice,
          stats: { ...state.stats, totalGoldEarned: state.stats.totalGoldEarned + eq.sellPrice },
        });
        get().showToast(`售出 ${eq.name}，获得 ${eq.sellPrice} 金币`);
      },

      // ---------- 商店 ----------
      buyShopItem: (itemId) => {
        const state = get();
        const entry = getShopEntries().find(e => e.itemId === itemId);
        if (!entry) return '商品不存在';
        if (entry.currency === 'gold') {
          if (state.gold < entry.price) return '金币不足';
          set({
            gold: state.gold - entry.price,
            inventory: addItem(state.inventory, itemId, itemId === 'herb_1' ? 5 : 1),
          });
        } else {
          if (state.gems < entry.price) return '宝石不足';
          set({
            gems: state.gems - entry.price,
            inventory: addItem(state.inventory, itemId, 1),
          });
        }
        get().showToast(`购得 ${entry.label}`);
        return null;
      },

      buyEquipBag: (kind) => {
        const state = get();
        const price = kind === 'legendary' ? 60 : 20;
        if (state.gems < price) {
          get().showToast('宝石不足');
          return null;
        }
        const avgLv = Math.max(1, Math.round(
          (['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[])
            .reduce((a, id) => a + state.skills[id].level, 0) / 5
        ));
        const eq = kind === 'legendary'
          ? generateEquipment(Math.max(1, avgLv), 'legendary')
          : openEquipBag(avgLv, 'rare');
        const equips = { ...state.equips };
        equips[eq.uid] = eq;
        set({
          gems: state.gems - price,
          equips,
          inventory: addItem(state.inventory, `equip:${eq.uid}`, 1),
        });
        get().showToast(`开启宝袋，获得【${eq.name}】！`);
        // 仙品宝袋直接触发装备类成就（与其他获取路径同源，不再等 5s 轮询兕底）
        get().checkAchievements();
        return eq;
      },

      // ---------- 生产（炼丹/锻造） ----------
      craft: (recipeId) => {
        const state = get();
        const recipe = CRAFT_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return '配方不存在';
        const skillLevel = state.skills[recipe.kind].level;
        if (skillLevel < recipe.minSkillLevel) return `${recipe.kind === 'cooking' ? '炼丹' : '锻造'}等级不足（需 ${recipe.minSkillLevel} 级）`;

        // 检查材料（ore_dynamic 按锻造阶级解析）
        let inventory = state.inventory;
        const consumed: { itemId: string; qty: number }[] = [];
        for (const m of recipe.materials) {
          const realId = m.itemId === 'ore_dynamic'
            ? `ore_${gatherTier(skillLevel)}`
            : m.itemId;
          const have = inventory.find(i => i.itemId === realId)?.quantity ?? 0;
          if (have < m.qty) {
            const mat = getItem(realId);
            return `材料不足：${mat?.name ?? realId} ×${m.qty}`;
          }
          consumed.push({ itemId: realId, qty: m.qty });
        }
        for (const c of consumed) {
          inventory = removeItem(inventory, c.itemId, c.qty);
        }

        const skills = { ...state.skills };
        let gems = state.gems;
        const res = grantSkillXp(skills, recipe.kind, recipe.skillXp * 3, skills.intellect.level, stateXpMult(state));
        gems += res.gems;

        let equips = state.equips;
        let toast = '';
        let quests = state.quests;
        if (recipe.kind === 'cooking' && recipe.outputItemId) {
          inventory = addItem(inventory, recipe.outputItemId, 1);
          const out = getItem(recipe.outputItemId);
          toast = `炼成 ${out?.icon}${out?.name}！`;
        } else if (recipe.kind === 'forging') {
          // 锻造：装备阶级随锻造等级，百炼/大师提高品质权重
          const tier = Math.max(1, Math.min(80, skillLevel));
          const bonusRare = recipeId === 'forge_master' ? 10 : recipeId === 'forge_refined' ? 4 : 0;
          const quality = rollQuality(1 + skillLevel * 0.01, bonusRare);
          const eq = generateEquipment(tier, quality);
          equips = { ...equips, [eq.uid]: eq };
          inventory = addItem(inventory, `equip:${eq.uid}`, 1);
          toast = `锻造出【${eq.name}】！`;
        }
        // 每日任务：炼制计数（炼丹/锻造均计）
        quests = bumpCounter(quests, 'craft');

        set({ inventory, skills, gems, equips, quests });
        get().showToast(toast);
        get().checkAchievements();
        return null;
      },

      // ---------- 成就 ----------
      checkAchievements: () => {
        const state = get();
        let gems = state.gems;
        const achievements = { ...state.achievements };
        let unlockedAny = false;

        for (const def of ACHIEVEMENTS) {
          const cur = achievements[def.id];
          if (cur?.claimed) continue;
          const value = achievementValue(def.metric, state);
          if (!cur || cur.bestValue < value) {
            achievements[def.id] = { ...(cur ?? { claimed: false, bestValue: 0 }), bestValue: value };
          }
          // 永久成就口径：按高水位（bestValue）判定——进度曾在两次检查之间达标后
          // 回退（放生灵宠/出售装备等）也不会错失成就
          if (Math.max(value, cur?.bestValue ?? 0) >= def.target && !(cur?.claimed)) {
            achievements[def.id] = { bestValue: Math.max(value, cur?.bestValue ?? 0), claimed: true };
            gems += def.gemReward;
            unlockedAny = true;
            get().showToast(`🏆 达成成就【${def.name}】 +${def.gemReward}💎`);
          }
        }
        if (unlockedAny || JSON.stringify(achievements) !== JSON.stringify(state.achievements)) {
          set({ achievements, gems });
        }
        // 位阶/转生/首杀等自动称号实时回填（修复：位阶晋升称号此前仅在刷新后授予）
        get().syncAutoTitles();
      },

      claimAchievement: (id) => {
        const state = get();
        const def = ACHIEVEMENTS.find(a => a.id === id);
        const cur = state.achievements[id];
        if (!def || !cur || cur.claimed) return;
        // 高水位口径：曾达标即视为达成，当前值回退不拦截领取
        const value = Math.max(achievementValue(def.metric, state), cur.bestValue ?? 0);
        if (value < def.target) return;
        set({
          achievements: { ...state.achievements, [id]: { bestValue: value, claimed: true } },
          gems: state.gems + def.gemReward,
        });
        get().showToast(`🏆 领取成就奖励 +${def.gemReward}💎`);
      },

      // ---------- 灵宠 ----------
      setActivePet: (uid) => set({ activePetUid: uid }),

      evolvePet: (uid) => {
        const state = get();
        const idx = state.pets.findIndex(p => p.uid === uid);
        if (idx < 0) return '灵宠不存在';
        const pet = state.pets[idx];
        if (!canEvolve(pet)) return '已达进化上限（神兽）';
        const req = petEvolveReq(pet);
        if (pet.level < req.level) return `等级不足（需 ${req.level} 级）`;
        if (state.gold < req.gold) return `金币不足（需 ${formatNum(req.gold)}）`;
        const coreHave = state.inventory.find(i => i.itemId === 'core_1')?.quantity ?? 0;
        if (coreHave < req.core) return `妖丹不足（需 ${req.core} 颗）`;
        if (req.gems > 0 && state.gems < req.gems) return `宝石不足（需 ${req.gems} 颗）`;

        const inventory = removeItem(state.inventory, 'core_1', req.core);
        const pets = [...state.pets];
        pets[idx] = { ...pet, stage: pet.stage + 1 };
        const nextStage = PET_STAGES[pet.stage + 1];
        set({ pets, inventory, gold: state.gold - req.gold, gems: state.gems - req.gems });
        get().showToast(`🌈 灵宠进化为「${nextStage.prefix}${MONSTER_MAP[pet.monsterId].name}」！属性×${nextStage.mult}`);
        get().checkAchievements();
        return null;
      },

      fusePet: (mainUid, sacrificeUid) => {
        const state = get();
        if (mainUid === sacrificeUid) return '不能以自身为祭品';
        const mainIdx = state.pets.findIndex(p => p.uid === mainUid);
        const sac = state.pets.find(p => p.uid === sacrificeUid);
        if (mainIdx < 0 || !sac) return '灵宠不存在';
        const main = state.pets[mainIdx];
        if (main.monsterId !== sac.monsterId) return '仅同种妖兽方可融合';
        if (main.stars >= MAX_PET_STARS) return '已达五星上限';

        // 星级守恒融合（修复：此前祭品星级被无声丢弃——误以高星同族为祭品会永久蒸发
        // 已有星级，且 petMaxStars 成就按存栏推导随之回退）。新规则：主宠新星数 =
        // 主宠 + 1 + 祭品（钳五星上限）。每次融合星质量仍净增 +1，6 只同族 → 5★ 的
        // 成本不变，无通货膨胀；附带效果：高星祭品可整体迁移星级到主宠，任何融合
        // 分支都不再毁星。
        const newStars = Math.min(MAX_PET_STARS, main.stars + 1 + sac.stars);
        let pets = state.pets.filter(p => p.uid !== sacrificeUid);
        pets = pets.map(p => p.uid === mainUid ? { ...p, stars: newStars } : p);
        set({
          pets,
          activePetUid: state.activePetUid === sacrificeUid ? mainUid : state.activePetUid,
        });
        get().showToast(`✨ 融合成功！${petDisplayName(main)} 升至 ${newStars} 星`);
        get().checkAchievements();
        return null;
      },

      releasePet: (uid) => {
        const state = get();
        const pet = state.pets.find(p => p.uid === uid);
        if (!pet) return;
        const gold = releaseGold(pet);
        const pets = state.pets.filter(p => p.uid !== uid);
        set({
          pets,
          activePetUid: state.activePetUid === uid ? null : state.activePetUid,
          gold: state.gold + gold,
          stats: { ...state.stats, totalGoldEarned: state.stats.totalGoldEarned + gold },
        });
        get().showToast(`放生灵宠，获得 ${gold} 金币`);
      },

      // ---------- 炼器 ----------
      refineGear: (uid) => {
        const state = get();
        const eq = state.equips[uid];
        if (!eq) return '装备不存在';
        if (!isRefinable(eq)) return '已达炼器上限 +10';
        const cost = refineCost(eq);
        const oreHave = state.inventory.find(i => i.itemId === cost.oreId)?.quantity ?? 0;
        if (oreHave < cost.oreQty) return `${refineOreName(eq)}不足（需 ${cost.oreQty} 块）`;
        if (state.gold < cost.gold) return `金币不足（需 ${formatNum(cost.gold)}）`;

        const rate = refineSuccessRate(eq);
        const success = Math.random() < rate;
        const inventory = removeItem(state.inventory, cost.oreId, cost.oreQty);
        const gold = state.gold - cost.gold;
        const equips = { ...state.equips };
        if (success) {
          const nextRefine = (eq.refine ?? 0) + 1;
          equips[uid] = { ...eq, refine: nextRefine };
          // 穿戴中的装备同步槽位引用（修复：此前仅更新装备池，equipped 槽位仍持旧对象，
          // 穿戴中炼器成功但 computePlayerStats 读不到新 refine，属性加成静默失效）
          const equipped = { ...state.equipped };
          let equippedChanged = false;
          for (const slot of ['weapon', 'armor', 'accessory'] as EquipSlot[]) {
            if (equipped[slot]?.uid === uid) { equipped[slot] = equips[uid]; equippedChanged = true; }
          }
          set(equippedChanged ? { inventory, gold, equips, equipped } : { inventory, gold, equips });
          get().showToast(`🔨 炼器成功！${eq.name} 强化至 +${nextRefine}`);
        } else {
          set({ inventory, gold, equips });
          get().showToast('💥 炼器失败，材料已折损（装备无损）');
        }
        get().checkAchievements();
        return null;
      },

      // ---------- 炼宝坊 ----------
      craftForge: (recipeId) => {
        const state = get();
        const recipe = FORGE_MAP[recipeId];
        if (!recipe) return '配方不存在';
        const check = forgeCostCheck(recipe, state.inventory, state.gold);
        if (!check.ok) return `材料不足：${check.missing.join('、')}`;

        let inventory = removeItem(state.inventory, recipe.materialId, recipe.coreQty);
        for (const m of recipe.extraMats) {
          inventory = removeItem(inventory, m.itemId, m.qty);
        }
        const gold = state.gold - recipe.gold;
        const eq = forgeEquipment(recipe);
        const equips = { ...state.equips, [eq.uid]: eq };
        inventory = addItem(inventory, `equip:${eq.uid}`, 1);

        set({ inventory, gold, equips });
        get().showToast(`⚒️ 专属装备「${recipe.name}」炼成！`);
        get().checkAchievements();
        return null;
      },

      // ---------- 宗门 ----------
      joinSect: (sectId) => {
        const state = get();
        if (state.sect) return;
        const sect: PlayerSectState = {
          sectId,
          contribution: 0,
          totalContrib: 0,
          joinedAt: Date.now(),
          dayKey: todayKey(),
          dayContrib: 0,
        };
        const titleId = sectTitleId(sectId, 'outer');
        const titles = (state.titles ?? []).includes(titleId)
          ? state.titles
          : [...(state.titles ?? []), titleId];
        set({ sect, titles });
        get().showToast(`🙏 拜入${SECT_MAP[sectId].name}，成为外门弟子！`);
        get().checkAchievements();
      },

      leaveSect: () => {
        const state = get();
        if (!state.sect) return;
        const titles = (state.titles ?? []).filter(t => !t.startsWith('sect_'));
        set({
          sect: null,
          titles,
          activeTitle: state.activeTitle?.startsWith('sect_') ? null : state.activeTitle,
          // 累计贡献入账终身统计（成就口径不因脱离宗门清零）；可消费贡献照旧清零
          stats: {
            ...state.stats,
            sectContribTotal: (state.stats.sectContribTotal ?? 0) + (state.sect.totalContrib ?? 0),
          },
        });
        get().showToast('已脱离宗门，当前贡献清零（累计贡献已计入成就）');
      },

      buySectItem: (itemId) => {
        const state = get();
        if (!state.sect) return '尚未拜入宗门';
        const entry = getSectShopEntries().find(e => e.itemId === itemId);
        if (!entry) return '商品不存在';
        if (state.sect.contribution < entry.price) return '贡献点不足';
        const sect = { ...state.sect, contribution: state.sect.contribution - entry.price };
        set({ sect, inventory: addItem(state.inventory, entry.itemId, entry.qty ?? 1) });
        get().showToast(`兑换 ${entry.label} 成功`);
        return null;
      },

      // ---------- 转生 ----------
      doRebirth: () => {
        const state = get();
        if (!canRebirth(state)) return;
        const cSum = combatLevelSum(state.skills);
        const gain = rebirthPointsGain(cSum);
        const rebirth = {
          count: (state.rebirth?.count ?? 0) + 1,
          points: (state.rebirth?.points ?? 0) + gain,
        };
        const titles = [...(state.titles ?? [])];
        for (const t of REBIRTH_TITLES) {
          if (rebirth.count >= t.count && !titles.includes(t.id)) titles.push(t.id);
        }
        set({
          skills: emptySkills(),
          rebirth,
          activeActivity: null,
          activityProgress: 0,
          activeBuffs: [],
          titles,
        });
        // 文案精确化：多世玩家累计加成为历史点数总和，仅展示本轮增量易误导
        get().showToast(`☸️ 转生功成！+${gain} 点转生点（累计加成：技能经验 +${rebirth.points}%、攻血 +${(rebirth.points * 0.5).toFixed(0)}%）`);
        get().checkAchievements();
      },

      // ---------- 画册奖励与称号 ----------
      claimAlbumReward: (id) => {
        const state = get();
        const rw = ALBUM_REWARDS.find(r => r.id === id);
        if (!rw || !isAlbumRewardAvailable(rw, state)) return;
        const albumClaims = [...(state.albumClaims ?? []), id];
        let titles = [...(state.titles ?? [])];
        let activeTitle = state.activeTitle ?? null;
        if (rw.titleId && !titles.includes(rw.titleId)) {
          titles.push(rw.titleId);
          activeTitle = rw.titleId; // 自动佩戴最新限定称号
        }
        set({ albumClaims, titles, activeTitle, gems: state.gems + rw.gems });
        get().showToast(`🖼️ 领取画册奖励【${rw.name}】 +${rw.gems}💎${rw.titleName ? ` · 获得称号「${rw.titleName}」` : ''}`);
      },

      cycleTitle: () => {
        const state = get();
        const owned = state.titles ?? [];
        if (owned.length === 0) {
          get().showToast('暂未获得限定称号');
          return;
        }
        const cur = state.activeTitle;
        const curIdx = cur ? owned.indexOf(cur) : -1;
        const next = curIdx + 1 >= owned.length ? null : owned[curIdx + 1];
        set({ activeTitle: next });
        if (next) {
          const name = getTitleDef(next, get())?.name;
          get().showToast(`已佩戴称号「${name}」`);
        } else {
          get().showToast('已取下称号');
        }
      },

      syncAutoTitles: (quiet = false) => {
        const state = get();
        const titles = [...(state.titles ?? [])];
        let changed = false;
        if (state.sect) {
          const tid = currentSectTitleId(state);
          if (tid && !titles.includes(tid)) {
            titles.push(tid);
            changed = true;
            if (!quiet) {
              get().showToast(`📜 贡献累积，晋升「${sectRank(state.sect.totalContrib).name}」！`);
            }
          }
        }
        const rc = state.rebirth?.count ?? 0;
        for (const t of REBIRTH_TITLES) {
          if (rc >= t.count && !titles.includes(t.id)) { titles.push(t.id); changed = true; }
        }
        // 世界 BOSS 首杀称号回填（兼容旧存档 / 异常路径遗漏）
        for (const bossName of state.stats.wbSlain ?? []) {
          const t = WB_KILL_TITLES[bossName];
          if (t && !titles.includes(t.id)) { titles.push(t.id); changed = true; }
        }
        // 隐藏称号「号令天下」：集齐十大妖王首杀称号后回填
        if (!titles.includes(HIDDEN_TITLE_HAOLING.id) && hasAllWbTitles(titles)) {
          titles.push(HIDDEN_TITLE_HAOLING.id);
          changed = true;
          get().showToast(`👑 十枚妖王称号集齐！隐藏称号「号令天下」现世，可往主页佩戴`);
        }
        if (changed) set({ titles });
      },

      // ---------- 世界 BOSS ----------
      applyWorldBossResult: (r) => {
        if (!r.ok) return;
        const state = get();
        const skills = { ...state.skills };
        let gems = state.gems;
        let inventory = state.inventory;
        const equips = { ...state.equips };
        const xpMult = stateXpMult(state);
        const goldMult = stateGoldMult(state);

        for (const id of ['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[]) {
          const res = grantSkillXp(skills, id, r.exp, skills.intellect.level, xpMult);
          gems += res.gems;
        }
        if (r.legendaryDrop) {
          equips[r.legendaryDrop.uid] = r.legendaryDrop;
          inventory = addItem(inventory, `equip:${r.legendaryDrop.uid}`, 1);
        }
        if (r.killDrop) {
          inventory = addItem(inventory, r.killDrop.itemId, r.killDrop.qty);
        }

        // 宗门贡献：每次挑战 +5
        let sect = state.sect;
        if (sect) {
          sect = grantContribution(sect, CONTRIB_PER_WB);
        }

        const gold = Math.round(r.gold * goldMult);

        // 首杀记录 + 限定称号授予
        let titles = [...(state.titles ?? [])];
        let newTitleName: string | null = null;
        let haolingUnlocked = false;
        if (r.killed && r.killedBossName) {
          const slain = [...new Set([...(state.stats.wbSlain ?? []), r.killedBossName])];
          const stats0 = { ...state.stats, wbSlain: slain };
          const tDef = WB_KILL_TITLES[r.killedBossName];
          if (tDef && !titles.includes(tDef.id)) {
            titles.push(tDef.id);
            newTitleName = tDef.name;
          }
          // 隐藏称号：第十枚集齐瞬间现世
          if (!titles.includes(HIDDEN_TITLE_HAOLING.id) && hasAllWbTitles(titles)) {
            titles.push(HIDDEN_TITLE_HAOLING.id);
            haolingUnlocked = true;
          }
          // 击杀掉落计入累计掉落口径（修复：仙品装备与专属异宝此前不计入搬运工/仓库管理员成就）
          const wbDrops = (r.legendaryDrop ? 1 : 0) + (r.killDrop?.qty ?? 0);
          const stats = {
            ...stats0,
            wbKills: (state.stats.wbKills ?? 0) + 1,
            wbBestDamage: Math.max(state.stats.wbBestDamage ?? 0, r.damage),
            totalGoldEarned: state.stats.totalGoldEarned + gold,
            totalExpEarned: state.stats.totalExpEarned + r.exp,
            totalDrops: state.stats.totalDrops + wbDrops,
          };
          set({ skills, gems: gems + r.gems, inventory, equips, stats, titles, gold: state.gold + gold, worldBoss: r.worldBoss, sect });
        } else {
          const stats = {
            ...state.stats,
            wbBestDamage: Math.max(state.stats.wbBestDamage ?? 0, r.damage),
            totalGoldEarned: state.stats.totalGoldEarned + gold,
            totalExpEarned: state.stats.totalExpEarned + r.exp,
          };
          set({ skills, gems: gems + r.gems, inventory, equips, stats, gold: state.gold + gold, worldBoss: r.worldBoss, sect });
        }

        if (r.killed) {
          get().showToast(`🌌 世界 BOSS 已被击杀！下一只已降临`);
        }
        if (newTitleName) {
          get().showToast(`🏆 获得限定称号「${newTitleName}」，可在主页佩戴`);
        }
        if (haolingUnlocked) {
          get().showToast(`👑 十枚妖王称号集齐！隐藏称号「号令天下」现世，号令天下，莫敢不从`);
        }
        get().checkAchievements();
      },

      setMoreView: (v) => set({ moreView: v }),

      // ---------- 奇遇 ----------
      tryTriggerEncounter: (source) => {
        const state = get();
        const now = Date.now();
        const chance = source === 'battle' ? ENCOUNTER_BATTLE_CHANCE : ENCOUNTER_ACTIVITY_CHANCE;
        if (Math.random() >= chance) return;
        // 已有奇遇未处理/未过期时不叠加；冷却节流（3 分钟内最多一次）
        if (state.encounter && state.encounter.expireAt > now) return;
        if (now < (state.lastEncounterAt ?? 0) + ENCOUNTER_COOLDOWN_MS) return;
        const draw = rollEncounterDraw(avgCombatLevel(state), now);
        const stats = { ...state.stats, encounters: (state.stats.encounters ?? 0) + 1 };
        if (draw.kind === 'qi') {
          // 同系 buff 刷新（不重复叠加灵气爆发）
          const buffs = [...(state.activeBuffs ?? []).filter(b => b.key !== 'exp'), draw.buff];
          set({ activeBuffs: buffs, lastEncounterAt: now, stats });
          get().showToast('🌟 奇遇·灵气爆发！120 秒内技能经验翻倍');
          return;
        }
        if (draw.kind === 'beast') {
          const buffs = [...(state.activeBuffs ?? []).filter(b => b.key !== 'cap'), draw.buff];
          set({ activeBuffs: buffs, lastEncounterAt: now, stats });
          get().showToast('🐾 奇遇·灵兽低语！120 秒内灵宠捕获率 ×3');
          return;
        }
        // 宝箱/神秘商人：写入状态，EventModal 监听弹出
        set({ encounter: draw.state, lastEncounterAt: now, stats });
      },

      claimEncounter: (optionId) => {
        const state = get();
        const enc = state.encounter;
        if (!enc || enc.kind !== 'treasure' || !enc.options) return;
        const opt = enc.options.find(o => o.id === optionId);
        if (!opt) return;
        let gold = state.gold;
        let gems = state.gems;
        let inventory = state.inventory;
        let equips = { ...state.equips };
        const r = opt.reward;
        let eqName: string | null = null;
        if (r.gold) gold += r.gold;
        if (r.gems) gems += r.gems;
        if (r.itemId && r.qty) inventory = addItem(inventory, r.itemId, r.qty);
        if (r.equipTier) {
          // openEquipBag 自带品质保底（≥rare / legendary）
          const eq = openEquipBag(r.equipTier, r.minQuality === 'legendary' ? 'legendary' : 'rare');
          equips[eq.uid] = eq;
          inventory = addItem(inventory, `equip:${eq.uid}`, 1);
          eqName = eq.name;
        }
        set({ gold, gems, inventory, equips, encounter: null });
        if (eqName) get().showToast(`🎁 开匣获得【${eqName}】！`);
        else if (r.gold) get().showToast(`💰 天降横财：+${formatNum(r.gold)} 金币！`);
        else if (r.gems) get().showToast(`💎 天降仙晶：+${r.gems}！`);
        else if (r.itemId) {
          const item = getItem(r.itemId);
          get().showToast(`🧧 获得 ${item?.icon ?? ''}${item?.name ?? r.itemId} ×${r.qty}！`);
        }
        get().checkAchievements();
      },

      dismissEncounter: () => set({ encounter: null }),

      buyEncounterItem: (key) => {
        const state = get();
        const enc = state.encounter;
        if (!enc || enc.kind !== 'merchant' || !enc.items) return '商人已离开';
        if (enc.expireAt <= Date.now()) {
          set({ encounter: null });
          return '商人已离开';
        }
        const item = enc.items.find(i => i.key === key);
        if (!item) return '商品不存在';
        const short = item.currency === 'gold' ? '金币不足' : '宝石不足';
        if (item.currency === 'gold' ? state.gold < item.price : state.gems < item.price) return short;

        let inventory = state.inventory;
        let equips = { ...state.equips };
        let eqName: string | null = null;
        if (item.itemId) inventory = addItem(inventory, item.itemId, item.qty ?? 1);
        if (item.equipTier) {
          const eq = item.minQuality === 'legendary'
            ? generateEquipment(item.equipTier, 'legendary')
            : openEquipBag(item.equipTier, 'rare');
          equips[eq.uid] = eq;
          inventory = addItem(inventory, `equip:${eq.uid}`, 1);
          eqName = eq.name;
        }
        // 买走的商品从货架上移除；剩余商品继续保留至到期
        const items = enc.items.filter(i => i.key !== key);
        set({
          gold: item.currency === 'gold' ? state.gold - item.price : state.gold,
          gems: item.currency === 'gem' ? state.gems - item.price : state.gems,
          inventory, equips,
          encounter: { ...enc, items },
        });
        get().showToast(eqName ? `🧳 购得【${eqName}】！` : `🧳 购得 ${item.label}！`);
        get().checkAchievements();
        return null;
      },

      // ---------- 离线 ----------
      settleOffline: () => {
        const state = get();
        if (!state.initialized) return;
        const now = Date.now();
        const report = computeOfflineReport(state, now);
        if (!report) {
          set({ lastTick: now });
          return;
        }

        // 应用报告
        const skills = { ...state.skills };
        let gems = state.gems;
        let gold = state.gold;
        let inventory = state.inventory;
        const equips = { ...state.equips };
        const xpMult = stateXpMult(state);
        const goldMult = stateGoldMult(state);

        // 技能经验
        for (const [skillId, xp] of Object.entries(report.skillXp)) {
          const r = grantSkillXp(skills, skillId as SkillId, xp, skills.intellect.level, xpMult);
          gems += r.gems;
        }

        // 活动金币
        gold += Math.round(report.gold * goldMult);

        // 物品
        for (const it of report.items) {
          if (it.itemId.startsWith('equip:')) {
            const uid = it.itemId.slice(6);
            const eq = pendingOfflineEquips.find(e => e.uid === uid);
            if (eq) {
              equips[uid] = eq;
              inventory = addItem(inventory, it.itemId, it.qty);
            }
          } else {
            inventory = addItem(inventory, it.itemId, it.qty);
          }
        }
        pendingOfflineEquips.length = 0;

        // 离线战斗
        let sect = state.sect;
        let pets = state.pets;
        let quests = state.quests;
        if (report.battleKills > 0) {
          gold += Math.round(report.battleGold * goldMult);
          for (const id of ['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[]) {
            const r = grantSkillXp(skills, id, report.battleExp, skills.intellect.level, xpMult);
            gems += r.gems;
          }
          // 每日任务：离线击杀/胜利同源计数（放置游戏奖励挂机而非惩罚）
          quests = bumpCounter(quests, 'kills', report.battleKills);
          quests = bumpCounter(quests, 'wins', report.battleKills);
          for (const d of report.battleDrops) {
            inventory = addItem(inventory, d.itemId, d.qty);
          }
          // 出战灵宠离线经验（与在线 1.2× 同源）
          if ((report.petXp ?? 0) > 0 && state.activePetUid) {
            const pidx = pets.findIndex(p => p.uid === state.activePetUid);
            if (pidx >= 0) {
              const r = grantPetXp(pets[pidx], report.petXp!);
              // 修复：此前仅在升级时持久化，未升级的离线经验被丢弃
              pets = [...pets];
              pets[pidx] = r.pet;
              if (r.levelsGained > 0) {
                get().showToast(`🐾 ${petDisplayName(r.pet)} 升至 ${r.pet.level} 级！`);
              }
            }
          }
          // 离线击杀也计入宗门贡献（每 10 杀 +1）
          if (sect) {
            sect = grantContribution(sect, Math.floor(report.battleKills / 10));
          }
        }

        gems += report.gems;

        // 每日任务：离线挂机轮次同源计数
        if ((report.activityRounds ?? 0) > 0) {
          quests = bumpCounter(quests, 'rounds', report.activityRounds ?? 0);
        }

        const offlineGold = Math.round(report.gold * goldMult) + Math.round(report.battleGold * goldMult); // 与实际入账同源
        const offlineDrops = report.items.reduce((a, it) => a + it.qty, 0) + report.battleDrops.reduce((a, d) => a + d.qty, 0);
        const stats = {
          ...state.stats,
          totalGoldEarned: state.stats.totalGoldEarned + offlineGold,
          totalExpEarned: state.stats.totalExpEarned + report.battleExp,
          totalKills: state.stats.totalKills + report.battleKills,
          totalWins: state.stats.totalWins + report.battleKills,
          totalBattles: state.stats.totalBattles + report.battleKills,
          totalDrops: state.stats.totalDrops + offlineDrops, // 修复：离线掉落此前未计入统计
          offlineSessions: state.stats.offlineSessions + 1,
        };

        set({
          lastTick: now,
          skills, gems, gold, inventory, equips, stats, sect, pets,
          ...(quests !== state.quests ? { quests } : {}),
          pendingOfflineReport: report,
          // 空窗期收益已由离线报告整段结算，后台战斗累计器清零防重复计入
          bgBattleAcc: 0,
        });
        get().checkAchievements();
      },

      dismissOfflineReport: () => set({ pendingOfflineReport: null }),

      // ---------- 锁妖塔 ----------
      challengeTower: (floor) => {
        const state = get();
        if (!state.initialized || !Number.isFinite(floor)) return null;
        const f = Math.floor(floor);
        if (f < 1) return null;
        // 仅可挑战下一层（首通制：已通层灵气已汲取，无重复收益；跳层拒绝）
        const best = Math.max(0, state.tower?.bestFloor ?? 0);
        if (f !== best + 1) return null;

        const monster = towerMonster(f);
        const pStats = computePlayerStats(state);
        const sim = simulateTowerBattle(pStats, monster, state.playerName || '无名散修');
        if (!sim.won) {
          // 败北无惩罚，不入账任何收益
          return { ...sim, floor: f, monster, gains: null };
        }

        // 首通入账：五项战斗技能经验（同野外胜场乘区）+ 金币/宝石/里程碑奖励
        const rw = towerClearRewards(f);
        const skills = { ...state.skills };
        let gems = state.gems;
        let levelUps = 0;
        const xpMult = stateXpMult(state);
        for (const id of ['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[]) {
          const r = grantSkillXp(skills, id, rw.exp, skills.intellect.level, xpMult);
          gems += r.gems;
          levelUps += r.levelsGained;
        }
        const goldGain = Math.round(rw.gold * stateGoldMult(state));
        gems += rw.gems;

        let inventory = state.inventory;
        const equips = { ...state.equips };
        let drops = 0;
        for (const it of rw.items) {
          inventory = addItem(inventory, it.itemId, it.qty);
          drops += it.qty;
        }
        let bagEq: Equipment | null = null;
        if (rw.bag) {
          bagEq = makeTowerEquip(rw.bag);
          equips[bagEq.uid] = bagEq;
          inventory = addItem(inventory, `equip:${bagEq.uid}`, 1);
          drops += 1;
        }

        // 每日任务：塔层首通计数；金币/掉落入累计统计（塔击杀不计入野外击杀口径，防图鉴/万妖成就虚增）
        const quests = bumpCounter(state.quests, 'tower');
        const stats = {
          ...state.stats,
          totalGoldEarned: state.stats.totalGoldEarned + goldGain,
          totalDrops: state.stats.totalDrops + drops,
        };
        set({
          skills, gems, inventory, equips, quests, stats,
          gold: state.gold + goldGain,
          tower: { bestFloor: f },
        });
        // 里程碑提示（面板内已有战报展示，仅大里程碑 toast 强化爽点）
        if (f % 25 === 0) {
          get().showToast(`🗼 锁妖塔第 ${f} 层大里程碑！收获丰厚奖励`);
        }
        // 塔中画境收录提示：本次首通恰好跨过某张画境所需层数时提示（画境按层数解锁，无存档字段）
        const newScene = TOWER_SCENES.find(s => Number(s.refId) === f);
        if (newScene) {
          setTimeout(() => get().showToast(`🖼️ 画境「${newScene.name}」已收录进山河画册`), 200);
        }
        get().checkAchievements();
        return {
          ...sim,
          floor: f,
          monster,
          gains: { gold: goldGain, gems: rw.gems, items: rw.items, equip: bagEq, levelUps },
        };
      },

      // ---------- 每日修行任务 ----------
      claimQuest: (id) => {
        const state = get();
        const def = QUEST_MAP[id];
        const quests = state.quests;
        if (!def || !quests || quests.claimed.includes(id)) return;
        // 防跨天旧进度领取：目标值按当前状态重算，计数不足直接拒绝
        const target = def.target(state);
        if ((quests.counters[def.counter] ?? 0) < target) return;
        const gold = questGold(state);
        set({
          quests: { ...quests, claimed: [...quests.claimed, id] },
          gold: state.gold + gold,
          gems: state.gems + QUEST_GEMS,
          stats: {
            ...state.stats,
            totalGoldEarned: state.stats.totalGoldEarned + gold,
            questsDone: (state.stats.questsDone ?? 0) + 1,
          },
        });
        get().showToast(`📋 完成「${def.name}」：+${formatNum(gold)} 金币 +${QUEST_GEMS}💎`);
        get().checkAchievements();
      },

      claimQuestChest: () => {
        const state = get();
        const quests = state.quests;
        if (quests.chestClaimed) return;
        if (!isQuestsComplete(quests, state)) return;
        set({
          quests: { ...quests, chestClaimed: true },
          inventory: addItem(state.inventory, QUEST_CHEST.itemId, QUEST_CHEST.qty),
          gems: state.gems + QUEST_CHEST.gems,
        });
        get().showToast(`🎁 全勤宝箱：悟道丹 ×1 +${QUEST_CHEST.gems}💎！`);
        get().checkAchievements();
      },

      // ---------- 洞府聚灵阵 ----------
      upgradeSpiritArray: () => {
        const state = get();
        const lv = Math.max(0, Math.floor(state.spiritArray ?? 0));
        const cost = spiritArrayCost(lv);
        if (state.gold < cost) {
          get().showToast('金币不足，无法为聚灵阵注灵');
          return;
        }
        set({ spiritArray: lv + 1, gold: state.gold - cost });
        get().showToast(`🔮 聚灵阵升至 ${lv + 1} 级：全局经验/金币 +${lv + 1}%`);
        get().checkAchievements();
      },
    }),
    {
      name: 'xiantu-idle-save-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const {
          hydrated, toast, toastSeq, pendingOfflineReport,
          // 后台自动战斗瞬态字段不入档（会话内 tick 自行维护）
          bgBattleAcc, bgTargetId, bgTargetCheckAt, bgKills,
          ...rest
        } = state;
        void hydrated; void toast; void toastSeq; void pendingOfflineReport;
        void bgBattleAcc; void bgTargetId; void bgTargetCheckAt; void bgKills;
        return rest as Omit<GameState, 'pendingOfflineReport' | 'bgBattleAcc' | 'bgTargetId' | 'bgTargetCheckAt' | 'bgKills'>;
      },
      onRehydrateStorage: () => (state) => {
        // 水合完成后标记
        if (state) {
          setTimeout(() => {
            state.markHydrated();
          }, 0);
        }
      },
    }
  )
);

// 辅助：当前是否有未读离线报告
export function hasOfflineReport(state: GameState): boolean {
  return state.pendingOfflineReport !== null;
}

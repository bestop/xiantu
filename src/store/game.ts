// ============================================
// Zustand 游戏状态 Store
// ============================================

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameState, SkillId, ActivityId, TabId, BattleRewards, EquipSlot,
  Equipment, OfflineReport, InvItem, AchievementState, MoreViewId,
  PlayerSectState, SectId, ActiveBuff, ActiveBuffKey,
} from '@/types/game';
import { ACTIVITY_MAP, xpToNext, gatherTier, combatLevelSum, pillMultiplier } from '@/lib/game/skills';
import {
  computePlayerStats, grantSkillXp, computeOfflineReport, resolveDynamicItemId,
  activityRoundReward, pendingOfflineEquips, getShopEntries, openEquipBag,
  stateXpMult, stateGoldMult,
} from '@/lib/game/engine';
import { getItem, generateEquipment, genUid, CRAFT_RECIPES, rollQuality } from '@/lib/game/items';
import { MONSTER_MAP } from '@/lib/game/monsters';
import { ACHIEVEMENTS, achievementValue } from '@/lib/game/achievements';
import {
  MAX_PETS, makePet, grantPetXp, releaseGold, normalizePet,
  canEvolve, petEvolveReq, petDisplayName, PET_STAGES, MAX_PET_STARS,
} from '@/lib/game/pets';
import { initialWorldBoss, checkRotate, WorldBossAttemptResult } from '@/lib/game/worldboss';
import {
  isRefinable, refineCost, refineSuccessRate, refineOreName,
} from '@/lib/game/refine';
import {
  SECT_MAP, getSectShopEntries, grantContribution, todayKey,
  CONTRIB_PER_KILL, CONTRIB_PER_BOSS, CONTRIB_PER_WB, sectTitleId,
} from '@/lib/game/sects';
import {
  initialRebirth, normalizeRebirth, canRebirth, rebirthPointsGain, REBIRTH_TITLES,
} from '@/lib/game/rebirth';
import { ALBUM_REWARDS, isAlbumRewardAvailable } from '@/lib/game/scenes';
import { getTitleDef, currentSectTitleId, normalizeTitles, WB_KILL_TITLES, hasAllWbTitles, HIDDEN_TITLE_HAOLING } from '@/lib/game/titles';
import { FORGE_MAP, forgeCostCheck, forgeEquipment } from '@/lib/game/forge';
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
  petsCaptured: 0, wbKills: 0, wbBestDamage: 0,
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
  syncAutoTitles: () => void;

  // 世界 BOSS
  applyWorldBossResult: (r: WorldBossAttemptResult) => void;

  // 更多面板子视图
  setMoreView: (v: MoreViewId) => void;

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
        const worldBoss = s.worldBoss ? checkRotate(s.worldBoss, Date.now()) : initialWorldBoss();
        const pets = (s.pets ?? []).map(normalizePet);
        const equips: Record<string, Equipment> = {};
        for (const [uid, e] of Object.entries(s.equips ?? {})) {
          equips[uid] = { ...e, refine: (e as Equipment).refine ?? 0 };
        }
        const rebirth = normalizeRebirth(s.rebirth);
        // 旧档兼容：技能表新增 id 时从初始值补齐，避免 skills.focus.level 等直接访问 undefined 崩溃
        const skills = { ...emptySkills(), ...(s.skills ?? {}) };
        const tn = normalizeTitles(s);
        // 旧存档 buff 迁移：activeBattleBuffAtk/buffExpireAt → activeBuffs（并丢弃已过期）
        const now = Date.now();
        let buffs: ActiveBuff[] = (s.activeBuffs ?? []).filter(b => b && b.expireAt > now);
        const legacyAtk = (s as unknown as { activeBattleBuffAtk?: number }).activeBattleBuffAtk ?? 0;
        const legacyExpire = (s as unknown as { buffExpireAt?: number }).buffExpireAt ?? 0;
        if (legacyAtk > 0 && legacyExpire > now && !buffs.some(b => b.key === 'atk')) {
          buffs = [...buffs, { key: 'atk', value: legacyAtk, expireAt: legacyExpire }];
        }
        set({
          hydrated: true, stats, worldBoss, pets, equips, rebirth, skills,
          titles: tn.titles, activeTitle: tn.activeTitle,
          albumClaims: s.albumClaims ?? [],
          sect: s.sect ?? null,
          activeBuffs: buffs,
        });
        get().syncAutoTitles();
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

        let gold = state.gold;
        let gems = state.gems;
        const skills = { ...state.skills };
        let inventory = state.inventory;
        let activityProgress = state.activityProgress;
        let levelUps = 0;
        const xpMult = stateXpMult(state);
        const goldMult = stateGoldMult(state);

        // 活动推进（基于真实时间差，兼容后台限流）
        if (state.activeActivity) {
          const act = ACTIVITY_MAP[state.activeActivity];
          if (act) {
            activityProgress += deltaSec / act.intervalSec;
            let guard = 0;
            while (activityProgress >= 1 && guard < 60) {
              activityProgress -= 1;
              guard++;
              // 结算一轮
              const r = activityRoundReward(state.activeActivity, state);
              const res = grantSkillXp(skills, act.skillId, r.skillXp, skills.intellect.level, xpMult);
              levelUps += res.levelsGained;
              gems += res.gems;
              if (r.gold > 0) { gold += Math.round(r.gold * goldMult); }
              if (r.itemId && r.itemQty > 0) {
                inventory = addItem(inventory, r.itemId, r.itemQty);
              }
              if (r.gem) { gems += 1; }
            }
          }
        }

        set({
          lastTick: now,
          gold, gems, skills, inventory,
          activityProgress,
        });

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
        const gold = state.gold + goldGain;

        // 宗门贡献：胜利 +1，妖王 +10
        let sect = state.sect;
        if (sect && won) {
          sect = grantContribution(sect, monster.isBoss ? CONTRIB_PER_BOSS : CONTRIB_PER_KILL);
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

        set({ skills, gems, inventory, equips, cards, gold, stats, pets, sect });
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

        set({ inventory, skills, gems, equips });
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
          if (value >= def.target && !(cur?.claimed)) {
            achievements[def.id] = { bestValue: value, claimed: true };
            gems += def.gemReward;
            unlockedAny = true;
            get().showToast(`🏆 达成成就【${def.name}】 +${def.gemReward}💎`);
          }
        }
        if (unlockedAny || JSON.stringify(achievements) !== JSON.stringify(state.achievements)) {
          set({ achievements, gems });
        }
      },

      claimAchievement: (id) => {
        const state = get();
        const def = ACHIEVEMENTS.find(a => a.id === id);
        const cur = state.achievements[id];
        if (!def || !cur || cur.claimed) return;
        const value = achievementValue(def.metric, state);
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

        let pets = state.pets.filter(p => p.uid !== sacrificeUid);
        pets = pets.map(p => p.uid === mainUid ? { ...p, stars: p.stars + 1 } : p);
        set({
          pets,
          activePetUid: state.activePetUid === sacrificeUid ? mainUid : state.activePetUid,
        });
        get().showToast(`✨ 融合成功！${petDisplayName(main)} 升至 ${main.stars + 1} 星`);
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
          set({ inventory, gold, equips });
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
        });
        get().showToast('已脱离宗门，贡献清零');
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
        get().showToast(`☸️ 转生功成！获得 ${gain} 点转生点（经验 +${gain}%，攻血 +${(gain * 0.5).toFixed(0)}%）`);
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

      syncAutoTitles: () => {
        const state = get();
        const titles = [...(state.titles ?? [])];
        let changed = false;
        if (state.sect) {
          const tid = currentSectTitleId(state);
          if (tid && !titles.includes(tid)) { titles.push(tid); changed = true; }
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
          const stats = {
            ...stats0,
            wbKills: (state.stats.wbKills ?? 0) + 1,
            wbBestDamage: Math.max(state.stats.wbBestDamage ?? 0, r.damage),
            totalGoldEarned: state.stats.totalGoldEarned + gold,
            totalExpEarned: state.stats.totalExpEarned + r.exp,
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
        if (report.battleKills > 0) {
          gold += Math.round(report.battleGold * goldMult);
          for (const id of ['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[]) {
            const r = grantSkillXp(skills, id, report.battleExp, skills.intellect.level, xpMult);
            gems += r.gems;
          }
          for (const d of report.battleDrops) {
            inventory = addItem(inventory, d.itemId, d.qty);
          }
          // 出战灵宠离线经验（与在线 1.2× 同源）
          if ((report.petXp ?? 0) > 0 && state.activePetUid) {
            const pidx = pets.findIndex(p => p.uid === state.activePetUid);
            if (pidx >= 0) {
              const r = grantPetXp(pets[pidx], report.petXp!);
              if (r.levelsGained > 0) {
                pets = [...pets];
                pets[pidx] = r.pet;
              }
            }
          }
          // 离线击杀也计入宗门贡献（每 10 杀 +1）
          if (sect) {
            sect = grantContribution(sect, Math.floor(report.battleKills / 10));
          }
        }

        gems += report.gems;

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
          pendingOfflineReport: report,
        });
        get().checkAchievements();
      },

      dismissOfflineReport: () => set({ pendingOfflineReport: null }),
    }),
    {
      name: 'xiantu-idle-save-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { hydrated, toast, toastSeq, ...rest } = state;
        void hydrated; void toast; void toastSeq;
        return rest as GameState & { pendingOfflineReport: OfflineReport | null };
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

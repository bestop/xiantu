// ============================================
// 《仙途挂机》类型定义 — Harpagia 式修仙放置 RPG
// ============================================

// ---------- 技能系统 ----------

// 16 项技能 ID（对标 Harpagia）
export type SkillId =
  // 战斗系（通过战斗训练）
  | 'hp'        // 气血
  | 'weaponry'  // 神兵
  | 'power'     // 神力
  | 'defence'   // 御体
  | 'speed'     // 遁速
  // 生活系（通过活动训练）
  | 'mining'      // 采矿
  | 'fishing'     // 垂钓
  | 'cooking'     // 炼丹
  | 'begging'     // 化缘
  | 'forging'     // 锻造
  | 'intellect'   // 悟道
  | 'focus'       // 定力
  | 'luck'        // 气运
  | 'imbibing'    // 灵酒
  | 'insight'     // 灵识
  | 'archaeology';// 寻宝

export type SkillCategory = 'combat' | 'gather' | 'craft' | 'support';

export interface SkillDef {
  id: SkillId;
  name: string;
  icon: string;
  category: SkillCategory;
  description: string;
  // 每 10 秒在线训练获得的基础 XP（生活技能通过对应活动获得）
  xpPerTick: number;
  // 对应的挂机活动（采集类）
  activityId?: ActivityId;
  // 效果说明格式化函数所需的 key
  effectKey: string;
}

export const MAX_SKILL_LEVEL = 200;
export const COMBAT_SKILLS: SkillId[] = ['hp', 'weaponry', 'power', 'defence', 'speed'];

// 技能进度
export interface SkillProgress {
  level: number;
  xp: number; // 当前级累计经验
}

// ---------- 活动系统 ----------

// 采集/训练类挂机活动（在线/离线均可进行；同一时间只进行一个）
export type ActivityId =
  | 'mining' | 'fishing' | 'begging' | 'archaeology'  // 采集产出
  | 'cooking' | 'forging'                              // 生产演习
  | 'intellect' | 'focus' | 'luck' | 'imbibing' | 'insight'; // 支援修行

export interface ActivityDef {
  id: ActivityId;
  name: string;
  icon: string;
  skillId: SkillId;
  description: string;
  // 每轮时长（秒）
  intervalSec: number;
  // 每轮基础产出
  reward: {
    gold?: number;
    itemId?: string;
    itemQty?: number;
    gemChance?: number; // 概率获得 1 宝石
  };
  // 每轮技能 XP
  skillXp: number;
  minSkillLevel: number;
}

// ---------- 物品系统 ----------

export type ItemQuality = 'common' | 'fine' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type ItemType = 'material' | 'pill' | 'equipment' | 'card' | 'treasure';

// 基础物品（材料/丹药/宝藏）
export interface BaseItem {
  id: string;
  name: string;
  type: ItemType;
  icon: string;
  description: string;
  quality: ItemQuality;
  // 丹药效果（buff 类：atk/def/spd/gold/luck/cap，heal/exp 为即时型）
  pillEffect?: 'heal' | 'exp' | 'buffAtk' | 'buffDef' | 'buffSpd' | 'buffGold' | 'buffLuck' | 'buffCap';
  pillValue?: number;
  // 基础卖价
  sellPrice: number;
  tier: number; // 物品阶级，决定来源区域
}

// 装备类型
export type EquipSlot = 'weapon' | 'armor' | 'accessory';

// 装备随机副词条
export type AffixKey = 'atk' | 'def' | 'hp' | 'crit' | 'dodge' | 'luck' | 'speed';

// 丹药临时 buff：value 语义随 key 变化 ——
// atk/def/spd/gold：百分比 +30 → 乘区 1.30；luck：气运面板值 +15；cap：捕获率乘区 ×100（如 160 → ×1.6）
export type ActiveBuffKey = 'atk' | 'def' | 'spd' | 'gold' | 'luck' | 'cap';

export interface ActiveBuff {
  key: ActiveBuffKey;
  value: number;
  expireAt: number;
}

export interface EquipAffix {
  key: AffixKey;
  value: number;
}

// 装备实例（随机生成，对应 Harpagia 的 Randomized gear stats）
export interface Equipment {
  uid: string;
  baseId: string;
  name: string;
  slot: EquipSlot;
  quality: ItemQuality;
  tier: number;
  icon: string;
  mainStat: { key: AffixKey; value: number };
  affixes: EquipAffix[];
  // 专属词条（炼宝坊专属装备必带，随炼器成长；旧存档无此字段）
  sigAffix?: { key: AffixKey; value: number; label: string };
  sellPrice: number;
  createdAt: number;
  refine: number; // 炼器等级 0-10（旧存档默认 0）
}

// 怪物卡片（收集要素）
export interface MonsterCardItem {
  id: string; // monsterId
  count: number;
}

// 背包物品条目
export interface InvItem {
  itemId: string;   // BaseItem.id 或 'equip:<uid>'
  quantity: number;
}

// ---------- 装备栏 ----------

export interface EquipSlots {
  weapon: Equipment | null;
  armor: Equipment | null;
  accessory: Equipment | null;
}

// ---------- 怪物系统 ----------

export interface MonsterDef {
  id: string;
  name: string;
  icon: string;
  region: string;
  tier: number;       // 等级档（约等于等级）
  hp: number;
  atk: number;
  def: number;
  speed: number;
  exp: number;        // 每个战斗技能获得的经验
  gold: number;
  isBoss: boolean;
  drops: { itemId: string; rate: number; qty?: number }[];
  equipDropRate: number; // 装备掉率
  cardDropRate: number;  // 卡片掉率
}

export interface RegionDef {
  id: string;
  name: string;
  icon: string;
  minTier: number;
  description: string;
}

// ---------- 战斗 ----------

export interface CombatantState {
  name: string;
  icon: string;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  speed: number;
}

export type LogType = 'player' | 'monster' | 'crit' | 'dodge' | 'info' | 'win' | 'lose';

export interface BattleLogLine {
  id: number;
  type: LogType;
  text: string;
}

export interface BattleRewards {
  exp: number;         // 每战斗技能
  gold: number;
  items: { itemId: string; qty: number }[];
  equips: Equipment[];
  cards: { monsterId: string }[];
  gems: number;
  petCapture?: string; // 触发灵宠捕获的 monsterId
}

// ---------- 玩家状态 ----------

export interface PlayerStats {
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  critRate: number;   // 0-1
  dodgeRate: number;  // 0-1
  luck: number;
}

export interface Statistics {
  totalBattles: number;
  totalWins: number;
  totalKills: number;
  bossKills: number;
  totalGoldEarned: number;
  totalExpEarned: number;
  totalDrops: number;
  offlineSessions: number;
  playStart: number;
  // v2 新增（旧存档缺失时用默认值兼容）
  petsCaptured: number;
  wbKills: number;       // 世界 BOSS 击杀数
  wbBestDamage: number;  // 单次挑战最高伤害
  wbSlain?: string[];    // 已首次击杀过的世界 BOSS 名（限定称号依据）
}

// ---------- 宠物 ----------

// 灵宠实例（捕获自妖兽，带出战可提供属性加成）
export interface PetInstance {
  uid: string;
  monsterId: string;
  level: number;
  xp: number;
  capturedAt: number;
  stage: number; // 进化阶段 0-3（旧存档默认 0）
  stars: number; // 融合星级 0-5（旧存档默认 0）
}

// ---------- 世界 BOSS ----------

// 世界 BOSS 状态（血量跨挑战持久，被击杀后轮换下一只）
export interface WorldBossState {
  bossIdx: number;        // 当期 BOSS 序号
  hp: number;             // 当前剩余血量
  spawnedAt: number;      // 刷新时间
  lastChallengeAt: number;// 上次挑战时间（冷却）
  seasonDamage: number;   // 本期累计伤害
  killed: boolean;        // 本期是否已被击杀
}

// ---------- 宗门 ----------

export type SectId = 'sword' | 'alchemy' | 'beast' | 'vault';

// 玩家在宗门中的状态（null = 未加入任何宗门）
export interface PlayerSectState {
  sectId: SectId;
  contribution: number;   // 当前可消费贡献点
  totalContrib: number;   // 累计贡献（决定弟子位阶/宗门等级）
  joinedAt: number;
  dayKey: string;         // 今日贡献统计键（YYYY-MM-DD）
  dayContrib: number;
}

// ---------- 转生 ----------

export interface RebirthState {
  count: number;  // 转生次数
  points: number; // 转生点数（永久加成）
}

// ---------- 更多面板子视图 ----------

export type MoreViewId =
  | 'root' | 'shop' | 'achievements' | 'codex'
  | 'pets' | 'worldboss' | 'leaderboard'
  | 'sect' | 'rebirth' | 'album' | 'forge'
  | 'settings';

// ---------- 成就 ----------

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  // 进度取值函数的 key
  metric: string;
  target: number;
  gemReward: number;
}

export interface AchievementState {
  claimed: boolean;
  bestValue: number;
}

// ---------- 离线收益 ----------

export interface OfflineReport {
  seconds: number;
  settledSeconds?: number; // 实际结算时长（受离线上限影响），旧档报告可能缺失
  effiency: number; // 0-1
  skillXp: Record<string, number>;
  gold: number;
  items: { itemId: string; qty: number }[];
  battleKills: number;
  battleExp: number;
  battleGold: number;
  battleDrops: { itemId: string; qty: number }[];
  gems: number;
  petXp?: number; // 出战灵宠离线经验（旧档报告无此字段）
}

// ---------- 商店 ----------

export interface ShopEntry {
  itemId: string;
  price: number;
  currency: 'gold' | 'gem';
  stock: number; // -1 无限
}

// ---------- 游戏主状态 ----------

export type TabId = 'home' | 'combat' | 'skills' | 'inventory' | 'more';

export interface GameState {
  // 基础
  initialized: boolean;
  playerName: string;
  lastTick: number;
  tab: TabId;

  // 货币
  gold: number;
  gems: number;

  // 技能
  skills: Record<SkillId, SkillProgress>;
  // 当前挂机活动（同一时间一个；null 表示无）
  activeActivity: ActivityId | null;
  activityProgress: number; // 当前轮进度 0-1

  // 背包与装备
  inventory: InvItem[];
  equips: Record<string, Equipment>; // uid -> equipment
  equipped: EquipSlots;

  // 收集
  cards: Record<string, number>; // monsterId -> count

  // 战斗
  lastRegionId: string;
  autoBattleEnabled: boolean;
  // 丹药临时 buff（可多系并存；旧存档由 markHydrated 从 activeBattleBuffAtk/buffExpireAt 迁移）
  activeBuffs: ActiveBuff[];

  // 成就
  achievements: Record<string, AchievementState>;

  // 统计
  stats: Statistics;

  // 宠物
  pets: PetInstance[];
  activePetUid: string | null;

  // 世界 BOSS
  worldBoss: WorldBossState;

  // 宗门 / 转生 / 画册奖励 / 限定称号
  sect: PlayerSectState | null;
  rebirth: RebirthState;
  albumClaims: string[];      // 已领取的画册奖励 id
  titles: string[];           // 已拥有的限定称号 id
  activeTitle: string | null; // 当前佩戴的限定称号

  // 更多面板当前子视图（供跨面板跳转）
  moreView: MoreViewId;

  // 离线报告（有内容时弹窗）
  pendingOfflineReport: OfflineReport | null;
}

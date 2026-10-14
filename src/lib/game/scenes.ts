// ============================================
// 山河画册 · 旅行青蛙式场景插画
// 每个游戏情境对应一张手绘水彩明信片，
// 同一位白衣小修士出现在每一张画中。
// ============================================

import { GameState } from '@/types/game';
import { SkillId } from '@/types/game';

export type SceneKind = 'home' | 'region' | 'activity' | 'boss' | 'tower';

export interface SceneDef {
  id: string;
  kind: SceneKind;
  name: string;
  caption: string;   // 明信片短句（青蛙旅行照风格）
  img: string;       // public 下路径
  // kind=region → 区域 id；kind=activity → 活动对应技能 id
  // kind=boss → 妖王名；kind=tower → 收录所需首通层数
  refId?: string;
}

export const SCENES: SceneDef[] = [
  // ---- 洞府 ----
  {
    id: 'home', kind: 'home', name: '青庐洞府', img: '/scenes/home.jpg',
    caption: '竹屋青灯，药圃丹炉。仙途再远，也要回家吃饭。',
  },
  // ---- 8 区域 ----
  {
    id: 'region-r1', kind: 'region', refId: 'r1', name: '青云郊野', img: '/scenes/region-r1.jpg',
    caption: '山门外的第一缕风，带着青草与露水的味道。',
  },
  {
    id: 'region-r2', kind: 'region', refId: 'r2', name: '落霞山脉', img: '/scenes/region-r2.jpg',
    caption: '晚霞把栈道染成金色，孤鹰替我探路。',
  },
  {
    id: 'region-r3', kind: 'region', refId: 'r3', name: '幽冥沼泽', img: '/scenes/region-r3.jpg',
    caption: '鬼火像萤灯，沼泽并不可怕，只是有点静。',
  },
  {
    id: 'region-r4', kind: 'region', refId: 'r4', name: '烈焰谷', img: '/scenes/region-r4.jpg',
    caption: '岩浆把夜空烘得暖暖的，记得多喝水。',
  },
  {
    id: 'region-r5', kind: 'region', refId: 'r5', name: '万妖林', img: '/scenes/region-r5.jpg',
    caption: '灯笼挂在古树上，小狐狸冲我眨了眨眼。',
  },
  {
    id: 'region-r6', kind: 'region', refId: 'r6', name: '寒冰原', img: '/scenes/region-r6.jpg',
    caption: '极光落在冰晶上，哈出的气都是甜的。',
  },
  {
    id: 'region-r7', kind: 'region', refId: 'r7', name: '雷罚之地', img: '/scenes/region-r7.jpg',
    caption: '雷声很近，伞有点小，但脚步很稳。',
  },
  {
    id: 'region-r8', kind: 'region', refId: 'r8', name: '九天秘境', img: '/scenes/region-r8.jpg',
    caption: '云海之上，古殿的钟声响了很久。',
  },
  {
    id: 'region-r9', kind: 'region', refId: 'r9', name: '归墟海', img: '/scenes/region-r9.jpg',
    caption: '海眼很深，气泡替我把愿望带下去。',
  },
  {
    id: 'region-r10', kind: 'region', refId: 'r10', name: '仙墟', img: '/scenes/region-r10.jpg',
    caption: '断剑插了千年，还在等一个提剑的人。',
  },
  // ---- 11 活动 ----
  {
    id: 'act-mining', kind: 'activity', refId: 'mining', name: '灵山采矿', img: '/scenes/act-mining.jpg',
    caption: '叮、叮、叮——今天也敲下满满一篓星屑。',
  },
  {
    id: 'act-fishing', kind: 'activity', refId: 'fishing', name: '灵潭垂钓', img: '/scenes/act-fishing.jpg',
    caption: '浮标动了一下，又动了一下。鱼比道法更难参透。',
  },
  {
    id: 'act-begging', kind: 'activity', refId: 'begging', name: '下山化缘', img: '/scenes/act-begging.jpg',
    caption: '包子铺的阿姨多给了一个，人间值得。',
  },
  {
    id: 'act-archaeology', kind: 'activity', refId: 'archaeology', name: '遗迹寻宝', img: '/scenes/act-archaeology.jpg',
    caption: '铲子敲到硬物的那一刻，心跳快过雷劫。',
  },
  {
    id: 'act-cooking', kind: 'activity', refId: 'cooking', name: '研习丹方', img: '/scenes/act-cooking.jpg',
    caption: '丹炉咕嘟咕嘟，药香比功法更有说服力。',
  },
  {
    id: 'act-forging', kind: 'activity', refId: 'forging', name: '锻造演习', img: '/scenes/act-forging.jpg',
    caption: '火星溅起来的时候，像握住了一小片星河。',
  },
  {
    id: 'act-intellect', kind: 'activity', refId: 'intellect', name: '参悟道经', img: '/scenes/act-intellect.jpg',
    caption: '读到第三卷，竹叶正好落在「道」字上。',
  },
  {
    id: 'act-focus', kind: 'activity', refId: 'focus', name: '打坐凝神', img: '/scenes/act-focus.jpg',
    caption: '水声很远，呼吸很近，彩虹在水雾里等我。',
  },
  {
    id: 'act-luck', kind: 'activity', refId: 'luck', name: '祈福气运', img: '/scenes/act-luck.jpg',
    caption: '喜鹊落檐角，许的愿暂时保密。',
  },
  {
    id: 'act-imbibing', kind: 'activity', refId: 'imbibing', name: '灵酒淬体', img: '/scenes/act-imbibing.jpg',
    caption: '月亮泡进酒杯里，今晚格外醇。',
  },
  {
    id: 'act-insight', kind: 'activity', refId: 'insight', name: '夜观星象', img: '/scenes/act-insight.jpg',
    caption: '银河替我翻开了下一页星图。',
  },
  // ---- 世界 BOSS ----
  {
    id: 'worldboss', kind: 'boss', name: '世界 BOSS', img: '/scenes/worldboss.jpg',
    caption: '它很大，我很小，但剑没有退。',
  },
  {
    id: 'wb-xueshang', kind: 'boss', refId: '噬山血蟒', name: '噬山血蟒', img: '/scenes/wb-python.png',
    caption: '满山红叶，它盘成一座小山。我没跑，它也没追。',
  },
  {
    id: 'wb-minghuang', kind: 'boss', refId: '九幽冥皇', name: '九幽冥皇', img: '/scenes/wb-nether.png',
    caption: '鬼火当灯，冥皇在王座上打盹。我踮着脚绕过去了。',
  },
  {
    id: 'wb-yandi', kind: 'boss', refId: '焚世炎帝', name: '焚世炎帝', img: '/scenes/wb-flame.png',
    caption: '山谷很热，灯笼显得多余。原来火也要先学会温暖自己。',
  },
  {
    id: 'wb-haihuang', kind: 'boss', refId: '沧溟海皇', name: '沧溟海皇', img: '/scenes/wb-seaking.png',
    caption: '浪比城墙还高，龙在浪里看我。它说海很深，让我别怕。',
  },
  {
    id: 'wb-shidi', kind: 'boss', refId: '万古石帝', name: '万古石帝', img: '/scenes/wb-stone.png',
    caption: '石帝坐了很久很久，久到身上长满苔藓与星星。',
  },
  {
    id: 'wb-leijun', kind: 'boss', refId: '紫雷天君', name: '紫雷天君', img: '/scenes/wb-thunder.png',
    caption: '紫色的雷一闪一闪，我数到第七下就不数了。',
  },
  {
    id: 'wb-jingzu', kind: 'boss', refId: '归墟鲸祖', name: '归墟鲸祖', img: '/scenes/wb-whale.png',
    caption: '它驮着归墟游了万年，我的小灯不聒不响。',
  },
  {
    id: 'wb-youhou', kind: 'boss', refId: '太阴幽后', name: '太阴幽后', img: '/scenes/wb-moon.png',
    caption: '月亮很大，狐狸的尾巴比月光还软。',
  },
  {
    id: 'wb-moshen', kind: 'boss', refId: '混沌魔神', name: '混沌魔神', img: '/scenes/wb-chaos.png',
    caption: '它由星尘组成，我的灯是唯一没被卷走的东西。',
  },
  {
    id: 'wb-zangtian', kind: 'boss', refId: '葬天仙帝', name: '葬天仙帝', img: '/scenes/wb-emperor.png',
    caption: '帝影垂目看我，我抬头看他——谁先眨眼，谁就输了。',
  },
  // ---- 锁妖塔（refId = 收录所需首通层数） ----
  {
    id: 'tower-gate', kind: 'tower', refId: '1', name: '塔门初启', img: '/scenes/tower-gate.png',
    caption: '塔门在身后缓缓合上，第一层的风比想象中冷。',
  },
  {
    id: 'tower-hall', kind: 'tower', refId: '10', name: '塔中石殿', img: '/scenes/tower-hall.png',
    caption: '石殿里只有一盏灯，替历代镇塔人亮着。我也帮它拔了拔灯芯。',
  },
  {
    id: 'tower-lantern', kind: 'tower', refId: '25', name: '万妖灯廊', img: '/scenes/tower-lantern.png',
    caption: '长廊两侧的灯笼里，各睡着一只小妖。脚步放轻些，别吵醒它们。',
  },
  {
    id: 'tower-cloud', kind: 'tower', refId: '50', name: '塔顶云海', img: '/scenes/tower-cloud.png',
    caption: '爬到塔顶才发现，云海就在脚边，软得像我泡的那碗面。',
  },
  {
    id: 'tower-seal', kind: 'tower', refId: '100', name: '塔尖封印', img: '/scenes/tower-seal.png',
    caption: '塔尖的封印之光很安静。我把它画下来，寄给你。',
  },
];

export const SCENE_MAP: Record<string, SceneDef> = Object.fromEntries(
  SCENES.map(s => [s.id, s])
);

// 区域 → 场景 / 活动（技能 id）→ 场景 快速索引
export const REGION_SCENE: Record<string, SceneDef> = Object.fromEntries(
  SCENES.filter(s => s.kind === 'region' && s.refId).map(s => [s.refId!, s])
);

export const ACTIVITY_SCENE: Record<string, SceneDef> = Object.fromEntries(
  SCENES.filter(s => s.kind === 'activity' && s.refId).map(s => [s.refId!, s])
);

export const HOME_SCENE = SCENE_MAP['home'];
export const BOSS_SCENE = SCENE_MAP['worldboss'];

// 世界 BOSS 专属场景：按 BOSS 名索引（未收录的沿用通用场景）
export const WB_SCENES_BY_BOSS: Record<string, SceneDef> = Object.fromEntries(
  SCENES.filter(s => s.kind === 'boss' && s.refId).map(s => [s.refId!, s])
);

// 锁妖塔画境（按收录所需层数升序）
export const TOWER_SCENES: SceneDef[] = SCENES
  .filter(s => s.kind === 'tower' && s.refId)
  .sort((a, b) => Number(a.refId) - Number(b.refId));

export function bossScene(bossName: string): SceneDef {
  return WB_SCENES_BY_BOSS[bossName] ?? BOSS_SCENE;
}

// 锁妖塔画境解锁：首通达到 refId 指定层数即收录
export function isTowerSceneUnlocked(requiredFloor: number, state: GameState): boolean {
  return (state.tower?.bestFloor ?? 0) >= requiredFloor;
}

// 塔面板横幅：已达的最高画境（按所需层数升序取最后一个已解锁）
export function currentTowerScene(state: GameState): SceneDef | null {
  let cur: SceneDef | null = null;
  for (const s of TOWER_SCENES) {
    const f = Number(s.refId);
    if (Number.isFinite(f) && isTowerSceneUnlocked(f, state)) cur = s;
  }
  return cur;
}

// 下一个待解锁画境（塔面板预告/锁定提示用）
export function nextTowerScene(state: GameState): SceneDef | null {
  for (const s of TOWER_SCENES) {
    const f = Number(s.refId);
    if (Number.isFinite(f) && !isTowerSceneUnlocked(f, state)) return s;
  }
  return null;
}

// ---------- 解锁逻辑（无新增存档字段，全部由现有状态推导） ----------

// 区域明信片：到访过该区域（当前所在，或持有该区域任意怪物卡）即解锁
export function isRegionSceneUnlocked(regionId: string, state: GameState): boolean {
  if (state.lastRegionId === regionId) return true;
  return Object.keys(state.cards).some(mid => mid.startsWith(`${regionId}_`));
}

// 活动明信片：对应技能升到 2 级及以上（修炼过至少一次升级）即解锁
export function isActivitySceneUnlocked(skillId: string, state: GameState): boolean {
  return (state.skills[skillId as SkillId]?.level ?? 1) >= 2;
}

// 世界 BOSS 明信片：
// - 通用画境（无 refId）：挑战过一次即收录（本期造成过伤害，或历史击杀）
// - 妖王专属画境（refId=boss.name）：击杀对应妖王后收录（与妖王称号图鉴同口径）
// 锁妖塔画境（refId=层数）：首通达到对应层数即收录
export function isBossSceneUnlocked(state: GameState): boolean {
  return state.worldBoss.seasonDamage > 0 || (state.stats.wbKills ?? 0) > 0;
}

export function isBossRefSceneUnlocked(bossName: string, state: GameState): boolean {
  return (state.stats.wbSlain ?? []).includes(bossName);
}

export function isSceneUnlocked(scene: SceneDef, state: GameState): boolean {
  switch (scene.kind) {
    case 'home': return true;
    case 'region': return scene.refId ? isRegionSceneUnlocked(scene.refId, state) : false;
    case 'activity': return scene.refId ? isActivitySceneUnlocked(scene.refId, state) : false;
    // 有 refId 的是妖王专属画境，须击杀对应妖王；无 refId 的通用画境挑战一次即收录
    case 'boss': return scene.refId ? isBossRefSceneUnlocked(scene.refId, state) : isBossSceneUnlocked(state);
    case 'tower': return scene.refId ? isTowerSceneUnlocked(Number(scene.refId), state) : false;
  }
}

export function unlockedSceneCount(state: GameState): number {
  return SCENES.reduce((n, s) => n + (isSceneUnlocked(s, state) ? 1 : 0), 0);
}

// 锁定时的解锁提示
export function sceneUnlockHint(scene: SceneDef): string {
  switch (scene.kind) {
    case 'region': return '到访该区域后收录';
    case 'activity': return '修行此项活动后收录';
    // 妖王专属画境与通用画境的解锁条件不同，提示分别对齐
    case 'boss': return scene.refId ? '击杀该妖王后收录' : '挑战世界 BOSS 后收录';
    case 'tower': return scene.refId ? `首通第 ${scene.refId} 层后收录` : '挑战锁妖塔后收录';
    default: return '';
  }
}

// ---------- 画册集齐奖励 ----------

export interface AlbumReward {
  id: string;              // 领取键（存入 albumClaims）
  kind: SceneKind | 'grand';
  name: string;            // 奖励名
  gems: number;            // 宝石奖励
  titleId?: string;        // 附带限定称号
  titleName?: string;
  desc: string;
}

export const ALBUM_REWARDS: AlbumReward[] = [
  { id: 'album_home', kind: 'home', name: '洞府常客', gems: 10, desc: '收录「我的洞府」全部分页' },
  { id: 'album_boss', kind: 'boss', name: '直面巨兽', gems: 10, desc: '收录「强敌之影」全部分页' },
  { id: 'album_tower', kind: 'tower', name: '镇塔修士', gems: 25, titleId: 'title_zhenta', titleName: '镇塔修士', desc: '收录「锁妖塔影」全部 5 张明信片' },
  { id: 'album_region', kind: 'region', name: '山河行者', gems: 30, titleId: 'title_shanhe', titleName: '山河行者', desc: '收录「行走山河」全部 10 张明信片' },
  { id: 'album_activity', kind: 'activity', name: '修行百艺', gems: 40, titleId: 'title_baiyi', titleName: '百艺修士', desc: '收录「修行手记」全部 11 张明信片' },
  { id: 'album_grand', kind: 'grand', name: '画圣·山河印心', gems: 100, titleId: 'title_huasheng', titleName: '画圣·山河印心', desc: '集齐整本山河画册（限定称号）' },
];

export function albumGroupProgress(kind: SceneKind, state: GameState): { got: number; total: number; done: boolean } {
  const scenes = SCENES.filter(s => s.kind === kind);
  const got = scenes.reduce((n, s) => n + (isSceneUnlocked(s, state) ? 1 : 0), 0);
  return { got, total: scenes.length, done: got === scenes.length && scenes.length > 0 };
}

export function isAlbumRewardClaimed(rw: AlbumReward, state: GameState): boolean {
  return (state.albumClaims ?? []).includes(rw.id);
}

export function isAlbumRewardAvailable(rw: AlbumReward, state: GameState): boolean {
  if (isAlbumRewardClaimed(rw, state)) return false;
  if (rw.kind === 'grand') return unlockedSceneCount(state) === SCENES.length;
  return albumGroupProgress(rw.kind as SceneKind, state).done;
}

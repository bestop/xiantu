// ============================================
// 区域与怪物图鉴（10 区域 × 12 妖兽 + 10 大 BOSS = 130）
// ============================================

import { MonsterDef, RegionDef } from '@/types/game';

export const REGIONS: RegionDef[] = [
  { id: 'r1', name: '青云郊野', icon: '⛰️', minTier: 1, description: '山门之外的青山野林，妖兽温和，适合初入修行者。' },
  { id: 'r2', name: '落霞山脉', icon: '🌄', minTier: 10, description: '晚霞映照的险峻山脉，妖兽渐强，机缘与危险并存。' },
  { id: 'r3', name: '幽冥沼泽', icon: '🌫️', minTier: 20, description: '瘴气弥漫的死地，阴魂游荡，寻常修士绕道而行。' },
  { id: 'r4', name: '烈焰谷', icon: '🌋', minTier: 30, description: '地火喷涌的灼热谷地，火属性妖兽的巢穴。' },
  { id: 'r5', name: '万妖林', icon: '🌲', minTier: 40, description: '万妖盘踞的古林，树精狐妖皆有道行。' },
  { id: 'r6', name: '寒冰原', icon: '❄️', minTier: 50, description: '万里冰封的极北之地，冰魄寒气蚀骨。' },
  { id: 'r7', name: '雷罚之地', icon: '⚡', minTier: 60, description: '九天雷罚终年轰鸣，非大毅力者不能踏足。' },
  { id: 'r8', name: '九天秘境', icon: '🏯', minTier: 70, description: '上古大能洞府遗址，机缘无数，凶险莫测。' },
  { id: 'r9', name: '归墟海', icon: '🌀', minTier: 85, description: '众水汇聚的无底深渊，海眼之下沉睡着上古遗骸。' },
  { id: 'r10', name: '仙墟', icon: '⛩️', minTier: 100, description: '上古仙战之地，断剑残碑间游荡着不敬的仙魂。' },
];

// 每区域 12 只常规妖兽名字
const MONSTER_NAMES: Record<string, string[]> = {
  r1: ['野山狼', '灰羽鸦', '赤尾狐', '青纹鹿', '通臂灵猴', '毒牙蛛', '石甲蟹', '追风隼', '竹叶青', '莽牛精', '偷丹鼠', '独角山羊'],
  r2: ['岩甲兽', '铁背熊', '落霞雕', '火鬣狗', '碧眼灵狸', '裂石蜥', '穿山兽', '黑风马贼', '血牙豹', '独角犀', '崖壁巨蛛', '铜头蝰蛇'],
  r3: ['淤泥怪', '腐骨蟾', '幽冥水蛭', '鬼面蛾', '行尸傀儡', '瘴气精', '暗影鳗', '噬魂蚁', '哭嚎鬼火', '沼泽巨蟒', '食人花', '溺亡水鬼'],
  r4: ['火蜥蜴', '熔岩犬', '赤炎蝎', '火焰人', '爆裂火鼠', '炎魔傀儡', '朱雀雏鸟', '火云邪狼', '熔金兽', '焚天蟒', '火灵芝妖', '岩浆史莱姆'],
  r5: ['千年狐妖', '古树妖精', '百花蛇妖', '黑熊精', '斑斓虎妖', '鹿角仙', '月宫玉兔', '罗刹蛛女', '衔月灵鹤', '通天蝠妖', '穿林豹妖', '藤蔓妖藤'],
  r6: ['冰晶狼', '雪原巨熊', '寒潭蛟龙', '冰甲甲虫', '霜降火狐', '雪山冰女', '冰魄蛇', '玄冰灵龟', '凛风霜鹰', '白毛雪怪', '九彩冰蚕', '寒潭玄鸦'],
  r7: ['紫霄雷鹰', '引雷天貂', '雷纹赤虎', '霹雳雷虫', '引雷幡傀儡', '雷泽蛟龙', '奔雷巨兽', '电光灵梭', '雷煞鬼将', '九霄雷蛇', '震地雷犀', '雷火天蝎'],
  r8: ['秘境石卫', '天兵残魂', '金甲力士', '星辰傀儡', '银河锦鲤', '九天玄鸟', '石像神卫', '虚空游魂', '天雷木灵', '混元灵兽', '守阁剑灵', '周天星君影'],
  r9: ['渊影鲛人', '沉舟水魅', '深海龙蛭', '墨涛巨鱿', '幽壑鲸灵', '溺海亡歌', '漩涡妖灵', '碧涛海妖', '珊瑚老祖', '深流电鳗', '沧渊之目', '归墟潮兽'],
  r10: ['碎甲仙兵', '断剑剑灵', '残碑石魂', '云辇遗骏', '仙宫灯守', '坠星铁骑', '金阙卫队', '焚香玉女', '镇碑武卒', '半仙傀儡', '遗诏天使', '仙池锦鲤'],
};

const MONSTER_ICONS: Record<string, string> = {
  r1: '🐺', r2: '🐻', r3: '👻', r4: '🔥', r5: '🦊', r6: '🐻‍❄️', r7: '🦅', r8: '🗿', r9: '🐙', r10: '⛩️',
};

const BOSSES: Record<string, { name: string; icon: string }> = {
  r1: { name: '千年树妖', icon: '🌳' },
  r2: { name: '落霞老祖', icon: '🧓' },
  r3: { name: '沼泽阎罗', icon: '☠️' },
  r4: { name: '炎狱魔君', icon: '👹' },
  r5: { name: '万妖之王', icon: '👑' },
  r6: { name: '冰封古帝', icon: '🧊' },
  r7: { name: '九霄雷尊', icon: '🌩️' },
  r8: { name: '天道化身', icon: '☯️' },
  r9: { name: '归墟之主', icon: '🐙' },
  r10: { name: '仙帝残影', icon: '🕯️' },
};

// 各区域掉落表
const REGION_DROPS: Record<string, { itemId: string; rate: number; qty?: number }[]> = {
  r1: [
    { itemId: 'herb_1', rate: 0.22, qty: 2 },
    { itemId: 'pelt_1', rate: 0.18 },
    { itemId: 'pill_heal_s', rate: 0.08 },
  ],
  r2: [
    { itemId: 'herb_1', rate: 0.2, qty: 3 },
    { itemId: 'bone_1', rate: 0.18 },
    { itemId: 'core_1', rate: 0.06 },
    { itemId: 'pill_heal_s', rate: 0.09 },
  ],
  r3: [
    { itemId: 'bone_1', rate: 0.2 },
    { itemId: 'core_1', rate: 0.09 },
    { itemId: 'herb_2', rate: 0.1 },
    { itemId: 'pill_heal_m', rate: 0.07 },
  ],
  r4: [
    { itemId: 'core_1', rate: 0.11 },
    { itemId: 'herb_2', rate: 0.12 },
    { itemId: 'pill_atk', rate: 0.05 },
    { itemId: 'pill_heal_m', rate: 0.08 },
  ],
  r5: [
    { itemId: 'core_1', rate: 0.13 },
    { itemId: 'herb_2', rate: 0.14 },
    { itemId: 'herb_3', rate: 0.06 },
    { itemId: 'pill_atk', rate: 0.05 },
    { itemId: 'pill_def', rate: 0.05 },
  ],
  r6: [
    { itemId: 'herb_3', rate: 0.09 },
    { itemId: 'core_1', rate: 0.14 },
    { itemId: 'pill_def', rate: 0.06 },
    { itemId: 'pill_heal_m', rate: 0.09 },
  ],
  r7: [
    { itemId: 'herb_3', rate: 0.11 },
    { itemId: 'core_1', rate: 0.16 },
    { itemId: 'pill_exp', rate: 0.04 },
    { itemId: 'pill_heal_l', rate: 0.07 },
  ],
  r8: [
    { itemId: 'herb_4', rate: 0.07 },
    { itemId: 'core_1', rate: 0.18 },
    { itemId: 'pill_exp', rate: 0.06 },
    { itemId: 'pill_heal_l', rate: 0.09 },
  ],
  r9: [
    { itemId: 'core_1', rate: 0.2 },
    { itemId: 'herb_4', rate: 0.08 },
    { itemId: 'pill_gold', rate: 0.05 },
    { itemId: 'pill_cap', rate: 0.05 },
    { itemId: 'pill_heal_l', rate: 0.1 },
  ],
  r10: [
    { itemId: 'herb_4', rate: 0.1 },
    { itemId: 'core_1', rate: 0.22 },
    { itemId: 'pill_exp', rate: 0.07 },
    { itemId: 'pill_luck', rate: 0.05 },
    { itemId: 'pill_heal_xl', rate: 0.06 },
  ],
};

// 妖王专属掉落（仅对应妖王掉落，不随小怪掉出；未被命中则无额外收获）
export const BOSS_ONLY_DROPS: Record<string, { itemId: string; rate: number; qty?: number }[]> = {
  r9_boss: [
    { itemId: 'r9_abyss_scale', rate: 0.5 },
  ],
  r10_boss: [
    { itemId: 'r10_immortal_shard', rate: 0.5 },
  ],
};

// 怪物属性公式
function monsterStats(tier: number, isBoss: boolean) {
  const hp = Math.round(30 * Math.pow(tier, 1.55) * (isBoss ? 4.5 : 1));
  const atk = Math.round(1.8 * Math.pow(tier, 1.2) * (isBoss ? 1.5 : 1));
  const def = Math.round(2.6 * Math.pow(tier, 1.12) * (isBoss ? 1.35 : 1));
  const speed = Math.round(5 + tier * 0.45 + (isBoss ? 8 : 0));
  const exp = Math.round(4 * Math.pow(tier, 1.65) * (isBoss ? 8 : 1));
  const gold = Math.round(5 * Math.pow(tier, 1.4) * (isBoss ? 9 : 1));
  return { hp, atk, def, speed, exp, gold };
}

function buildMonsters(): MonsterDef[] {
  const list: MonsterDef[] = [];
  for (const region of REGIONS) {
    const names = MONSTER_NAMES[region.id];
    names.forEach((name, i) => {
      const tier = region.minTier + i; // 区域内递增
      const s = monsterStats(tier, false);
      list.push({
        id: `${region.id}_m${i + 1}`,
        name,
        icon: MONSTER_ICONS[region.id],
        region: region.id,
        tier,
        ...s,
        isBoss: false,
        drops: REGION_DROPS[region.id],
        equipDropRate: 0.035 + tier * 0.0004,
        cardDropRate: 0.025,
      });
    });
    // BOSS
    const bt = region.minTier + 11;
    const s = monsterStats(bt, true);
    list.push({
      id: `${region.id}_boss`,
      name: BOSSES[region.id].name,
      icon: BOSSES[region.id].icon,
      region: region.id,
      tier: bt,
      ...s,
      isBoss: true,
      drops: REGION_DROPS[region.id],
      equipDropRate: 0.28,
      cardDropRate: 0.5,
    });
  }
  return list;
}

export const MONSTERS: MonsterDef[] = buildMonsters();

export const MONSTER_MAP: Record<string, MonsterDef> = Object.fromEntries(
  MONSTERS.map(m => [m.id, m])
);

export function getMonstersByRegion(regionId: string): MonsterDef[] {
  return MONSTERS.filter(m => m.region === regionId);
}

export function getBossByRegion(regionId: string): MonsterDef {
  return MONSTERS.find(m => m.region === regionId && m.isBoss)!;
}

// 根据玩家平均战斗等级推荐怪物
export function getRecommendedMonster(avgCombatLevel: number): MonsterDef {
  // 找 tier 接近 avgCombatLevel/5 的怪（战斗技能总等级/5 ≈ 单项平均）
  const targetTier = Math.max(1, Math.round(avgCombatLevel / 5));
  let best = MONSTERS[0];
  let bestDiff = Infinity;
  for (const m of MONSTERS) {
    if (m.isBoss) continue;
    const diff = Math.abs(m.tier - targetTier);
    if (diff < bestDiff) { bestDiff = diff; best = m; }
  }
  return best;
}

export const TOTAL_MONSTERS = MONSTERS.length;

// 图鉴收集数：按妖兽总表扫描，卡片记录里的陈旧 id（妖兽改名/删减遗留）不计入
// 图鉴 / 成就 cardTypes / 天梯评分共用此口径
export function countCollectedCards(cards: Record<string, number> | undefined): number {
  if (!cards) return 0;
  return MONSTERS.reduce((a, m) => a + ((cards[m.id] ?? 0) > 0 ? 1 : 0), 0);
}

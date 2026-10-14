// ============================================
// 限定称号注册表：画册集齐 / 弟子位阶 / 转生轮回
// 玩家可任选一枚佩戴，展示在主页角色卡
// ============================================

import { GameState, SectId } from '@/types/game';
import { SECT_MAP, sectRank, sectTitleId } from './sects';
import { REBIRTH_TITLES } from './rebirth';

export interface TitleDef {
  id: string;
  name: string;
  desc: string;
}

// 世界 BOSS 击杀限定称号：按 BOSS 名映射，首次击杀自动授予（十大妖王各一枚）
export const WB_KILL_TITLES: Record<string, TitleDef> = {
  '噬山血蟒': { id: 'title_tunshan', name: '吞山客', desc: '首次击杀世界 BOSS「噬山血蟒」' },
  '九幽冥皇': { id: 'title_zhenyou', name: '镇幽使', desc: '首次击杀世界 BOSS「九幽冥皇」' },
  '焚世炎帝': { id: 'title_daohuo', name: '蹈火真君', desc: '首次击杀世界 BOSS「焚世炎帝」' },
  '沧溟海皇': { id: 'title_yuhai', name: '驭海龙尊', desc: '首次击杀世界 BOSS「沧溟海皇」' },
  '万古石帝': { id: 'title_hanyue', name: '撼岳神君', desc: '首次击杀世界 BOSS「万古石帝」' },
  '紫雷天君': { id: 'title_yulei', name: '御雷天将', desc: '首次击杀世界 BOSS「紫雷天君」' },
  '归墟鲸祖': { id: 'title_cangyuan', name: '沧渊猎神', desc: '首次击杀世界 BOSS「归墟鲸祖」' },
  '太阴幽后': { id: 'title_lanyue', name: '揽月者', desc: '首次击杀世界 BOSS「太阴幽后」' },
  '混沌魔神': { id: 'title_podun', name: '破沌者', desc: '首次击杀世界 BOSS「混沌魔神」' },
  '葬天仙帝': { id: 'title_shixian', name: '弑仙者', desc: '首次击杀世界 BOSS「葬天仙帝」' },
};

// 隐藏称号：集齐十大妖王首杀称号后现世
export const HIDDEN_TITLE_HAOLING: TitleDef = {
  id: 'title_haoling',
  name: '号令天下',
  desc: '集齐十大妖王首杀限定称号（隐藏称号）',
};

// 固定称号（画册 / 转生 / 世界 BOSS 击杀 / 隐藏）
export const FIXED_TITLES: TitleDef[] = [
  { id: 'title_shanhe', name: '山河行者', desc: '集齐画册「行走山河」全部明信片' },
  { id: 'title_baiyi', name: '百艺修士', desc: '集齐画册「修行手记」全部明信片' },
  { id: 'title_zhenta', name: '镇塔修士', desc: '集齐画册「锁妖塔影」全部明信片' },
  { id: 'title_huasheng', name: '画圣·山河印心', desc: '集齐整本山河画册（限定）' },
  ...Object.values(WB_KILL_TITLES),
  ...REBIRTH_TITLES.map(t => ({ id: t.id, name: t.name, desc: `转生 ${t.count} 次达成` })),
  HIDDEN_TITLE_HAOLING,
];

// 是否已集齐十大妖王首杀称号（隐藏称号授予条件）
export function hasAllWbTitles(ownedTitleIds: string[]): boolean {
  const ids = Object.values(WB_KILL_TITLES).map(t => t.id);
  return ids.every(id => ownedTitleIds.includes(id));
}

export const TITLE_MAP: Record<string, TitleDef> = Object.fromEntries(
  FIXED_TITLES.map(t => [t.id, t])
);

// 弟子位阶称号（随宗门与贡献动态生成）
export function sectRankTitle(sectId: SectId, rankKey: string): TitleDef {
  const sect = SECT_MAP[sectId];
  const rankName = sectRank(9999).name; // fallback
  const names: Record<string, string> = { outer: '外门弟子', inner: '内门弟子', true: '真传弟子' };
  return {
    id: sectTitleId(sectId, rankKey),
    name: `${sect.name}·${names[rankKey] ?? rankName}`,
    desc: `${sect.name}位阶称号`,
  };
}

// 获取称号定义（含宗门动态称号）
export function getTitleDef(id: string, state: GameState): TitleDef | null {
  if (TITLE_MAP[id]) return TITLE_MAP[id];
  // 宗门称号：sect_{sectId}_{rank}
  if (id.startsWith('sect_')) {
    const parts = id.split('_');
    if (parts.length === 3) {
      const [, sectId, rank] = parts;
      const names: Record<string, string> = { outer: '外门弟子', inner: '内门弟子', true: '真传弟子' };
      const sect = SECT_MAP[sectId as SectId];
      if (sect && names[rank]) {
        return { id, name: `${sect.name}·${names[rank]}`, desc: `${sect.name}位阶称号` };
      }
    }
  }
  return null;
}

// 当前应授予的宗门称号 id（由累计贡献决定）
export function currentSectTitleId(state: GameState): string | null {
  const sect = state.sect;
  if (!sect) return null;
  return sectTitleId(sect.sectId, sectRank(sect.totalContrib).key);
}

// 兼容旧存档
export function normalizeTitles(state: { titles?: string[]; activeTitle?: string | null }): {
  titles: string[]; activeTitle: string | null;
} {
  return {
    titles: state.titles ?? [],
    activeTitle: state.activeTitle ?? null,
  };
}

// 佩戴展示名
export function activeTitleName(state: GameState): string | null {
  if (!state.activeTitle) return null;
  return getTitleDef(state.activeTitle, state)?.name ?? null;
}

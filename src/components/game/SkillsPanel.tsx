// 技能面板：修行总览 / 16 技能图形卡 / 技能详情 / 炼丹锻造
// 图形化改造：纯视图层，逻辑与存档零改动，旧档天然兼容（img 缺失时回退 emoji）
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { SKILLS, SKILL_MAP, ACTIVITY_MAP, xpToNext, gatherTier, combatLevelSum, totalSkillLevel, getTitle } from '@/lib/game/skills';
import { ACTIVITY_SCENE } from '@/lib/game/scenes';
import { SkillId, SkillCategory, MAX_SKILL_LEVEL } from '@/types/game';
import { Section, ProgressBar, ActionButton, formatNum, formatDuration } from './ui-bits';
import { getItem, CRAFT_RECIPES, CraftRecipe } from '@/lib/game/items';
import { cn } from '@/lib/utils';
import { ChevronLeft, Hammer, FlaskConical, Play, Square } from 'lucide-react';

const CATEGORY_TABS: { id: SkillCategory | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'combat', label: '战斗' },
  { id: 'gather', label: '采集' },
  { id: 'craft', label: '生产' },
  { id: 'support', label: '辅助' },
];

// 分类徽标配色
const CATEGORY_STYLE: Record<SkillCategory, { label: string; chip: string }> = {
  combat: { label: '战斗', chip: 'bg-rose-950/85 text-rose-300' },
  gather: { label: '采集', chip: 'bg-emerald-950/85 text-emerald-300' },
  craft: { label: '生产', chip: 'bg-amber-950/85 text-amber-300' },
  support: { label: '辅助', chip: 'bg-sky-950/85 text-sky-300' },
};

// 图片加载失败 → 隐藏 img 露出底层 emoji 回退（统一 404 防御口径）
function hideImg(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.visibility = 'hidden';
}

// ---------- 效果文本（当前等级 / 下一级复用） ----------
function skillEffectText(effectKey: string, lv: number): string {
  switch (effectKey) {
    case 'hp': return `生命上限 ${40 + lv * 12}（基础 40 + 每级 12）`;
    case 'power': return `基础攻击 ${6 + lv * 2}（每级 +2）`;
    case 'weaponry': return `武器增伤 ${lv}（每级 +1 攻）`;
    case 'defence': return `防御 ${3 + Math.round(lv * 1.5)}（每级 +1.5）`;
    case 'speed': return `速度 ${5 + Math.round(lv * 0.5)}（每级 +0.5，提升闪避）`;
    case 'mining': return `当前可采 ${gatherTier(lv)} 阶矿石`;
    case 'fishing': return `当前可钓 ${gatherTier(lv)} 阶灵鱼`;
    case 'begging': return `每轮化缘 ${Math.round(25 * (1 + lv * 0.06))} 金币`;
    case 'archaeology': return `装备掉落 +${(lv * 0.2).toFixed(1)}%`;
    case 'cooking': return `可炼制 ${CRAFT_RECIPES.filter(r => r.kind === 'cooking' && r.minSkillLevel <= lv).length} 种丹药`;
    case 'forging': return `锻造装备 ${Math.min(80, lv)} 阶`;
    case 'intellect': return `全部经验 +${lv}%`;
    case 'focus': return `离线效率 ${Math.min(100, 60 + lv * 0.2).toFixed(0)}% · 上限 ${formatDuration(12 * 3600 + lv * 360)}`;
    case 'luck': return `掉落率 +${(lv * 0.5).toFixed(1)}%`;
    case 'imbibing': return `丹药效果 +${lv}%`;
    case 'insight': return `暴击率 +${(lv * 0.15).toFixed(1)}%`;
    default: return '';
  }
}

export function SkillsPanel() {
  const store = useGameStore();
  const [tab, setTab] = useState<SkillCategory | 'all'>('all');
  const [detail, setDetail] = useState<SkillId | null>(null);

  const filtered = SKILLS.filter(s => tab === 'all' || s.category === tab);
  const skillDef = detail ? SKILL_MAP[detail] : null;

  if (detail && skillDef) {
    return <SkillDetail skillId={detail} onBack={() => setDetail(null)} />;
  }

  // 修行总览数据
  const combatSum = combatLevelSum(store.skills);
  const totalLv = totalSkillLevel(store.skills);
  const realm = getTitle(combatSum);
  const act = store.activeActivity ? ACTIVITY_MAP[store.activeActivity] : null;
  const actScene = act ? ACTIVITY_SCENE[act.id] : null;
  const roundProg = Math.min(1, Math.max(0, store.activityProgress || 0));

  return (
    <div className="p-3 pb-24 space-y-3">
      {/* ===== 修行总览横幅 ===== */}
      <section className="relative rounded-2xl overflow-hidden border border-stone-800 shadow-[0_0_20px_rgba(0,0,0,0.35)]">
        {/* 背景：修炼中显示活动场景画，否则用洞府画 */}
        <img
          src={actScene?.img ?? '/scenes/home.jpg'}
          alt={act ? act.name : '青庐洞府'}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-900/30" />
        <div className="relative p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] tracking-widest text-amber-200/80">修行总览</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-200 font-medium">
              境界 · {realm}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-stone-950/55 border border-stone-800/80 px-2.5 py-1.5">
              <div className="text-[10px] text-stone-400">战斗等级</div>
              <div className="text-base font-bold text-rose-300 tabular-nums leading-tight">{combatSum}</div>
              <div className="text-[9px] text-stone-500">五项战斗技能之和</div>
            </div>
            <div className="rounded-xl bg-stone-950/55 border border-stone-800/80 px-2.5 py-1.5">
              <div className="text-[10px] text-stone-400">技能总等级</div>
              <div className="text-base font-bold text-amber-300 tabular-nums leading-tight">
                {totalLv}<span className="text-[10px] text-stone-500 font-normal"> / {SKILLS.length * MAX_SKILL_LEVEL}</span>
              </div>
              <div className="text-[9px] text-stone-500">共 {SKILLS.length} 项技艺</div>
            </div>
          </div>
          {act ? (
            <div className="mt-2 rounded-xl bg-stone-950/55 border border-emerald-900/50 px-2.5 py-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-300 font-medium">正在修炼 · {act.name}</span>
                <span className="text-stone-500 tabular-nums">每轮 {act.intervalSec} 秒</span>
              </div>
              <ProgressBar value={roundProg} max={1} className="mt-1 h-1.5" barClass="bg-gradient-to-r from-emerald-600 to-emerald-400" />
            </div>
          ) : (
            <div className="mt-2 rounded-xl bg-stone-950/55 border border-stone-800/80 px-2.5 py-2 text-[11px] text-stone-400">
              暂无修炼中的技艺 —— 点击下方卡片选择一项挂机修行
            </div>
          )}
        </div>
      </section>

      {/* 分类过滤 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-3 px-3">
        {CATEGORY_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border min-h-[36px] transition-all active:scale-95',
              tab === t.id
                ? 'bg-gradient-to-b from-amber-800/80 to-amber-950/70 border-amber-500/60 text-amber-100'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== 技能图形卡网格 ===== */}
      <div className="grid grid-cols-2 gap-2">
        {filtered.map(s => {
          const prog = store.skills[s.id];
          const need = xpToNext(prog.level);
          const training = store.activeActivity ? ACTIVITY_MAP[store.activeActivity]?.skillId === s.id : false;
          const maxed = prog.level >= MAX_SKILL_LEVEL;
          const cat = CATEGORY_STYLE[s.category];
          return (
            <button key={s.id} onClick={() => setDetail(s.id)}
              className={cn('relative rounded-xl overflow-hidden border text-left transition-all duration-200 ease-out active:scale-[0.97] group',
                training
                  ? 'border-emerald-500/70 shadow-[0_0_16px_rgba(16,185,129,0.18)] animate-emerald-pulse'
                  : maxed
                    ? 'border-rose-600/80 animate-mythic-glow'
                    : 'border-stone-800 hover:border-stone-700 active:border-amber-700/60')}>
              {/* 修炼中顶部流光 */}
              {training && <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent z-20" />}
              {/* 画布（emoji 兜底在最底层） */}
              <div className="relative aspect-[4/3] w-full bg-stone-800">
                <span aria-hidden className="absolute inset-0 flex items-center justify-center text-4xl opacity-70">{s.icon}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.name} loading="lazy" onError={hideImg}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-active:scale-110 group-active:brightness-110" />
                {/* 渐变压暗，保证文字可读 */}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/25 to-transparent" />
                {/* 角标：分类（左上） */}
                <span className={cn('absolute top-1.5 left-1.5 z-10 text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm font-medium', cat.chip)}>
                  {cat.label}
                </span>
                {/* 角标：修炼中 / 满级（右上） */}
                {training && (
                  <span className="absolute top-1.5 right-1.5 z-10 text-[9px] px-1.5 py-0.5 rounded bg-emerald-600/90 text-white font-medium shadow">
                    修炼中
                  </span>
                )}
                {maxed && !training && (
                  <span className="absolute top-1.5 right-1.5 z-10 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/90 text-stone-950 font-bold shadow animate-gold-pulse">
                    满级
                  </span>
                )}
                {/* 底部信息条 */}
                <div className="absolute left-0 right-0 bottom-1.5 z-10 px-2 flex items-end justify-between gap-1">
                  <span className="text-xs font-bold text-stone-100 drop-shadow truncate">{s.name}</span>
                  <span className="shrink-0 text-[11px] font-bold text-amber-300 tabular-nums drop-shadow">
                    {prog.level}<span className="text-[9px] text-stone-400 font-normal"> 级</span>
                  </span>
                </div>
                {/* 经验进度条贴底 */}
                <div className="absolute left-0 right-0 bottom-0 z-10 h-1.5 bg-stone-950/70">
                  <div className={cn('h-full transition-all',
                    training
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      : 'bg-gradient-to-r from-amber-600 to-amber-400')}
                    style={{ width: `${maxed ? 100 : Math.min(100, (prog.xp / Math.max(1, need)) * 100)}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===== 技能详情 =====
function SkillDetail({ skillId, onBack }: { skillId: SkillId; onBack: () => void }) {
  const store = useGameStore();
  const def = SKILL_MAP[skillId];
  const prog = store.skills[skillId];
  const need = xpToNext(prog.level);
  const act = def.activityId ? ACTIVITY_MAP[def.activityId] : null;
  const training = store.activeActivity === def.activityId && !!def.activityId;
  const recipes = CRAFT_RECIPES.filter(r => r.kind === (skillId === 'cooking' ? 'cooking' : skillId === 'forging' ? 'forging' : '__none__'));
  const maxed = prog.level >= MAX_SKILL_LEVEL;
  const cat = CATEGORY_STYLE[def.category];
  const scene = ACTIVITY_SCENE[skillId];

  return (
    <div className="p-3 pb-24 space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-stone-400 min-h-[36px] px-2">
        <ChevronLeft className="w-4 h-4" /> 返回技能列表
      </button>

      {/* ===== 头图横幅（满级时对齐神品呼吸辉光） ===== */}
      <section className={cn('relative rounded-2xl overflow-hidden border shadow-[0_0_20px_rgba(0,0,0,0.35)]',
        maxed ? 'border-rose-600/80 animate-mythic-glow' : 'border-stone-800')}>
        <div className="relative h-40 w-full bg-stone-800">
          <span aria-hidden className="absolute inset-0 flex items-center justify-center text-5xl opacity-70">{def.icon}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={def.img} alt={def.name} onError={hideImg} className="absolute inset-0 w-full h-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/35 to-transparent" />
          <div className="absolute left-0 right-0 bottom-0 p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-amber-100 drop-shadow">{def.name}</h2>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm font-medium', cat.chip)}>{cat.label}系</span>
              {training && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600/90 text-white font-medium">修炼中</span>}
            </div>
            <div className="text-xs text-stone-300/90 mt-1 drop-shadow">{def.description}</div>
          </div>
        </div>
      </section>
      {scene?.caption && (
        <div className="text-[11px] italic text-stone-500 text-center -mt-1">「{scene.caption}」</div>
      )}

      {/* 进度与效果 */}
      <Section className="bg-gradient-to-br from-stone-900 to-stone-900/50">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-400">等级 <b className="text-amber-300 tabular-nums">{prog.level}</b> / {MAX_SKILL_LEVEL}</span>
            <span className="text-stone-500 tabular-nums">{formatNum(prog.xp)} / {formatNum(need)}</span>
          </div>
          <ProgressBar value={prog.xp} max={need} className="h-2.5" showText barClass="bg-gradient-to-r from-amber-600 to-amber-400" />
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-900/40 rounded-lg px-2.5 py-2">
            当前效果：{skillEffectText(def.effectKey, prog.level)}
          </div>
          {!maxed && (
            <div className="text-xs text-stone-400 bg-stone-800/40 border border-stone-800 rounded-lg px-2.5 py-2">
              下一级：{skillEffectText(def.effectKey, prog.level + 1)}
            </div>
          )}
        </div>
      </Section>

      {/* 训练活动 */}
      {act && (
        <Section title="修炼活动">
          <div className="flex items-center gap-2 mb-2">
            {/* 活动场景缩略图（emoji 兜底） */}
            <div className="relative w-20 h-14 shrink-0 rounded-lg overflow-hidden border border-stone-800 bg-stone-800">
              <span aria-hidden className="absolute inset-0 flex items-center justify-center text-2xl opacity-70">{act.icon}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene?.img} alt={act.name} loading="lazy" onError={hideImg}
                className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-stone-200">{act.name}</div>
              <div className="text-[10px] text-stone-500">{act.description}</div>
              <div className="text-[10px] text-stone-500 mt-0.5">每轮 {act.intervalSec} 秒 · +{act.skillXp} 经验</div>
            </div>
          </div>
          {training ? (
            <div className="space-y-2">
              <ProgressBar value={store.activityProgress} max={1} className="h-2.5" barClass="bg-emerald-500" showText />
              <ActionButton variant="danger" className="w-full" onClick={() => store.stopActivity()}>
                <span className="flex items-center justify-center gap-1"><Square className="w-4 h-4" /> 停止修炼</span>
              </ActionButton>
            </div>
          ) : (
            <ActionButton className="w-full" onClick={() => store.startActivity(act.id)} disabled={maxed}>
              <span className="flex items-center justify-center gap-1"><Play className="w-4 h-4" /> 开始修炼</span>
            </ActionButton>
          )}
          {store.activeActivity && !training && (
            <div className="text-[10px] text-stone-500 mt-1.5 text-center">
              注意：开始新活动会停止当前的「{ACTIVITY_MAP[store.activeActivity]?.name}」
            </div>
          )}
        </Section>
      )}

      {/* 战斗技能提示 */}
      {def.category === 'combat' && (
        <Section title="训练方式">
          <div className="text-xs text-stone-400 leading-relaxed">
            战斗系技能通过战斗提升——每击败一只妖兽，气血、神力、神兵、御体、遁速五项技能同时获得经验。
            开启自动战斗或在离线时勾选自动战斗，也能持续训练。
          </div>
          <ActionButton variant="ghost" className="w-full mt-2" onClick={() => store.setTab('combat')}>前往战斗</ActionButton>
        </Section>
      )}

      {/* 炼丹/锻造配方 */}
      {recipes.length > 0 && (
        <CraftSection kind={skillId === 'cooking' ? 'cooking' : 'forging'} recipes={recipes} />
      )}
    </div>
  );
}

// ===== 炼丹/锻造 =====
function CraftSection({ kind, recipes }: { kind: 'cooking' | 'forging'; recipes: CraftRecipe[] }) {
  const store = useGameStore();
  const level = store.skills[kind].level;
  const [msg, setMsg] = useState<string | null>(null);

  const doCraft = (r: CraftRecipe) => {
    const err = store.craft(r.id);
    setMsg(err ?? (kind === 'cooking' ? '丹成！' : '锻造完成！'));
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <Section title={kind === 'cooking' ? '炼丹配方' : '锻造图纸'} extra={
      <span className="text-[10px] text-stone-500 flex items-center gap-1">
        {kind === 'cooking' ? <FlaskConical className="w-3 h-3" /> : <Hammer className="w-3 h-3" />}
        {kind === 'cooking' ? '炼丹' : '锻造'} {level} 级
      </span>
    }>
      <div className="space-y-2">
        {recipes.map(r => {
          const locked = level < r.minSkillLevel;
          // 材料足够判定
          const canAfford = r.materials.every(m => {
            if (m.itemId === 'ore_dynamic') {
              const realId = `ore_${gatherTier(level)}`;
              return (store.inventory.find(i => i.itemId === realId)?.quantity ?? 0) >= m.qty;
            }
            return (store.inventory.find(i => i.itemId === m.itemId)?.quantity ?? 0) >= m.qty;
          });
          return (
            <div key={r.id} className={cn('rounded-lg border p-2.5',
              locked ? 'border-stone-800/60 opacity-50' : 'border-stone-800 bg-stone-800/40')}>
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-stone-200">{r.name}
                    {!locked && r.minSkillLevel > 1 && <span className="text-[9px] text-stone-500 ml-1">{r.minSkillLevel}级解锁</span>}
                  </div>
                  <div className="text-[10px] text-stone-500">{r.description}</div>
                  <div className="text-[10px] mt-0.5">
                    {r.materials.map(m => {
                      const realId = m.itemId === 'ore_dynamic' ? `ore_${gatherTier(level)}` : m.itemId;
                      const it = getItem(realId);
                      const have = store.inventory.find(i => i.itemId === realId)?.quantity ?? 0;
                      return (
                        <span key={m.itemId} className={cn('mr-2', have >= m.qty ? 'text-stone-400' : 'text-red-400')}>
                          {it?.icon}{it?.name} {have}/{m.qty}
                        </span>
                      );
                    })}
                    <span className="text-amber-400/80">+{r.skillXp * 3} 经验</span>
                  </div>
                </div>
                <ActionButton className="!min-h-[40px] !px-3 text-xs"
                  disabled={locked || !canAfford} onClick={() => doCraft(r)}>
                  {kind === 'cooking' ? '炼制' : '锻造'}
                </ActionButton>
              </div>
            </div>
          );
        })}
        {msg && (
          <div className={cn('text-xs text-center py-1.5 rounded-lg',
            msg.includes('不足') || msg.includes('失败') ? 'text-red-300 bg-red-950/50' : 'text-emerald-300 bg-emerald-950/50')}>
            {msg}
          </div>
        )}
      </div>
    </Section>
  );
}

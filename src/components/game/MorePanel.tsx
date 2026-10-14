// 更多面板：灵宠舍 / 世界BOSS / 天梯榜 / 仙市 / 成就 / 图鉴 / 设置
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { getShopEntries } from '@/lib/game/engine';
import { getItem, QUALITY_TEXT, AFFIX_NAMES } from '@/lib/game/items';
import { FORGE_RECIPES, forgeCostCheck, ForgeRecipe } from '@/lib/game/forge';
import { formatAffix } from '@/lib/game/items';
import { ACHIEVEMENTS, achievementValue } from '@/lib/game/achievements';
import { REGIONS, getMonstersByRegion, TOTAL_MONSTERS, MONSTERS, countCollectedCards } from '@/lib/game/monsters';
import {
  SCENES, isSceneUnlocked, unlockedSceneCount, sceneUnlockHint, SceneKind,
  ALBUM_REWARDS, albumGroupProgress, isAlbumRewardClaimed, isAlbumRewardAvailable,
} from '@/lib/game/scenes';
import { PetPanel } from './PetPanel';
import { WorldBossPanel } from './WorldBossPanel';
import { LeaderboardPanel } from './LeaderboardPanel';
import { SectPanel } from './SectPanel';
import { RebirthPanel } from './RebirthPanel';
import { Section, ActionButton, formatNum } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Store, Trophy, BookOpen, Settings, AlertTriangle, PawPrint, Skull, Medal, Images, Landmark, RefreshCcw, Gift, Hammer } from 'lucide-react';

export function MorePanel() {
  const view = useGameStore(s => s.moreView);
  const setView = useGameStore(s => s.setMoreView);
  // 图鉴入口动态进度（与 CodexView 头部同口径）
  const collectedCards = countCollectedCards(useGameStore(s => s.cards));

  if (view === 'shop') return <ShopView onBack={() => setView('root')} />;
  if (view === 'forge') return <ForgeView onBack={() => setView('root')} />;
  if (view === 'achievements') return <AchievementsView onBack={() => setView('root')} />;
  if (view === 'codex') return <CodexView onBack={() => setView('root')} />;
  if (view === 'album') return <AlbumView onBack={() => setView('root')} />;
  if (view === 'pets') return <PetPanel onBack={() => setView('root')} />;
  if (view === 'worldboss') return <WorldBossPanel onBack={() => setView('root')} />;
  if (view === 'leaderboard') return <LeaderboardPanel onBack={() => setView('root')} />;
  if (view === 'sect') return <SectPanel onBack={() => setView('root')} />;
  if (view === 'rebirth') return <RebirthPanel onBack={() => setView('root')} />;
  if (view === 'settings') return <SettingsView onBack={() => setView('root')} />;

  const entries = [
    { id: 'sect', icon: <Landmark className="w-5 h-5" />, title: '宗门', desc: '拜入山门，贡献换珍宝，同门争魁首', tone: 'text-cyan-300 bg-cyan-950/60 border-cyan-900/50' },
    { id: 'pets', icon: <PawPrint className="w-5 h-5" />, title: '灵宠舍', desc: '收服妖兽为灵宠，进化融合羽化神兽', tone: 'text-emerald-300 bg-emerald-950/60 border-emerald-900/50' },
    { id: 'worldboss', icon: <Skull className="w-5 h-5" />, title: '世界 BOSS', desc: '血量持久的巨兽，伤害累积冲榜', tone: 'text-rose-300 bg-rose-950/60 border-rose-900/50' },
    { id: 'leaderboard', icon: <Medal className="w-5 h-5" />, title: '天梯榜', desc: '综合实力排名，与万千修士争锋', tone: 'text-amber-300 bg-amber-950/60 border-amber-900/50' },
    { id: 'rebirth', icon: <RefreshCcw className="w-5 h-5" />, title: '轮回转生', desc: '渡劫之后轮回重修，换取永久加成', tone: 'text-violet-300 bg-violet-950/60 border-violet-900/50' },
    { id: 'forge', icon: <Hammer className="w-5 h-5" />, title: '炼宝坊', desc: '妖王异宝熔铸专属神装', tone: 'text-orange-300 bg-orange-950/60 border-orange-900/50' },
    { id: 'shop', icon: <Store className="w-5 h-5" />, title: '仙市', desc: '购买丹药、材料与装备宝袋', tone: 'text-stone-300 bg-stone-800/80 border-stone-700/50' },
    { id: 'achievements', icon: <Trophy className="w-5 h-5" />, title: '成就', desc: '永久成就与宝石奖励', tone: 'text-amber-300 bg-amber-950/60 border-amber-900/50' },
    { id: 'codex', icon: <BookOpen className="w-5 h-5" />, title: '妖兽图鉴', desc: `已收集 ${collectedCards}/${TOTAL_MONSTERS}，点亮图鉴`, tone: 'text-stone-300 bg-stone-800/80 border-stone-700/50' },
    { id: 'album', icon: <Images className="w-5 h-5" />, title: '山河画册', desc: '集齐明信片领限定称号，永久收藏', tone: 'text-sky-300 bg-sky-950/60 border-sky-900/50' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, title: '设置', desc: '重置存档与游戏说明', tone: 'text-stone-300 bg-stone-800/80 border-stone-700/50' },
  ] as const;

  return (
    <div className="p-3 pb-24 space-y-2">
      {entries.map(e => (
        <button key={e.id} onClick={() => setView(e.id)}
          className={cn('w-full bg-stone-900/80 border rounded-xl p-3.5 flex items-center gap-3 text-left active:scale-[0.99] min-h-[64px] transition-colors hover:bg-stone-900',
            e.id === 'worldboss' ? 'border-rose-900/60' : 'border-stone-800')}>
          <span className={cn('w-10 h-10 rounded-lg border flex items-center justify-center shrink-0', e.tone)} aria-hidden>
            {e.icon}
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-stone-200">{e.title}</div>
            <div className="text-[10px] text-stone-500">{e.desc}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-600 shrink-0" />
        </button>
      ))}
      <div className="text-center text-[10px] text-stone-600 pt-2">
        仙途 · 文字放置修仙 · 灵感来自 Harpagia
      </div>
    </div>
  );
}

// ===== 炼宝坊 =====
function ForgeView({ onBack }: { onBack: () => void }) {
  const inventory = useGameStore(s => s.inventory);
  const gold = useGameStore(s => s.gold);
  const craftForge = useGameStore(s => s.craftForge);
  const [err, setErr] = useState<string | null>(null);

  const craft = (recipe: ForgeRecipe) => {
    setErr(craftForge(recipe.id));
  };

  return (
    <div className="p-3 pb-24 space-y-3">
      <SubHeader title="炼宝坊" onBack={onBack} />

      <div className="text-[11px] text-stone-400 leading-relaxed bg-stone-900/80 border border-stone-800 rounded-xl p-3">
        妖王陨落时遗留的异宝凡火难熔，唯有炼宝坊的地火能将其熔铸成器。核心异宝来自对应妖王掉落，辅以珍材灵金，即可炼成<b className="text-orange-300">专属神装</b>。
      </div>

      {err && (
        <div className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-900/60 rounded-lg px-3 py-2">{err}</div>
      )}

      <div className="space-y-2.5">
        {FORGE_RECIPES.map(recipe => {
          const check = forgeCostCheck(recipe, inventory, gold);
          const needs = [
            { itemId: recipe.materialId, qty: recipe.coreQty },
            ...recipe.extraMats,
          ];
          return (
            <div key={recipe.id} className={cn('bg-stone-900/80 border rounded-xl p-3.5 space-y-2.5',
              recipe.quality === 'mythic' ? 'border-rose-900/60' : 'border-amber-900/50')}>
              <div className="flex items-start gap-3">
                <div className={cn('w-12 h-12 rounded-lg border flex items-center justify-center text-2xl shrink-0',
                  recipe.quality === 'mythic' ? 'bg-rose-950/60 border-rose-800/60' : 'bg-amber-950/50 border-amber-800/50')}>
                  {recipe.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn('text-sm font-bold', QUALITY_TEXT[recipe.quality])}>{recipe.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-400">{recipe.tier}阶·{recipe.quality === 'mythic' ? '神品' : '仙品'}</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">来源：{recipe.bossName}</div>
                  <div className="text-[10px] text-stone-400 mt-1 leading-relaxed">{recipe.desc}</div>
                  <div className="text-[10px] text-amber-300/90 mt-1.5 inline-flex items-center gap-1 bg-amber-950/40 border border-amber-900/50 rounded-md px-2 py-1">
                    <span aria-hidden>✨</span>专属词条·{recipe.sigAffix.label}：{formatAffix(recipe.sigAffix.key, recipe.sigAffix.value)} {AFFIX_NAMES[recipe.sigAffix.key]}（必带）
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {needs.map(m => {
                  const have = inventory.find(i => i.itemId === m.itemId)?.quantity ?? 0;
                  const enough = have >= m.qty;
                  const it = getItem(m.itemId);
                  return (
                    <span key={m.itemId}
                      className={cn('text-[10px] px-2 py-1 rounded-md border tabular-nums',
                        enough ? 'text-emerald-300 border-emerald-900/60 bg-emerald-950/30' : 'text-rose-300 border-rose-900/60 bg-rose-950/30')}>
                      {it?.icon}{it?.name} {have}/{m.qty}
                    </span>
                  );
                })}
                <span className={cn('text-[10px] px-2 py-1 rounded-md border tabular-nums',
                  gold >= recipe.gold ? 'text-amber-300 border-amber-900/60 bg-amber-950/30' : 'text-rose-300 border-rose-900/60 bg-rose-950/30')}>
                  🪙 金币 {formatNum(gold)}/{formatNum(recipe.gold)}
                </span>
              </div>

              <ActionButton
                className="w-full"
                disabled={!check.ok}
                onClick={() => craft(recipe)}
              >
                {check.ok ? `⚒️ 熔铸「${recipe.name}」` : `还差 ${check.missing[0]}`}
              </ActionButton>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-stone-600 text-center">专属装备必带专属词条（金色），其余词条随机生成，亦可继续炼器强化</div>
    </div>
  );
}

// ===== 仙市 =====
function ShopView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const entries = getShopEntries();
  const [msg, setMsg] = useState<string | null>(null);
  const avgLv = Math.max(1, Math.round(
    (['hp', 'weaponry', 'power', 'defence', 'speed'] as const).reduce((a, id) => a + store.skills[id].level, 0) / 5
  ));

  return (
    <div className="p-3 pb-24 space-y-3">
      <SubHeader title="仙市" onBack={onBack} />
      {msg && <div className="text-xs text-center text-amber-300 bg-amber-950/50 rounded-lg py-2">{msg}</div>}

      <Section title="金币商品">
        <div className="space-y-2">
          {entries.filter(e => e.currency === 'gold').map(e => {
            const item = getItem(e.itemId);
            if (!item) return null;
            return (
              <div key={e.itemId} className="flex items-center gap-2.5 bg-stone-800/40 border border-stone-800 rounded-lg p-2.5">
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={cn('text-xs font-semibold', QUALITY_TEXT[item.quality])}>{item.name}</div>
                  <div className="text-[10px] text-stone-500 truncate">{item.description}</div>
                </div>
                <ActionButton className="!min-h-[40px] !px-3 text-xs" disabled={store.gold < e.price} onClick={() => {
                  const err = store.buyShopItem(e.itemId);
                  if (err) { setMsg(err); setTimeout(() => setMsg(null), 2000); }
                }}>🪙 {formatNum(e.price)}</ActionButton>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="宝石商品">
        <div className="space-y-2">
          {entries.filter(e => e.currency === 'gem').map(e => {
            const item = getItem(e.itemId);
            if (!item) return null;
            return (
              <div key={e.itemId} className="flex items-center gap-2.5 bg-stone-800/40 border border-stone-800 rounded-lg p-2.5">
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={cn('text-xs font-semibold', QUALITY_TEXT[item.quality])}>{item.name}</div>
                  <div className="text-[10px] text-stone-500 truncate">{item.description}</div>
                </div>
                <ActionButton className="!min-h-[40px] !px-3 text-xs" onClick={() => {
                  const err = store.buyShopItem(e.itemId);
                  if (err) { setMsg(err); setTimeout(() => setMsg(null), 2000); }
                }} disabled={store.gems < e.price}>💎 {e.price}</ActionButton>
              </div>
            );
          })}
          <div className="flex items-center gap-2.5 bg-purple-950/30 border border-purple-900/60 rounded-lg p-2.5">
            <span className="w-10 h-10 rounded-lg border border-purple-800/50 bg-purple-950/60 flex items-center justify-center text-xl shrink-0" aria-hidden>🎁</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-purple-300">稀有装备宝袋</div>
              <div className="text-[10px] text-stone-500">开出一件 {Math.min(120, avgLv)} 阶上品及以上随机装备</div>
            </div>
            <ActionButton className="!min-h-[40px] !px-3 text-xs" disabled={store.gems < 20} onClick={() => {
              const eq = store.buyEquipBag('rare');
              if (eq) { setMsg(`获得【${eq.name}】！`); setTimeout(() => setMsg(null), 2500); }
            }}>💎 20</ActionButton>
          </div>
          <div className="flex items-center gap-2.5 bg-amber-950/30 border border-amber-900/60 rounded-lg p-2.5">
            <span className="w-10 h-10 rounded-lg border border-amber-800/50 bg-amber-950/60 flex items-center justify-center text-xl shrink-0" aria-hidden>🎑</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-amber-300">仙品装备宝袋</div>
              <div className="text-[10px] text-stone-500">开出一件 {Math.min(120, avgLv)} 阶仙品随机装备</div>
            </div>
            <ActionButton className="!min-h-[40px] !px-3 text-xs" disabled={store.gems < 60} onClick={() => {
              const eq = store.buyEquipBag('legendary');
              if (eq) { setMsg(`获得【${eq.name}】！`); setTimeout(() => setMsg(null), 2500); }
            }}>💎 60</ActionButton>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ===== 成就 =====
function AchievementsView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  // 永久成就口径：高水位（曾达标）即计入完成数，当前值回退不影响
  const done = ACHIEVEMENTS.filter(a => {
    const s = store.achievements[a.id];
    const hw = Math.max(achievementValue(a.metric, store), s?.bestValue ?? 0);
    return s?.claimed || hw >= a.target;
  }).length;

  return (
    <div className="p-3 pb-24 space-y-3">
      <SubHeader title={`成就 (${done}/${ACHIEVEMENTS.length})`} onBack={onBack} />
      <div className="space-y-2">
        {ACHIEVEMENTS.map(a => {
          const value = achievementValue(a.metric, store);
          const state = store.achievements[a.id];
          const hw = Math.max(value, state?.bestValue ?? 0);
          const achieved = (state?.claimed || hw >= a.target);
          const pct = Math.min(100, (value / a.target) * 100);
          return (
            <div key={a.id} className={cn('rounded-xl border p-3',
              achieved ? 'bg-emerald-950/30 border-emerald-800' : 'bg-stone-900/80 border-stone-800')}>
              <div className="flex items-center gap-2.5">
                <span className={cn('text-2xl', !achieved && 'opacity-40 grayscale')} aria-hidden>{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-semibold', achieved ? 'text-emerald-300' : 'text-stone-300')}>{a.name}</span>
                    {state?.claimed && <span className="text-[9px] px-1 rounded bg-emerald-900 text-emerald-300">已领</span>}
                  </div>
                  <div className="text-[10px] text-stone-500">{a.description} · 奖励 💎{a.gemReward}</div>
                  {!achieved && (
                    <div className="mt-1 h-1 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                {!state?.claimed && hw >= a.target && (
                  <ActionButton className="!min-h-[36px] !px-3 text-xs" onClick={() => store.claimAchievement(a.id)}>领取</ActionButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== 妖兽图鉴 =====
// 收集数口径统一在 lib/game/monsters.ts 的 countCollectedCards（图鉴/成就/天梯共用）
function CodexView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const cards = store.cards ?? {};
  const collected = countCollectedCards(cards);
  const [regionId, setRegionId] = useState(REGIONS[0].id);
  const monsters = getMonstersByRegion(regionId);

  return (
    <div className="p-3 pb-24 space-y-3">
      <SubHeader title={`妖兽图鉴 (${collected}/${TOTAL_MONSTERS})`} onBack={onBack} />

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-3 px-3">
        {REGIONS.map(r => {
          const rms = getMonstersByRegion(r.id);
          const got = rms.reduce((a, m) => a + ((cards[m.id] ?? 0) > 0 ? 1 : 0), 0);
          return (
            <button key={r.id} onClick={() => setRegionId(r.id)}
              className={cn('shrink-0 px-3 py-1.5 rounded-lg text-xs border min-h-[36px] transition-all',
                regionId === r.id
                  ? 'bg-gradient-to-b from-amber-800/80 to-amber-950/70 border-amber-500/60 text-amber-100'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700')}>
              {r.icon}{r.name}
              <span className={cn('block text-[9px] tabular-nums', got >= rms.length ? 'text-emerald-400' : 'opacity-70')}>
                {got}/{rms.length}{got >= rms.length ? ' ✓' : ''}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {monsters.map(m => {
          const count = cards[m.id] ?? 0;
          const has = count > 0;
          return (
            <div key={m.id}
              className={cn('rounded-xl border p-2 text-center',
                has
                  ? m.isBoss
                    ? 'bg-gradient-to-b from-amber-950/40 to-stone-900/80 border-amber-800/60'
                    : 'bg-stone-900/80 border-stone-700'
                  : 'bg-stone-950/60 border-stone-800/50')}>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-stone-900/60">
                {/* 图片 404 兜底：已收集卡露出图腾（未收集不渲染，防剧透）。
                    层序：图腾(默认) < 图片(z-10) < ？遮罩/妖王徽标(z-20) */}
                {has && (
                  <span className="absolute inset-0 flex items-center justify-center text-3xl" aria-hidden>{m.icon}</span>
                )}
                <img src={`/monsters/${m.id}.jpg`} alt={has ? m.name : '未知妖兽'} loading="lazy"
                  onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
                  className={cn('relative z-10 w-full h-full object-cover transition-all duration-300',
                    has ? '' : 'brightness-[0.16] saturate-0 blur-[2px] scale-110')} />
                {!has && (
                  <span className="absolute inset-0 z-20 flex items-center justify-center text-xl text-stone-600" aria-hidden>？</span>
                )}
                {m.isBoss && has && (
                  <span className="absolute top-1 left-1 z-20 text-[8px] px-1 py-0.5 rounded bg-amber-950/85 border border-amber-700/60 text-amber-300">妖王</span>
                )}
              </div>
              <div className={cn('text-[10px] mt-1 truncate', has ? 'text-stone-300' : 'text-stone-600')}>
                {has ? m.name : '？？？'}
              </div>
              <div className="text-[9px] text-stone-600">{has ? `卡片 ×${count}` : '未收集'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== 山河画册（旅行青蛙式明信片相册） =====
const ALBUM_GROUPS: { kind: SceneKind; label: string }[] = [
  { kind: 'home', label: '我的洞府' },
  { kind: 'region', label: '行走山河' },
  { kind: 'activity', label: '修行手记' },
  { kind: 'boss', label: '强敌之影' },
];

function AlbumView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const unlocked = unlockedSceneCount(store);

  return (
    <div className="p-3 pb-24 space-y-4">
      <SubHeader title={`山河画册 (${unlocked}/${SCENES.length})`} onBack={onBack} />
      <p className="text-[10px] text-stone-500 leading-relaxed">
        同一位白衣小修士，走过一处山水，便寄回一张明信片。
      </p>

      {/* 集齐奖励 */}
      <Section title="集齐奖励">
        <div className="space-y-1.5">
          {ALBUM_REWARDS.map(rw => {
            const claimed = isAlbumRewardClaimed(rw, store);
            const available = isAlbumRewardAvailable(rw, store);
            const prog = rw.kind === 'grand'
              ? { got: unlocked, total: SCENES.length }
              : albumGroupProgress(rw.kind as SceneKind, store);
            return (
              <div key={rw.id}
                className={cn('rounded-lg border p-2.5 flex items-center gap-2.5',
                  claimed ? 'bg-emerald-950/30 border-emerald-800/60'
                    : available ? 'bg-amber-950/40 border-amber-700/60'
                    : 'bg-stone-900/60 border-stone-800')}>
                <span aria-hidden className={cn('w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 text-lg',
                  claimed ? 'border-emerald-800/60 bg-emerald-950/50' : 'border-stone-700/60 bg-stone-800/60')}>
                  {claimed ? '🏅' : '🎁'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={cn('text-xs font-semibold', claimed ? 'text-emerald-300' : 'text-stone-200')}>
                    {rw.name}
                    {rw.titleName && <span className="text-[9px] ml-1 px-1 py-0.5 rounded bg-amber-900/80 text-amber-200">称号</span>}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {rw.desc} · 💎{rw.gems} · 进度 {prog.got}/{prog.total}
                  </div>
                </div>
                {claimed ? (
                  <span className="text-[10px] text-emerald-400 shrink-0">已领取</span>
                ) : available ? (
                  <ActionButton className="!min-h-[36px] !px-3 text-xs shrink-0"
                    onClick={() => store.claimAlbumReward(rw.id)}>
                    <Gift className="w-3.5 h-3.5 inline mr-1 -mt-0.5" aria-hidden />领取
                  </ActionButton>
                ) : (
                  <span className="text-[10px] text-stone-600 shrink-0">未达成</span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {ALBUM_GROUPS.map(group => {
        const scenes = SCENES.filter(s => s.kind === group.kind);
        if (scenes.length === 0) return null;
        const got = scenes.filter(s => isSceneUnlocked(s, store)).length;
        return (
          <div key={group.kind} className="space-y-2">
            <div className="flex items-center gap-2">
              <span aria-hidden className="w-1 h-3.5 rounded-full bg-gradient-to-b from-amber-400 to-amber-700" />
              <span className="text-xs font-semibold text-stone-300">{group.label}</span>
              <span className="text-[10px] text-stone-600 tabular-nums">{got}/{scenes.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {scenes.map(s => {
                const has = isSceneUnlocked(s, store);
                return (
                  <div key={s.id}
                    className={cn('relative rounded-xl overflow-hidden border aspect-[4/3]',
                      has ? 'border-stone-700 bg-stone-900' : 'border-stone-800/60 bg-stone-950/60')}>
                    <img src={s.img} alt={has ? s.name : '未解锁'} loading="lazy" decoding="async"
                      className={cn('absolute inset-0 w-full h-full object-cover transition',
                        has ? '' : 'opacity-15 blur-[6px] grayscale scale-110')} />
                    {has && <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />}
                    <div className="absolute bottom-0 inset-x-0 px-2 py-1.5">
                      <div className={cn('text-[11px] font-semibold truncate', has ? 'text-white' : 'text-stone-600')}>
                        {has ? s.name : '？？？'}
                      </div>
                      {has ? (
                        <div className="text-[9px] text-stone-300/90 line-clamp-2 leading-snug">{s.caption}</div>
                      ) : (
                        <div className="text-[9px] text-stone-600 flex items-center gap-1">
                          🔒 {sceneUnlockHint(s)}
                        </div>
                      )}
                    </div>
                    {has && (
                      <span aria-hidden className="absolute top-1.5 right-1.5 text-[8px] px-1 py-0.5 rounded bg-black/45 text-amber-200/90 border border-white/10">已收录</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {unlocked === SCENES.length ? (
        <div className="text-center text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-900/50 rounded-xl py-2.5">
          山河尽收眼底，仙途从未止步。画册已集齐！
        </div>
      ) : (
        <div className="text-center text-[10px] text-stone-600">
          去更远的山河，寄回更多的明信片。
        </div>
      )}
    </div>
  );
}

// ===== 设置 =====
function SettingsView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="p-3 pb-24 space-y-3">
      <SubHeader title="设置" onBack={onBack} />

      <Section title="游戏说明">
        <div className="text-[11px] text-stone-400 space-y-1.5 leading-relaxed">
          <p>《仙途》是一款 Harpagia 式文字放置修仙 RPG。</p>
          <p>· <b className="text-stone-300">16 项技能</b>：5 项战斗技能随战斗成长，11 项生活技能通过活动修炼，上限 200 级。</p>
          <p>· <b className="text-stone-300">真实离线进度</b>：关闭页面后角色继续修炼、战斗、采集（受定力技能影响），回来领取收益。</p>
          <p>· <b className="text-stone-300">随机装备</b>：主属性与副词条完全随机，品质决定强度，气运影响掉落。</p>
          <p>· <b className="text-stone-300">灵宠</b>：战胜妖兽小概率收服，出战提供属性加成并随战斗成长；可进化（凡→灵→仙→神）与融合升星。</p>
          <p>· <b className="text-stone-300">炼器</b>：背包中炼化装备，主属性 +12%/级，失败不损装备，上限 +10。</p>
          <p>· <b className="text-stone-300">炼宝坊</b>：妖王专属异宝熔铸专属神装，每件必带专属词条；十大妖王首杀各有限定称号，集齐十枚解锁隐藏称号「号令天下」。</p>
          <p>· <b className="text-stone-300">宗门</b>：拜入四大宗门获得专属异能，战斗积累贡献，兑换珍宝、晋升位阶。</p>
          <p>· <b className="text-stone-300">世界 BOSS</b>：血量跨挑战持久的巨兽，按伤害结算奖励并列入本期伤害榜，击杀得仙品装备与专属异宝。</p>
          <p>· <b className="text-stone-300">天梯榜</b>：综合实力排名，与万千修士争锋。</p>
          <p>· <b className="text-stone-300">山河画册</b>：集齐明信片可领取宝石与限定称号，主页可佩戴称号。</p>
          <p>· <b className="text-stone-300">轮回转生</b>：渡劫后可转生，重置技能换取永久加成，资产全部保留。</p>
          <p>· 存档保存在浏览器本地。</p>
        </div>
      </Section>

      <Section title="危险操作">
        {confirming ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-red-300 bg-red-950/50 rounded-lg p-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              确定要删除全部存档、重新开始吗？此操作不可恢复！
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton variant="danger" onClick={() => { store.resetGame(); }}>确认重置</ActionButton>
              <ActionButton variant="ghost" onClick={() => setConfirming(false)}>取消</ActionButton>
            </div>
          </div>
        ) : (
          <ActionButton variant="danger" className="w-full" onClick={() => setConfirming(true)}>重置游戏存档</ActionButton>
        )}
      </Section>
    </div>
  );
}

// ===== 通用子页头 =====
function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-1 pb-1">
      <button onClick={onBack} className="text-stone-400 min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1 rounded-lg hover:bg-stone-900" aria-label="返回">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="font-xianzi text-base font-bold text-gold-grad tracking-widest">{title}</h2>
    </div>
  );
}

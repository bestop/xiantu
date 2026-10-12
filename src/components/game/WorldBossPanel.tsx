// 世界 BOSS：伤害累积挑战
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { computePlayerStats } from '@/lib/game/engine';
import { WORLD_BOSSES, wbMaxHp, runWorldBossAttempt, WB_CHALLENGE_COOLDOWN_MS, WorldBossAttemptResult, getWbDamageRanking } from '@/lib/game/worldboss';
import { QUALITY_TEXT, getItem } from '@/lib/game/items';
import { bossScene } from '@/lib/game/scenes';
import { WB_KILL_TITLES } from '@/lib/game/titles';
import { Section, ProgressBar, ActionButton, formatNum, QualityBadge } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft, Swords } from 'lucide-react';

export function WorldBossPanel({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const wb = store.worldBoss;
  const boss = WORLD_BOSSES[wb.bossIdx % WORLD_BOSSES.length];
  const maxHp = wbMaxHp(wb.bossIdx);
  const [result, setResult] = useState<WorldBossAttemptResult | null>(null);
  const ranking = getWbDamageRanking(store);
  const scene = bossScene(boss.name);
  const slain: string[] = store.stats.wbSlain ?? [];
  const slainTitles = WORLD_BOSSES.filter(b => slain.includes(b.name) && WB_KILL_TITLES[b.name]).length;

  const cooldownLeft = Math.max(0, wb.lastChallengeAt + WB_CHALLENGE_COOLDOWN_MS - Date.now());
  const cooldownSec = Math.ceil(cooldownLeft / 1000);

  const challenge = () => {
    const r = runWorldBossAttempt(useGameStore.getState());
    if (!r.ok) return;
    store.applyWorldBossResult(r);
    setResult(r);
  };

  return (
    <div className="p-3 pb-24 space-y-3">
      <div className="flex items-center gap-1">
        <button onClick={onBack} className="text-stone-400 min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1 rounded-lg hover:bg-stone-900" aria-label="返回">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-xianzi text-base font-bold text-gold-grad tracking-widest">世界 BOSS</h2>
      </div>

      {/* BOSS 卡 */}
      <div className="bg-gradient-to-br from-rose-950/60 via-stone-900 to-stone-900 border border-rose-900/60 rounded-xl overflow-hidden relative">
        {/* 场景横幅（旅行青蛙式，按妖王切换） */}
        <div className="relative h-28">
          <img src={scene.img} alt={scene.name} className="w-full h-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-transparent" />
          {scene.refId && (
            <div className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full bg-stone-950/70 border border-amber-800/60 text-amber-200/90">专属画境</div>
          )}
        </div>
        <div className="p-4 pt-1 relative">
        <div aria-hidden className="absolute -top-8 -left-8 w-36 h-36 rounded-full bg-rose-600/10 blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border border-rose-800/50 bg-rose-950/50 flex items-center justify-center shrink-0">
              <div className="text-4xl animate-breathe" aria-hidden>{boss.icon}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-rose-200">{boss.name}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">{boss.title}</div>
              {boss.region && (
                <div className="mt-1 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-stone-900/80 border border-stone-700 text-amber-200/90">
                  🗺️ 出没·{boss.region}
                </div>
              )}
            </div>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900/70 text-rose-300 border border-rose-800/60 shrink-0">{boss.tier}阶·世界级</span>
        </div>

        {(() => {
          const tDef = WB_KILL_TITLES[boss.name];
          const owned = tDef && slain.includes(boss.name);
          return (
            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-violet-200/90 bg-violet-950/30 border border-violet-900/50 rounded-lg px-2.5 py-1.5">
              <span aria-hidden>🏆</span>
              <span>首杀限定称号：<b className="text-violet-300">{tDef ? `「${tDef.name}」` : '待揭晓'}</b>{owned && ' · 已授'}</span>
            </div>
          );
        })()}

        {boss.drop && (() => {
          const it = getItem(boss.drop.itemId);
          if (!it) return null;
          return (
            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-amber-200/90 bg-amber-950/30 border border-amber-900/50 rounded-lg px-2.5 py-1.5">
              <span aria-hidden>{it.icon}</span>
              <span>击杀必得异宝<b className="text-amber-300">「{it.name}」</b>· 可入炼宝坊熔铸</span>
            </div>
          );
        })()}

        <div className="mt-3 relative">
          <ProgressBar value={wb.hp} max={maxHp} className="h-4" barClass="bg-gradient-to-r from-rose-700 to-rose-500" showText />
          <div className="flex justify-between text-[10px] text-stone-500 mt-1 tabular-nums">
            <span>剩余血量 {formatNum(wb.hp)} / {formatNum(maxHp)}</span>
            <span>已削减 {((1 - wb.hp / maxHp) * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mt-3 text-center">
          <div className="bg-stone-900/70 rounded-lg py-1.5">
            <div className="text-[9px] text-stone-500">本期累计伤害</div>
            <div className="text-xs text-amber-300 font-semibold tabular-nums">{formatNum(wb.seasonDamage)}</div>
          </div>
          <div className="bg-stone-900/70 rounded-lg py-1.5">
            <div className="text-[9px] text-stone-500">单次最高伤害</div>
            <div className="text-xs text-amber-300 font-semibold tabular-nums">{formatNum(store.stats.wbBestDamage ?? 0)}</div>
          </div>
          <div className="bg-stone-900/70 rounded-lg py-1.5">
            <div className="text-[9px] text-stone-500">累计击杀</div>
            <div className="text-xs text-rose-300 font-semibold tabular-nums">{store.stats.wbKills ?? 0}</div>
          </div>
        </div>
        </div>
      </div>

      {/* 挑战 */}
      <Section title="挑战">
        <div className="text-[11px] text-stone-400 space-y-1 leading-relaxed mb-2.5">
          <p>· 世界 BOSS <b className="text-rose-300">血量跨挑战持久</b>，每次最多交手 15 回合，打空血量即完成击杀。</p>
          <p>· 挑战按造成伤害结算奖励（败了也有收益）；击杀必得<b className="text-amber-300">仙品装备</b>与大量宝石。</p>
          <p>· 击杀后下一只更强的世界 BOSS 立即降临；每 24 小时也会自动轮换。</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 mb-2">
          <div>你的攻击 <b className="text-stone-300">{formatNum(computePlayerStats(store).atk)}</b></div>
          <div>你的生命 <b className="text-stone-300">{formatNum(computePlayerStats(store).maxHp)}</b></div>
        </div>
        {cooldownSec > 0 ? (
          <ActionButton disabled className="w-full">调息中… {cooldownSec}s 后可再战</ActionButton>
        ) : (
          <ActionButton className="w-full" onClick={challenge}>
            <span className="flex items-center justify-center gap-1.5"><Swords className="w-4 h-4" /> 挑战世界 BOSS</span>
          </ActionButton>
        )}
      </Section>

      {/* 战报 */}
      {result && (
        <div className={cn('rounded-xl border p-3 space-y-2',
          result.killed ? 'bg-amber-950/40 border-amber-700' : 'bg-stone-900/80 border-stone-800')}>
          <div className={cn('text-sm font-bold text-center',
            result.killed ? 'text-amber-300' : result.survived ? 'text-emerald-300' : 'text-red-300')}>
            {result.killed ? `🌌 击杀 ${result.killedBossName ?? boss.name}！` : result.survived ? `⚔️ 交手 ${result.rounds} 回合，共造成 ${formatNum(result.damage)} 伤害` : `💀 不敌 ${boss.name}，造成 ${formatNum(result.damage)} 伤害`}
          </div>
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {result.log.map((l, i) => (
              <div key={i} className={cn('text-[11px] leading-relaxed',
                l.includes('暴击') ? 'text-amber-300 font-semibold' : l.includes('避开') ? 'text-emerald-300' : l.includes('承受') ? 'text-red-300/90' : 'text-stone-400')}>
                {l}
              </div>
            ))}
          </div>
          <div className="space-y-1 text-xs border-t border-stone-800 pt-2">
            <div className="flex justify-between text-stone-300"><span>战斗经验（五项技能各得）</span><span className="text-amber-300 tabular-nums">+{formatNum(result.exp)}</span></div>
            <div className="flex justify-between text-stone-300"><span>金币</span><span className="text-amber-300 tabular-nums">+{formatNum(result.gold)}</span></div>
            {result.gems > 0 && <div className="text-cyan-300">💎 获得 {result.gems} 颗宝石</div>}
            {result.killDrop && (() => {
              const it = getItem(result.killDrop.itemId);
              return (
                <div className="text-amber-300">{it?.icon ?? '🎁'} 击杀专属掉落：{it?.name ?? result.killDrop.itemId} ×{result.killDrop.qty}</div>
              );
            })()}
            {result.legendaryDrop && (
              <div className="text-stone-400">
                击杀奖励：<span className={QUALITY_TEXT[result.legendaryDrop.quality]}>
                  {result.legendaryDrop.icon}{result.legendaryDrop.name}</span> <QualityBadge quality={result.legendaryDrop.quality} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 伤害排行榜 */}
      <Section title="本期伤害榜" extra={<span className="text-[10px] text-amber-300">你的排名 第 {ranking.playerRank} / {ranking.entries.length} 位</span>}>
        <div className="space-y-1">
          {ranking.entries.slice(0, 10).map((e, i) => (
            <div key={e.name}
              className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs',
                e.isPlayer ? 'bg-amber-950/40 border border-amber-900/50' : i % 2 === 0 ? 'bg-stone-800/30' : '')}>
              <span className={cn('w-5 text-center text-[10px] tabular-nums shrink-0',
                i === 0 ? 'text-amber-400' : i === 1 ? 'text-stone-300' : i === 2 ? 'text-orange-400' : 'text-stone-600')}>
                {i + 1}
              </span>
              <span className="shrink-0" aria-hidden>{e.icon}</span>
              <span className="flex-1 min-w-0 truncate text-stone-300">{e.name}{e.isPlayer && '（你）'}</span>
              <span className="tabular-nums text-rose-300/90 text-[11px]">{formatNum(e.damage)}</span>
            </div>
          ))}
          {ranking.playerRank > 10 && (() => {
            const me = ranking.entries[ranking.playerRank - 1];
            return (
              <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs bg-amber-950/40 border border-amber-900/50 mt-1">
                <span className="w-5 text-center text-[10px] tabular-nums text-stone-500 shrink-0">{ranking.playerRank}</span>
                <span className="shrink-0" aria-hidden>{me.icon}</span>
                <span className="flex-1 min-w-0 truncate text-stone-300">{me.name}（你）</span>
                <span className="tabular-nums text-rose-300/90 text-[11px]">{formatNum(me.damage)}</span>
              </div>
            );
          })()}
        </div>
        <div className="text-[10px] text-stone-600 mt-2 text-center">本期对当前世界 BOSS 的累计伤害排名，轮换后重新计榜</div>
      </Section>

      {/* 妖王称号图鉴（含隐藏称号） */}
      <Section title="妖王称号图鉴" extra={<span className={cn('text-[10px] tabular-nums', slainTitles >= WORLD_BOSSES.length ? 'text-amber-300' : 'text-stone-500')}>{slainTitles} / {WORLD_BOSSES.length}</span>}>
        <div className="text-[10px] text-stone-500 mb-2">首次击杀对应妖王即授予限定称号；集齐十枚，解锁隐藏称号「号令天下」。</div>
        <div className="grid grid-cols-2 gap-1.5">
          {WORLD_BOSSES.map(b => {
            const tDef = WB_KILL_TITLES[b.name];
            const owned = !!tDef && slain.includes(b.name);
            return (
              <div key={b.name}
                className={cn('rounded-lg border px-2 py-1.5 flex items-center gap-2',
                  owned ? 'bg-violet-950/40 border-violet-800/60' : 'bg-stone-900/60 border-stone-800 opacity-70')}>
                <span className="shrink-0 text-base" aria-hidden>{b.icon}</span>
                <div className="min-w-0">
                  <div className="text-[9px] text-stone-500 truncate">{b.name}</div>
                  <div className={cn('text-[11px] font-semibold truncate', owned ? 'text-violet-300' : 'text-stone-600')}>
                    {owned ? `「${tDef?.name}」` : '？？？'}
                  </div>
                </div>
                {owned && <span className="ml-auto shrink-0 text-[9px] text-violet-400">✓</span>}
              </div>
            );
          })}
        </div>
        {(() => {
          const owned = store.titles?.includes('title_haoling') ?? false;
          return (
            <div className={cn('mt-1.5 rounded-lg border px-2.5 py-2 flex items-center gap-2',
              owned
                ? 'bg-gradient-to-r from-amber-950/60 via-rose-950/40 to-amber-950/60 border-amber-700/70'
                : 'bg-stone-900/60 border-stone-800 opacity-80')}>
              <span className={cn('shrink-0 text-lg', owned && 'animate-breathe')} aria-hidden>👑</span>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] text-stone-500">隐藏称号 · 集齐十大妖王称号解锁</div>
                <div className={cn('text-[12px] font-bold tracking-wider',
                  owned ? 'text-gold-grad' : 'text-stone-600')}>
                  {owned ? '「号令天下」· 已现世' : '「？？？」'}
                </div>
              </div>
              {owned && <span className="shrink-0 text-[9px] text-amber-400">已授</span>}
            </div>
          );
        })()}
      </Section>

      {/* 轮换表 */}
      <Section title="轮换一览" extra={<span className="text-[10px] text-stone-500">当前第 {(wb.bossIdx % WORLD_BOSSES.length) + 1} / {WORLD_BOSSES.length} 位</span>}>
        <div className="grid grid-cols-4 gap-1.5">
          {WORLD_BOSSES.map((b, i) => (
            <div key={b.name}
              className={cn('rounded-lg border p-1.5 text-center',
                i === wb.bossIdx % WORLD_BOSSES.length ? 'bg-rose-950/50 border-rose-800' : 'bg-stone-900/60 border-stone-800 opacity-60')}>
              <div className="text-lg" aria-hidden>{b.icon}</div>
              <div className="text-[9px] text-stone-400 truncate">{b.name}</div>
              <div className="text-[9px] text-stone-600 truncate" title={b.region}>{b.tier}阶{b.region ? `·${b.region}` : ''}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-stone-600 mt-2 text-center">击杀当前 BOSS 或每 24 小时自动轮换至下一位</div>
      </Section>
    </div>
  );
}

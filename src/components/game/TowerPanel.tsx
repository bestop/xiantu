// 锁妖塔：无限爬塔挑战（封印万妖、逐层首通有赏、败北无惩罚）
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { computePlayerStats } from '@/lib/game/engine';
import { towerMonster, towerTier, towerMilestoneGems, towerClearItems, towerEquipBag } from '@/lib/game/tower';
import { getItem, QUALITY_TEXT } from '@/lib/game/items';
import { Section, ActionButton, formatNum, SubHeader } from './ui-bits';
import { TowerChallengeReport } from '@/lib/game/tower';
import { cn } from '@/lib/utils';
import { Swords } from 'lucide-react';

export function TowerPanel({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const [report, setReport] = useState<TowerChallengeReport | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const best = Math.max(0, store.tower?.bestFloor ?? 0);
  const nextFloor = best + 1;
  const nextMonster = towerMonster(nextFloor);
  const pStats = computePlayerStats(store);

  // 战力提示：塔层阶级 vs 玩家大约对应阶级（单项战斗技能均值/5，与战斗面板同口径）
  const avgCombat = (['hp', 'weaponry', 'power', 'defence', 'speed'] as const)
    .reduce((a, id) => a + store.skills[id].level, 0) / 5;
  const myTier = avgCombat / 5;
  const harder = nextMonster.tier > myTier + 4;
  const easier = nextMonster.tier < myTier - 4;

  // 首通奖励预览
  const previewGems = towerMilestoneGems(nextFloor);
  const previewItems = towerClearItems(nextFloor);
  const previewBag = towerEquipBag(nextFloor);

  const challenge = () => {
    setErr(null);
    const r = store.challengeTower(nextFloor);
    if (!r) {
      setErr('暂不可挑战（请刷新后重试）');
      return;
    }
    setReport(r);
  };

  const continueNext = () => {
    // 乘胜追击：直接挑战下一层（nextFloor 已是 best+1，store 内再校验一次）
    setErr(null);
    const r = useGameStore.getState().challengeTower(nextFloor);
    if (!r) {
      setErr('暂不可挑战');
      return;
    }
    setReport(r);
  };

  // ===== 战报视图 =====
  if (report) {
    const won = report.won;
    const gains = report.gains;
    return (
      <div className="p-3 pb-24 space-y-3">
        <SubHeader title="锁妖塔" onBack={() => { setReport(null); onBack(); }} />

        {/* 结果横幅 */}
        <div className={cn('rounded-xl border p-4 text-center space-y-1',
          won
            ? 'bg-gradient-to-b from-fuchsia-950/50 to-stone-900 border-fuchsia-700/70 shadow-[0_0_20px_rgba(192,38,211,0.12)]'
            : 'bg-red-950/40 border-red-900')}>
          <div className={cn('text-base font-bold', won ? 'text-fuchsia-200' : 'text-red-300')}>
            {won
              ? `🗼 首通第 ${report.floor} 层！`
              : `💀 止步第 ${report.floor} 层`}
          </div>
          <div className="text-[11px] text-stone-400">
            {won
              ? `与「${report.monster.name}」塔影鏖战 ${report.rounds} 回合，灵气已被你汲取`
              : `「${report.monster.name}」塔影尚余 ${report.monsterHpLeftPct}% 血量 · 提升实力再来，败北无惩罚`}
          </div>
        </div>

        {/* 收益清单（仅胜利） */}
        {won && gains && (
          <Section title="首通奖励">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-300">
                <span>战斗经验（五项技能各得）</span>
                <span className="tabular-nums text-amber-300">
                  +{formatNum(report.monster.exp)}{gains.levelUps > 0 ? `（升级 ${gains.levelUps} 次）` : ''}
                </span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>金币</span>
                <span className="tabular-nums text-amber-300">+{formatNum(gains.gold)}</span>
              </div>
              {gains.gems > 0 && (
                <div className="flex justify-between text-cyan-300">
                  <span>💎 里程碑宝石（每 5 层）</span>
                  <span className="tabular-nums">+{gains.gems}</span>
                </div>
              )}
              {gains.items.map(it => {
                const item = getItem(it.itemId);
                if (!item) return null;
                return (
                  <div key={it.itemId} className="flex justify-between text-purple-300">
                    <span>🎁 大里程碑（每 25 层）</span>
                    <span>{item.icon}{item.name} ×{it.qty}</span>
                  </div>
                );
              })}
              {gains.equip && (
                <div className="flex justify-between text-amber-300 font-semibold">
                  <span>🎑 装备袋（每 {gains.equip.quality === 'legendary' ? '50' : '10'} 层）</span>
                  <span className={QUALITY_TEXT[gains.equip.quality]}>{gains.equip.icon}{gains.equip.name}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* 战报日志 */}
        <Section title="战报">
          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {report.log.map((l, i) => (
              <div key={i} className={cn('text-xs leading-relaxed',
                l.kind === 'player' && 'text-stone-300',
                l.kind === 'crit' && 'text-amber-300 font-semibold',
                l.kind === 'monster' && 'text-red-300/90',
                l.kind === 'dodge' && 'text-emerald-300',
                l.kind === 'info' && 'text-stone-500',
                l.kind === 'win' && 'text-emerald-300 font-bold',
                l.kind === 'lose' && 'text-red-400 font-bold',
              )}>{l.text}</div>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-2 gap-2">
          {won ? (
            <>
              <ActionButton onClick={continueNext}>⚔️ 挑战第 {nextFloor} 层</ActionButton>
              <ActionButton variant="ghost" onClick={() => setReport(null)}>返回塔前</ActionButton>
            </>
          ) : (
            <>
              <ActionButton onClick={() => setReport(null)}>重整旗鼓</ActionButton>
              <ActionButton variant="ghost" onClick={onBack}>离开锁妖塔</ActionButton>
            </>
          )}
        </div>
      </div>
    );
  }

  // ===== 塔前视图 =====
  return (
    <div className="p-3 pb-24 space-y-3">
      <SubHeader title="锁妖塔" onBack={onBack} />

      {/* 塔层主卡 */}
      <div className="bg-gradient-to-b from-fuchsia-950/40 via-stone-900 to-stone-900 border border-fuchsia-900/50 rounded-xl p-4 text-center relative overflow-hidden">
        <div aria-hidden className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-fuchsia-600/10 blur-2xl pointer-events-none" />
        <div className="text-[10px] text-fuchsia-300/80 tracking-[0.35em]">封印万妖 · 无尽之塔</div>
        <div className="text-3xl font-bold text-fuchsia-200 my-1 tabular-nums">{best}<span className="text-sm text-stone-500 font-normal"> 层</span></div>
        <div className="text-[11px] text-stone-400">{best === 0 ? '塔门已开，尚无一人首通任何一层' : `你已首通 ${best} 层，塔中灵气仍在上层涌动`}</div>
      </div>

      {/* 下一层妖兽预览 */}
      <Section title={`第 ${nextFloor} 层 · 塔影现形`}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 shrink-0 rounded-lg border border-fuchsia-800/50 bg-fuchsia-950/40 flex items-center justify-center text-3xl" aria-hidden>🗼</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-fuchsia-200">{nextMonster.name} · 塔影</span>
              <span className="text-[10px] text-stone-500">{nextMonster.tier} 阶</span>
              {harder && <span className="text-[9px] px-1 rounded bg-red-950 text-red-400">危险</span>}
              {easier && <span className="text-[9px] px-1 rounded bg-stone-800 text-stone-500">碾压</span>}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5 tabular-nums">
              生命 {formatNum(nextMonster.hp)} · 攻击 {formatNum(nextMonster.atk)} · 防御 {formatNum(nextMonster.def)}
            </div>
          </div>
        </div>

        {/* 首通奖励预览 */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-[10px] px-2 py-1 rounded-md border border-amber-900/60 bg-amber-950/30 text-amber-300 tabular-nums">
            🪙 金币 ~{formatNum(nextMonster.gold)}
          </span>
          <span className="text-[10px] px-2 py-1 rounded-md border border-amber-900/60 bg-amber-950/30 text-amber-300 tabular-nums">
            📈 经验 ×5 技能 ~{formatNum(nextMonster.exp)}
          </span>
          {previewGems > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-md border border-cyan-900/60 bg-cyan-950/30 text-cyan-300 tabular-nums">💎 里程碑 +{previewGems}</span>
          )}
          {previewItems.length > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-md border border-purple-900/60 bg-purple-950/30 text-purple-300">
              🎁 {getItem(previewItems[0].itemId)?.name ?? '悟道丹'} ×{previewItems[0].qty}
            </span>
          )}
          {previewBag && (
            <span className={cn('text-[10px] px-2 py-1 rounded-md border',
              previewBag === 'legendary' ? 'border-amber-900/60 bg-amber-950/30 text-amber-300' : 'border-purple-900/60 bg-purple-950/30 text-purple-300')}>
              🎑 {previewBag === 'legendary' ? '仙品' : '稀有'}装备袋（{Math.max(1, Math.round(towerTier(nextFloor)))} 阶）
            </span>
          )}
        </div>

        {err && (
          <div className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-900/60 rounded-lg px-3 py-2 mt-3">{err}</div>
        )}

        <ActionButton className="w-full mt-3" onClick={challenge}>
          <span className="flex items-center justify-center gap-1.5"><Swords className="w-4 h-4" /> 挑战第 {nextFloor} 层</span>
        </ActionButton>
      </Section>

      {/* 塔规 */}
      <Section title="塔规">
        <ul className="text-[11px] text-stone-400 space-y-1.5 leading-relaxed">
          <li>· 塔中封印着历代降伏的妖兽塔影，每层一只，阶级随层数缓慢攀升。</li>
          <li>· <b className="text-stone-300">首通</b>发奖励：金币丰厚，战斗经验与野外胜场同源。</li>
          <li>· <b className="text-cyan-300">每 5 层</b>里程碑 +5💎；<b className="text-purple-300">每 10 层</b>稀有装备袋；<b className="text-purple-300">每 25 层</b>悟道丹；<b className="text-amber-300">每 50 层</b>仙品装备袋。</li>
          <li>· 已首通层灵气已被汲取，不可重复刷取收益。</li>
          <li>· 败北无任何惩罚，随时可再战。</li>
        </ul>
      </Section>
    </div>
  );
}

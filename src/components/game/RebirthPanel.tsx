// 转生面板：轮回重修，换取永久加成
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { combatLevelSum } from '@/lib/game/skills';
import {
  REBIRTH_MIN_COMBAT, rebirthPointsGain, canRebirth,
  BONUS_XP_PER_POINT, BONUS_STAT_PER_POINT, REBIRTH_KEEP_DESC,
} from '@/lib/game/rebirth';
import { Section, ActionButton, formatNum } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft, RefreshCcw } from 'lucide-react';

export function RebirthPanel({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const [confirming, setConfirming] = useState(false);
  const cSum = combatLevelSum(store.skills);
  const ok = canRebirth(store);
  const gain = rebirthPointsGain(cSum);
  const points = store.rebirth?.points ?? 0;
  const count = store.rebirth?.count ?? 0;
  const progress = Math.min(100, (cSum / REBIRTH_MIN_COMBAT) * 100);

  return (
    <div className="p-3 pb-24 space-y-3">
      <div className="flex items-center gap-1">
        <button onClick={onBack} className="text-stone-400 min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1 rounded-lg hover:bg-stone-900" aria-label="返回">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-xianzi text-base font-bold text-gold-grad tracking-widest">轮回转生</h2>
      </div>

      {/* 当前状态 */}
      <Section title="转生状态">
        <div className="grid grid-cols-2 gap-1.5 text-center">
          <div className="bg-stone-800/50 rounded-lg py-2.5">
            <div className="text-[10px] text-stone-500">转生次数</div>
            <div className="text-lg font-bold text-amber-300 tabular-nums">{count} 世</div>
          </div>
          <div className="bg-stone-800/50 rounded-lg py-2.5">
            <div className="text-[10px] text-stone-500">转生点数</div>
            <div className="text-lg font-bold text-cyan-300 tabular-nums">{formatNum(points)}</div>
          </div>
        </div>
        {points > 0 && (
          <div className="mt-2.5 text-[11px] text-stone-400 leading-relaxed">
            当前永久加成：技能经验 <b className="text-emerald-300">+{formatNum(points * BONUS_XP_PER_POINT * 100)}%</b>
            ，攻击与生命 <b className="text-emerald-300">+{(points * BONUS_STAT_PER_POINT * 100).toFixed(1)}%</b>
          </div>
        )}
      </Section>

      {/* 转生条件 */}
      <Section title="转生条件">
        <div className="text-[11px] text-stone-400 space-y-1.5 leading-relaxed">
          <p>· 战斗技能总等级达到 <b className="text-amber-300">渡劫（{REBIRTH_MIN_COMBAT}）</b> 后方可转生。</p>
          <p>· 转生点数按<b className="text-amber-300">战斗技能总等级 ÷ 25</b>计算（生活技能不计点，但也会一并重置）。</p>
          <p>· 转生将<b className="text-red-300">重置全部 16 项技能至 1 级</b>、清空丹药增益，换取转生点数。</p>
          <p className="text-stone-500">· {REBIRTH_KEEP_DESC}。</p>
          <p>· 每点转生点：技能经验 <b className="text-emerald-300">+{BONUS_XP_PER_POINT * 100}%</b>、攻击与生命 <b className="text-emerald-300">+{BONUS_STAT_PER_POINT * 100}%</b>，永久生效、多次叠加。</p>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-stone-500 mb-1">
            <span>当前战斗总等级 {Math.floor(cSum)}</span>
            <span>{REBIRTH_MIN_COMBAT}</span>
          </div>
          <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full bg-gradient-to-r', ok ? 'from-cyan-500 to-emerald-400' : 'from-amber-700 to-amber-500')}
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Section>

      {/* 转生操作 */}
      <Section title="轮回之门">
        {ok ? (
          confirming ? (
            <div className="space-y-2">
              <div className="text-xs text-red-300 bg-red-950/50 rounded-lg p-2.5 leading-relaxed">
                即将散去毕生修为（16 项技能归 1），换取 <b className="text-amber-300">{gain} 点转生点</b>。天劫之下，道心不灭，确认转生？
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ActionButton onClick={() => { store.doRebirth(); setConfirming(false); }}>
                  <RefreshCcw className="w-4 h-4 inline mr-1 -mt-0.5" aria-hidden />踏入轮回
                </ActionButton>
                <ActionButton variant="ghost" onClick={() => setConfirming(false)}>再修百年</ActionButton>
              </div>
            </div>
          ) : (
            <ActionButton className="w-full" onClick={() => setConfirming(true)}>
              ☸️ 转生（+{gain} 点）
            </ActionButton>
          )
        ) : (
          <ActionButton disabled className="w-full">
            战斗总等级不足（{Math.floor(cSum)}/{REBIRTH_MIN_COMBAT}）
          </ActionButton>
        )}
        <div className="text-[10px] text-stone-600 mt-2 text-center">
          转生不删除任何资产，技能重修将更快（经验加成 + 宗门剑修加成叠加）
        </div>
      </Section>
    </div>
  );
}

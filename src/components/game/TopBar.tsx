// 顶栏：名号 / 称号 / 货币
'use client';

import { useGameStore } from '@/store/game';
import { getTitle, combatLevelSum, totalSkillLevel } from '@/lib/game/skills';
import { rebirthPrefix } from '@/lib/game/rebirth';
import { formatNum } from './ui-bits';

export function TopBar() {
  const playerName = useGameStore(s => s.playerName);
  const gold = useGameStore(s => s.gold);
  const gems = useGameStore(s => s.gems);
  const skills = useGameStore(s => s.skills);
  const rebirthCount = useGameStore(s => s.rebirth?.count ?? 0);

  const title = `${rebirthPrefix(rebirthCount)}${getTitle(combatLevelSum(skills))}`;

  return (
    <header id="game-topbar" className="sticky top-0 z-30 bg-stone-950/80 backdrop-blur-md">
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-amber-100 truncate">{playerName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-900/80 to-amber-800/50 text-amber-300 border border-amber-700/50 whitespace-nowrap">
              {title}
            </span>
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5 tabular-nums">
            技能总等级 {totalSkillLevel(skills)} · 战斗等级 {combatLevelSum(skills)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-1 bg-stone-900/80 border border-stone-700/60 rounded-lg px-2 py-1 text-xs">
            <span aria-hidden>💰</span>
            <span className="tabular-nums text-amber-200 font-medium">{formatNum(gold)}</span>
          </span>
          <span className="flex items-center gap-1 bg-stone-900/80 border border-stone-700/60 rounded-lg px-2 py-1 text-xs">
            <span aria-hidden>💎</span>
            <span className="tabular-nums text-cyan-200 font-medium">{formatNum(gems)}</span>
          </span>
        </div>
      </div>
      {/* 底部金色 hairline */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-800/50 to-transparent" aria-hidden />
    </header>
  );
}

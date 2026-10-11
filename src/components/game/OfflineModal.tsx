// 离线收益结算弹窗
'use client';

import { useGameStore } from '@/store/game';
import { getItem } from '@/lib/game/items';
import { SKILL_MAP } from '@/lib/game/skills';
import { SkillId } from '@/types/game';
import { ActionButton, formatNum, formatDuration } from './ui-bits';
import { QUALITY_TEXT } from '@/lib/game/items';
import { REGION_SCENE, HOME_SCENE } from '@/lib/game/scenes';
import { cn } from '@/lib/utils';
import { MoonStar } from 'lucide-react';

export function OfflineModal() {
  const report = useGameStore(s => s.pendingOfflineReport);
  const dismiss = useGameStore(s => s.dismissOfflineReport);
  const lastRegionId = useGameStore(s => s.lastRegionId);
  if (!report) return null;

  const settled = report.settledSeconds ?? report.seconds;
  const capped = settled < report.seconds;
  const skillEntries = Object.entries(report.skillXp) as [SkillId, number][];
  const allItems = [
    ...report.items,
    ...report.battleDrops,
  ];
  const scene = REGION_SCENE[lastRegionId] ?? HOME_SCENE;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="离线收益" onClick={dismiss}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md bg-gradient-to-b from-stone-900 to-stone-950 border-t border-amber-800/50 rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto overscroll-contain thin-scrollbar animate-in slide-in-from-bottom duration-300">
        {/* 把手 */}
        <div aria-hidden className="w-10 h-1 rounded-full bg-stone-700 mx-auto mb-3" />
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto mb-2 rounded-full border border-amber-700/50 bg-gradient-to-br from-stone-900 to-amber-950/70 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.18)]">
            <MoonStar className="w-7 h-7 text-amber-300" aria-hidden />
          </div>
          <h2 className="font-xianzi text-xl font-bold text-gold-grad tracking-[0.3em] pl-[0.3em]">闭关归来</h2>
          <p className="text-[11px] text-stone-500 mt-1 tabular-nums">
            离线 {formatDuration(settled)} · 收益效率 {(report.effiency * 100).toFixed(0)}%
            {capped ? '（超出部分已达挂机上限）' : ''}
          </p>
        </div>

        {/* 离开时的风景（旅行青蛙式明信片） */}
        <div className="relative rounded-xl overflow-hidden border border-stone-800 mb-3">
          <img src={scene.img} alt={scene.name} className="w-full h-24 object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 px-3 py-1.5 flex items-end justify-between">
            <div>
              <div className="text-[9px] text-amber-200/80 tracking-[0.25em]">离开时的风景</div>
              <div className="text-xs font-bold text-white drop-shadow">{scene.name}</div>
            </div>
            <div className="text-[9px] text-stone-300/80 italic">「{scene.caption}」</div>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* 技能修炼 */}
          {skillEntries.length > 0 && (
            <div className="bg-stone-800/50 rounded-xl p-3">
              <div className="text-stone-400 font-semibold mb-1.5">🧘 修炼收获</div>
              {skillEntries.map(([id, xp]) => (
                <div key={id} className="flex justify-between text-stone-300 py-0.5">
                  <span>{SKILL_MAP[id]?.icon} {SKILL_MAP[id]?.name}</span>
                  <span className="tabular-nums text-amber-300">+{formatNum(xp)} 经验</span>
                </div>
              ))}
            </div>
          )}

          {/* 离线战斗 */}
          {report.battleKills > 0 && (
            <div className="bg-stone-800/50 rounded-xl p-3">
              <div className="text-stone-400 font-semibold mb-1.5">⚔️ 自动战斗</div>
              <div className="flex justify-between text-stone-300 py-0.5">
                <span>击败妖兽</span><span className="tabular-nums text-stone-200">{formatNum(report.battleKills)} 只</span>
              </div>
              <div className="flex justify-between text-stone-300 py-0.5">
                <span>战斗经验（五项各得）</span><span className="tabular-nums text-amber-300">+{formatNum(report.battleExp)}</span>
              </div>
              <div className="flex justify-between text-stone-300 py-0.5">
                <span>金币</span><span className="tabular-nums text-amber-300">+{formatNum(report.battleGold)}</span>
              </div>
              {(report.petXp ?? 0) > 0 && (
                <div className="flex justify-between text-stone-300 py-0.5">
                  <span>🐾 出战灵宠经验</span><span className="tabular-nums text-emerald-300">+{formatNum(report.petXp!)}</span>
                </div>
              )}
            </div>
          )}

          {/* 采集金币 */}
          {report.gold > 0 && (
            <div className="flex justify-between items-center bg-stone-800/50 rounded-xl px-3 py-2.5 text-stone-300">
              <span>🪙 活动金币</span>
              <span className="tabular-nums text-amber-300">+{formatNum(report.gold)}</span>
            </div>
          )}

          {/* 物品 */}
          {allItems.length > 0 && (
            <div className="bg-stone-800/50 rounded-xl p-3">
              <div className="text-stone-400 font-semibold mb-1.5">🎒 物品收获</div>
              <div className="flex flex-wrap gap-1.5">
                {allItems.map((it, idx) => {
                  const item = getItem(it.itemId);
                  if (!item) return null;
                  return (
                    <span key={`${it.itemId}-${idx}`} className={cn('bg-stone-900 rounded-lg px-2 py-1 text-[10px]', QUALITY_TEXT[item.quality])}>
                      {item.icon}{item.name}×{formatNum(it.qty)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 宝石 */}
          {report.gems > 0 && (
            <div className="flex justify-between items-center bg-stone-800/50 rounded-xl px-3 py-2.5 text-stone-300">
              <span>💎 宝石</span>
              <span className="tabular-nums text-cyan-300">+{formatNum(report.gems)}</span>
            </div>
          )}
        </div>

        <ActionButton className="w-full mt-4" onClick={dismiss}>收入囊中，继续修行</ActionButton>
      </div>
    </div>
  );
}

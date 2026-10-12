// 奇遇弹窗：天降宝箱（三选一）/ 神秘商人（90 秒限时 5 折）
'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/game';
import { formatNum } from './ui-bits';
import { cn } from '@/lib/utils';
import { ActionButton } from './ui-bits';

export function EventModal() {
  const encounter = useGameStore(s => s.encounter);
  const claimEncounter = useGameStore(s => s.claimEncounter);
  const dismissEncounter = useGameStore(s => s.dismissEncounter);
  const buyEncounterItem = useGameStore(s => s.buyEncounterItem);
  const [err, setErr] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  // 商人/宝箱倒计时每秒刷新
  useEffect(() => {
    if (!encounter) return;
    const t = setInterval(() => forceTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [encounter]);

  useEffect(() => {
    if (!err) return;
    const t = setTimeout(() => setErr(null), 1800);
    return () => clearTimeout(t);
  }, [err]);

  if (!encounter) return null;
  const remainSec = Math.max(0, Math.ceil((encounter.expireAt - Date.now()) / 1000));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className="w-full max-w-md bg-stone-900 border-t border-amber-700/60 rounded-t-2xl p-4 pb-8 space-y-3 animate-in slide-in-from-bottom-4 duration-200
        shadow-[0_-8px_40px_rgba(245,158,11,0.12)]">
        {encounter.kind === 'treasure' ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-xianzi text-sm font-bold text-gold-grad tracking-widest">🎁 天降宝箱</h3>
              <span className="text-[10px] text-stone-500 tabular-nums">
                {remainSec > 0 ? `${Math.floor(remainSec / 60)}:${String(remainSec % 60).padStart(2, '0')} 后消散` : '已消散'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              一道流光坠入袖中——是前世机缘今日兑现。<b className="text-amber-300">三选一</b>，过时不候。
            </p>
            <div className="space-y-2">
              {(encounter.options ?? []).map(o => (
                <button key={o.id} onClick={() => claimEncounter(o.id)}
                  className="w-full flex items-center gap-3 bg-stone-800/50 border border-amber-900/40 hover:border-amber-600/70 rounded-xl p-3 text-left transition-colors active:scale-[0.99]">
                  <span className="text-2xl shrink-0" aria-hidden>{o.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-amber-100">{o.label}</div>
                    <div className="text-[10px] text-stone-500 truncate">{o.desc}</div>
                  </div>
                  <span className="text-[10px] text-amber-400 shrink-0">选取 ›</span>
                </button>
              ))}
            </div>
            <button onClick={dismissEncounter}
              className="w-full text-[10px] text-stone-600 hover:text-stone-400 min-h-[32px]">
              放弃这份机缘
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-xianzi text-sm font-bold text-gold-grad tracking-widest">🧳 神秘商人</h3>
              <span className="text-[10px] text-rose-300 tabular-nums" aria-live="polite">
                停留 {remainSec}s
              </span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              蒙面货郎压低声音：「道友，都是好东西，<b className="text-amber-300">五折</b>——只此一刻。」
            </p>
            {err && <div className="text-xs text-center text-rose-300 bg-rose-950/50 rounded-lg py-1.5">{err}</div>}
            <div className="space-y-2">
              {(encounter.items ?? []).map(it => (
                <div key={it.key}
                  className="flex items-center gap-2.5 bg-stone-800/50 border border-amber-900/40 rounded-xl p-2.5">
                  <span className="text-2xl shrink-0" aria-hidden>{it.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-amber-100">{it.label}</div>
                    <div className="text-[10px] text-stone-500">限时五折</div>
                  </div>
                  <ActionButton className="!min-h-[38px] !px-3 text-xs" onClick={() => {
                    const e = buyEncounterItem(it.key);
                    if (e) setErr(e);
                  }}>
                    {it.currency === 'gold' ? '🪙' : '💎'} {formatNum(it.price)}
                  </ActionButton>
                </div>
              ))}
            </div>
            <button onClick={dismissEncounter}
              className="w-full text-[10px] text-stone-600 hover:text-stone-400 min-h-[32px]">
              送客（未购商品将随商人离开）
            </button>
          </>
        )}
      </div>
    </div>
  );
}

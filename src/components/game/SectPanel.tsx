// 宗门面板：拜入宗门 / 贡献与位阶 / 同门榜 / 宗门商店
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import {
  SECTS, SECT_MAP, getSectMembers, getSectShopEntries, sectRank,
  sectScaleHint, SECT_RANKS,
} from '@/lib/game/sects';
import { getItem } from '@/lib/game/items';
import { Section, ActionButton, formatNum, ProgressBar } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft, Swords, Flame, PawPrint, Coins } from 'lucide-react';

const SECT_ICONS: Record<string, React.ReactNode> = {
  sword: <Swords className="w-5 h-5" />,
  alchemy: <Flame className="w-5 h-5" />,
  beast: <PawPrint className="w-5 h-5" />,
  vault: <Coins className="w-5 h-5" />,
};

export function SectPanel({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const sect = store.sect;
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2600); };

  return (
    <div className="p-3 pb-24 space-y-3">
      <div className="flex items-center gap-1">
        <button onClick={onBack} className="text-stone-400 min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1 rounded-lg hover:bg-stone-900" aria-label="返回">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-xianzi text-base font-bold text-gold-grad tracking-widest">宗门</h2>
      </div>

      {msg && <div className="text-xs text-center text-amber-300 bg-amber-950/50 border border-amber-900/50 rounded-lg py-2">{msg}</div>}

      {!sect ? (
        <>
          <Section title="拜入山门">
            <div className="text-[11px] text-stone-400 leading-relaxed mb-2.5">
              <p>择一宗门修行，可获专属庇护。战斗胜利积累<b className="text-amber-300">贡献点</b>（小妖 +1，妖王 +10，世界 BOSS 挑战 +5），贡献可兑换宗门商店珍品、晋升弟子位阶。</p>
              <p className="mt-1 text-stone-500">叛宗将清空全部贡献并失去位阶称号，慎之。</p>
            </div>
            <div className="space-y-2">
              {SECTS.map(s => (
                <div key={s.id} className={cn('rounded-xl border overflow-hidden bg-stone-900/80', s.tone.split(' ')[2])}>
                  <div className="relative h-20">
                    <img src={`/sects/sect-${s.id}.jpg`} alt={`${s.name}画卷`} loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-transparent" />
                    <div className="absolute bottom-1.5 left-3 flex items-center gap-2">
                      <span className={cn('w-8 h-8 rounded-lg border flex items-center justify-center bg-stone-950/85 shrink-0', s.tone)} aria-hidden>
                        {SECT_ICONS[s.id]}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-amber-100 drop-shadow">{s.name}</div>
                        <div className="text-[10px] text-stone-400 drop-shadow truncate">「{s.motto}」</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 pt-2">
                    <div className="text-[10px] text-stone-500">{sectScaleHint(s.id)}</div>
                    <div className="mt-1.5 text-[11px] text-stone-400">
                      传承异能 <b className={s.tone.split(' ')[0]}>{s.bonusName}</b>：{s.bonusDesc}
                    </div>
                    {pendingId === s.id ? (
                      <div className="grid grid-cols-2 gap-2 mt-2.5">
                        <ActionButton className="!min-h-[38px] text-xs" onClick={() => { store.joinSect(s.id); setPendingId(null); }}>确认拜入</ActionButton>
                        <ActionButton variant="ghost" className="!min-h-[38px] text-xs" onClick={() => setPendingId(null)}>再想想</ActionButton>
                      </div>
                    ) : (
                      <ActionButton className="w-full !min-h-[38px] text-xs mt-2.5" onClick={() => setPendingId(s.id)}>拜入{s.name}</ActionButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      ) : (
        <SectHome confirmLeave={confirmLeave} setConfirmLeave={setConfirmLeave} flash={flash} />
      )}
    </div>
  );
}

function SectHome({ confirmLeave, setConfirmLeave, flash }: {
  confirmLeave: boolean;
  setConfirmLeave: (v: boolean) => void;
  flash: (m: string) => void;
}) {
  const store = useGameStore();
  const sect = store.sect!;
  const def = SECT_MAP[sect.sectId];
  const info = getSectMembers(store);
  const rank = sectRank(sect.totalContrib);
  const nextRank = SECT_RANKS.find(r => r.min > sect.totalContrib);
  const shop = getSectShopEntries();

  return (
    <>
      {/* 宗门卡 */}
      <div className={cn('rounded-xl border overflow-hidden bg-gradient-to-b from-stone-900 to-stone-950 relative', def.tone.split(' ')[2])}>
        <div className="relative h-24">
          <img src={`/sects/sect-${def.id}.jpg`} alt={`${def.name}山门画卷`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/35 to-transparent" />
          <div className="absolute bottom-2 left-4 flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full border border-stone-700 bg-stone-950/85 flex items-center justify-center shrink-0">
              <span className="text-2xl" aria-hidden>{def.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold text-amber-100 drop-shadow">{def.name}</div>
              <div className="text-[10px] text-stone-400 drop-shadow">「{def.motto}」 · 宗门等级 {info.level}</div>
            </div>
          </div>
        </div>
        <div className="p-4 pt-3">
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-stone-900/70 rounded-lg py-1.5">
              <div className="text-[9px] text-stone-500">可用贡献</div>
              <div className="text-xs text-amber-300 font-semibold tabular-nums">{formatNum(sect.contribution)}</div>
            </div>
            <div className="bg-stone-900/70 rounded-lg py-1.5">
              <div className="text-[9px] text-stone-500">累计贡献</div>
              <div className="text-xs text-amber-300 font-semibold tabular-nums">{formatNum(sect.totalContrib)}</div>
            </div>
            <div className="bg-stone-900/70 rounded-lg py-1.5">
              <div className="text-[9px] text-stone-500">今日贡献</div>
              <div className="text-xs text-amber-300 font-semibold tabular-nums">{formatNum(sect.dayContrib)}</div>
            </div>
          </div>
          <div className="mt-2.5 text-[11px] text-stone-300">
            传承异能 <b className={def.tone.split(' ')[0]}>{def.bonusName}</b>：{def.bonusDesc}
          </div>
        </div>
      </div>

      {/* 位阶进度 */}
      <Section title="弟子位阶" extra={<span className={cn('text-xs font-semibold px-2 py-0.5 rounded border', def.tone)}>{rank.name}</span>}>
        {nextRank ? (
          <>
            <ProgressBar value={sect.totalContrib - rank.min} max={nextRank.min - rank.min} className="h-2" barClass="bg-gradient-to-r from-amber-600 to-amber-400" />
            <div className="text-[10px] text-stone-500 mt-1.5">再积累 {formatNum(nextRank.min - sect.totalContrib)} 贡献晋升「{nextRank.name}」（累计需 {formatNum(nextRank.min)}）</div>
          </>
        ) : (
          <div className="text-[11px] text-amber-300/90">已至最高位阶「{rank.name}」，宗门与你同辉。</div>
        )}
      </Section>

      {/* 同门贡献榜 */}
      <Section title="同门贡献榜" extra={<span className="text-[10px] text-stone-500">你的排名 第 {info.playerRank} 位</span>}>
        <div className="space-y-1">
          {info.members.map((mem, i) => (
            <div key={mem.name}
              className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs',
                mem.isPlayer ? 'bg-amber-950/40 border border-amber-900/50' : i % 2 === 0 ? 'bg-stone-800/30' : '')}>
              <span className={cn('w-5 text-center text-[10px] tabular-nums shrink-0',
                i === 0 ? 'text-amber-400' : i === 1 ? 'text-stone-300' : i === 2 ? 'text-orange-400' : 'text-stone-600')}>
                {i + 1}
              </span>
              <span className="flex-1 min-w-0 truncate text-stone-300">{mem.name}</span>
              <span className="tabular-nums text-amber-300/90 text-[11px]">{formatNum(mem.contribution)}</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-stone-600 mt-2 text-center">宗门总贡献 {formatNum(info.total)}，众人拾柴，宗门等级随总贡献提升</div>
      </Section>

      {/* 宗门商店 */}
      <Section title="宗门商店（贡献兑换）">
        <div className="space-y-2">
          {shop.map(e => {
            const item = getItem(e.itemId);
            if (!item) return null;
            const afford = sect.contribution >= e.price;
            return (
              <div key={e.itemId} className="flex items-center gap-2.5 bg-stone-800/40 border border-stone-800 rounded-lg p-2.5">
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-stone-200">{e.label}</div>
                  <div className="text-[10px] text-stone-500 truncate">{item.description}</div>
                </div>
                <ActionButton
                  className="!min-h-[40px] !px-3 text-xs"
                  disabled={!afford}
                  onClick={() => {
                    const err = store.buySectItem(e.itemId);
                    if (err) flash(err);
                  }}
                >📜 {formatNum(e.price)}</ActionButton>
              </div>
            );
          })}
          <div className="text-[10px] text-stone-600 text-center">贡献不足的商品将置灰，战斗胜利与挑战世界 BOSS 可赚取贡献</div>
        </div>
      </Section>

      {/* 叛宗 */}
      <Section title="脱离宗门">
        {confirmLeave ? (
          <div className="space-y-2">
            <div className="text-xs text-red-300 bg-red-950/50 rounded-lg p-2.5">
              确认叛出{def.name}？贡献清零、位阶称号收回，此操作不可恢复。
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton variant="danger" className="text-xs" onClick={() => { store.leaveSect(); setConfirmLeave(false); }}>确认叛宗</ActionButton>
              <ActionButton variant="ghost" className="text-xs" onClick={() => setConfirmLeave(false)}>取消</ActionButton>
            </div>
          </div>
        ) : (
          <ActionButton variant="danger" className="w-full text-xs" onClick={() => setConfirmLeave(true)}>叛出宗门</ActionButton>
        )}
      </Section>
    </>
  );
}

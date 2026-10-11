// 灵宠舍：宠物列表 / 出战管理 / 进化 / 融合 / 放生
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { MONSTER_MAP } from '@/lib/game/monsters';
import {
  petStats, petBonus, petXpToNext, releaseGold, MAX_PETS, MAX_PET_LEVEL,
  PET_STAGES, petEvolveReq, canEvolve, petDisplayName, MAX_PET_STARS, STAR_BONUS_PER,
} from '@/lib/game/pets';
import { statePetMult } from '@/lib/game/engine';
import { Section, ProgressBar, ActionButton, formatNum } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft, Sparkles, GitMerge } from 'lucide-react';

const STAGE_TONE: string[] = [
  'text-stone-300',
  'text-emerald-300',
  'text-cyan-300',
  'text-amber-300',
];

export function PetPanel({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const pets = store.pets ?? [];
  const [confirmUid, setConfirmUid] = useState<string | null>(null);
  const [fuseUid, setFuseUid] = useState<string | null>(null); // 正在为主宠选择祭品
  const [msg, setMsg] = useState<string | null>(null);

  const activePet = pets.find(p => p.uid === store.activePetUid) ?? null;
  const petMult = statePetMult(store);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2600); };

  return (
    <div className="p-3 pb-24 space-y-3">
      <div className="flex items-center gap-1">
        <button onClick={onBack} className="text-stone-400 min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1 rounded-lg hover:bg-stone-900" aria-label="返回">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-xianzi text-base font-bold text-gold-grad tracking-widest">灵宠舍（{pets.length}/{MAX_PETS}）</h2>
      </div>

      {msg && <div className="text-xs text-center text-amber-300 bg-amber-950/50 border border-amber-900/50 rounded-lg py-2">{msg}</div>}

      {fuseUid && <FuseSelector mainUid={fuseUid} onCancel={() => setFuseUid(null)} onDone={(ok, err) => {
        if (ok) { setFuseUid(null); }
        else if (err) flash(err);
      }} />}

      <Section title="灵宠机制">
        <div className="text-[11px] text-stone-400 space-y-1 leading-relaxed">
          <p>· 战胜妖兽后小概率<b className="text-emerald-300">收服为灵宠</b>，出战提供属性加成并随战斗成长。</p>
          <p>· <b className="text-cyan-300">进化</b>：等级达标后消耗金币与妖丹，凡兽 → 灵兽 → 仙兽 → 神兽，属性大幅提升。</p>
          <p>· <b className="text-amber-300">融合</b>：吞噬一只<b>同种</b>妖兽升一星（上限 {MAX_PET_STARS} 星），每星全属性 +{Math.round(STAR_BONUS_PER * 100)}%。</p>
          <p>· 放生灵宠可换取金币，进化与星级越高越值钱。</p>
        </div>
      </Section>

      {pets.length === 0 ? (
        <div className="text-center py-10 bg-stone-900/40 border border-dashed border-stone-800 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full border border-stone-700/60 bg-stone-900/80 flex items-center justify-center">
            <span className="text-3xl opacity-60 animate-float" aria-hidden>🥚</span>
          </div>
          <div className="text-xs text-stone-500">尚未收服任何灵宠</div>
          <div className="text-[10px] text-stone-600 mt-1">去战斗页挑战妖兽试试运气吧</div>
        </div>
      ) : (
        <div className="space-y-2">
          {pets.map(pet => {
            const m = MONSTER_MAP[pet.monsterId];
            const ps = petStats(pet);
            const bonusRaw = petBonus(pet);
            const bonus = {
              atk: Math.round(bonusRaw.atk * petMult),
              def: Math.round(bonusRaw.def * petMult),
              hp: Math.round(bonusRaw.hp * petMult),
            };
            const isActive = pet.uid === store.activePetUid;
            const xpNeed = petXpToNext(pet.level);
            const stage = PET_STAGES[pet.stage] ?? PET_STAGES[0];
            const evolvable = canEvolve(pet);
            const req = petEvolveReq(pet);
            const coreHave = store.inventory.find(i => i.itemId === 'core_1')?.quantity ?? 0;
            const sameSpecies = pets.filter(p => p.monsterId === pet.monsterId && p.uid !== pet.uid).length;
            return (
              <div key={pet.uid}
                className={cn('rounded-xl border p-3 space-y-2 relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-br from-emerald-950/40 to-stone-900/90 border-emerald-600/70 shadow-[0_0_16px_rgba(16,185,129,0.12)]'
                    : 'bg-stone-900/80 border-stone-800')}>
                {isActive && <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />}
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-11 h-11 shrink-0 rounded-full border flex items-center justify-center relative',
                    isActive ? 'border-emerald-700/60 bg-emerald-950/50' : 'border-stone-700/60 bg-stone-800/60')}>
                    <span className={cn('text-2xl', isActive && 'animate-float')} aria-hidden>{m.icon}</span>
                    {pet.stage > 0 && (
                      <span aria-hidden className="absolute -top-1 -right-1 text-[9px] px-1 rounded-full bg-amber-900 text-amber-200 border border-amber-600/60">
                        {['', '灵', '仙', '神'][pet.stage]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn('text-sm font-semibold truncate', isActive ? 'text-emerald-300' : STAGE_TONE[pet.stage])}>
                        {petDisplayName(pet)}
                      </span>
                      <span className="text-[10px] text-stone-500">Lv.{pet.level}</span>
                      {pet.stars > 0 && (
                        <span className="text-[10px] text-amber-400 tracking-tight" aria-label={`${pet.stars}星`}>
                          {'★'.repeat(pet.stars)}{'☆'.repeat(MAX_PET_STARS - pet.stars)}
                        </span>
                      )}
                      {isActive && <span className="text-[9px] px-1 rounded bg-emerald-900 text-emerald-300">出战中</span>}
                    </div>
                    <div className="text-[10px] text-stone-500 tabular-nums mt-0.5">
                      攻 {formatNum(ps.atk)} · 防 {formatNum(ps.def)} · 血 {formatNum(ps.hp)}
                      <span className="text-stone-600">（{stage.name}×{stage.mult}{pet.stars > 0 ? ` + 星${pet.stars}` : ''}）</span>
                    </div>
                  </div>
                </div>

                {pet.level >= MAX_PET_LEVEL ? (
                  <div className="h-1.5 flex items-center justify-center bg-amber-950/50 border border-amber-800/50 rounded-full text-[9px] text-amber-300 font-semibold tracking-widest">
                    ⭐ 已达满级 LV.{MAX_PET_LEVEL}
                  </div>
                ) : (
                  <ProgressBar value={pet.xp} max={xpNeed} className="h-1.5"
                    barClass={isActive ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-stone-600'} />
                )}

                <div className="flex items-center justify-between gap-2 text-[10px] text-amber-300/90 tabular-nums">
                  <span>出战加成：攻+{formatNum(bonus.atk)} 防+{formatNum(bonus.def)} 血+{formatNum(bonus.hp)}{petMult > 1 && <span className="text-amber-500">（含宗门×{petMult.toFixed(2)}）</span>}</span>
                </div>

                {/* 进化行 */}
                {evolvable && (
                  <div className="flex items-center justify-between gap-2 bg-stone-800/40 border border-cyan-900/40 rounded-lg px-2.5 py-1.5">
                    <div className="text-[10px] text-cyan-300/90 leading-tight">
                      <Sparkles className="w-3 h-3 inline mr-1 -mt-0.5" aria-hidden />
                      可进化为{PET_STAGES[pet.stage + 1]?.name}：
                      Lv.{req.level} · 🪙{formatNum(req.gold)} · 🔮妖丹×{req.core}{req.gems > 0 ? ` · 💎${req.gems}` : ''}
                      <span className={cn('ml-1', coreHave >= req.core ? 'text-stone-500' : 'text-red-400')}>(持有妖丹×{coreHave})</span>
                    </div>
                    <ActionButton className="!min-h-[32px] !px-2.5 text-[11px]" onClick={() => {
                      const err = store.evolvePet(pet.uid);
                      if (err) flash(err);
                    }}>进化</ActionButton>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1.5 shrink-0">
                    {isActive ? (
                      <ActionButton variant="ghost" className="!min-h-[36px] !px-3 text-xs"
                        onClick={() => store.setActivePet(null)}>休息</ActionButton>
                    ) : (
                      <ActionButton className="!min-h-[36px] !px-3 text-xs"
                        onClick={() => store.setActivePet(pet.uid)}>出战</ActionButton>
                    )}
                    {pet.stars < MAX_PET_STARS && (
                      <button onClick={() => setFuseUid(pet.uid)}
                        disabled={sameSpecies === 0}
                        className="bg-amber-950/60 border border-amber-800/60 text-amber-300 rounded-lg px-2.5 min-h-[36px] text-[11px] active:scale-95 disabled:opacity-40 inline-flex items-center gap-1">
                        <GitMerge className="w-3.5 h-3.5" aria-hidden /> 融合
                        {sameSpecies === 0 && <span className="text-stone-500">（缺同族）</span>}
                      </button>
                    )}
                  </div>
                  {confirmUid === pet.uid ? (
                    <div className="flex gap-1.5 shrink-0">
                      <ActionButton variant="danger" className="!min-h-[36px] !px-2.5 text-xs"
                        onClick={() => { store.releasePet(pet.uid); setConfirmUid(null); }}>确认</ActionButton>
                      <ActionButton variant="ghost" className="!min-h-[36px] !px-2.5 text-xs"
                        onClick={() => setConfirmUid(null)}>取消</ActionButton>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmUid(pet.uid)}
                      className="bg-stone-800 border border-stone-700 text-stone-400 rounded-lg px-2.5 min-h-[36px] text-[11px] active:scale-95 ml-auto">
                      放生 +{formatNum(releaseGold(pet))}🪙
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== 融合祭品选择器 =====
function FuseSelector({ mainUid, onCancel, onDone }: {
  mainUid: string;
  onCancel: () => void;
  onDone: (ok: boolean, err?: string) => void;
}) {
  const store = useGameStore();
  const [fuseUid, setFuseUid] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const main = (store.pets ?? []).find(p => p.uid === mainUid);
  if (!main) return null;
  const m = MONSTER_MAP[main.monsterId];
  const candidates = (store.pets ?? []).filter(p => p.monsterId === main.monsterId && p.uid !== mainUid);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md bg-stone-900 border-t border-amber-800/50 rounded-t-2xl p-4 pb-8 space-y-3 animate-in slide-in-from-bottom-4 duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-xianzi text-sm font-bold text-gold-grad tracking-widest">灵宠融合</h3>
          <button onClick={onCancel} className="text-stone-400 min-h-[36px] min-w-[36px] rounded-lg hover:bg-stone-800" aria-label="关闭">✕</button>
        </div>
        <div className="text-[11px] text-stone-400 leading-relaxed">
          选择一只<b className="text-amber-300">同种</b>妖兽作为祭品，主宠 {petDisplayName(main)} 将升为
          <b className="text-amber-300"> {main.stars + 1} 星</b>（全属性 +{Math.round(STAR_BONUS_PER * 100)}%）。祭品灵宠将消失，其等级不计入主宠。
        </div>
        <div className="space-y-1.5 max-h-72 overflow-y-auto overscroll-contain">
          {candidates.map(p => {
            const lv = p.level;
            return (
              <button key={p.uid}
                onClick={() => setFuseUid(p.uid)}
                className={cn('w-full flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors',
                  fuseUid === p.uid ? 'bg-amber-950/60 border-amber-700' : 'bg-stone-800/40 border-stone-800 hover:border-stone-700')}>
                <span className="text-2xl" aria-hidden>{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-stone-200 font-semibold">Lv.{lv} {petDisplayName(p)}</div>
                  <div className="text-[10px] text-stone-500">{p.stars > 0 ? `${'★'.repeat(p.stars)} ` : ''}将作为祭品被吞噬</div>
                </div>
                {fuseUid === p.uid && <span className="text-amber-400 text-xs">已选中</span>}
              </button>
            );
          })}
        </div>
        {confirming && fuseUid ? (
          <div className="grid grid-cols-2 gap-2">
            <ActionButton variant="danger" onClick={() => {
              const err = store.fusePet(mainUid, fuseUid);
              if (err) { onDone(false, err); setConfirming(false); }
              else onDone(true);
            }}>确认融合</ActionButton>
            <ActionButton variant="ghost" onClick={() => setConfirming(false)}>再想想</ActionButton>
          </div>
        ) : (
          <ActionButton className="w-full" disabled={!fuseUid}
            onClick={() => setConfirming(true)}>
            <GitMerge className="w-4 h-4 inline mr-1 -mt-0.5" aria-hidden />开始融合
          </ActionButton>
        )}
      </div>
    </div>
  );
}

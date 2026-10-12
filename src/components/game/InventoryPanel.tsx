// 背包面板：装备栏 / 物品分类 / 装备详情与对比 / 出售
'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/game';
import { getItem, QUALITY_TEXT, QUALITY_NAMES, AFFIX_NAMES, formatAffix } from '@/lib/game/items';
import { BaseItem, Equipment, EquipSlot, ItemQuality, InvItem } from '@/types/game';
import { computePlayerStats, equipTotals } from '@/lib/game/engine';
import {
  MAX_REFINE, isRefinable, refineCost, refineSuccessRate,
  refineMainMult, refineAffixMult, refineName, refineOreName,
} from '@/lib/game/refine';
import { Section, ActionButton, QualityBadge, ProgressBar, formatNum } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft, Trash2 } from 'lucide-react';

type InvTab = 'gear' | 'pill' | 'material' | 'treasure';

const SLOT_META: Record<EquipSlot, { icon: string; label: string }> = {
  weapon: { icon: '🗡️', label: '武器' },
  armor: { icon: '🛡️', label: '护甲' },
  accessory: { icon: '💍', label: '饰品' },
};

// 品质发光（已装备槽位）
const QUALITY_GLOW: Record<ItemQuality, string> = {
  common: 'shadow-[0_0_10px_rgba(120,113,108,0.15)]',
  fine: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  rare: 'shadow-[0_0_10px_rgba(34,211,238,0.2)]',
  epic: 'shadow-[0_0_10px_rgba(168,85,247,0.25)]',
  legendary: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
  mythic: 'shadow-[0_0_14px_rgba(244,63,94,0.35)]',
};

// 品质左侧色条
const QUALITY_EDGE: Record<ItemQuality, string> = {
  common: 'border-l-stone-600',
  fine: 'border-l-emerald-600',
  rare: 'border-l-cyan-600',
  epic: 'border-l-purple-600',
  legendary: 'border-l-amber-500',
  mythic: 'border-l-rose-500',
};

export function InventoryPanel() {
  const store = useGameStore();
  const [tab, setTab] = useState<InvTab>('gear');
  const [detailUid, setDetailUid] = useState<string | null>(null);
  const [detailBase, setDetailBase] = useState<string | null>(null);

  const stats = computePlayerStats(store);
  const eqTotals = equipTotals(store.equipped);

  // 装备详情
  const detailEquip: Equipment | null = detailUid ? store.equips[detailUid] ?? null : null;
  const detailItem: { item: BaseItem; qty: number } | null = useMemo(() => {
    if (!detailBase) return null;
    const item = getItem(detailBase);
    const inv = store.inventory.find(i => i.itemId === detailBase);
    return item && inv ? { item, qty: inv.quantity } : null;
  }, [detailBase, store.inventory]);

  const inventory = store.inventory;
  const equips = store.equips;
  const grouped = useMemo(() => {
    const pills: InvItem[] = [];
    const materials: InvItem[] = [];
    const treasures: InvItem[] = [];
    const gearUids: string[] = [];
    for (const inv of inventory) {
      if (inv.itemId.startsWith('equip:')) {
        gearUids.push(inv.itemId.slice(6));
        continue;
      }
      const item = getItem(inv.itemId);
      if (!item) continue;
      if (item.type === 'pill') pills.push(inv);
      else if (item.type === 'treasure') treasures.push(inv);
      else materials.push(inv);
    }
    // 背包装备按品质+等级排序
    gearUids.sort((a, b) => {
      const ea = equips[a], eb = equips[b];
      if (!ea || !eb) return 0;
      const rank: Record<ItemQuality, number> = { common: 0, fine: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
      return (rank[eb.quality] - rank[ea.quality]) || (eb.tier - ea.tier);
    });
    return { pills, materials, treasures, gearUids };
  }, [inventory, equips]);

  if (detailEquip) {
    return <GearDetail uid={detailEquip.uid} onBack={() => setDetailUid(null)} />;
  }
  if (detailItem) {
    return <ItemDetail itemId={detailItem.item.id} qty={detailItem.qty} onBack={() => setDetailBase(null)} />;
  }

  return (
    <div className="p-3 pb-24 space-y-3">
      {/* 装备栏总览 */}
      <Section title="人物属性">
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          <AttrBox icon="❤️" label="生命" value={formatNum(stats.maxHp)} bonus={eqTotals.hp} />
          <AttrBox icon="⚔️" label="攻击" value={formatNum(stats.atk)} bonus={eqTotals.atk} />
          <AttrBox icon="🛡️" label="防御" value={formatNum(stats.def)} bonus={eqTotals.def} />
          <AttrBox icon="💨" label="速度" value={stats.speed} bonus={eqTotals.speed} />
          <AttrBox icon="🔥" label="暴击" value={`${(stats.critRate * 100).toFixed(1)}%`} />
          <AttrBox icon="🌪️" label="闪避" value={`${(stats.dodgeRate * 100).toFixed(1)}%`} />
        </div>
      </Section>

      <Section title="已装备">
        <div className="grid grid-cols-3 gap-2">
          {(['weapon', 'armor', 'accessory'] as EquipSlot[]).map(slot => {
            const eq = store.equipped[slot];
            return (
              <button key={slot} onClick={() => eq && setDetailUid(eq.uid)}
                className={cn('rounded-lg p-2 min-h-[72px] flex flex-col items-center justify-center gap-1 border transition-colors',
                  eq
                    ? `bg-stone-800/60 border-stone-600/60 ${QUALITY_GLOW[eq.quality]}`
                    : 'bg-stone-900/50 border border-dashed border-stone-800')}>
                {eq ? (
                  <>
                    <span className="text-2xl" aria-hidden>{eq.icon}</span>
                    <span className={cn('text-[10px] text-center leading-tight', QUALITY_TEXT[eq.quality])}>{eq.name}</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl opacity-30" aria-hidden>{SLOT_META[slot].icon}</span>
                    <span className="text-[10px] text-stone-600">{SLOT_META[slot].label}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* 分类 Tab */}
      <div className="grid grid-cols-4 gap-1.5">
        {([
          { id: 'gear', label: `装备 ${grouped.gearUids.length}` },
          { id: 'pill', label: `丹药 ${grouped.pills.length}` },
          { id: 'material', label: `材料 ${grouped.materials.length}` },
          { id: 'treasure', label: `宝藏 ${grouped.treasures.length}` },
        ] as { id: InvTab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('py-2 rounded-lg text-[11px] font-medium border min-h-[38px] transition-all',
              tab === t.id
                ? 'bg-gradient-to-b from-amber-800/80 to-amber-950/70 border-amber-500/60 text-amber-100'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 装备列表 */}
      {tab === 'gear' && (
        <div className="space-y-2">
          {grouped.gearUids.length === 0 && <EmptyHint text="尚无装备，去战斗或锻造获取吧" />}
          {grouped.gearUids.map(uid => {
            const eq = store.equips[uid];
            if (!eq) return null;
            const isEquipped = Object.values(store.equipped).some(e => e?.uid === uid);
            return (
              <button key={uid} onClick={() => setDetailUid(uid)}
                className={cn('w-full bg-stone-900/80 border rounded-xl p-2.5 flex items-center gap-2.5 text-left border-l-2 transition-colors hover:bg-stone-900',
                  isEquipped ? 'border-amber-700' : 'border-stone-800',
                  QUALITY_EDGE[eq.quality])}>
                <span className="text-2xl" aria-hidden>{eq.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-semibold truncate', QUALITY_TEXT[eq.quality])}>{refineName(eq)}</span>
                    <QualityBadge quality={eq.quality} />
                    {isEquipped && <span className="text-[9px] px-1 rounded bg-amber-900 text-amber-300">已装备</span>}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    {eq.tier}阶 · {mainStatText(eq)} {eq.sigAffix && <span className="text-amber-400">· ✨专属</span>} {eq.affixes.length > 0 && `· ${eq.affixes.length}条副属性`}
                  </div>
                </div>
                <span className="text-[10px] text-stone-500 shrink-0">🪙{formatNum(eq.sellPrice)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 丹药/材料/宝藏列表 */}
      {tab !== 'gear' && (
        <div className="space-y-2">
          {(tab === 'pill' ? grouped.pills : tab === 'material' ? grouped.materials : grouped.treasures).length === 0 && (
            <EmptyHint text="暂无物品" />
          )}
          {(tab === 'pill' ? grouped.pills : tab === 'material' ? grouped.materials : grouped.treasures).map(inv => {
            const item = getItem(inv.itemId);
            if (!item) return null;
            return (
              <button key={inv.itemId} onClick={() => setDetailBase(inv.itemId)}
                className={cn('w-full bg-stone-900/80 border border-stone-800 border-l-2 rounded-xl p-2.5 flex items-center gap-2.5 text-left transition-colors hover:bg-stone-900',
                  QUALITY_EDGE[item.quality])}>
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-semibold', QUALITY_TEXT[item.quality])}>{item.name}</span>
                    <span className="text-[10px] text-stone-500">×{formatNum(inv.quantity)}</span>
                  </div>
                  <div className="text-[10px] text-stone-500 truncate">{item.description}</div>
                </div>
                <span className="text-[10px] text-stone-500 shrink-0">🪙{item.sellPrice}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AttrBox({ icon, label, value, bonus }: { icon: string; label: string; value: string | number; bonus?: number }) {
  return (
    <div className="bg-stone-800/60 rounded-lg px-2 py-1.5">
      <div className="text-[10px] text-stone-500">{icon} {label}</div>
      <div className="text-sm font-semibold text-stone-200 tabular-nums">
        {value}
        {bonus !== undefined && bonus > 0 && <span className="text-[9px] text-emerald-400 ml-1">+{formatNum(bonus)}</span>}
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="text-center py-8 bg-stone-900/40 border border-dashed border-stone-800/80 rounded-xl">
      <div className="text-xs text-stone-600">{text}</div>
    </div>
  );
}

function mainStatText(eq: Equipment): string {
  const key = eq.mainStat.key;
  const v = eq.mainStat.value * refineMainMult(eq);
  if (key === 'crit' || key === 'dodge') return `${AFFIX_NAMES[key]} +${(v * 100).toFixed(1)}%`;
  return `${AFFIX_NAMES[key]} +${formatNum(v)}`;
}

// ===== 装备详情 =====
function GearDetail({ uid, onBack }: { uid: string; onBack: () => void }) {
  const store = useGameStore();
  const eq = store.equips[uid];
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmSell, setConfirmSell] = useState(false);
  if (!eq) return null;
  const isEquipped = Object.values(store.equipped).some(e => e?.uid === uid);
  const current = store.equipped[eq.slot];
  const equippedScore = current ? gearScore(current) : 0;
  const thisScore = gearScore(eq);
  const refinable = isRefinable(eq);
  const cost = refineCost(eq);
  const rate = refineSuccessRate(eq);
  const oreHave = store.inventory.find(i => i.itemId === cost.oreId)?.quantity ?? 0;
  const oreOk = oreHave >= cost.oreQty;
  const goldOk = store.gold >= cost.gold;

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2600); };

  // 高价值装备售出需二次确认：仙品/神品、已炼器、专属装备（防误触蒸发心血）
  const precious = eq.quality === 'legendary' || eq.quality === 'mythic'
    || (eq.refine ?? 0) > 0 || !!eq.sigAffix;
  const trySell = () => {
    if (precious && !confirmSell) {
      setConfirmSell(true);
      setTimeout(() => setConfirmSell(false), 3000);
      return;
    }
    store.sellEquipment(uid);
    onBack();
  };

  return (
    <div className="p-3 pb-24 space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-stone-400 min-h-[36px] px-2">
        <ChevronLeft className="w-4 h-4" /> 返回背包
      </button>

      <Section className="text-center">
        <div className="text-5xl mb-2" aria-hidden>{eq.icon}</div>
        <div className={cn('text-base font-bold', QUALITY_TEXT[eq.quality])}>{refineName(eq)}</div>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <QualityBadge quality={eq.quality} />
          <span className="text-[10px] text-stone-500">{eq.tier}阶 · {SLOT_META[eq.slot].label}</span>
        </div>
      </Section>

      <Section title="属性">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-stone-400">主属性{eq.refine ? <span className="text-amber-500">（含炼器×{refineMainMult(eq).toFixed(2)}）</span> : null}</span>
            <span className="text-amber-300 font-semibold">{mainStatText(eq)}</span>
          </div>
          {eq.affixes.map((a, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-stone-400">副属性 {i + 1}</span>
              <span className="text-emerald-300">{AFFIX_NAMES[a.key]} {formatAffix(a.key, a.value * refineAffixMult(eq))}</span>
            </div>
          ))}
          {eq.sigAffix && (
            <div className="flex justify-between items-center flex-wrap gap-x-2 gap-y-0.5 bg-amber-950/30 border border-amber-900/40 rounded-md px-2 py-1">
              <span className="text-amber-400/90 shrink-0">✨ 专属词条·{eq.sigAffix.label}</span>
              <span className="text-amber-300 font-semibold">{AFFIX_NAMES[eq.sigAffix.key]} {formatAffix(eq.sigAffix.key, eq.sigAffix.value * refineAffixMult(eq))}{eq.refine ? <span className="text-[9px] text-amber-500 ml-1">（含炼器）</span> : null}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-stone-800">
            <span className="text-stone-400">综合评分</span>
            <span className="tabular-nums text-stone-200">{thisScore}
              {isEquipped ? <span className="text-[10px] text-amber-400 ml-1">（当前装备）</span>
                : equippedScore > 0 && <span className={thisScore >= equippedScore ? 'text-emerald-400' : 'text-red-400'}>
                  （对比当前 {equippedScore} {thisScore >= equippedScore ? '↑' : '↓'}）
                </span>}
            </span>
          </div>
        </div>
      </Section>

      {/* 炼器 */}
      <Section title={`炼器 +${eq.refine ?? 0} / ${MAX_REFINE}`}>
        {msg && <div className="text-xs text-center text-amber-300 bg-amber-950/50 border border-amber-900/50 rounded-lg py-2 mb-2">{msg}</div>}
        {refinable ? (
          <>
            <div className="text-[11px] text-stone-400 space-y-1 leading-relaxed mb-2.5">
              <p>· 消耗灵矿与金币炼化装备：主属性 <b className="text-amber-300">+12%</b>/级，副词条 <b className="text-amber-300">+6%</b>/级。</p>
              <p>· 成功率随等级下降，失败仅折损材料，装备无损、不降级。</p>
            </div>
            <ProgressBar value={rate * 100} max={100} className="h-2.5" barClass="bg-gradient-to-r from-cyan-600 to-cyan-400" showText />
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span className={cn('text-stone-400', !oreOk && 'text-red-400')}>
                {refineOreName(eq)} {oreHave}/{cost.oreQty}
              </span>
              <span className={cn('text-stone-400', !goldOk && 'text-red-400')}>
                🪙 {formatNum(cost.gold)}
              </span>
            </div>
            <ActionButton className="w-full mt-2.5"
              disabled={!oreOk || !goldOk}
              onClick={() => {
                const err = store.refineGear(uid);
                if (err) flash(err);
              }}>
              🔨 开始炼器（成功率 {Math.round(rate * 100)}%）
            </ActionButton>
          </>
        ) : (
          <div className="text-center text-[11px] text-amber-300/90 py-2">已达炼器上限 +{MAX_REFINE}，宝光自蕴</div>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-2">
        {isEquipped ? (
          <ActionButton variant="ghost" onClick={() => { store.unequipGear(eq.slot); onBack(); }}>卸下</ActionButton>
        ) : (
          <ActionButton onClick={() => { store.equipGear(uid); onBack(); }}>装备</ActionButton>
        )}
        <ActionButton variant={precious && confirmSell ? 'ghost' : 'danger'} onClick={trySell}
          disabled={isEquipped}>
          <span className="flex items-center justify-center gap-1">
            <Trash2 className="w-4 h-4" />
            {precious && confirmSell ? '再点一次确认售出！' : `售出 🪙${formatNum(eq.sellPrice)}`}
          </span>
        </ActionButton>
      </div>
    </div>
  );
}

function gearScore(eq: Equipment): number {
  let score = 0;
  const rm = refineMainMult(eq);
  const am = refineAffixMult(eq);
  const all = [
    { key: eq.mainStat.key, value: eq.mainStat.value * rm },
    ...eq.affixes.map(a => ({ key: a.key, value: a.value * am })),
    ...(eq.sigAffix ? [{ key: eq.sigAffix.key, value: eq.sigAffix.value * am }] : []),
  ];
  for (const a of all) {
    switch (a.key) {
      case 'atk': score += a.value * 3; break;
      case 'def': score += a.value * 2.5; break;
      case 'hp': score += a.value * 0.5; break;
      case 'speed': score += a.value * 2; break;
      case 'crit': score += a.value * 400; break;
      case 'dodge': score += a.value * 350; break;
      case 'luck': score += a.value * 1; break;
    }
  }
  return Math.round(score);
}

// ===== 物品详情（丹药/材料） =====
function ItemDetail({ itemId, qty, onBack }: { itemId: string; qty: number; onBack: () => void }) {
  const store = useGameStore();
  const item = getItem(itemId);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmSellAll, setConfirmSellAll] = useState(false);
  if (!item) return null;
  const usable = item.type === 'pill';

  return (
    <div className="p-3 pb-24 space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-stone-400 min-h-[36px] px-2">
        <ChevronLeft className="w-4 h-4" /> 返回背包
      </button>

      <Section className="text-center">
        <div className="text-5xl mb-2" aria-hidden>{item.icon}</div>
        <div className={cn('text-base font-bold', QUALITY_TEXT[item.quality])}>{item.name}</div>
        <div className="text-xs text-stone-500 mt-1">{item.description}</div>
        <div className="text-[10px] text-stone-600 mt-1">持有 {formatNum(qty)} · 单价 🪙{item.sellPrice}</div>
      </Section>

      {msg && <div className="text-xs text-center text-amber-300 bg-amber-950/50 rounded-lg py-2">{msg}</div>}

      <div className="grid grid-cols-2 gap-2">
        {usable && (
          <ActionButton onClick={() => {
            const result = store.useItem(itemId);
            if (result) { setMsg(result); setTimeout(() => setMsg(null), 2500); }
            else onBack();
          }}>使用</ActionButton>
        )}
        <ActionButton variant="danger" onClick={() => { store.sellMaterial(itemId, 1); onBack(); }}>
          卖 1 个
        </ActionButton>
        {qty > 1 && (
          <ActionButton variant={confirmSellAll ? 'danger' : 'ghost'} className={usable ? 'col-span-2' : ''}
            onClick={() => {
              if (!confirmSellAll) {
                setConfirmSellAll(true);
                setTimeout(() => setConfirmSellAll(false), 3000);
                return;
              }
              store.sellMaterial(itemId, qty);
              onBack();
            }}>
            {confirmSellAll ? '再点一次确认清空！' : `全部售出 🪙${formatNum(item.sellPrice * qty)}`}
          </ActionButton>
        )}
      </div>
    </div>
  );
}

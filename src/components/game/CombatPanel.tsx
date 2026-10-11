// 战斗面板：区域选择 / 妖兽列表 / 回合制文字战斗 / 自动挂机
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '@/store/game';
import { REGIONS, getMonstersByRegion, MONSTER_MAP } from '@/lib/game/monsters';
import { WORLD_BOSSES } from '@/lib/game/worldboss';
import { computePlayerStats, rollDrops, simulateRound } from '@/lib/game/engine';
import { PlayerStats, MonsterDef, BattleLogLine, BattleRewards, CombatantState, ActiveBuffKey } from '@/types/game';
import { Section, ActionButton, ProgressBar, formatNum, QualityBadge } from './ui-bits';
import { getItem, QUALITY_TEXT } from '@/lib/game/items';
import { pillMultiplier } from '@/lib/game/skills';
import { REGION_SCENE } from '@/lib/game/scenes';
import { cn } from '@/lib/utils';
import { ChevronLeft, Play, Zap, Heart } from 'lucide-react';

interface BattleState {
  monsterId: string;
  player: CombatantState;
  playerHp: number;
  monsterHp: number;
  round: number;
  log: BattleLogLine[];
  phase: 'fighting' | 'won' | 'lost';
  rewards: BattleRewards | null;
  playerHitEpoch: number;
  monsterHitEpoch: number;
}

let logId = 0;

// 丹药 buff 展示元数据
const BUFF_META: Record<ActiveBuffKey, { name: string; icon: string }> = {
  atk: { name: '攻击', icon: '🔴' },
  def: { name: '防御', icon: '🔵' },
  spd: { name: '速度', icon: '💨' },
  gold: { name: '金币', icon: '🪙' },
  luck: { name: '气运', icon: '🍀' },
  cap: { name: '捕获', icon: '🪤' },
};

export function CombatPanel() {
  const store = useGameStore();
  const playerStats = useMemo(() => computePlayerStats(store), [store.skills, store.equipped, store.activeBuffs, store.activePetUid, store.pets]);

  const [regionId, setRegionId] = useState(store.lastRegionId);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const battleRef = useRef<BattleState | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logBoxRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<PlayerStats>(playerStats);
  statsRef.current = playerStats;

  // 顶栏实测高度：战斗视图占满 TopBar→BottomNav 之间视口用
  const [topInset, setTopInset] = useState(56);

  useEffect(() => { store.setRegion(regionId); }, [regionId]);

  const sync = useCallback(() => {
    if (battleRef.current) {
      setBattle({ ...battleRef.current, log: [...battleRef.current.log] });
    } else {
      setBattle(null);
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
  }, []);

  // 结算战斗
  const finishBattle = useCallback((won: boolean) => {
    const b = battleRef.current;
    clearTimer();
    if (!b) return;
    b.phase = won ? 'won' : 'lost';
    if (won) {
      const rewards = rollDrops(MONSTER_MAP[b.monsterId], useGameStore.getState(), statsRef.current.luck);
      b.rewards = rewards;
      useGameStore.getState().applyBattleResult(b.monsterId, true, rewards);
    } else {
      useGameStore.getState().applyBattleResult(b.monsterId, false, {
        exp: 0, gold: 0, items: [], equips: [], cards: [], gems: 0,
      });
    }
    sync();

    // 自动战斗：胜利后 1.6s 开下一场（timeout 纳入 clearTimer 管理，避免逃离/卸载后僵尸复活）
    if (useGameStore.getState().autoBattleEnabled && won) {
      autoTimerRef.current = setTimeout(() => {
        autoTimerRef.current = null;
        // 逃离战斗后 battleRef 为 null，此时不得自动开新战斗
        if (useGameStore.getState().autoBattleEnabled && battleRef.current && battleRef.current.phase !== 'fighting') {
          startBattleRef.current?.(MONSTER_MAP[b.monsterId]);
        }
      }, 1600);
    }
  }, [clearTimer, sync]);

  // 单回合推进
  const stepRound = useCallback(() => {
    const b = battleRef.current;
    if (!b || b.phase !== 'fighting') { clearTimer(); return; }
    const monster = MONSTER_MAP[b.monsterId];
    const ps = statsRef.current;
    b.round += 1;

    const r = simulateRound(ps, b.playerHp, monster, b.monsterHp);
    const prevMonsterHp = b.monsterHp;
    b.monsterHp = r.monsterHpAfter;
    if (r.monsterHpAfter < prevMonsterHp) b.monsterHitEpoch += 1;

    let text = `第${b.round}回合：你挥出${r.playerDmg}点伤害${r.playerCrit ? '（暴击！）' : ''}`;
    b.log.push({ id: ++logId, type: r.playerCrit ? 'crit' : 'player', text });

    if (r.monsterHpAfter <= 0) {
      b.log.push({ id: ++logId, type: 'win', text: `⚔️ 你击败了 ${monster.name}！` });
      finishBattle(true);
      sync();
      return;
    }

    if (r.playerDodge) {
      b.log.push({ id: ++logId, type: 'dodge', text: `💨 你身形一闪，避开了 ${monster.name} 的攻击！` });
    } else {
      const prevPlayerHp = b.playerHp;
      b.playerHp = r.playerHpAfter;
      if (r.playerHpAfter < prevPlayerHp) b.playerHitEpoch += 1;
      text = `${monster.name} 反击造成 ${r.monsterDmg} 点伤害${r.monsterCrit ? '（暴击！）' : ''}`;
      b.log.push({ id: ++logId, type: 'monster', text });
      if (r.playerHpAfter <= 0) {
        b.log.push({ id: ++logId, type: 'lose', text: `💀 你不敌 ${monster.name}，仓皇逃遁...` });
        finishBattle(false);
        sync();
        return;
      }
    }
    if (b.log.length > 60) b.log = b.log.slice(-60);
    sync();
  }, [clearTimer, finishBattle, sync]);

  // 开战
  const startBattle = useCallback((monster: MonsterDef) => {
    clearTimer();
    const ps = statsRef.current;
    battleRef.current = {
      monsterId: monster.id,
      player: { name: useGameStore.getState().playerName, icon: '🧙', maxHp: ps.maxHp, hp: ps.maxHp, atk: ps.atk, def: ps.def, speed: ps.speed },
      playerHp: ps.maxHp,
      monsterHp: monster.hp,
      round: 0,
      log: [{ id: ++logId, type: 'info', text: `你与 ${monster.name}（${monster.tier} 阶${monster.isBoss ? '·妖王' : ''}）对峙！` }],
      phase: 'fighting',
      rewards: null,
      playerHitEpoch: 0,
      monsterHitEpoch: 0,
    };
    sync();
    timerRef.current = setInterval(stepRound, 750);
  }, [clearTimer, stepRound, sync]);

  const startBattleRef = useRef(startBattle);
  startBattleRef.current = startBattle;

  // 快速战斗：瞬间结算
  const fastBattle = useCallback((monster: MonsterDef) => {
    startBattle(monster);
    const b = battleRef.current;
    if (!b) return;
    let guard = 0;
    while (b.phase === 'fighting' && guard < 300) {
      guard++;
      const ps = statsRef.current;
      b.round += 1;
      const r = simulateRound(ps, b.playerHp, monster, b.monsterHp);
      const prevMonsterHp = b.monsterHp;
      b.monsterHp = r.monsterHpAfter;
      if (r.monsterHpAfter < prevMonsterHp) b.monsterHitEpoch += 1;
      if (r.monsterHpAfter <= 0) {
        b.log.push({ id: ++logId, type: 'win', text: `⚔️ 你击败了 ${monster.name}！（${b.round} 回合）` });
        finishBattle(true);
        break;
      }
      if (r.playerDodge) continue;
      const prevPlayerHp = b.playerHp;
      b.playerHp = r.playerHpAfter;
      if (r.playerHpAfter < prevPlayerHp) b.playerHitEpoch += 1;
      if (r.playerHpAfter <= 0) {
        b.log.push({ id: ++logId, type: 'lose', text: `💀 你不敌 ${monster.name}，仓皇逃遁...（第 ${b.round} 回合）` });
        finishBattle(false);
        break;
      }
    }
    sync();
  }, [startBattle, finishBattle, sync]);

  // 卸载清理
  useEffect(() => clearTimer, [clearTimer]);

  // 战斗日志自动滚动（跟随最后一条日志 id；依赖 length 会在 60 条裁剪后失效）
  const lastLogId = battle && battle.log.length > 0 ? battle.log[battle.log.length - 1].id : 0;
  useEffect(() => {
    const box = logBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [lastLogId]);

  // 进入战斗视图时量取顶栏实际高度，使战斗区恰好填满 TopBar→BottomNav 之间
  const inBattle = !!battle && !!MONSTER_MAP[battle.monsterId];
  useEffect(() => {
    if (!inBattle) return;
    const el = document.getElementById('game-topbar');
    if (el) setTopInset(el.offsetHeight);
  }, [inBattle]);

  // 战斗内喝药
  const healPills = store.inventory.filter(i => {
    const item = getItem(i.itemId);
    return item && item.type === 'pill' && item.pillEffect === 'heal' && i.quantity > 0;
  });

  const drinkPill = (itemId: string) => {
    const item = getItem(itemId);
    if (!item || item.pillEffect !== 'heal' || !battleRef.current) return;
    // 满血保护：避免误触白白消耗丹药
    if (battleRef.current.playerHp >= battleRef.current.player.maxHp) return;
    if (!useGameStore.getState().consumeItem(itemId, 1)) return;
    const mult = pillMultiplier(useGameStore.getState().skills.imbibing.level);
    const heal = Math.round((item.pillValue ?? 0) * mult);
    const b = battleRef.current;
    b.playerHp = Math.min(b.player.maxHp, b.playerHp + heal);
    b.log.push({ id: ++logId, type: 'info', text: `💚 服下${item.name}，恢复 ${heal} 点气血` });
    sync();
  };

  const monsters = getMonstersByRegion(regionId);
  const avgCombat = (['hp', 'weaponry', 'power', 'defence', 'speed'] as const)
    .reduce((a, id) => a + store.skills[id].level, 0) / 5;
  const currentTier = Math.round(avgCombat / 5);
  const monster = battle ? MONSTER_MAP[battle.monsterId] : null;
  const nowTs = Date.now();
  const activeBuffs = (store.activeBuffs ?? []).filter(b => b.expireAt > nowTs);
  const regionScene = REGION_SCENE[regionId];

  // ===== 战斗视图 =====
  if (battle && monster) {
    // 视口自适应战斗屏：战报区 flex 弹性伸缩并内部滚动，操作按钮钉在底栏上方，
    // 不再随战报增多而整体下移（inline dvh 优先，旧浏览器回退 vh 类）
    return (
      <div
        style={{ height: `calc(100dvh - ${topInset}px)` }}
        className="h-[calc(100vh_-_3.5rem)] flex flex-col gap-2 px-3 pt-1.5 pb-[calc(64px_+_env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain"
      >
        <button onClick={() => { clearTimer(); battleRef.current = null; sync(); }}
          className="shrink-0 flex items-center gap-1 text-xs text-stone-400 min-h-[36px] px-2">
          <ChevronLeft className="w-4 h-4" /> 逃离战斗
        </button>

        {/* 此刻所在 · 区域明信片（旅行青蛙式） */}
        {regionScene && (
          <div className="relative shrink-0 rounded-xl overflow-hidden border border-stone-800 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <img src={regionScene.img} alt={regionScene.name} className="w-full h-28 object-cover" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 px-3 py-2 flex items-end justify-between">
              <div>
                <div className="text-[9px] text-amber-200/80 tracking-[0.25em]">此刻所在</div>
                <div className="text-sm font-bold text-white drop-shadow">{regionScene.name}</div>
              </div>
              <div className="text-[10px] text-stone-300/90 text-right">
                与 <span className="text-rose-300">{monster.name}</span> 对峙
              </div>
            </div>
          </div>
        )}

        {/* 对阵卡 */}
        <div className="shrink-0 bg-gradient-to-b from-stone-900/90 to-stone-900/70 border border-stone-800 rounded-xl p-4 space-y-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <CombatantCard
            icon="🧙" name={battle.player.name} hp={battle.playerHp} maxHp={battle.player.maxHp}
            atk={battle.player.atk} def={battle.player.def} accent="amber" hitEpoch={battle.playerHitEpoch}
          />
          <div className="flex items-center gap-2" aria-hidden>
            <span className="flex-1 h-px bg-stone-800" />
            <span className="text-[10px] text-stone-500 tracking-[0.3em] tabular-nums">第 {battle.round} 回合</span>
            <span className="flex-1 h-px bg-stone-800" />
          </div>
          <CombatantCard
            icon={monster.icon} name={`${monster.name}·${monster.tier}阶`} hp={battle.monsterHp} maxHp={monster.hp}
            atk={monster.atk} def={monster.def} accent={monster.isBoss ? 'rose' : 'stone'} hitEpoch={battle.monsterHitEpoch}
          />
        </div>

        {/* 战斗日志（flex-1 弹性占位 + 内部滚动，高度恒定不推移下方按钮） */}
        <Section className="!p-0 overflow-hidden flex-1 min-h-[96px] flex flex-col">
          <div ref={logBoxRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-1 scroll-smooth" aria-live="polite">
            {battle.log.slice(-30).map(l => (
              <div key={l.id} className={cn('text-xs leading-relaxed animate-in fade-in slide-in-from-left-1 duration-200',
                l.type === 'player' && 'text-stone-300',
                l.type === 'crit' && 'text-amber-300 font-semibold',
                l.type === 'monster' && 'text-red-300/90',
                l.type === 'dodge' && 'text-emerald-300',
                l.type === 'info' && 'text-stone-500',
                l.type === 'win' && 'text-emerald-300 font-bold',
                l.type === 'lose' && 'text-red-400 font-bold',
              )}>{l.text}</div>
            ))}
          </div>
        </Section>

        {/* 药品 + 操作 */}
        {healPills.length > 0 && battle.phase === 'fighting' && (
          <div className="shrink-0 flex gap-1.5 flex-wrap">
            {healPills.map(i => {
              const item = getItem(i.itemId)!;
              const fullHp = battle.playerHp >= battle.player.maxHp;
              return (
                <button key={i.itemId} onClick={() => drinkPill(i.itemId)} disabled={fullHp}
                  className={cn('flex items-center gap-1 bg-emerald-950/80 border border-emerald-800 rounded-lg px-2.5 py-2 text-xs text-emerald-200 min-h-[40px] disabled:opacity-40',
                    !fullHp && 'active:scale-95')}>
                  <Heart className="w-3.5 h-3.5" /> {item.name} ×{i.quantity}
                </button>
              );
            })}
          </div>
        )}

        {battle.phase === 'fighting' ? (
          <div className="shrink-0 grid grid-cols-2 gap-2">
            <ActionButton variant="ghost" onClick={() => {
              const m = MONSTER_MAP[battle.monsterId];
              clearTimer();
              fastBattle(m);
            }}>
              <span className="flex items-center justify-center gap-1"><Zap className="w-4 h-4" /> 快速战斗</span>
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => store.toggleAutoBattle()} className={store.autoBattleEnabled ? '!border-amber-600 !text-amber-400' : ''}>
              {store.autoBattleEnabled ? '自动战斗·开' : '自动战斗·关'}
            </ActionButton>
          </div>
        ) : (
          <BattleResult battle={battle} monster={monster} onAgain={() => fastBattle(monster)} onBack={() => { battleRef.current = null; sync(); }} />
        )}
      </div>
    );
  }

  // ===== 区域/怪物选择视图 =====
  return (
    <div className="p-3 pb-24 space-y-3">
      {/* 区域横滚 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-none">
        {REGIONS.map(r => (
          <button key={r.id} onClick={() => setRegionId(r.id)}
            className={cn(
              'shrink-0 px-3 py-2 rounded-xl text-xs font-medium border min-h-[40px] transition-all',
              regionId === r.id
                ? 'bg-gradient-to-b from-amber-800/80 to-amber-950/70 border-amber-500/60 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.15)]'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
            )}>
            <span className="mr-1" aria-hidden>{r.icon}</span>{r.name}
            <span className="block text-[9px] opacity-70">{r.minTier}阶起</span>
          </button>
        ))}
      </div>

      {store.autoBattleEnabled && (
        <div className="text-[10px] text-amber-400/80 text-center">自动战斗已开启：胜利后自动挑战同一妖兽</div>
      )}

      {/* 当前区域场景横幅 */}
      {regionScene && (
        <div className="relative rounded-xl overflow-hidden border border-stone-800">
          <img src={regionScene.img} alt={regionScene.name} className="w-full h-24 object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-black/40" />
          <div className="absolute inset-0 px-3 py-2 flex flex-col justify-center">
            <div className="text-sm font-bold text-white drop-shadow">
              <span className="mr-1" aria-hidden>{REGIONS.find(r => r.id === regionId)?.icon}</span>{regionScene.name}
            </div>
            <div className="text-[10px] text-stone-300/90 mt-0.5 line-clamp-2 max-w-[85%]">
              {REGIONS.find(r => r.id === regionId)?.description}
            </div>
          </div>
        </div>
      )}

      {/* 世界 BOSS 入口 */}
      <button onClick={() => { store.setMoreView('worldboss'); store.setTab('more'); }}
        className="w-full bg-gradient-to-r from-rose-950/70 via-stone-900 to-stone-900 border border-rose-900/60 rounded-xl p-3 flex items-center gap-3 min-h-[64px] active:scale-[0.99]">
        <span className="text-3xl animate-breathe" aria-hidden>{WORLD_BOSSES[store.worldBoss.bossIdx % WORLD_BOSSES.length].icon}</span>
        <span className="flex-1 text-left">
          <span className="block text-sm font-semibold text-rose-200">世界 BOSS 降临</span>
          <span className="block text-[10px] text-stone-500">剩余血量 {formatNum(store.worldBoss.hp)} · 伤害累积挑战，击杀得仙品装备</span>
        </span>
        <span className="text-xs text-rose-400 shrink-0">前往 ›</span>
      </button>

      {/* 自动战斗开关（选怪界面也可操作） */}
      <button onClick={() => store.toggleAutoBattle()}
        className={cn('w-full rounded-xl border p-3 flex items-center justify-between min-h-[52px] transition',
          store.autoBattleEnabled ? 'bg-amber-950/50 border-amber-700' : 'bg-stone-900/80 border-stone-800')}>
        <span className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>🤖</span>
          <span className="text-left">
            <span className="block text-xs font-semibold text-stone-200">自动战斗</span>
            <span className="block text-[10px] text-stone-500">在线连续挑战 · 离线时也自动挂机战斗</span>
          </span>
        </span>
        <span className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition',
          store.autoBattleEnabled ? 'bg-amber-600' : 'bg-stone-700')}>
          <span className={cn('inline-block h-4.5 w-4.5 h-[18px] w-[18px] transform rounded-full bg-white transition',
            store.autoBattleEnabled ? 'translate-x-[24px]' : 'translate-x-[4px]')} />
        </span>
      </button>
      {activeBuffs.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {activeBuffs.map(b => {
            const meta = BUFF_META[b.key];
            const left = Math.ceil((b.expireAt - nowTs) / 1000);
            const val = b.key === 'luck' ? `气运 +${b.value}`
              : b.key === 'cap' ? `捕获 ×${(b.value / 100).toFixed(1)}`
              : `${meta.name} +${b.value}%`;
            return (
              <span key={b.key} className="inline-flex items-center gap-1 bg-stone-900/90 border border-amber-800/70 rounded-full px-2 py-1 text-[10px] text-amber-200 tabular-nums">
                <span aria-hidden>{meta.icon}</span>{val}
                <span className="text-stone-500">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* 妖兽列表 */}
      <div className="space-y-2">
        {monsters.map(m => {
          const strong = m.tier > currentTier + 6;
          const weak = m.tier < currentTier - 6;
          return (
            <div key={m.id}
              className={cn('border rounded-xl p-3 flex items-center gap-3 transition-colors',
                m.isBoss
                  ? 'bg-gradient-to-r from-rose-950/40 via-stone-900/80 to-stone-900/80 border-rose-800/60'
                  : 'bg-stone-900/80 border-stone-800 hover:bg-stone-900')}>
              <div className={cn('text-3xl shrink-0', m.isBoss && 'animate-breathe')} aria-hidden>{m.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-sm font-semibold truncate', m.isBoss ? 'text-rose-300' : 'text-stone-200')}>{m.name}</span>
                  <span className="text-[10px] text-stone-500">{m.tier}阶</span>
                  {m.isBoss && <span className="text-[9px] px-1 rounded bg-rose-900/70 text-rose-300">妖王</span>}
                  {strong && <span className="text-[9px] px-1 rounded bg-red-950 text-red-400">危险</span>}
                  {weak && <span className="text-[9px] px-1 rounded bg-stone-800 text-stone-500">碾压</span>}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5 tabular-nums">
                  生命 {formatNum(m.hp)} · 攻击 {formatNum(m.atk)} · 经验 {formatNum(m.exp)} · 金币 {formatNum(m.gold)}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => startBattle(m)}
                  className="flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-3 min-h-[40px] text-xs font-semibold active:scale-95">
                  <Play className="w-3.5 h-3.5" /> 战斗
                </button>
                <button onClick={() => fastBattle(m)}
                  className="flex items-center justify-center gap-1 bg-stone-800 border border-stone-700 text-stone-300 rounded-lg px-3 min-h-[36px] text-[11px] active:scale-95">
                  <Zap className="w-3 h-3" /> 快速
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- 子组件 ----

function CombatantCard({ icon, name, hp, maxHp, atk, def, accent, hitEpoch }: {
  icon: string; name: string; hp: number; maxHp: number; atk: number; def: number;
  accent: 'amber' | 'stone' | 'rose'; hitEpoch: number;
}) {
  // 血量动态配色：充足绿 → 过半黄 → 危急红
  const pct = maxHp > 0 ? hp / maxHp : 0;
  const hpBar = pct > 0.5
    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
    : pct > 0.25
      ? 'bg-gradient-to-r from-amber-600 to-amber-400'
      : 'bg-gradient-to-r from-red-700 to-red-500';

  return (
    <div className="relative">
      {/* 受击红闪（key 变化重挂载触发动画） */}
      {hitEpoch > 0 && (
        <div key={`flash-${hitEpoch}`} aria-hidden className="absolute inset-0 rounded-lg pointer-events-none animate-hit-flash" />
      )}
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-200">
          <span key={`icon-${hitEpoch}`} className="text-xl inline-block animate-hit" aria-hidden>{icon}</span>{name}
        </span>
        <span className="text-[10px] text-stone-500 tabular-nums">
          <span className="text-amber-300/80">攻{formatNum(atk)}</span> · <span className="text-stone-300">防{formatNum(def)}</span>
        </span>
      </div>
      <ProgressBar value={hp} max={maxHp} className="h-3.5"
        barClass={hpBar} showText />
    </div>
  );
}

function BattleResult({ battle, monster, onAgain, onBack }: {
  battle: BattleState; monster: MonsterDef; onAgain: () => void; onBack: () => void;
}) {
  const won = battle.phase === 'won';
  const r = battle.rewards;
  return (
    <div className={cn('shrink-0 rounded-xl border p-3 space-y-2',
      won
        ? 'bg-gradient-to-b from-emerald-950/50 to-emerald-950/20 border-emerald-700/80 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
        : 'bg-red-950/40 border-red-900')}>
      <div className={cn('text-sm font-bold text-center', won ? 'text-emerald-300' : 'text-red-300')}>
        {won ? `⚔️ 战胜 ${monster.name}！` : `💀 败于 ${monster.name}`}
      </div>
      {won && r && (
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-300">
            <span>战斗经验（五项技能各得）</span><span className="tabular-nums text-amber-300">+{formatNum(r.exp)}</span>
          </div>
          <div className="flex justify-between text-stone-300">
            <span>金币</span><span className="tabular-nums text-amber-300">+{formatNum(r.gold)}</span>
          </div>
          {r.items.length > 0 && (
            <div className="text-stone-400">
              掉落：{r.items.map(it => {
                const item = getItem(it.itemId);
                return item ? <span key={it.itemId} className={cn('mr-1.5 inline-block', QUALITY_TEXT[item.quality])}>{item.icon}{item.name}×{it.qty}</span> : null;
              })}
            </div>
          )}
          {r.equips.length > 0 && (
            <div className="text-stone-400">
              装备：{r.equips.map(e => (
                <span key={e.uid} className={cn('mr-1.5', QUALITY_TEXT[e.quality])}>{e.icon}{e.name} <QualityBadge quality={e.quality} /></span>
              ))}
            </div>
          )}
          {r.cards.length > 0 && <div className="text-purple-300">🎴 获得怪物卡：{monster.name}</div>}
          {r.petCapture && <div className="text-emerald-300 font-semibold">🥚 灵缘降临！{monster.name} 被你收服，灵宠 +1</div>}
          {r.gems > 0 && <div className="text-cyan-300">💎 获得 {r.gems} 颗宝石</div>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <ActionButton onClick={onAgain}>再战一场</ActionButton>
        <ActionButton variant="ghost" onClick={onBack}>返回选怪</ActionButton>
      </div>
    </div>
  );
}

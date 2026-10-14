// 主页：角色总览 / 当前修行 / 属性面板 / 生涯统计
'use client';

import { useGameStore } from '@/store/game';
import { computePlayerStats, computeOfflineEfficiency, statePetMult } from '@/lib/game/engine';
import { getTitle, combatLevelSum, totalSkillLevel, ACTIVITY_MAP, offlineCapSeconds } from '@/lib/game/skills';
import { petBonus, petStats, petXpToNext, MAX_PET_LEVEL, petDisplayName } from '@/lib/game/pets';
import { MONSTER_MAP } from '@/lib/game/monsters';
import { realmAvatar } from '@/lib/game/realms';
import { SECT_MAP } from '@/lib/game/sects';
import { rebirthPrefix } from '@/lib/game/rebirth';
import { activeTitleName } from '@/lib/game/titles';
import { QUESTS, QUEST_GEMS, QUEST_CHEST, questGold, isQuestsComplete } from '@/lib/game/quests';
import { spiritArrayCost, SPIRIT_BONUS_PER_LEVEL } from '@/lib/game/spirit';
import { Section, ProgressBar, StatPill, ActionButton, formatNum, formatDuration } from './ui-bits';
import { getItem, QUALITY_TEXT } from '@/lib/game/items';
import { refineMainMult } from '@/lib/game/refine';
import { ACTIVITY_SCENE, HOME_SCENE } from '@/lib/game/scenes';
import { cn } from '@/lib/utils';

export function HomePanel() {
  const state = useGameStore();
  const stats = computePlayerStats(state);
  const cSum = combatLevelSum(state.skills);
  const tSum = totalSkillLevel(state.skills);
  const title = getTitle(cSum);
  const act = state.activeActivity ? ACTIVITY_MAP[state.activeActivity] : null;
  const eff = computeOfflineEfficiency(state);
  const cap = offlineCapSeconds(state.skills.focus.level);
  const avatar = realmAvatar(cSum);
  const sect = state.sect ? SECT_MAP[state.sect.sectId] : null;
  const wornTitle = activeTitleName(state);
  const ownedCount = (state.titles ?? []).length;

  const equips = [state.equipped.weapon, state.equipped.armor, state.equipped.accessory];

  return (
    <div className="space-y-3 p-3 pb-24">
      {/* 角色卡 */}
      <Section className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 relative overflow-hidden">
        {/* 顶部金晕装饰 */}
        <div aria-hidden className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-600/8 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 relative">
          {/* 境界换装头像（随战斗总等级更换服饰） */}
          <div className="w-16 h-16 shrink-0 rounded-full border border-amber-600/50 bg-gradient-to-br from-stone-800 to-amber-950/70 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.15),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            <img src={avatar.img} alt={`小修士${avatar.name}形象`}
              className="w-full h-full object-cover object-top scale-[1.35] translate-y-[6%]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-lg font-bold text-amber-100 truncate">{state.playerName}</span>
              {(state.rebirth?.count ?? 0) > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-900/80 text-violet-200 border border-violet-700/50 whitespace-nowrap">
                  {rebirthPrefix(state.rebirth.count).replace('·', '转')}
                </span>
              )}
            </div>
            <div className="text-xs text-stone-400 mt-0.5">
              境界 <span className="text-amber-300">{title}</span> · 战斗 {cSum} · 技能 {tSum}
            </div>
            {/* 限定称号（点击切换佩戴） */}
            <button onClick={() => state.cycleTitle()} disabled={ownedCount === 0}
              className={cn('mt-1 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border min-h-[22px] transition-colors',
                wornTitle
                  ? 'bg-gradient-to-r from-amber-900/80 to-amber-800/50 text-amber-200 border-amber-600/50'
                  : 'bg-stone-800/60 text-stone-500 border-stone-700/50')}>
              <span aria-hidden>🎖️</span>
              {wornTitle ?? (ownedCount > 0 ? `切换称号（${ownedCount} 枚）` : '暂无限定称号')}
            </button>
          </div>
          <div className="text-right text-[10px] text-stone-500 shrink-0 tabular-nums">
            <div>修行 {formatDuration((Date.now() - state.stats.playStart) / 1000)}</div>
            <div className="mt-0.5">击杀 {formatNum(state.stats.totalKills)} · 胜率 {state.stats.totalBattles > 0 ? Math.round(state.stats.totalWins / state.stats.totalBattles * 100) : 0}%</div>
          </div>
        </div>

        {/* 宗门 / 服饰信息条 */}
        <div className="flex items-center gap-1.5 mt-2.5 text-[10px] relative">
          {sect ? (
            <button onClick={() => { state.setMoreView('sect'); state.setTab('more'); }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/60 border border-stone-700/50 text-stone-300 min-h-[26px]">
              <span aria-hidden>{sect.icon}</span>{sect.name}
            </button>
          ) : (
            <button onClick={() => { state.setMoreView('sect'); state.setTab('more'); }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/60 border border-dashed border-stone-700/50 text-stone-500 min-h-[26px]">
              🏯 未拜入宗门 · 前往
            </button>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/40 border border-stone-800 text-stone-400 min-h-[26px]">
            👘 {avatar.name}
          </span>
        </div>

        {/* 属性面板 */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 relative">
          <StatPill icon="❤️" value={formatNum(stats.maxHp)} label="生命" />
          <StatPill icon="⚔️" value={formatNum(stats.atk)} label="攻击" />
          <StatPill icon="🛡️" value={formatNum(stats.def)} label="防御" />
          <StatPill icon="💨" value={stats.speed} label="速度" />
          <StatPill icon="🔥" value={`${(stats.critRate * 100).toFixed(1)}%`} label="暴击" />
          <StatPill icon="🌪️" value={`${(stats.dodgeRate * 100).toFixed(1)}%`} label="闪避" />
        </div>

        {/* 装备摘要 */}
        <div className="flex gap-1.5 mt-2 relative">
          {equips.map((e, i) => (
            <div key={i} className={cn('flex-1 rounded-lg px-2 py-1.5 text-center min-h-[44px] flex flex-col justify-center',
              e ? 'bg-stone-800/60 border border-stone-700/50' : 'bg-stone-900/40 border border-dashed border-stone-800')}>
              {e ? (
                <>
                  <div className={`text-[11px] font-medium ${QUALITY_TEXT[e.quality]}`}>{e.icon} {e.name}</div>
                  <div className="text-[9px] text-stone-500">{e.mainStat.key === 'atk' ? `攻+${Math.round(e.mainStat.value * refineMainMult(e))}` : e.mainStat.key === 'def' ? `防+${Math.round(e.mainStat.value * refineMainMult(e))}` : `血+${Math.round(e.mainStat.value * refineMainMult(e))}`}</div>
                </>
              ) : (
                <div className="text-[10px] text-stone-600">{['武器', '护甲', '饰品'][i]}·空</div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* 今日修行（每日任务 + 全勤宝箱；离线挂机同样计数） */}
      <DailyQuestsSection />

      {/* 出战灵宠 */}
      {(() => {
        const pets = state.pets ?? [];
        const pet = pets.find(p => p.uid === state.activePetUid) ?? null;
        if (pets.length === 0) return null;
        if (!pet) {
          return (
            <Section>
              <button onClick={() => { state.setMoreView('pets'); state.setTab('more'); }}
                className="w-full flex items-center justify-between min-h-[44px]">
                <span className="text-xs text-stone-400">🐾 灵宠休息中（已有 {pets.length} 只）</span>
                <span className="text-xs text-amber-400">前往灵宠舍 ›</span>
              </button>
            </Section>
          );
        }
        const m = MONSTER_MAP[pet.monsterId];
        const ps = petStats(pet);
        const petMult = statePetMult(state);
        const bonusRaw = petBonus(pet);
        const bonus = {
          atk: Math.round(bonusRaw.atk * petMult),
          def: Math.round(bonusRaw.def * petMult),
          hp: Math.round(bonusRaw.hp * petMult),
        };
        const xpNeed = petXpToNext(pet.level);
        return (
          <Section className="bg-gradient-to-br from-emerald-950/40 via-stone-900 to-stone-900 border-emerald-900/50">
            <button onClick={() => { state.setMoreView('pets'); state.setTab('more'); }} className="w-full text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 shrink-0 rounded-full border border-emerald-700/50 bg-emerald-950/40 flex items-center justify-center">
                  <span className="text-2xl animate-float" aria-hidden>{m.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-emerald-300">{petDisplayName(pet)} <span className="text-[10px] text-stone-500">Lv.{pet.level} · 出战中</span></div>
                  <div className="text-[10px] text-stone-500 tabular-nums">
                    攻 {formatNum(ps.atk)} · 防 {formatNum(ps.def)} · 加成 攻+{formatNum(bonus.atk)} 防+{formatNum(bonus.def)} 血+{formatNum(bonus.hp)}
                  </div>
                </div>
                <span className="text-[10px] text-amber-400 shrink-0">灵宠舍 ›</span>
              </div>
              {pet.level < MAX_PET_LEVEL && (
                <ProgressBar value={pet.xp} max={xpNeed} className="mt-2 h-1.5" barClass="bg-gradient-to-r from-emerald-600 to-emerald-400" />
              )}
            </button>
          </Section>
        );
      })()}

      {/* 当前修行（旅行青蛙式场景卡：小修士此刻在做什么） */}
      <Section title="此刻行踪" extra={
        act ? <ActionButton variant="ghost" className="!min-h-[36px] !px-3 text-xs" onClick={() => state.stopActivity()}>停止</ActionButton> : undefined
      }>
        {act ? (
          <div>
            <div className="relative rounded-xl overflow-hidden border border-stone-800">
              <img src={ACTIVITY_SCENE[act.id]?.img ?? HOME_SCENE.img} alt={act.name} className="w-full h-32 object-cover" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 px-3 py-2">
                <div className="text-sm font-bold text-white drop-shadow">小修士正在「{act.name}」</div>
                <div className="text-[10px] text-stone-300/90 mt-0.5">{ACTIVITY_SCENE[act.id]?.caption}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 mt-2.5">
              <div className="w-9 h-9 shrink-0 rounded-full border border-emerald-700/40 bg-emerald-950/30 flex items-center justify-center">
                <span className="text-xl animate-float" aria-hidden>{act.icon}</span>
              </div>
              <div className="flex-1">
                <ProgressBar value={state.activityProgress} max={1} className="h-2.5" barClass="bg-gradient-to-r from-emerald-600 to-emerald-400" showText />
                <div className="text-[10px] text-stone-500 mt-1">每轮 {act.intervalSec} 秒 · +{act.skillXp} 经验{act.reward.gold ? ` · +${Math.round((act.reward.gold ?? 0) * (1 + state.skills.begging.level * 0.06))} 金币` : ''}</div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="relative rounded-xl overflow-hidden border border-stone-800">
              <img src={HOME_SCENE.img} alt={HOME_SCENE.name} className="w-full h-32 object-cover" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 px-3 py-2">
                <div className="text-sm font-bold text-white drop-shadow">小修士在「{HOME_SCENE.name}」歇息</div>
                <div className="text-[10px] text-stone-300/90 mt-0.5">{HOME_SCENE.caption}</div>
              </div>
            </div>
            <div className="text-center mt-2.5">
              <ActionButton className="!min-h-[40px]" onClick={() => state.setTab('skills')}>出发修行</ActionButton>
            </div>
          </div>
        )}
        <div className="text-[10px] text-stone-500 mt-2 flex justify-between">
          <span>离线效率 {(eff * 100).toFixed(0)}%（定力 +{(eff * 100 - 60).toFixed(0)}%）</span>
          <span>离线上限 {formatDuration(cap)}</span>
        </div>
      </Section>

      {/* 洞府聚灵阵（金币升级，全局收益加成；转生保留） */}
      <Section title="洞府">
        {(() => {
          const lv = Math.max(0, Math.floor(state.spiritArray ?? 0));
          const cost = spiritArrayCost(lv);
          const affordable = state.gold >= cost;
          return (
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 shrink-0 rounded-lg border border-violet-800/50 bg-violet-950/40 flex items-center justify-center text-2xl" aria-hidden>🔮</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-violet-200">聚灵阵 <span className="text-[10px] text-stone-500">Lv.{lv}</span></div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    全局技能经验与金币收益 +{lv}%（战斗 · 挂机 · 离线同享）
                    {lv > 0 && <span className="text-violet-400"> · 每级 +{Math.round(SPIRIT_BONUS_PER_LEVEL * 100)}%</span>}
                  </div>
                </div>
              </div>
              <ActionButton className="w-full mt-2.5" disabled={!affordable} onClick={() => state.upgradeSpiritArray()}>
                {affordable ? `注灵升级至 Lv.${lv + 1}（🪙 ${formatNum(cost)}）` : `金币不足（需 🪙 ${formatNum(cost)}）`}
              </ActionButton>
              <div className="text-[10px] text-stone-600 text-center mt-1.5">洞府建筑不随转生损毁，费用随等级递增</div>
            </div>
          );
        })()}
      </Section>

      {/* 生涯统计 */}
      <Section title="生涯统计">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-stone-300">
          <div className="flex justify-between"><span className="text-stone-500">总战斗</span><span className="tabular-nums">{formatNum(state.stats.totalBattles)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">总获胜</span><span className="tabular-nums">{formatNum(state.stats.totalWins)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">击杀妖兽</span><span className="tabular-nums">{formatNum(state.stats.totalKills)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">斩杀妖王</span><span className="tabular-nums">{formatNum(state.stats.bossKills)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">累计金币</span><span className="tabular-nums">{formatNum(state.stats.totalGoldEarned)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">累计经验</span><span className="tabular-nums">{formatNum(state.stats.totalExpEarned)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">掉落物品</span><span className="tabular-nums">{formatNum(state.stats.totalDrops)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">离线次数</span><span className="tabular-nums">{formatNum(state.stats.offlineSessions)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">灵宠收服</span><span className="tabular-nums">{formatNum(state.stats.petsCaptured ?? 0)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">世界 BOSS 击杀</span><span className="tabular-nums">{formatNum(state.stats.wbKills ?? 0)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">锁妖塔首通</span><span className="tabular-nums">{formatNum(Math.max(0, state.tower?.bestFloor ?? 0))} 层</span></div>
          <div className="flex justify-between"><span className="text-stone-500">每日任务完成</span><span className="tabular-nums">{formatNum(state.stats.questsDone ?? 0)} 次</span></div>
        </div>
      </Section>

      {/* 游戏说明 */}
      <Section title="修行指南">
        <ul className="text-[11px] text-stone-400 space-y-1 leading-relaxed">
          <li>· 战斗系技能（气血/神力/神兵/御体/遁速）通过战斗提升，每胜一场五项齐涨。</li>
          <li>· 生活技能在「技能」页选择活动修炼，离线也会继续修行。</li>
          <li>· 技能每升 1 级送 1 颗宝石，成就与寻宝也能获得宝石。</li>
          <li>· 装备词条完全随机，气运越高掉落越稀有。</li>
          <li>· 锁妖塔逐层首通有赏，每日修行任务全勤开宝箱，聚灵阵用金币升级全局收益。</li>
        </ul>
      </Section>
    </div>
  );
}

// ---- 今日修行（每日任务列表 + 全勤宝箱） ----
function DailyQuestsSection() {
  const state = useGameStore();
  const quests = state.quests;
  const gold = questGold(state);
  const doneCount = QUESTS.filter(q => (quests.counters[q.counter] ?? 0) >= q.target(state)).length;
  const complete = isQuestsComplete(quests, state);
  const chestItem = getItem(QUEST_CHEST.itemId);

  return (
    <Section title="今日修行" extra={
      <span className="text-[10px] text-stone-500 tabular-nums">{doneCount}/{QUESTS.length} · 单项 🪙{formatNum(gold)} +{QUEST_GEMS}💎</span>
    }>
      <div className="space-y-2">
        {QUESTS.map(q => {
          const target = q.target(state);
          const cur = Math.min(target, quests.counters[q.counter] ?? 0);
          const claimed = quests.claimed.includes(q.id);
          const ready = !claimed && cur >= target;
          return (
            <div key={q.id} className="flex items-center gap-2.5 bg-stone-800/40 border border-stone-800 rounded-lg px-2.5 py-2">
              <span className="text-xl shrink-0" aria-hidden>{q.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-stone-200">{q.name}</span>
                  <span className="text-[10px] text-stone-500 tabular-nums shrink-0">{cur}/{target}</span>
                </div>
                <ProgressBar value={cur} max={target} className="h-1.5 mt-1"
                  barClass={claimed ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : undefined} />
                <div className="text-[9px] text-stone-600 mt-0.5">{q.targetText(target)}{claimed ? ' · 已完成' : ''}</div>
              </div>
              {claimed ? (
                <span className="text-[10px] text-emerald-400 shrink-0 px-1">✓ 已领</span>
              ) : ready ? (
                <ActionButton className="!min-h-[36px] !px-3 text-xs shrink-0" onClick={() => state.claimQuest(q.id)}>领取</ActionButton>
              ) : null}
            </div>
          );
        })}

        {/* 全勤宝箱 */}
        <div className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2 border',
          quests.chestClaimed
            ? 'border-emerald-900/60 bg-emerald-950/20'
            : complete
              ? 'border-amber-700/60 bg-amber-950/30'
              : 'border-stone-800 bg-stone-900/40')}>
          <span className="text-xl shrink-0" aria-hidden>🎁</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-stone-200">全勤宝箱</div>
            <div className="text-[9px] text-stone-500">五项任务全部完成：{chestItem?.icon}{chestItem?.name ?? QUEST_CHEST.itemId} ×{QUEST_CHEST.qty} + {QUEST_CHEST.gems}💎</div>
          </div>
          {quests.chestClaimed ? (
            <span className="text-[10px] text-emerald-400 shrink-0 px-1">✓ 已领</span>
          ) : complete ? (
            <ActionButton className="!min-h-[36px] !px-3 text-xs shrink-0" onClick={() => state.claimQuestChest()}>领取</ActionButton>
          ) : (
            <span className="text-[10px] text-stone-600 shrink-0 px-1">{doneCount}/{QUESTS.length}</span>
          )}
        </div>
      </div>
    </Section>
  );
}

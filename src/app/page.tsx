// 《仙途挂机》主页面 — Harpagia 式修仙放置 RPG
'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useGameStore } from '@/store/game';
import { useGameTick } from '@/hooks/useGameTick';
import { TopBar } from '@/components/game/TopBar';
import { BottomNav } from '@/components/game/BottomNav';
import { HomePanel } from '@/components/game/HomePanel';
import { CombatPanel } from '@/components/game/CombatPanel';
import { SkillsPanel } from '@/components/game/SkillsPanel';
import { InventoryPanel } from '@/components/game/InventoryPanel';
import { MorePanel } from '@/components/game/MorePanel';
import { OfflineModal } from '@/components/game/OfflineModal';
import { EventModal } from '@/components/game/EventModal';
import { StartScreen } from '@/components/game/StartScreen';

// 客户端挂载检测（避免 SSR 水合不一致，且不触发 effect 内 setState）
const emptySubscribe = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function Splash() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-stone-950 relative overflow-hidden">
      <div className="xiantu-bg" aria-hidden />
      <div className="text-center relative z-10">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full border border-amber-700/40 bg-gradient-to-br from-stone-900 to-amber-950/60 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-float">
          <span className="text-4xl" aria-hidden>⛰️</span>
        </div>
        <div className="font-xianzi text-base text-gold-grad tracking-[0.6em] pl-[0.6em]">仙途</div>
      </div>
    </div>
  );
}

function Toast() {
  const toast = useGameStore(s => s.toast);
  const toastSeq = useGameStore(s => s.toastSeq);
  const clearToast = useGameStore(s => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => clearToast(), 2600);
    return () => clearTimeout(timer);
  }, [toast, toastSeq, clearToast]);

  if (!toast) return null;
  return (
    <div className="fixed top-14 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none" aria-live="polite">
      <div className="bg-stone-900/95 backdrop-blur border border-amber-700/40 text-amber-100 text-xs rounded-full px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_18px_rgba(245,158,11,0.12)] max-w-[90%] text-center animate-in fade-in slide-in-from-top-2 duration-300">
        {toast}
      </div>
    </div>
  );
}

function GameShell() {
  const tab = useGameStore(s => s.tab);
  useGameTick();

  // 切换页签时回到顶部，避免长页面残留滚动位置
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  return (
    <div className="min-h-dvh bg-stone-950 relative">
      <div className="xiantu-bg" aria-hidden />
      <div className="relative z-10">
        <TopBar />
        <Toast />
        <main className="max-w-md mx-auto">
          <div key={tab} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            {tab === 'home' && <HomePanel />}
            {tab === 'combat' && <CombatPanel />}
            {tab === 'skills' && <SkillsPanel />}
            {tab === 'inventory' && <InventoryPanel />}
            {tab === 'more' && <MorePanel />}
          </div>
        </main>
        <BottomNav />
      </div>
      <OfflineModal />
      <EventModal />
    </div>
  );
}

export default function Page() {
  const mounted = useMounted();
  const hydrated = useGameStore(s => s.hydrated);
  const initialized = useGameStore(s => s.initialized);

  if (!mounted || !hydrated) return <Splash />;
  if (!initialized) return <StartScreen />;
  return <GameShell />;
}

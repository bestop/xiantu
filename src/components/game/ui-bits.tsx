// 共享 UI 小元件
'use client';

import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { QUALITY_COLORS, QUALITY_NAMES, QUALITY_TEXT } from '@/lib/game/items';
import { ItemQuality } from '@/types/game';
import { cn } from '@/lib/utils';

// ---------- 装备品质视觉（首页/背包共享，神品辉光口径统一） ----------
// 品质发光（卡片/槽位辉光）
export const QUALITY_GLOW: Record<ItemQuality, string> = {
  common: 'shadow-[0_0_10px_rgba(120,113,108,0.15)]',
  fine: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  rare: 'shadow-[0_0_10px_rgba(34,211,238,0.2)]',
  epic: 'shadow-[0_0_10px_rgba(168,85,247,0.25)]',
  legendary: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
  mythic: 'shadow-[0_0_14px_rgba(244,63,94,0.35)]',
};

// 品质卡片外框（图形化卡片描边）
export const QUALITY_BORDER: Record<ItemQuality, string> = {
  common: 'border-stone-700/90',
  fine: 'border-emerald-800',
  rare: 'border-cyan-800',
  epic: 'border-purple-800',
  legendary: 'border-amber-600/80',
  mythic: 'border-rose-600/80',
};

// 品质图标砖：渐变底 + 彩边（图块化视觉核心）
export const QUALITY_TILE: Record<ItemQuality, string> = {
  common: 'from-stone-600/40 via-stone-800/70 to-stone-900 border-stone-600/70',
  fine: 'from-emerald-900/70 via-emerald-950/70 to-stone-900 border-emerald-700/70',
  rare: 'from-cyan-900/70 via-cyan-950/70 to-stone-900 border-cyan-600/70',
  epic: 'from-purple-900/70 via-purple-950/70 to-stone-900 border-purple-600/70',
  legendary: 'from-amber-800/70 via-amber-950/70 to-stone-900 border-amber-500/80',
  mythic: 'from-rose-800/70 via-rose-950/70 to-stone-900 border-rose-500/80',
};

// 区块卡片（标题带金色装饰竖条）
export function Section({ title, extra, children, className }: {
  title?: string; extra?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn(
      'bg-stone-900/80 border border-stone-800/80 rounded-xl p-3',
      'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]',
      className
    )}>
      {title && (
        <header className="flex items-center justify-between mb-2.5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-amber-200/90">
            <span className="inline-block w-[3px] h-3.5 rounded-full bg-gradient-to-b from-amber-400 to-amber-700" aria-hidden />
            {title}
          </h3>
          {extra}
        </header>
      )}
      {children}
    </section>
  );
}

// 进度条（带流光扫过效果；text 可覆盖默认 "当前/上限" 文案）
export function ProgressBar({ value, max, className, barClass, showText, text, shimmer = true }: {
  value: number; max: number; className?: string; barClass?: string; showText?: boolean; text?: string; shimmer?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn(
      'relative h-2 w-full bg-stone-800 rounded-full overflow-hidden',
      'shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]',
      className
    )}>
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300 ease-out',
          shimmer && 'progress-shimmer',
          barClass || 'bg-gradient-to-r from-amber-600 to-amber-400'
        )}
        style={{ width: `${pct}%` }}
      />
      {(showText || text != null) && (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white/90 font-medium tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          {text ?? `${Math.floor(value)}/${Math.floor(max)}`}
        </span>
      )}
    </div>
  );
}

// 品质徽标
export function QualityBadge({ quality }: { quality: ItemQuality }) {
  return (
    <span className={cn('text-[10px] px-1 py-0.5 rounded border bg-stone-950/60', QUALITY_COLORS[quality])}>
      {QUALITY_NAMES[quality]}
    </span>
  );
}

export function QualityText({ quality, children }: { quality: ItemQuality; children: ReactNode }) {
  return <span className={QUALITY_TEXT[quality]}>{children}</span>;
}

// 数值 pill
export function StatPill({ icon, value, label, onClick }: {
  icon: string; value: string | number; label?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 bg-stone-800/70 border border-stone-700/50 rounded-lg px-2 py-1 text-xs text-stone-200 min-h-[32px] transition-colors active:bg-stone-700/70"
    >
      <span aria-hidden>{icon}</span>
      <span className="tabular-nums font-medium">{value}</span>
      {label && <span className="text-stone-400 text-[10px]">{label}</span>}
    </button>
  );
}

// 主操作按钮（金色渐变 + 内高光）
export function ActionButton({ children, onClick, disabled, variant = 'primary', className }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger'; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-h-[44px] px-4 rounded-xl text-sm font-semibold transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 select-none',
        variant === 'primary' && [
          'text-amber-50 border border-amber-500/60',
          'bg-gradient-to-b from-amber-500 to-amber-700',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_4px_10px_-2px_rgba(69,26,3,0.7)]',
          'hover:from-amber-400 hover:to-amber-600',
        ],
        variant === 'ghost' && 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700',
        variant === 'danger' && 'bg-gradient-to-b from-red-800 to-red-950 hover:from-red-700 hover:to-red-900 text-red-100 border border-red-700/60',
        className
      )}
    >
      {children}
    </button>
  );
}

// 通用子页头（金色书法字标题 + 返回键）
export function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-1 pb-1">
      <button onClick={onBack} className="text-stone-400 min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1 rounded-lg hover:bg-stone-900" aria-label="返回">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="font-xianzi text-base font-bold text-gold-grad tracking-widest">{title}</h2>
    </div>
  );
}

// 时间格式化
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} 小时 ${m} 分`;
}

export function formatNum(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}兆`;
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
}

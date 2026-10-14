// ============================================
// 洞府聚灵阵：金币升级的挂机收益建筑
// 参考同类放置游戏「洞府/建筑升级」长线养成：
//   - 每级使技能经验与金币收益 +1%（全局乘区，战斗/活动/离线同源）
//   - 升级费用指数增长（1.42^级），是金币的长期消耗口
//   - 转生保留（洞府建筑不随轮回损毁）
// ============================================

// 每级全局收益加成（+1%/级）
export const SPIRIT_BONUS_PER_LEVEL = 0.01;

// 软上限提示（超过后费用高昂，仅作 UI 文案，不强制封顶）
export const SPIRIT_SOFT_CAP = 50;

// 聚灵阵全局乘区（负数/NaN 档由调用方钳 0）
export function spiritArrayMult(level: number): number {
  return 1 + Math.max(0, level) * SPIRIT_BONUS_PER_LEVEL;
}

// 升级到 level+1 级的金币费用（level 为当前等级）
// 400 × 1.42^level：1 级 400，10 级约 1.2 万，30 级约 460 万，50 级约 20 亿
export function spiritArrayCost(level: number): number {
  return Math.round(400 * Math.pow(1.42, Math.max(0, level)));
}

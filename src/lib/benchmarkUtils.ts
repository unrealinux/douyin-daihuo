/**
 * 对标视频热度与排序。SOP 强调「转发权重 > 点赞」，评论能拉动流量，
 * 因此热度按加权计算：播放 + 点赞×10 + 收藏×10 + 转发×20 + 评论×15。
 */

export interface BenchmarkHeatInput {
  views?: number | null;
  likes?: number | null;
  favorites?: number | null;
  shares?: number | null;
  comments?: number | null;
}

export function heatScore(item: BenchmarkHeatInput): number {
  const num = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return (
    num(item.views) +
    num(item.likes) * 10 +
    num(item.favorites) * 10 +
    num(item.shares) * 20 +
    num(item.comments) * 15
  );
}

export type BenchmarkSort = "recent" | "hot";

/** 复制排序，不修改入参。recent 按创建时间倒序，hot 按热度倒序。 */
export function sortBenchmarks<T extends BenchmarkHeatInput & { createdAt: Date }>(
  items: T[],
  order: BenchmarkSort = "recent"
): T[] {
  const copy = [...items];
  if (order === "hot") {
    return copy.sort((a, b) => heatScore(b) - heatScore(a));
  }
  return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

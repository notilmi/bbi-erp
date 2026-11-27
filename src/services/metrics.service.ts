import type { MTOOrder } from '../types/mto.types.ts';

export interface DashboardMetrics {
  onTimeRatePct: number;
  activeOrdersCount: number;
  openNcrCount: number;
  avgMaterialReadinessPct: number;
  costVariancePct: number;
}

export function computeDashboardMetrics(orders: readonly MTOOrder[]): DashboardMetrics {
  if (orders.length === 0) {
    return {
      onTimeRatePct: 100,
      activeOrdersCount: 0,
      openNcrCount: 0,
      avgMaterialReadinessPct: 0,
      costVariancePct: 0,
    };
  }

  const onTimeCount = orders.filter(
    (o) =>
      o.delayMonths === 0 &&
      o.procurement.state !== 'Delayed' &&
      o.quality.state !== 'Delayed',
  ).length;

  const activeOrdersCount = orders.filter((o) => o.stage !== 'Delivered').length;

  const openNcrCount = orders.reduce(
    (sum, o) => sum + o.ncrs.filter((n) => n.status === 'Open').length,
    0,
  );

  const avgMaterialReadinessPct = Math.round(
    orders.reduce((sum, o) => sum + o.procurement.materialReadinessPct, 0) / orders.length,
  );

  const totalEst = orders.reduce((sum, o) => sum + o.cost.estimatedCostIdr, 0);
  const totalActual = orders.reduce((sum, o) => sum + o.cost.actualCostIdr, 0);
  const costVariancePct =
    totalEst > 0 ? Number((((totalActual - totalEst) / totalEst) * 100).toFixed(1)) : 0;

  return {
    onTimeRatePct: Math.round((onTimeCount / orders.length) * 100),
    activeOrdersCount,
    openNcrCount,
    avgMaterialReadinessPct,
    costVariancePct,
  };
}

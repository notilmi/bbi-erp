import type { DashboardMetrics } from '../services/metrics.service.ts';

export function renderKpiCards(container: HTMLElement, metrics: DashboardMetrics): void {
  const varianceSign = metrics.costVariancePct > 0 ? '+' : '';
  const varianceClass = metrics.costVariancePct > 5 ? 'is-error' : 'is-success';
  const ncrClass = metrics.openNcrCount > 0 ? 'is-error' : 'is-success';

  container.innerHTML = `
    <section class="kpi-grid" aria-label="Executive KPIs">
      <article class="card-stat">
        <span class="card-stat-label">On-Time Schedule</span>
        <span class="card-stat-value ${metrics.onTimeRatePct >= 75 ? 'is-success' : 'is-error'}">
          ${metrics.onTimeRatePct}%
        </span>
        <span class="card-stat-foot">Target: eliminate 3&ndash;7 mo delays</span>
      </article>

      <article class="card-stat">
        <span class="card-stat-label">Active MTO Orders</span>
        <span class="card-stat-value">${metrics.activeOrdersCount}</span>
        <span class="card-stat-foot">Avg material readiness: ${metrics.avgMaterialReadinessPct}%</span>
      </article>

      <article class="card-stat">
        <span class="card-stat-label">Open Quality NCRs</span>
        <span class="card-stat-value ${ncrClass}">${metrics.openNcrCount}</span>
        <span class="card-stat-foot">Real-time CAPA feedback active</span>
      </article>

      <article class="card-stat">
        <span class="card-stat-label">Cost Variance</span>
        <span class="card-stat-value ${varianceClass}">${varianceSign}${metrics.costVariancePct}%</span>
        <span class="card-stat-foot">Actual vs. estimated MTO budget</span>
      </article>
    </section>
  `;
}

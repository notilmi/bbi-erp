import type { RoleKpiCard } from '../services/metrics.service.ts';
import { escapeHtml } from '../utils/dom.util.ts';

export function renderKpiCards(container: HTMLElement, cards: readonly RoleKpiCard[]): void {
  const cardsHtml = cards
    .map((card) => {
      const toneClass =
        card.tone === 'error' ? 'is-error' : card.tone === 'success' ? 'is-success' : '';
      return `
        <article class="card-stat">
          <span class="card-stat-label">${escapeHtml(card.label)}</span>
          <span class="card-stat-value ${toneClass}">${escapeHtml(card.value)}</span>
          <span class="card-stat-foot">${escapeHtml(card.foot)}</span>
        </article>
      `;
    })
    .join('');

  container.innerHTML = `
    <section class="kpi-grid" aria-label="KPI Peran Departemen">
      ${cardsHtml}
    </section>
  `;
}

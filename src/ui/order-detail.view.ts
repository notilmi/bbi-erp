import type { MTOOrder, OrderStage, SubsystemState } from '../types/mto.types.ts';
import { escapeHtml, qs } from '../utils/dom.util.ts';
import { formatIdr, formatShortDate, getStateBadgeClass } from '../utils/format.util.ts';

const ORDER_STAGES: readonly OrderStage[] = [
  'Proposal',
  'Design & Engineering',
  'In Production',
  'QC & Dispatch',
  'Delivered',
];

const SUBSYSTEM_STATES: readonly SubsystemState[] = [
  'Pending',
  'In Progress',
  'Delayed',
  'Completed',
];

export function renderOrderDetail(
  container: HTMLElement,
  order: MTOOrder | undefined,
  callbacks: {
    onStageChange: (orderId: string, stage: OrderStage) => void;
    onProcurementUpdate: (orderId: string, state: SubsystemState, pct: number) => void;
    onOperationsUpdate: (orderId: string, state: SubsystemState, pct: number) => void;
    onCostUpdate: (orderId: string, actualIdr: number, reworkIdr: number) => void;
    onBumpDocRevision: (orderId: string, docId: string) => void;
    onAddNcr: (orderId: string, description: string, capaAction: string) => void;
    onResolveNcr: (orderId: string, ncrId: string) => void;
  },
): void {
  if (!order) {
    container.innerHTML = `
      <div class="panel-card">
        <p style="color: var(--color-ink-mute);">Select an MTO order from the list to inspect its 4 parallel subsystems.</p>
      </div>
    `;
    return;
  }

  const stageOptions = ORDER_STAGES.map(
    (s) => `<option value="${escapeHtml(s)}" ${order.stage === s ? 'selected' : ''}>${escapeHtml(s)}</option>`,
  ).join('');

  const buildStateOptions = (selected: SubsystemState): string =>
    SUBSYSTEM_STATES.map(
      (st) => `<option value="${escapeHtml(st)}" ${selected === st ? 'selected' : ''}>${escapeHtml(st)}</option>`,
    ).join('');

  const docsHtml = order.documents
    .map(
      (doc) => `
      <div class="doc-item">
        <div>
          <div><strong>${escapeHtml(doc.docCode)}</strong> &mdash; ${escapeHtml(doc.title)}</div>
          <div class="navbar-subtitle">
            ${escapeHtml(doc.revision)} &bull; Updated by ${escapeHtml(doc.updatedByRole)} (${formatShortDate(doc.updatedAt)})
          </div>
        </div>
        <button type="button" class="btn-pill btn-secondary-pill btn-compact" data-bump-doc="${escapeHtml(doc.id)}">
          Bump Rev
        </button>
      </div>
    `,
    )
    .join('');

  const ncrsHtml =
    order.ncrs.length > 0
      ? order.ncrs
          .map(
            (ncr) => `
          <div class="ncr-item">
            <div>
              <div>
                <span class="badge ${ncr.status === 'Open' ? 'badge-error' : 'badge-success'}">${escapeHtml(ncr.status)}</span>
                <strong>${escapeHtml(ncr.description)}</strong>
              </div>
              <div class="navbar-subtitle">CAPA: ${escapeHtml(ncr.capaAction)}</div>
            </div>
            ${
              ncr.status === 'Open'
                ? `<button type="button" class="btn-pill btn-outline-aubergine btn-compact" data-resolve-ncr="${escapeHtml(ncr.id)}">Resolve</button>`
                : ''
            }
          </div>
        `,
          )
          .join('')
      : `<div class="navbar-subtitle">No non-conformance reports logged for this order.</div>`;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap: var(--space-lg);">
      <section class="detail-aubergine-band">
        <div>
          <span class="pill-cap-shade">${escapeHtml(order.orderNo)} &bull; ${escapeHtml(order.productCategory)}</span>
          <h2 class="detail-order-title">${escapeHtml(order.projectTitle)}</h2>
          <p class="detail-meta">
            Client: ${escapeHtml(order.customerName)} &bull; Target Delivery: ${formatShortDate(order.targetDeliveryDate)}
          </p>
        </div>
        <div class="field-group" style="min-width: 190px;">
          <label class="field-label" for="detail-stage" style="color: var(--color-on-aubergine-mute);">Order Stage</label>
          <select id="detail-stage" class="select-input">${stageOptions}</select>
        </div>
      </section>

      <section class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">4 Parallel Subsystems (Centralized DB)</h3>
          <span class="navbar-subtitle">Updated ${formatShortDate(order.updatedAt)}</span>
        </div>

        <div class="subsystem-grid">
          <!-- 1. Procurement -->
          <article class="subsystem-card">
            <div class="subsystem-head">
              <span class="subsystem-name">1. Material &amp; Services</span>
              <span class="${getStateBadgeClass(order.procurement.state)}">${escapeHtml(order.procurement.state)}</span>
            </div>
            <div class="navbar-subtitle">
              ${escapeHtml(order.procurement.poNumber)} &bull; ${escapeHtml(order.procurement.supplierName)}
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${order.procurement.materialReadinessPct}%"></div>
            </div>
            <div class="inline-controls">
              <select id="proc-state" class="mini-input">${buildStateOptions(order.procurement.state)}</select>
              <input id="proc-pct" class="mini-input" type="number" min="0" max="100" value="${order.procurement.materialReadinessPct}" style="width:74px;" />
              <span class="navbar-subtitle">%</span>
              <button type="button" id="btn-save-proc" class="btn-pill btn-primary-pill btn-compact">Save</button>
            </div>
          </article>

          <!-- 2. Operations -->
          <article class="subsystem-card">
            <div class="subsystem-head">
              <span class="subsystem-name">2. Operations &amp; Production</span>
              <span class="${getStateBadgeClass(order.operations.state)}">${escapeHtml(order.operations.state)}</span>
            </div>
            <div class="navbar-subtitle">${escapeHtml(order.operations.workCenter)}</div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${order.operations.productionProgressPct}%"></div>
            </div>
            <div class="inline-controls">
              <select id="ops-state" class="mini-input">${buildStateOptions(order.operations.state)}</select>
              <input id="ops-pct" class="mini-input" type="number" min="0" max="100" value="${order.operations.productionProgressPct}" style="width:74px;" />
              <span class="navbar-subtitle">%</span>
              <button type="button" id="btn-save-ops" class="btn-pill btn-primary-pill btn-compact">Save</button>
            </div>
          </article>

          <!-- 3. Quality -->
          <article class="subsystem-card">
            <div class="subsystem-head">
              <span class="subsystem-name">3. Quality (QA / QC)</span>
              <span class="${getStateBadgeClass(order.quality.state)}">${escapeHtml(order.quality.state)}</span>
            </div>
            <div class="navbar-subtitle">${escapeHtml(order.quality.lastFeedbackNote)}</div>
            <div class="navbar-subtitle">
              Open NCRs: <strong>${order.quality.ncrCount}</strong> &bull;
              Inspection: <strong>${order.quality.inspectionPassed ? 'Passed' : 'Action Required'}</strong>
            </div>
          </article>

          <!-- 4. Cost -->
          <article class="subsystem-card">
            <div class="subsystem-head">
              <span class="subsystem-name">4. Cost &amp; Rework Control</span>
              <span class="badge ${order.cost.actualCostIdr > order.cost.estimatedCostIdr ? 'badge-error' : 'badge-success'}">
                Est ${formatIdr(order.cost.estimatedCostIdr)}
              </span>
            </div>
            <div class="navbar-subtitle">
              Actual: <strong>${formatIdr(order.cost.actualCostIdr)}</strong> &bull;
              Rework: <strong>${formatIdr(order.cost.reworkCostIdr)}</strong>
            </div>
            <div class="inline-controls">
              <input id="cost-actual" class="mini-input" type="number" step="10000000" value="${order.cost.actualCostIdr}" style="width:120px;" title="Actual Cost IDR" />
              <input id="cost-rework" class="mini-input" type="number" step="5000000" value="${order.cost.reworkCostIdr}" style="width:110px;" title="Rework Cost IDR" />
              <button type="button" id="btn-save-cost" class="btn-pill btn-primary-pill btn-compact">Update</button>
            </div>
          </article>
        </div>
      </section>

      <!-- Digital Document Control -->
      <section class="panel-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Digital Document Control</h3>
            <p class="navbar-subtitle">Single-source revision lock prevents workshop from using outdated drawings</p>
          </div>
        </div>
        <div class="doc-list">${docsHtml}</div>
      </section>

      <!-- QC/QA NCR & CAPA Log -->
      <section class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">QC / QA Non-Conformance &amp; CAPA</h3>
        </div>
        <form id="ncr-form" class="inline-controls">
          <input id="ncr-desc" class="text-input" type="text" required placeholder="Describe deviation..." style="flex:1; min-width:180px;" />
          <input id="ncr-capa" class="text-input" type="text" required placeholder="CAPA corrective action..." style="flex:1; min-width:180px;" />
          <button type="submit" class="btn-pill btn-outline-aubergine btn-compact">Log NCR</button>
        </form>
        <div class="ncr-list">${ncrsHtml}</div>
      </section>
    </div>
  `;

  qs<HTMLSelectElement>(container, '#detail-stage').addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value as OrderStage;
    callbacks.onStageChange(order.id, val);
  });

  qs<HTMLButtonElement>(container, '#btn-save-proc').addEventListener('click', () => {
    const state = qs<HTMLSelectElement>(container, '#proc-state').value as SubsystemState;
    const pct = Number(qs<HTMLInputElement>(container, '#proc-pct').value);
    callbacks.onProcurementUpdate(order.id, state, pct);
  });

  qs<HTMLButtonElement>(container, '#btn-save-ops').addEventListener('click', () => {
    const state = qs<HTMLSelectElement>(container, '#ops-state').value as SubsystemState;
    const pct = Number(qs<HTMLInputElement>(container, '#ops-pct').value);
    callbacks.onOperationsUpdate(order.id, state, pct);
  });

  qs<HTMLButtonElement>(container, '#btn-save-cost').addEventListener('click', () => {
    const actual = Number(qs<HTMLInputElement>(container, '#cost-actual').value);
    const rework = Number(qs<HTMLInputElement>(container, '#cost-rework').value);
    callbacks.onCostUpdate(order.id, actual, rework);
  });

  container.querySelectorAll<HTMLButtonElement>('[data-bump-doc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const docId = btn.dataset.bumpDoc;
      if (docId) callbacks.onBumpDocRevision(order.id, docId);
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-resolve-ncr]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ncrId = btn.dataset.resolveNcr;
      if (ncrId) callbacks.onResolveNcr(order.id, ncrId);
    });
  });

  qs<HTMLFormElement>(container, '#ncr-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = qs<HTMLInputElement>(container, '#ncr-desc').value;
    const capa = qs<HTMLInputElement>(container, '#ncr-capa').value;
    callbacks.onAddNcr(order.id, desc, capa);
  });
}

import type { RoleDashboardPolicy } from '../config/role-dashboard.config.ts';
import type { DashboardViewPrefs } from '../services/preferences.service.ts';
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
  policy: RoleDashboardPolicy,
  prefs: DashboardViewPrefs,
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
        <p style="color: var(--color-ink-mute);">Pilih salah satu Order MTO untuk memantau 4 subsistem paralel.</p>
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
            ${escapeHtml(doc.revision)} &bull; Diperbarui oleh ${escapeHtml(doc.updatedByRole)} (${formatShortDate(doc.updatedAt)})
          </div>
        </div>
        ${
          policy.canBumpDocRevision
            ? `<button type="button" class="btn-pill btn-secondary-pill btn-compact" data-bump-doc="${escapeHtml(doc.id)}">
                Naikkan Revision
              </button>`
            : `<span class="badge badge-neutral">Read-Only</span>`
        }
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
              ncr.status === 'Open' && policy.canEditQualityNcr
                ? `<button type="button" class="btn-pill btn-outline-aubergine btn-compact" data-resolve-ncr="${escapeHtml(ncr.id)}">Selesaikan</button>`
                : ''
            }
          </div>
        `,
          )
          .join('')
      : `<div class="navbar-subtitle">Belum ada laporan NCR untuk order ini.</div>`;

  const subsystemsSectionHtml = prefs.showSubsystems
    ? `
      <section class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">4 Subsistem Paralel (Database Terpusat)</h3>
          <span class="navbar-subtitle">Diperbarui ${formatShortDate(order.updatedAt)}</span>
        </div>

        <div class="subsystem-grid">
          <!-- 1. Procurement -->
          <article class="subsystem-card ${policy.highlightedSubsystem === 'procurement' ? 'is-highlighted' : ''}">
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
            ${
              policy.canEditProcurement
                ? `<div class="inline-controls">
                    <select id="proc-state" class="mini-input">${buildStateOptions(order.procurement.state)}</select>
                    <input id="proc-pct" class="mini-input" type="number" min="0" max="100" value="${order.procurement.materialReadinessPct}" style="width:74px;" />
                    <span class="navbar-subtitle">%</span>
                    <button type="button" id="btn-save-proc" class="btn-pill btn-primary-pill btn-compact">Simpan</button>
                  </div>`
                : `<span class="readonly-note">Material Readiness: ${order.procurement.materialReadinessPct}% &bull; Read-Only (Wewenang Logistics)</span>`
            }
          </article>

          <!-- 2. Operations -->
          <article class="subsystem-card ${policy.highlightedSubsystem === 'operations' ? 'is-highlighted' : ''}">
            <div class="subsystem-head">
              <span class="subsystem-name">2. Operations &amp; Production</span>
              <span class="${getStateBadgeClass(order.operations.state)}">${escapeHtml(order.operations.state)}</span>
            </div>
            <div class="navbar-subtitle">${escapeHtml(order.operations.workCenter)}</div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${order.operations.productionProgressPct}%"></div>
            </div>
            ${
              policy.canEditOperations
                ? `<div class="inline-controls">
                    <select id="ops-state" class="mini-input">${buildStateOptions(order.operations.state)}</select>
                    <input id="ops-pct" class="mini-input" type="number" min="0" max="100" value="${order.operations.productionProgressPct}" style="width:74px;" />
                    <span class="navbar-subtitle">%</span>
                    <button type="button" id="btn-save-ops" class="btn-pill btn-primary-pill btn-compact">Simpan</button>
                  </div>`
                : `<span class="readonly-note">Progres Produksi: ${order.operations.productionProgressPct}% &bull; Read-Only (Wewenang Operations)</span>`
            }
          </article>

          <!-- 3. Quality -->
          <article class="subsystem-card ${policy.highlightedSubsystem === 'quality' ? 'is-highlighted' : ''}">
            <div class="subsystem-head">
              <span class="subsystem-name">3. Quality (QA / QC)</span>
              <span class="${getStateBadgeClass(order.quality.state)}">${escapeHtml(order.quality.state)}</span>
            </div>
            <div class="navbar-subtitle">${escapeHtml(order.quality.lastFeedbackNote)}</div>
            <div class="navbar-subtitle">
              Open NCR: <strong>${order.quality.ncrCount}</strong> &bull;
              Inspeksi: <strong>${order.quality.inspectionPassed ? 'Lulus' : 'Perlu Tindakan'}</strong>
            </div>
          </article>

          <!-- 4. Cost -->
          <article class="subsystem-card ${policy.highlightedSubsystem === 'cost' ? 'is-highlighted' : ''}">
            <div class="subsystem-head">
              <span class="subsystem-name">4. Cost &amp; Rework Control</span>
              <span class="badge ${order.cost.actualCostIdr > order.cost.estimatedCostIdr ? 'badge-error' : 'badge-success'}">
                Est ${formatIdr(order.cost.estimatedCostIdr)}
              </span>
            </div>
            <div class="navbar-subtitle">
              Aktual: <strong>${formatIdr(order.cost.actualCostIdr)}</strong> &bull;
              Rework: <strong>${formatIdr(order.cost.reworkCostIdr)}</strong>
            </div>
            ${
              policy.canEditCost
                ? `<div class="inline-controls">
                    <input id="cost-actual" class="mini-input" type="number" step="10000000" value="${order.cost.actualCostIdr}" style="width:120px;" title="Biaya Aktual IDR" />
                    <input id="cost-rework" class="mini-input" type="number" step="5000000" value="${order.cost.reworkCostIdr}" style="width:110px;" title="Biaya Rework IDR" />
                    <button type="button" id="btn-save-cost" class="btn-pill btn-primary-pill btn-compact">Perbarui</button>
                  </div>`
                : `<span class="readonly-note">Read-Only (Wewenang Finance &amp; Management)</span>`
            }
          </article>
        </div>
      </section>
    `
    : '';

  const docsSectionHtml = prefs.showDocuments
    ? `
      <section class="panel-card" style="${policy.highlightedSubsystem === 'documents' ? 'border: 2px solid var(--color-primary);' : ''}">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Digital Document Control</h3>
            <p class="navbar-subtitle">Single-source revision lock mencegah workshop memakai gambar revisi lama</p>
          </div>
        </div>
        <div class="doc-list">${docsHtml}</div>
      </section>
    `
    : '';

  const ncrSectionHtml = prefs.showNcrs
    ? `
      <section class="panel-card" style="${policy.highlightedSubsystem === 'quality' ? 'border: 2px solid var(--color-primary);' : ''}">
        <div class="panel-header">
          <h3 class="panel-title">Log NCR &amp; CAPA (QC / QA)</h3>
        </div>
        ${
          policy.canEditQualityNcr
            ? `<form id="ncr-form" class="inline-controls">
                <input id="ncr-desc" class="text-input" type="text" required placeholder="Deskripsi ketidaksesuaian..." style="flex:1; min-width:180px;" />
                <input id="ncr-capa" class="text-input" type="text" required placeholder="Tindakan CAPA..." style="flex:1; min-width:180px;" />
                <button type="submit" class="btn-pill btn-outline-aubergine btn-compact">Catat NCR</button>
              </form>`
            : `<span class="readonly-note">Pencatatan &amp; penyelesaian NCR hanya aktif untuk role QC / QA atau Management.</span>`
        }
        <div class="ncr-list">${ncrsHtml}</div>
      </section>
    `
    : '';

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap: var(--space-lg);">
      <section class="detail-aubergine-band">
        <div>
          <span class="pill-cap-shade">${escapeHtml(order.orderNo)} &bull; ${escapeHtml(order.productCategory)}</span>
          <h2 class="detail-order-title">${escapeHtml(order.projectTitle)}</h2>
          <p class="detail-meta">
            Pelanggan: ${escapeHtml(order.customerName)} &bull; Target Kirim: ${formatShortDate(order.targetDeliveryDate)}
          </p>
        </div>
        <div class="field-group" style="min-width: 200px;">
          <label class="field-label" for="detail-stage" style="color: var(--color-on-aubergine-mute);">Order Stage</label>
          <select id="detail-stage" class="select-input" ${policy.canEditStage ? '' : 'disabled'}>${stageOptions}</select>
        </div>
      </section>

      ${subsystemsSectionHtml}
      ${docsSectionHtml}
      ${ncrSectionHtml}
    </div>
  `;

  if (policy.canEditStage) {
    qs<HTMLSelectElement>(container, '#detail-stage').addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value as OrderStage;
      callbacks.onStageChange(order.id, val);
    });
  }

  if (prefs.showSubsystems && policy.canEditProcurement) {
    qs<HTMLButtonElement>(container, '#btn-save-proc').addEventListener('click', () => {
      const state = qs<HTMLSelectElement>(container, '#proc-state').value as SubsystemState;
      const pct = Number(qs<HTMLInputElement>(container, '#proc-pct').value);
      callbacks.onProcurementUpdate(order.id, state, pct);
    });
  }

  if (prefs.showSubsystems && policy.canEditOperations) {
    qs<HTMLButtonElement>(container, '#btn-save-ops').addEventListener('click', () => {
      const state = qs<HTMLSelectElement>(container, '#ops-state').value as SubsystemState;
      const pct = Number(qs<HTMLInputElement>(container, '#ops-pct').value);
      callbacks.onOperationsUpdate(order.id, state, pct);
    });
  }

  if (prefs.showSubsystems && policy.canEditCost) {
    qs<HTMLButtonElement>(container, '#btn-save-cost').addEventListener('click', () => {
      const actual = Number(qs<HTMLInputElement>(container, '#cost-actual').value);
      const rework = Number(qs<HTMLInputElement>(container, '#cost-rework').value);
      callbacks.onCostUpdate(order.id, actual, rework);
    });
  }

  if (prefs.showDocuments && policy.canBumpDocRevision) {
    container.querySelectorAll<HTMLButtonElement>('[data-bump-doc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const docId = btn.dataset.bumpDoc;
        if (docId) callbacks.onBumpDocRevision(order.id, docId);
      });
    });
  }

  if (prefs.showNcrs && policy.canEditQualityNcr) {
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
}

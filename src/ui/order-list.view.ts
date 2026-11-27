import type { MTOOrder, ProductCategory } from '../types/mto.types.ts';
import { escapeHtml, qs } from '../utils/dom.util.ts';
import { formatShortDate, getStateBadgeClass } from '../utils/format.util.ts';

export function renderOrderList(
  container: HTMLElement,
  orders: readonly MTOOrder[],
  selectedOrderId: string | null,
  searchQuery: string,
  canCreateProposal: boolean,
  callbacks: {
    onSelectOrder: (orderId: string) => void;
    onSearchChange: (query: string) => void;
    onCreateOrder: (input: {
      customerName: string;
      productCategory: ProductCategory;
      projectTitle: string;
      targetDeliveryDate: string;
      estimatedLeadMonths: number;
      estimatedCostIdr: number;
    }) => void;
  },
): void {
  const normalized = searchQuery.trim().toLowerCase();
  const filtered = normalized
    ? orders.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(normalized) ||
          o.customerName.toLowerCase().includes(normalized) ||
          o.productCategory.toLowerCase().includes(normalized) ||
          o.projectTitle.toLowerCase().includes(normalized),
      )
    : orders;

  const rowsHtml =
    filtered.length > 0
      ? filtered
          .map((order) => {
            const isSelected = order.id === selectedOrderId;
            const overallState =
              order.procurement.state === 'Delayed' || order.quality.state === 'Delayed'
                ? 'Delayed'
                : order.stage === 'Delivered'
                  ? 'Completed'
                  : order.stage === 'Proposal'
                    ? 'Pending'
                    : 'In Progress';

            return `
              <tr class="order-row ${isSelected ? 'selected' : ''}" data-order-id="${escapeHtml(order.id)}">
                <td>
                  <div class="order-code">${escapeHtml(order.orderNo)}</div>
                  <div class="navbar-subtitle">${escapeHtml(order.productCategory)}</div>
                </td>
                <td>
                  <div><strong>${escapeHtml(order.customerName)}</strong></div>
                  <div class="navbar-subtitle">${escapeHtml(order.projectTitle)}</div>
                </td>
                <td>
                  <span class="${getStateBadgeClass(overallState)}">${escapeHtml(order.stage)}</span>
                </td>
                <td>${formatShortDate(order.targetDeliveryDate)}</td>
              </tr>
            `;
          })
          .join('')
      : `<tr><td colspan="4" style="text-align:center; color: var(--color-ink-mute);">Tidak ada Order MTO yang sesuai pencarian.</td></tr>`;

  const hadSearchFocus = document.activeElement?.id === 'order-search-input';
  const cursorPos =
    hadSearchFocus && document.activeElement instanceof HTMLInputElement
      ? document.activeElement.selectionStart ?? searchQuery.length
      : searchQuery.length;

  container.innerHTML = `
    <div class="panel-card">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Daftar Order &amp; Proposal MTO</h2>
          <p class="navbar-subtitle">Klik baris order untuk memantau subsistem paralel</p>
        </div>
        ${
          canCreateProposal
            ? `<button type="button" id="btn-open-new-order" class="btn-pill btn-primary-pill btn-compact">
                + Buat Proposal MTO
              </button>`
            : `<span class="badge badge-neutral">Buat Proposal: Khusus Sales / Manajemen</span>`
        }
      </div>

      <div class="filter-row">
        <input
          id="order-search-input"
          class="text-input"
          type="search"
          placeholder="Cari nomor order, pelanggan, Pressure Vessel, Heat Exchanger..."
          value="${escapeHtml(searchQuery)}"
        />
      </div>

      <div class="order-table-wrap">
        <table class="order-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Pelanggan &amp; Lingkup</th>
              <th>Order Stage</th>
              <th>Target Kirim</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>

    <div id="new-order-modal" class="modal-backdrop hidden" role="dialog" aria-modal="true">
      <div class="modal-card">
        <div class="panel-header">
          <h3 class="panel-title">Proposal / Order MTO Baru</h3>
          <button type="button" id="btn-close-modal" class="btn-pill btn-secondary-pill btn-compact">Tutup</button>
        </div>
        <form id="new-order-form" class="auth-form">
          <div class="field-group">
            <label class="field-label" for="new-customer">Nama Pelanggan</label>
            <input id="new-customer" class="text-input" type="text" required placeholder="contoh: PT Chandra Asri" />
          </div>
          <div class="field-group">
            <label class="field-label" for="new-category">Kategori Peralatan</label>
            <select id="new-category" class="select-input">
              <option value="Pressure Vessel">Pressure Vessel</option>
              <option value="Heat Exchanger">Heat Exchanger</option>
              <option value="Storage Tank">Storage Tank</option>
              <option value="Industrial Piping">Industrial Piping</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label" for="new-title">Judul Proyek / Spesifikasi</label>
            <input id="new-title" class="text-input" type="text" required placeholder="contoh: Reactor Feed Heat Exchanger" />
          </div>
          <div class="inline-controls">
            <div class="field-group" style="flex:1;">
              <label class="field-label" for="new-date">Target Pengiriman</label>
              <input id="new-date" class="text-input" type="date" required value="2027-06-30" />
            </div>
            <div class="field-group" style="flex:1;">
              <label class="field-label" for="new-cost">Estimasi Anggaran (IDR)</label>
              <input id="new-cost" class="text-input" type="number" required min="100000000" step="50000000" value="2000000000" />
            </div>
          </div>
          <button type="submit" class="btn-pill btn-primary-pill">Simpan ke Database Terpusat</button>
        </form>
      </div>
    </div>
  `;

  container.querySelectorAll<HTMLTableRowElement>('[data-order-id]').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.dataset.orderId;
      if (id) callbacks.onSelectOrder(id);
    });
  });

  const searchInput = qs<HTMLInputElement>(container, '#order-search-input');
  if (hadSearchFocus) {
    searchInput.focus();
    searchInput.setSelectionRange(cursorPos, cursorPos);
  }
  searchInput.addEventListener('input', () => {
    callbacks.onSearchChange(searchInput.value);
  });

  const modal = qs<HTMLDivElement>(container, '#new-order-modal');
  const openBtn = container.querySelector<HTMLButtonElement>('#btn-open-new-order');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
  }
  qs<HTMLButtonElement>(container, '#btn-close-modal').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  const form = qs<HTMLFormElement>(container, '#new-order-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    callbacks.onCreateOrder({
      customerName: qs<HTMLInputElement>(form, '#new-customer').value,
      productCategory: qs<HTMLSelectElement>(form, '#new-category').value as ProductCategory,
      projectTitle: qs<HTMLInputElement>(form, '#new-title').value,
      targetDeliveryDate: qs<HTMLInputElement>(form, '#new-date').value,
      estimatedLeadMonths: 8,
      estimatedCostIdr: Number(qs<HTMLInputElement>(form, '#new-cost').value),
    });
    modal.classList.add('hidden');
  });
}

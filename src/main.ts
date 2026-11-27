import './styles/tokens.css';
import './styles/base.css';
import './styles/auth.css';
import './styles/dashboard.css';

import { getRolePolicy } from './config/role-dashboard.config.ts';
import { getActiveSession, logout } from './services/auth.service.ts';
import { computeRoleKpis } from './services/metrics.service.ts';
import {
  addQualityNcr,
  bumpDocumentRevision,
  createMTOOrder,
  getOrderById,
  getOrders,
  resetAllDemoData,
  resolveQualityNcr,
  updateCost,
  updateOperations,
  updateOrderStage,
  updateProcurement,
} from './services/order.service.ts';
import { getRoleViewPrefs, saveRoleViewPrefs } from './services/preferences.service.ts';
import type { AuthSession } from './types/auth.types.ts';
import { renderAuthView } from './ui/auth.view.ts';
import { renderKpiCards } from './ui/kpi-cards.view.ts';
import { renderNavbar } from './ui/navbar.view.ts';
import { renderOrderDetail } from './ui/order-detail.view.ts';
import { renderOrderList } from './ui/order-list.view.ts';
import { escapeHtml, qs } from './utils/dom.util.ts';

const appRoot = qs<HTMLDivElement>(document, '#app');

let selectedOrderId: string | null = null;
let searchQuery = '';

function renderApp(): void {
  const session = getActiveSession();
  if (!session) {
    renderAuthView(appRoot, () => {
      selectedOrderId = null;
      renderApp();
    });
    return;
  }
  renderDashboard(session);
}

function renderDashboard(session: AuthSession): void {
  const policy = getRolePolicy(session.role);
  const orders = getOrders();
  if (!selectedOrderId || !orders.some((o) => o.id === selectedOrderId)) {
    selectedOrderId = orders[0]?.id ?? null;
  }

  let prefs = getRoleViewPrefs(session.role);

  appRoot.innerHTML = `
    <div class="dashboard-shell">
      <div id="mount-navbar"></div>
      <main class="dashboard-main">
        <div class="command-header">
          <div>
            <span class="pill-cap-shade">${escapeHtml(policy.focusBadge)}</span>
            <h1 class="command-title" style="margin-top:8px;">${escapeHtml(policy.dashboardTitle)}</h1>
            <p class="command-desc">${escapeHtml(policy.dashboardSubtitle)}</p>
          </div>
          <div class="customize-bar" aria-label="Sesuaikan Tampilan Dasbor">
            <span class="navbar-subtitle" style="font-weight:700;">Sesuaikan Panel:</span>
            <label class="customize-toggle">
              <input type="checkbox" id="pref-kpis" ${prefs.showKpis ? 'checked' : ''} /> KPI Cards
            </label>
            <label class="customize-toggle">
              <input type="checkbox" id="pref-subsystems" ${prefs.showSubsystems ? 'checked' : ''} /> 4 Subsistem
            </label>
            <label class="customize-toggle">
              <input type="checkbox" id="pref-docs" ${prefs.showDocuments ? 'checked' : ''} /> Document Control
            </label>
            <label class="customize-toggle">
              <input type="checkbox" id="pref-ncrs" ${prefs.showNcrs ? 'checked' : ''} /> NCR &amp; CAPA
            </label>
          </div>
        </div>
        <div id="mount-kpis"></div>
        <section class="command-grid">
          <div id="mount-order-list"></div>
          <div id="mount-order-detail"></div>
        </section>
      </main>
    </div>
  `;

  const navMount = qs<HTMLDivElement>(appRoot, '#mount-navbar');
  const kpiMount = qs<HTMLDivElement>(appRoot, '#mount-kpis');
  const listMount = qs<HTMLDivElement>(appRoot, '#mount-order-list');
  const detailMount = qs<HTMLDivElement>(appRoot, '#mount-order-detail');

  renderNavbar(navMount, session, {
    onResetDemo: () => {
      resetAllDemoData();
      selectedOrderId = null;
      searchQuery = '';
      renderDashboard(session);
    },
    onLogout: () => {
      logout();
      renderApp();
    },
  });

  const refreshDataViews = (): void => {
    const currentOrders = getOrders();

    if (prefs.showKpis) {
      kpiMount.classList.remove('hidden');
      renderKpiCards(kpiMount, computeRoleKpis(session.role, currentOrders));
    } else {
      kpiMount.classList.add('hidden');
      kpiMount.innerHTML = '';
    }

    renderOrderList(
      listMount,
      currentOrders,
      selectedOrderId,
      searchQuery,
      policy.canCreateProposal,
      {
        onSelectOrder: (orderId) => {
          selectedOrderId = orderId;
          refreshDataViews();
        },
        onSearchChange: (query) => {
          searchQuery = query;
          refreshDataViews();
        },
        onCreateOrder: (input) => {
          const created = createMTOOrder({
            ...input,
            createdByRole: session.role,
          });
          selectedOrderId = created.id;
          refreshDataViews();
        },
      },
    );

    const activeOrder = selectedOrderId ? getOrderById(selectedOrderId) : undefined;
    renderOrderDetail(detailMount, activeOrder, policy, prefs, {
      onStageChange: (orderId, stage) => {
        updateOrderStage(orderId, stage);
        refreshDataViews();
      },
      onProcurementUpdate: (orderId, state, pct) => {
        updateProcurement(orderId, { state, materialReadinessPct: pct });
        refreshDataViews();
      },
      onOperationsUpdate: (orderId, state, pct) => {
        updateOperations(orderId, { state, productionProgressPct: pct });
        refreshDataViews();
      },
      onCostUpdate: (orderId, actualIdr, reworkIdr) => {
        updateCost(orderId, { actualCostIdr: actualIdr, reworkCostIdr: reworkIdr });
        refreshDataViews();
      },
      onBumpDocRevision: (orderId, docId) => {
        bumpDocumentRevision(orderId, docId, session.role);
        refreshDataViews();
      },
      onAddNcr: (orderId, desc, capa) => {
        addQualityNcr(orderId, desc, capa);
        refreshDataViews();
      },
      onResolveNcr: (orderId, ncrId) => {
        resolveQualityNcr(orderId, ncrId);
        refreshDataViews();
      },
    });
  };

  const bindPrefToggle = (
    id: string,
    key: 'showKpis' | 'showSubsystems' | 'showDocuments' | 'showNcrs',
  ): void => {
    qs<HTMLInputElement>(appRoot, id).addEventListener('change', (e) => {
      prefs = { ...prefs, [key]: (e.target as HTMLInputElement).checked };
      saveRoleViewPrefs(session.role, prefs);
      refreshDataViews();
    });
  };

  bindPrefToggle('#pref-kpis', 'showKpis');
  bindPrefToggle('#pref-subsystems', 'showSubsystems');
  bindPrefToggle('#pref-docs', 'showDocuments');
  bindPrefToggle('#pref-ncrs', 'showNcrs');

  refreshDataViews();
}

renderApp();

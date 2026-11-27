import './styles/tokens.css';
import './styles/base.css';
import './styles/auth.css';
import './styles/dashboard.css';

import { getActiveSession, logout } from './services/auth.service.ts';
import { computeDashboardMetrics } from './services/metrics.service.ts';
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
import type { AuthSession } from './types/auth.types.ts';
import { renderAuthView } from './ui/auth.view.ts';
import { renderKpiCards } from './ui/kpi-cards.view.ts';
import { renderNavbar } from './ui/navbar.view.ts';
import { renderOrderDetail } from './ui/order-detail.view.ts';
import { renderOrderList } from './ui/order-list.view.ts';
import { qs } from './utils/dom.util.ts';

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
  const orders = getOrders();
  if (!selectedOrderId || !orders.some((o) => o.id === selectedOrderId)) {
    selectedOrderId = orders[0]?.id ?? null;
  }

  appRoot.innerHTML = `
    <div class="dashboard-shell">
      <div id="mount-navbar"></div>
      <main class="dashboard-main">
        <div class="command-header">
          <div>
            <h1 class="command-title">MTO Operational Command Center</h1>
            <p class="command-desc">
              Real-time synchronization across Proposal, Engineering, Procurement, Operations, QA/QC, and Cost.
            </p>
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
    renderKpiCards(kpiMount, computeDashboardMetrics(currentOrders));

    renderOrderList(listMount, currentOrders, selectedOrderId, searchQuery, {
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
    });

    const activeOrder = selectedOrderId ? getOrderById(selectedOrderId) : undefined;
    renderOrderDetail(detailMount, activeOrder, {
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

  refreshDataViews();
}

renderApp();

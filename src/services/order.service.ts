import { SEED_ORDERS, SEED_USERS, STORAGE_KEYS } from '../storage/seed.data.ts';
import { clearStorageKeys, readStorage, writeStorage } from '../storage/storage.service.ts';
import type {
  MTOOrder,
  OrderStage,
  ProductCategory,
  SubsystemState,
} from '../types/mto.types.ts';

export function getOrders(): MTOOrder[] {
  const existing = readStorage<MTOOrder[]>(STORAGE_KEYS.ORDERS, []);
  if (existing.length > 0) return existing;
  writeStorage(STORAGE_KEYS.ORDERS, SEED_ORDERS);
  return SEED_ORDERS;
}

export function getOrderById(orderId: string): MTOOrder | undefined {
  return getOrders().find((o) => o.id === orderId);
}

export function createMTOOrder(input: {
  customerName: string;
  productCategory: ProductCategory;
  projectTitle: string;
  targetDeliveryDate: string;
  estimatedLeadMonths: number;
  estimatedCostIdr: number;
  createdByRole: string;
}): MTOOrder {
  const orders = getOrders();
  const nextSeq = String(orders.length + 45).padStart(3, '0');
  const now = new Date().toISOString();

  const newOrder: MTOOrder = {
    id: `ord-${Date.now()}`,
    orderNo: `BBI-MTO-2026-${nextSeq}`,
    customerName: input.customerName.trim(),
    productCategory: input.productCategory,
    projectTitle: input.projectTitle.trim(),
    stage: 'Proposal',
    targetDeliveryDate: input.targetDeliveryDate,
    estimatedLeadMonths: input.estimatedLeadMonths,
    delayMonths: 0,
    procurement: {
      state: 'Pending',
      materialReadinessPct: 10,
      poNumber: `PO-LOG-89${nextSeq.slice(-2)}`,
      supplierName: 'Pending Supplier Assignment',
      etaDate: input.targetDeliveryDate,
    },
    operations: {
      state: 'Pending',
      productionProgressPct: 0,
      workCenter: 'Engineering & Planning Queue',
      activeShift: 'Unassigned',
    },
    quality: {
      state: 'Pending',
      inspectionPassed: true,
      ncrCount: 0,
      lastFeedbackNote: 'Awaiting initial design & material spec review.',
    },
    cost: {
      estimatedCostIdr: input.estimatedCostIdr,
      actualCostIdr: Math.round(input.estimatedCostIdr * 0.05),
      reworkCostIdr: 0,
    },
    documents: [
      {
        id: `doc-${Date.now()}`,
        docCode: `PROP-${nextSeq}`,
        title: `MTO Proposal & Technical Spec (${input.productCategory})`,
        revision: 'Rev 01',
        updatedByRole: input.createdByRole,
        updatedAt: now,
      },
    ],
    ncrs: [],
    updatedAt: now,
  };

  writeStorage(STORAGE_KEYS.ORDERS, [newOrder, ...orders]);
  return newOrder;
}

export function updateOrderStage(orderId: string, stage: OrderStage): MTOOrder | undefined {
  return mutateOrder(orderId, (order) => ({ ...order, stage }));
}

export function updateProcurement(
  orderId: string,
  patch: { state: SubsystemState; materialReadinessPct: number },
): MTOOrder | undefined {
  return mutateOrder(orderId, (order) => ({
    ...order,
    procurement: {
      ...order.procurement,
      state: patch.state,
      materialReadinessPct: clampPct(patch.materialReadinessPct),
    },
  }));
}

export function updateOperations(
  orderId: string,
  patch: { state: SubsystemState; productionProgressPct: number },
): MTOOrder | undefined {
  return mutateOrder(orderId, (order) => ({
    ...order,
    operations: {
      ...order.operations,
      state: patch.state,
      productionProgressPct: clampPct(patch.productionProgressPct),
    },
  }));
}

export function updateCost(
  orderId: string,
  patch: { actualCostIdr: number; reworkCostIdr: number },
): MTOOrder | undefined {
  return mutateOrder(orderId, (order) => ({
    ...order,
    cost: {
      ...order.cost,
      actualCostIdr: Math.max(0, patch.actualCostIdr),
      reworkCostIdr: Math.max(0, patch.reworkCostIdr),
    },
  }));
}

export function bumpDocumentRevision(
  orderId: string,
  docId: string,
  updatedByRole: string,
): MTOOrder | undefined {
  return mutateOrder(orderId, (order) => ({
    ...order,
    documents: order.documents.map((doc) => {
      if (doc.id !== docId) return doc;
      const numeric = Number.parseInt(doc.revision.replace(/\D+/g, ''), 10) || 1;
      return {
        ...doc,
        revision: `Rev ${String(numeric + 1).padStart(2, '0')}`,
        updatedByRole,
        updatedAt: new Date().toISOString(),
      };
    }),
  }));
}

export function addQualityNcr(
  orderId: string,
  description: string,
  capaAction: string,
): MTOOrder | undefined {
  return mutateOrder(orderId, (order) => {
    const newNcr = {
      id: `ncr-${Date.now()}`,
      description: description.trim(),
      capaAction: capaAction.trim(),
      status: 'Open' as const,
      reportedAt: new Date().toISOString(),
    };
    const nextNcrs = [newNcr, ...order.ncrs];
    const openCount = nextNcrs.filter((n) => n.status === 'Open').length;
    return {
      ...order,
      ncrs: nextNcrs,
      quality: {
        ...order.quality,
        state: 'Delayed',
        inspectionPassed: false,
        ncrCount: openCount,
        lastFeedbackNote: `Open NCR: ${newNcr.description}`,
      },
    };
  });
}

export function resolveQualityNcr(orderId: string, ncrId: string): MTOOrder | undefined {
  return mutateOrder(orderId, (order) => {
    const nextNcrs = order.ncrs.map((ncr) =>
      ncr.id === ncrId ? { ...ncr, status: 'Resolved' as const } : ncr,
    );
    const openCount = nextNcrs.filter((n) => n.status === 'Open').length;
    return {
      ...order,
      ncrs: nextNcrs,
      quality: {
        ...order.quality,
        state: openCount === 0 ? 'In Progress' : 'Delayed',
        inspectionPassed: openCount === 0,
        ncrCount: openCount,
        lastFeedbackNote:
          openCount === 0
            ? 'All NCRs resolved; CAPA verified by QC/QA.'
            : `${openCount} NCR(s) still open.`,
      },
    };
  });
}

export function resetAllDemoData(): void {
  clearStorageKeys([STORAGE_KEYS.ORDERS, STORAGE_KEYS.USERS]);
  writeStorage(STORAGE_KEYS.USERS, SEED_USERS);
  writeStorage(STORAGE_KEYS.ORDERS, SEED_ORDERS);
}

function mutateOrder(
  orderId: string,
  updater: (order: MTOOrder) => MTOOrder,
): MTOOrder | undefined {
  const orders = getOrders();
  let updatedOrder: MTOOrder | undefined;
  const nextOrders = orders.map((order) => {
    if (order.id !== orderId) return order;
    updatedOrder = {
      ...updater(order),
      updatedAt: new Date().toISOString(),
    };
    return updatedOrder;
  });
  if (updatedOrder) {
    writeStorage(STORAGE_KEYS.ORDERS, nextOrders);
  }
  return updatedOrder;
}

function clampPct(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

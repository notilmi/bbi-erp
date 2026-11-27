import type { DepartmentRole } from '../types/auth.types.ts';
import type { MTOOrder } from '../types/mto.types.ts';
import { formatIdr } from '../utils/format.util.ts';

export interface RoleKpiCard {
  label: string;
  value: string;
  foot: string;
  tone: 'default' | 'success' | 'error';
}

export function computeRoleKpis(
  role: DepartmentRole,
  orders: readonly MTOOrder[],
): RoleKpiCard[] {
  const total = orders.length;
  const activeOrders = orders.filter((o) => o.stage !== 'Delivered');
  const onTimeCount = orders.filter(
    (o) =>
      o.delayMonths === 0 &&
      o.procurement.state !== 'Delayed' &&
      o.quality.state !== 'Delayed',
  ).length;
  const onTimePct = total > 0 ? Math.round((onTimeCount / total) * 100) : 100;

  const avgMaterialPct =
    total > 0
      ? Math.round(
          orders.reduce((sum, o) => sum + o.procurement.materialReadinessPct, 0) / total,
        )
      : 0;
  const avgOpsPct =
    total > 0
      ? Math.round(
          orders.reduce((sum, o) => sum + o.operations.productionProgressPct, 0) / total,
        )
      : 0;

  const openNcrCount = orders.reduce(
    (sum, o) => sum + o.ncrs.filter((n) => n.status === 'Open').length,
    0,
  );
  const totalReworkIdr = orders.reduce((sum, o) => sum + o.cost.reworkCostIdr, 0);
  const totalEstIdr = orders.reduce((sum, o) => sum + o.cost.estimatedCostIdr, 0);
  const totalActualIdr = orders.reduce((sum, o) => sum + o.cost.actualCostIdr, 0);
  const costVariancePct =
    totalEstIdr > 0
      ? Number((((totalActualIdr - totalEstIdr) / totalEstIdr) * 100).toFixed(1))
      : 0;

  switch (role) {
    case 'Sales & Proposal': {
      const proposalCount = orders.filter((o) => o.stage === 'Proposal').length;
      const avgLead =
        total > 0
          ? (orders.reduce((s, o) => s + o.estimatedLeadMonths, 0) / total).toFixed(1)
          : '0';
      return [
        {
          label: 'Proposal Aktif',
          value: String(proposalCount),
          foot: `Dari total ${total} Order MTO`,
          tone: 'default',
        },
        {
          label: 'Nilai Pipeline MTO',
          value: formatIdr(totalEstIdr),
          foot: 'Akumulasi estimasi kontrak',
          tone: 'default',
        },
        {
          label: 'On-Time Delivery',
          value: `${onTimePct}%`,
          foot: 'Target jaga kepercayaan klien',
          tone: onTimePct >= 75 ? 'success' : 'error',
        },
        {
          label: 'Rata-rata Lead Time',
          value: `${avgLead} bln`,
          foot: 'Estimasi siklus MTO',
          tone: 'default',
        },
      ];
    }

    case 'Engineering': {
      const totalDocs = orders.reduce((s, o) => s + o.documents.length, 0);
      const designStageCount = orders.filter((o) => o.stage === 'Design & Engineering').length;
      return [
        {
          label: 'Dokumen Digital',
          value: String(totalDocs),
          foot: 'Tersimpan di Document Control',
          tone: 'default',
        },
        {
          label: 'Tahap Engineering',
          value: String(designStageCount),
          foot: 'Menunggu rilis Drawing & BOM',
          tone: 'default',
        },
        {
          label: 'Open NCR',
          value: String(openNcrCount),
          foot: 'Perlu sinkronisasi revisi',
          tone: openNcrCount > 0 ? 'error' : 'success',
        },
        {
          label: 'Order MTO Aktif',
          value: String(activeOrders.length),
          foot: 'Terhubung paralel ke workshop',
          tone: 'default',
        },
      ];
    }

    case 'Logistics & Procurement': {
      const delayedPo = orders.filter((o) => o.procurement.state === 'Delayed').length;
      const completedPo = orders.filter((o) => o.procurement.state === 'Completed').length;
      return [
        {
          label: 'Material Readiness',
          value: `${avgMaterialPct}%`,
          foot: 'Rata-rata kesiapan bahan baku',
          tone: avgMaterialPct >= 75 ? 'success' : 'default',
        },
        {
          label: 'PO Terlambat (Delayed)',
          value: String(delayedPo),
          foot: 'Prioritas tindak lanjut pemasok',
          tone: delayedPo > 0 ? 'error' : 'success',
        },
        {
          label: 'PO Selesai',
          value: String(completedPo),
          foot: `Dari ${total} pesanan aktif`,
          tone: 'success',
        },
        {
          label: 'On-Time Schedule',
          value: `${onTimePct}%`,
          foot: 'Dampak ketepatan material',
          tone: onTimePct >= 75 ? 'success' : 'error',
        },
      ];
    }

    case 'Operations': {
      const inProdCount = orders.filter((o) => o.stage === 'In Production').length;
      return [
        {
          label: 'Progres Produksi',
          value: `${avgOpsPct}%`,
          foot: 'Rata-rata capaian Work Center',
          tone: 'default',
        },
        {
          label: 'Tahap In Production',
          value: String(inProdCount),
          foot: 'Sedang dikerjakan di workshop',
          tone: 'default',
        },
        {
          label: 'Material Readiness',
          value: `${avgMaterialPct}%`,
          foot: 'Kesiapan bahan untuk fabrikasi',
          tone: avgMaterialPct >= 75 ? 'success' : 'error',
        },
        {
          label: 'Open NCR',
          value: String(openNcrCount),
          foot: 'Potensi hambatan pengerjaan',
          tone: openNcrCount > 0 ? 'error' : 'success',
        },
      ];
    }

    case 'QC / QA': {
      const passedCount = orders.filter((o) => o.quality.inspectionPassed).length;
      const passRate = total > 0 ? Math.round((passedCount / total) * 100) : 100;
      return [
        {
          label: 'Open NCR',
          value: String(openNcrCount),
          foot: 'Menunggu penyelesaian CAPA',
          tone: openNcrCount > 0 ? 'error' : 'success',
        },
        {
          label: 'Lulus Inspeksi',
          value: `${passRate}%`,
          foot: `${passedCount} dari ${total} order lolos`,
          tone: passRate >= 80 ? 'success' : 'error',
        },
        {
          label: 'Biaya Rework',
          value: formatIdr(totalReworkIdr),
          foot: 'Akumulasi biaya perbaikan',
          tone: totalReworkIdr > 0 ? 'error' : 'success',
        },
        {
          label: 'Tahap QC & Dispatch',
          value: String(orders.filter((o) => o.stage === 'QC & Dispatch').length),
          foot: 'Siap Manufacturing Data Report',
          tone: 'default',
        },
      ];
    }

    case 'Finance & Management': {
      const varianceSign = costVariancePct > 0 ? '+' : '';
      return [
        {
          label: 'On-Time Schedule',
          value: `${onTimePct}%`,
          foot: 'Target: cegah keterlambatan 3-7 bln',
          tone: onTimePct >= 75 ? 'success' : 'error',
        },
        {
          label: 'Order MTO Aktif',
          value: String(activeOrders.length),
          foot: `Material Readiness: ${avgMaterialPct}%`,
          tone: 'default',
        },
        {
          label: 'Open NCR',
          value: String(openNcrCount),
          foot: `Total Rework: ${formatIdr(totalReworkIdr)}`,
          tone: openNcrCount > 0 ? 'error' : 'success',
        },
        {
          label: 'Cost Variance',
          value: `${varianceSign}${costVariancePct}%`,
          foot: 'Realisasi vs. estimasi anggaran',
          tone: costVariancePct > 5 ? 'error' : 'success',
        },
      ];
    }
  }
}

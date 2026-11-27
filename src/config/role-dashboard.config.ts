import type { DepartmentRole } from '../types/auth.types.ts';

export type DashboardSectionKey = 'subsystems' | 'documents' | 'ncrs';

export interface RoleDashboardPolicy {
  role: DepartmentRole;
  dashboardTitle: string;
  dashboardSubtitle: string;
  focusBadge: string;
  canCreateProposal: boolean;
  canEditStage: boolean;
  canEditProcurement: boolean;
  canEditOperations: boolean;
  canEditQualityNcr: boolean;
  canEditCost: boolean;
  canBumpDocRevision: boolean;
  highlightedSubsystem: 'procurement' | 'operations' | 'quality' | 'cost' | 'documents';
}

export const ROLE_POLICIES: Record<DepartmentRole, RoleDashboardPolicy> = {
  'Sales & Proposal': {
    role: 'Sales & Proposal',
    dashboardTitle: 'Dasbor Proposal & Penjualan MTO',
    dashboardSubtitle:
      'Pantau pipeline penawaran, estimasi biaya & lead time berbasis database historis proyek.',
    focusBadge: 'Fokus: Proposal & Order Stage',
    canCreateProposal: true,
    canEditStage: true,
    canEditProcurement: false,
    canEditOperations: false,
    canEditQualityNcr: false,
    canEditCost: false,
    canBumpDocRevision: false,
    highlightedSubsystem: 'cost',
  },
  Engineering: {
    role: 'Engineering',
    dashboardTitle: 'Dasbor Engineering & Document Control',
    dashboardSubtitle:
      'Kelola revisi gambar teknik, Data Sheet, dan BOM secara digital agar workshop selalu memakai versi terbaru.',
    focusBadge: 'Fokus: Digital Document Control',
    canCreateProposal: false,
    canEditStage: true,
    canEditProcurement: false,
    canEditOperations: false,
    canEditQualityNcr: false,
    canEditCost: false,
    canBumpDocRevision: true,
    highlightedSubsystem: 'documents',
  },
  'Logistics & Procurement': {
    role: 'Logistics & Procurement',
    dashboardTitle: 'Dasbor Pengadaan Bahan & Jasa',
    dashboardSubtitle:
      'Kendalikan PO pemasok dan Material Readiness secara paralel untuk mencegah keterlambatan bahan baku.',
    focusBadge: 'Fokus: Material & Services',
    canCreateProposal: false,
    canEditStage: false,
    canEditProcurement: true,
    canEditOperations: false,
    canEditQualityNcr: false,
    canEditCost: false,
    canBumpDocRevision: false,
    highlightedSubsystem: 'procurement',
  },
  Operations: {
    role: 'Operations',
    dashboardTitle: 'Dasbor Operasi & Workshop',
    dashboardSubtitle:
      'Pantau progres Work Center secara real-time dan eksekusi produksi dengan dokumen revisi terkini.',
    focusBadge: 'Fokus: Operations & Production',
    canCreateProposal: false,
    canEditStage: true,
    canEditProcurement: false,
    canEditOperations: true,
    canEditQualityNcr: false,
    canEditCost: false,
    canBumpDocRevision: false,
    highlightedSubsystem: 'operations',
  },
  'QC / QA': {
    role: 'QC / QA',
    dashboardTitle: 'Dasbor Pengendalian Mutu (QA / QC)',
    dashboardSubtitle:
      'Catat inspeksi, NCR, dan tindakan CAPA secara real-time untuk menekan biaya rework dan repair.',
    focusBadge: 'Fokus: Quality, NCR & CAPA',
    canCreateProposal: false,
    canEditStage: false,
    canEditProcurement: false,
    canEditOperations: false,
    canEditQualityNcr: true,
    canEditCost: false,
    canBumpDocRevision: true,
    highlightedSubsystem: 'quality',
  },
  'Finance & Management': {
    role: 'Finance & Management',
    dashboardTitle: 'Dasbor Eksekutif & Pengendalian Biaya',
    dashboardSubtitle:
      'Pengawasan menyeluruh terhadap jadwal pengiriman, Cost Variance, biaya rework, dan seluruh subsistem.',
    focusBadge: 'Akses Penuh: Pengawasan Lintas Fungsi',
    canCreateProposal: true,
    canEditStage: true,
    canEditProcurement: true,
    canEditOperations: true,
    canEditQualityNcr: true,
    canEditCost: true,
    canBumpDocRevision: true,
    highlightedSubsystem: 'cost',
  },
};

export function getRolePolicy(role: DepartmentRole): RoleDashboardPolicy {
  return ROLE_POLICIES[role];
}

export type ProductCategory =
  | 'Pressure Vessel'
  | 'Heat Exchanger'
  | 'Storage Tank'
  | 'Industrial Piping';

export type OrderStage =
  | 'Proposal'
  | 'Design & Engineering'
  | 'In Production'
  | 'QC & Dispatch'
  | 'Delivered';

export type SubsystemState = 'Pending' | 'In Progress' | 'Delayed' | 'Completed';

export interface ProcurementSubsystem {
  state: SubsystemState;
  materialReadinessPct: number;
  poNumber: string;
  supplierName: string;
  etaDate: string;
}

export interface OperationsSubsystem {
  state: SubsystemState;
  productionProgressPct: number;
  workCenter: string;
  activeShift: string;
}

export interface QualitySubsystem {
  state: SubsystemState;
  inspectionPassed: boolean;
  ncrCount: number;
  lastFeedbackNote: string;
}

export interface CostSubsystem {
  estimatedCostIdr: number;
  actualCostIdr: number;
  reworkCostIdr: number;
}

export interface DocumentRevision {
  id: string;
  docCode: string;
  title: string;
  revision: string;
  updatedByRole: string;
  updatedAt: string;
}

export interface QualityNCR {
  id: string;
  description: string;
  capaAction: string;
  status: 'Open' | 'Resolved';
  reportedAt: string;
}

export interface MTOOrder {
  id: string;
  orderNo: string;
  customerName: string;
  productCategory: ProductCategory;
  projectTitle: string;
  stage: OrderStage;
  targetDeliveryDate: string;
  estimatedLeadMonths: number;
  delayMonths: number;
  procurement: ProcurementSubsystem;
  operations: OperationsSubsystem;
  quality: QualitySubsystem;
  cost: CostSubsystem;
  documents: DocumentRevision[];
  ncrs: QualityNCR[];
  updatedAt: string;
}

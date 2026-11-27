import { readStorage, writeStorage } from '../storage/storage.service.ts';
import type { DepartmentRole } from '../types/auth.types.ts';

export interface DashboardViewPrefs {
  showKpis: boolean;
  showSubsystems: boolean;
  showDocuments: boolean;
  showNcrs: boolean;
}

const PREFS_KEY = 'bbi_mto_view_prefs_v1';

const DEFAULT_PREFS: DashboardViewPrefs = {
  showKpis: true,
  showSubsystems: true,
  showDocuments: true,
  showNcrs: true,
};

export function getRoleViewPrefs(role: DepartmentRole): DashboardViewPrefs {
  const all = readStorage<Partial<Record<DepartmentRole, DashboardViewPrefs>>>(PREFS_KEY, {});
  return { ...DEFAULT_PREFS, ...(all[role] ?? {}) };
}

export function saveRoleViewPrefs(role: DepartmentRole, prefs: DashboardViewPrefs): void {
  const all = readStorage<Partial<Record<DepartmentRole, DashboardViewPrefs>>>(PREFS_KEY, {});
  writeStorage(PREFS_KEY, { ...all, [role]: prefs });
}

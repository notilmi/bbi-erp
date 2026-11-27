export type DepartmentRole =
  | 'Sales & Proposal'
  | 'Engineering'
  | 'Logistics & Procurement'
  | 'Operations'
  | 'QC / QA'
  | 'Finance & Management';

export const DEPARTMENT_ROLES: readonly DepartmentRole[] = [
  'Sales & Proposal',
  'Engineering',
  'Logistics & Procurement',
  'Operations',
  'QC / QA',
  'Finance & Management',
];

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: DepartmentRole;
  location: 'Surabaya Plant' | 'HQ Corporate';
}

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: DepartmentRole;
  location: 'Surabaya Plant' | 'HQ Corporate';
  loggedInAt: string;
}

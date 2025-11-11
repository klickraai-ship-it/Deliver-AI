
export type KpiChangeType = 'increase' | 'decrease' | 'neutral';

export interface KpiData {
  title: string;
  value: string;
  change: string;
  changeType: KpiChangeType;
  period: string;
}

export type ComplianceStatus = 'pass' | 'fail' | 'warn';

export interface ComplianceItem {
  id: string;
  name: string;
  status: ComplianceStatus;
  details: string;
  fixLink: string;
}

export interface DomainPerformanceData {
  name: string;
  deliveryRate: number;
  complaintRate: number;
  spamRate: number;
}

export interface DashboardData {
  kpis: KpiData[];
  gmailSpamRate: number;
  domainPerformance: DomainPerformanceData[];
  complianceChecklist: ComplianceItem[];
}

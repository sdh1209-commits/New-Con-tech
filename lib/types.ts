export type CompanyType = "prime" | "sub";
export type ClaimStatus = "draft" | "submitted" | "approved" | "rejected" | "paid";

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
}

export interface Site {
  id: string;
  name: string;
  address: string | null;
  prime_company_id: string;
  start_date: string | null;
  end_date: string | null;
  status: "active" | "completed";
}

export interface SiteContract {
  id: string;
  site_id: string;
  sub_company_id: string;
  trade: string;
  contract_amount: number;
}

export interface Worker {
  id: string;
  name: string;
  trade: string;
  daily_wage: number;
  sub_company_id: string;
  phone: string | null;
}

export interface Attendance {
  id: string;
  site_id: string;
  worker_id: string;
  work_date: string;
  man_day: number;
  check_in: string | null;
  check_out: string | null;
}

export interface Claim {
  id: string;
  site_id: string;
  sub_company_id: string;
  claim_month: string;
  labor_amount: number;
  material_amount: number;
  equipment_amount: number;
  total_amount: number;
  status: ClaimStatus;
  submitted_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  reject_reason: string | null;
}

export interface ClaimLaborItem {
  id: string;
  claim_id: string;
  worker_id: string;
  man_days: number;
  daily_wage: number;
  amount: number;
}

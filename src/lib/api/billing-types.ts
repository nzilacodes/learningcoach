export type PaymentMethod = "card" | "reference" | "transfer" | "mobile_money";

export type PlanRow = {
  id: string;
  tier: string;
  billing_cycle: string;
  price_kz: number;
  duration_days: number;
  features: string[] | null;
  is_active: boolean;
};

export type SubscriptionRow = {
  id: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  subscription_plans: PlanRow | null;
};

export type PaymentRow = {
  id: string;
  status: string;
  method: string | null;
  reference: string | null;
  invoice_number: string | null;
  amount_kz: number;
  paid_at: string | null;
  created_at: string;
  subscription_plans: Pick<PlanRow, "tier" | "billing_cycle" | "price_kz" | "duration_days"> | null;
};

export type OrderInfo = {
  subscription_id: string;
  payment_id: string;
  reference: string;
  entity: string;
  invoice_number: string;
  amount_kz: number;
};

export type ServiceCode =
  | 'wa'
  | 'tg'
  | 'ig'
  | 'tk'
  | 'go'
  | 'fb'
  | 'ds'
  | 'tw'
  | 'nf'
  | 'sp'
  | 'ot';

export interface ServiceItem {
  id: string;
  name: string;
  code: string;
  category: 'Popular' | 'Social' | 'Messenger' | 'Entertainment' | 'Others';
  icon: string;
  badge?: string;
  minPrice: number;
}

export interface CountryItem {
  id: string;
  code: string;
  name: string;
  flag: string;
  prefix: string;
  costRub: number;
  costIdr: number;
  finalPriceIdr: number;
  stock: number;
}

export type OrderStatus =
  | 'PENDING_SMS'
  | 'SMS_RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface NokosOrder {
  id: string;
  userId: string;
  serviceCode: string;
  serviceName: string;
  countryCode: string;
  countryName: string;
  phoneNumber: string;
  providerOrderId: string;
  price: number;
  cost: number;
  profit: number;
  status: OrderStatus;
  otpCode?: string | null;
  fullSms?: string | null;
  expiresAt: string;
  createdAt: string;
}

export type DepositStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';

export interface DepositRecord {
  id: string;
  userId: string;
  amount: number;
  uniqueCode: number;
  totalPay: number;
  status: DepositStatus;
  paymentMethod: string;
  qrUrl?: string;
  reference?: string;
  createdAt: string;
  paidAt?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  balance: number;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface PricingRule {
  markupPercent: number;
  fixedMarkupIdr: number;
  minPriceIdr: number;
}

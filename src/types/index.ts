export interface CursorConfig {
  userId: string;
  sessionToken: string;
  lastRequest?: Date;
  customHeaders?: Record<string, string>;
}

export interface CachedResponse {
  data: any;
  timestamp: Date;
}

export interface MonthlyInvoiceResponse {
  items?: {
    cents: number;
    [key: string]: any;
  }[];
  [key: string]: any;
}

export interface UsageBasedPremiumResponse {
  usageBasedPremiumRequests?: boolean;
  error?: string;
}

export interface HardLimitResponse {
  hardLimit?: number;
  error?: string;
}

export interface MonthlyInvoiceResult {
  success: boolean;
  totalCents?: number;
  error?: string;
}

export interface ModelData {
  numRequests: number;
  numRequestsTotal: number;
  numTokens: number;
  maxRequestUsage: number;
  maxTokenUsage: null | number;
}

export interface UsageData {
  [key: string]: ModelData | string | boolean | number | undefined;
  "gpt-4": ModelData;
  startOfMonth: string;
  usageBasedPremiumRequests?: boolean;
  hardLimit?: number;
  totalCents?: number;
}
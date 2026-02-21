export enum Availability {
  High   = 'High',
  Medium = 'Medium',
  Low    = 'Low',
  Out    = 'Out of Stock',
}

export enum Commitment {
  OnDemand   = 'On-Demand',
  Spot       = 'Spot',
  Reserved1Y = '1-Year Reserved',
  Reserved3Y = '3-Year Reserved',
}

export interface GPUInstance {
  id: string;
  provider: string;
  providerLogo?: string;
  instanceName: string;
  model: string;
  gpuCount: number;
  vram: number;       // GB
  cpu: number;        // cores
  ram: number;        // GB system RAM
  pricePerHour: number;
  region: string;
  commitment: Commitment;
  availability: Availability;
  link: string;
  lastUpdated: string;
}

export interface FilterState {
  search: string;
  models: string[];
  providers: string[];
  regions: string[];
  commitment: Commitment[];
  minPrice: number;
  maxPrice: number;
  minVram: number;
  gpuCounts: number[]; // -1 means "8+"
}

export type SortField = 'pricePerHour' | 'provider' | 'model' | 'availability' | 'vram' | 'gpuCount' | 'valueScore';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

// ── Price History ────────────────────────────────────────────────────────────

export interface ModelSnapshot {
  min: number;
  avg: number;
  p25: number;
  p75: number;
  count: number;
}

export interface DaySnapshot {
  date: string;
  models: Record<string, ModelSnapshot>;
}

export interface PriceHistory {
  generated: string;
  snapshots: DaySnapshot[];
}

// ── Smart Alerts ─────────────────────────────────────────────────────────────

export type AlertType = 'price-drop' | 'availability' | 'new-low' | 'back-in-stock';

export interface AlertConditions {
  models?: string[];
  providers?: string[];
  minVram?: number;
  maxPrice?: number;
  onlyStable?: boolean;
  onlyHighAvail?: boolean;
}

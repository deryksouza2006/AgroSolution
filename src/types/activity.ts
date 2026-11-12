export type ActivityType = 'IRRIGATION' | 'FERTILIZATION' | 'PLANTING' | 'HARVEST';

export interface ActivityRequest {
  type: ActivityType;
  performedAt: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
}

export interface Activity extends ActivityRequest {
  id: number;
  cropAreaId: number;
  authorId: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityPage {
  content: Activity[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ActivityFilters { type?: ActivityType; from?: string; to?: string }
export interface ActivityFilterValues { type: ActivityType | ''; fromDate: string; toDate: string }
export type ActivityFilterErrors = Partial<Record<keyof ActivityFilterValues, string>>;
export interface ActivityFormValues {
  type: ActivityType | '';
  date: string;
  time: string;
  description: string;
  quantity: string;
  unit: string;
}
export type ActivityFormErrors = Partial<Record<keyof ActivityFormValues, string>>;

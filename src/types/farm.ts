export type AreaUnit = 'HECTARE' | 'SQUARE_METER';

export interface FarmRequest {
  name: string;
  city: string;
  state: string;
  totalArea: number;
  areaUnit: AreaUnit;
}

export interface Farm extends FarmRequest { id: number }

export interface FarmPage {
  content: Farm[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface FarmFormValues {
  name: string;
  city: string;
  state: string;
  totalArea: string;
  areaUnit: AreaUnit | '';
}

export type FarmFormErrors = Partial<Record<keyof FarmFormValues, string>>;

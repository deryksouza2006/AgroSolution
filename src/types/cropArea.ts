import type { AreaUnit } from './farm';

export type CropAreaStatus = 'NORMAL' | 'ATTENTION' | 'CRITICAL' | 'ARCHIVED';

export interface CropAreaRequest {
  farmId: number;
  name: string;
  cropType: string;
  areaSize: number;
  areaUnit: AreaUnit;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
}

export interface CropArea extends CropAreaRequest {
  id: number;
  farmName: string;
  status: CropAreaStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CropAreaPage {
  content: CropArea[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CropAreaFormValues {
  farmId: number | null;
  name: string;
  cropType: string;
  areaSize: string;
  areaUnit: AreaUnit | '';
  latitude: string;
  longitude: string;
  description: string;
}

export type CropAreaFormErrors = Partial<Record<keyof CropAreaFormValues, string>>;
export interface CropAreaSelection { id: number; name: string }

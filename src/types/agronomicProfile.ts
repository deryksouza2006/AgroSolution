export interface AgronomicProfileRequest {
  soilTexture: string;
  fieldCapacityPercent: number;
  wiltingPointPercent: number;
  rootDepthCentimeters: number | null;
  sensorDepthCentimeters: number | null;
  source: string;
  demo: boolean;
}

export interface AgronomicProfile extends AgronomicProfileRequest {
  id: number;
  cropAreaId: number;
  revision: number;
}

export interface AgronomicProfileFormValues {
  soilTexture: string;
  fieldCapacityPercent: string;
  wiltingPointPercent: string;
  rootDepthCentimeters: string;
  sensorDepthCentimeters: string;
  source: string;
  demo: boolean;
}

export type AgronomicProfileFormErrors = Partial<Record<keyof AgronomicProfileFormValues, string>>;

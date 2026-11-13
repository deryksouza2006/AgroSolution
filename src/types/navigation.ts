import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ReadingScope } from './reading';

export type AuthStackParamList = { Login: undefined; Register: undefined };
export type FarmsStackParamList = {
  FarmList: undefined;
  FarmDetails: { id: number };
  FarmCreate: undefined;
  FarmEdit: { id: number };
  CropAreas: NavigatorScreenParams<CropAreasStackParamList>;
};
export type CropAreasStackParamList = {
  CropAreaList: { farmId?: number; farmName?: string } | undefined;
  CropAreaDetails: { id: number; listFarmId?: number };
  CropAreaCreate: { farmId?: number } | undefined;
  CropAreaEdit: { id: number; listFarmId?: number };
  ActivityDiary: { cropAreaId: number; cropAreaName: string };
  AgronomicProfile: { cropAreaId: number };
  AgronomicProfileForm: { cropAreaId: number };
  Sensors: NavigatorScreenParams<SensorsStackParamList>;
  Readings: ReadingsEntryParams;
  RiskJobs: RiskJobsEntryParams;
  Alerts: NavigatorScreenParams<AlertsStackParamList>;
};
export type ActivitiesStackParamList = {
  ActivityList: { cropAreaId: number; cropAreaName: string };
  ActivityDetails: { cropAreaId: number; id: number };
  ActivityCreate: { cropAreaId: number };
  ActivityEdit: { cropAreaId: number; id: number };
};
export type ProducerTabParamList = {
  Home: undefined;
  Farms: NavigatorScreenParams<FarmsStackParamList> | undefined;
  Monitoring: NavigatorScreenParams<CropAreasStackParamList> | undefined;
  Sensors: NavigatorScreenParams<SensorsStackParamList> | undefined;
  Alerts: NavigatorScreenParams<AlertsStackParamList> | undefined;
  Profile: undefined;
};
export type SensorsStackParamList = {
  SensorList: { cropAreaId?: number; cropAreaName?: string } | undefined;
  SensorDetails: { id: number; listCropAreaId?: number };
  SensorCreate: { cropAreaId?: number } | undefined;
  SensorEdit: { id: number; listCropAreaId?: number };
  Readings: ReadingsEntryParams;
};
export type ReadingsEntryParams = { scope: ReadingScope; registerSensorId?: number; readingId?: number };
export type ReadingsStackParamList = {
  ReadingList: { scope: ReadingScope };
  ReadingDetails: { id: number; scope: ReadingScope };
  ReadingCreate: { sensorId?: number; scope: ReadingScope };
};
export type RiskJobsEntryParams = { cropAreaId: number; cropAreaName?: string; jobId?: number } | { jobId: number; cropAreaId?: number; cropAreaName?: string };
export type RiskJobsStackParamList = {
  RiskJobList: { cropAreaId: number; cropAreaName?: string };
  RiskJobDetails: { jobId: number; cropAreaId?: number };
  Alerts: NavigatorScreenParams<AlertsStackParamList>;
};
export type AlertsStackParamList = {
  AlertList: { cropAreaId?: number; cropAreaName?: string } | undefined;
  AlertDetails: { jobId: number };
};
export type ProducerStackParamList = {
  Tabs: NavigatorScreenParams<ProducerTabParamList> | undefined;
  About: undefined;
};

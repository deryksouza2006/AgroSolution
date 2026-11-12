import type { NavigatorScreenParams } from '@react-navigation/native';

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
  Alerts: undefined;
  Profile: undefined;
};
export type SensorsStackParamList = {
  SensorList: { cropAreaId?: number; cropAreaName?: string } | undefined;
  SensorDetails: { id: number; listCropAreaId?: number };
  SensorCreate: { cropAreaId?: number } | undefined;
  SensorEdit: { id: number; listCropAreaId?: number };
};
export type ProducerStackParamList = {
  Tabs: NavigatorScreenParams<ProducerTabParamList> | undefined;
  About: undefined;
};

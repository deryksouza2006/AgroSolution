import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = { Login: undefined; Register: undefined };
export type FarmsStackParamList = {
  FarmList: undefined;
  FarmDetails: { id: number };
  FarmCreate: undefined;
  FarmEdit: { id: number };
};
export type ProducerTabParamList = {
  Home: undefined;
  Farms: NavigatorScreenParams<FarmsStackParamList> | undefined;
  Monitoring: undefined;
  Alerts: undefined;
  Profile: undefined;
};
export type ProducerStackParamList = {
  Tabs: NavigatorScreenParams<ProducerTabParamList> | undefined;
  About: undefined;
};

import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = { Login: undefined; Register: undefined };
export type ProducerTabParamList = {
  Home: undefined;
  Farms: undefined;
  Monitoring: undefined;
  Alerts: undefined;
  Profile: undefined;
};
export type ProducerStackParamList = {
  Tabs: NavigatorScreenParams<ProducerTabParamList> | undefined;
  About: undefined;
};

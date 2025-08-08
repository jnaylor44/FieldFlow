
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp, NavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  WorkerMain: undefined;
  OwnerMain: undefined;
  JobDetail: { jobId: string };
  CreateJob: undefined;
  WorkerJobDetail: { jobId: string };
};
export type OwnerTabParamList = {
  Dashboard: undefined;
  Jobs: undefined;
  Customers: undefined;
  Financials: undefined;
  Settings: undefined;
};
export type WorkerTabParamList = {
  WorkerDashboard: undefined;
  WorkerJobs: undefined;
  WorkerTimeTracking: undefined;
  WorkerProfile: undefined;
};

export type OwnerStackParamList = {
  OwnerTabs: undefined;
  JobDetail: { jobId: string };
  CreateJob: undefined;
};

export type WorkerStackParamList = {
  WorkerTabs: undefined;
  WorkerJobDetail: { jobId: string };
};
export type JobsStackParamList = {
  JobsList: { refresh?: boolean; success?: boolean; message?: string } | undefined;
  JobDetail: { jobId: string };
  CreateJob: undefined;
};
export type WorkerJobsStackParamList = {
  WorkerJobsList: undefined;
  WorkerJobDetail: { jobId: string };
};
export type LoginNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export type DashboardScreenNavigationProp = CompositeNavigationProp
  BottomTabNavigationProp<OwnerTabParamList, 'Dashboard'>,
  StackNavigationProp<RootStackParamList>
>;

export type WorkerDashboardScreenNavigationProp = CompositeNavigationProp
  BottomTabNavigationProp<WorkerTabParamList, 'WorkerDashboard'>,
  StackNavigationProp<RootStackParamList>
>;
export type AppNavigationProp = NavigationProp<RootStackParamList>;
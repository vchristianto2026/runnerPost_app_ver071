export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'courier_sender' | 'citizen_recipient';
  stationName: string;
  lat: number;
  lng: number;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface Waypoint {
  name: string;
  km: number;
  passed: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  recipientStation: string;
  title: string;
  body: string | null;
  originalWordCount: number;
  originalCharCount: number;
  pageFormat: '1_A4' | '2_A4';
  originLocation: { name: string; lat: number; lng: number };
  targetLocation: { name: string; lat: number; lng: number };
  distanceKm: number;
  runnerSpeedKmH: number;
  terrain: 'plains' | 'mountain_pass' | 'river_valley' | 'coastal_ridge';
  weather: 'fair' | 'light_rain' | 'headwind' | 'night_fog';
  effectiveSpeedKmH: number;
  totalTransitMinutes: number;
  progressPercent: number;
  status: 'QUEUED' | 'IN_TRANSIT' | 'DELIVERED' | 'BURNED_DELIVERED' | 'BURNED_IN_FLIGHT' | 'INTERCEPTED_ADMIN';
  autoDeletePolicy: 'BURN_ON_DELIVERY' | 'MID_TRANSIT_TRIGGER' | 'TIMED_EPHEMERAL';
  burnAfterDeliveredSeconds: number;
  deliveredAt: string | null;
  burnedAt: string | null;
  burnReason: string | null;
  encryptionStandard: string;
  digitalSignature: string;
  waypoints: Waypoint[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  runnerMinSpeed: number;
  runnerMaxSpeed: number;
  simulationMultiplier: number;
  strictA4CapEnforced: boolean;
  autoBurnOnDelivery: boolean;
  birdApiMonitoringEnabled: boolean;
}

export interface SenderActivity {
  senderId: string;
  senderName: string;
  totalDispatches: number;
  a4OneCount: number;
  a4TwoCount: number;
  burnedCount: number;
  inFlightCount: number;
  totalChars: number;
  status: 'active' | 'suspended';
}

export interface AdminStats {
  totalMessages: number;
  inTransit: number;
  burned: number;
  delivered: number;
  intercepted: number;
  totalDistanceRunKm: number;
  totalUsers: number;
  sendersActivity: SenderActivity[];
  config: SystemConfig;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'INFO' | 'RUNNER' | 'SECURITY' | 'PURGE' | 'BIRD_API';
  actor: string;
  text: string;
}

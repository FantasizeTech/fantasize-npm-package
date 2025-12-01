export type RtcSignalType = 'offer' | 'answer' | 'candidate' | 'bye' | 'custom';

export interface RtcSignal {
  type: RtcSignalType;
  payload: unknown;
  to?: string;
}

export interface ConnectResponse {
  roomId: string;
  peerId: string;
  heartbeatIntervalMs: number;
  iceServers: string[];
  joinedAt: number;
  metadata: Record<string, unknown>;
  roomMetadata: Record<string, unknown>;
}

export interface HeartbeatResponse {
  lastSeen: number;
}

export interface RelayResponse {
  roomId: string;
  fromPeerId: string;
  signal: RtcSignal;
  listenersNotified: number;
}

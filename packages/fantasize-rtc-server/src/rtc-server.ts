import { EventEmitter } from 'node:events';

export type RtcSignalType = 'offer' | 'answer' | 'candidate' | 'bye' | 'custom';

export interface RtcSignal {
  type: RtcSignalType;
  payload: unknown;
  to?: string;
}

export interface RtcServerConfig {
  iceServers?: string[];
  maxPeersPerRoom?: number;
  heartbeatIntervalMs?: number;
}

export interface RoomOptions {
  maxPeers?: number;
  metadata?: Record<string, unknown>;
}

export interface ConnectResult {
  roomId: string;
  peerId: string;
  heartbeatIntervalMs: number;
  iceServers: string[];
  joinedAt: number;
  metadata: Record<string, unknown>;
  roomMetadata: Record<string, unknown>;
}

export interface RelayResult {
  roomId: string;
  fromPeerId: string;
  signal: RtcSignal;
  listenersNotified: number;
}

export interface RoomSnapshot {
  id: string;
  maxPeers: number;
  metadata: Record<string, unknown>;
  peers: Array<{ id: string; metadata: Record<string, unknown>; lastSeen: number }>;
}

interface PeerState {
  id: string;
  metadata: Record<string, unknown>;
  lastSeen: number;
}

interface RoomState {
  id: string;
  peers: Map<string, PeerState>;
  maxPeers: number;
  metadata: Record<string, unknown>;
}

const DEFAULT_CONFIG: Required<RtcServerConfig> = {
  iceServers: [],
  maxPeersPerRoom: 8,
  heartbeatIntervalMs: 30000,
};

export class RtcServer extends EventEmitter {
  readonly config: Required<RtcServerConfig>;
  private readonly rooms = new Map<string, RoomState>();

  constructor(config: RtcServerConfig = {}) {
    super();
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      iceServers: [...(config.iceServers ?? DEFAULT_CONFIG.iceServers)],
    };
    this.assertConfig(this.config);
  }

  createRoom(roomId: string, options: RoomOptions = {}): RoomState {
    const trimmedId = roomId.trim();
    if (!trimmedId) {
      throw new Error('roomId is required');
    }
    if (this.rooms.has(trimmedId)) {
      throw new Error(`Room ${trimmedId} already exists`);
    }

    const maxPeers = options.maxPeers ?? this.config.maxPeersPerRoom;
    if (maxPeers <= 0) {
      throw new Error('maxPeers must be greater than 0');
    }

    const metadata = options.metadata ?? {};
    const room: RoomState = {
      id: trimmedId,
      peers: new Map(),
      maxPeers,
      metadata,
    };
    this.rooms.set(trimmedId, room);
    this.emit('room:created', { roomId: trimmedId, maxPeers, metadata });
    return room;
  }

  connectPeer(
    roomId: string,
    peerId: string,
    metadata: Record<string, unknown> = {}
  ): ConnectResult {
    const room = this.rooms.get(roomId) ?? this.createRoom(roomId);
    if (room.peers.has(peerId)) {
      throw new Error(`Peer ${peerId} already connected to room ${roomId}`);
    }
    if (room.peers.size >= room.maxPeers) {
      throw new Error(`Room ${roomId} is full`);
    }

    const now = Date.now();
    const peer: PeerState = { id: peerId, metadata, lastSeen: now };
    room.peers.set(peerId, peer);
    this.emit('peer:connected', { roomId: room.id, peerId, metadata });

    return {
      roomId: room.id,
      peerId,
      heartbeatIntervalMs: this.config.heartbeatIntervalMs,
      iceServers: [...this.config.iceServers],
      joinedAt: now,
      metadata,
      roomMetadata: room.metadata,
    };
  }

  heartbeat(roomId: string, peerId: string): number {
    const peer = this.getPeer(roomId, peerId);
    peer.lastSeen = Date.now();
    this.emit('peer:heartbeat', { roomId, peerId, lastSeen: peer.lastSeen });
    return peer.lastSeen;
  }

  relay(roomId: string, fromPeerId: string, signal: RtcSignal): RelayResult {
    const peer = this.getPeer(roomId, fromPeerId);
    const listeners = this.listenerCount('signal');
    this.emit('signal', { roomId, fromPeerId, signal, metadata: peer.metadata });
    return { roomId, fromPeerId, signal, listenersNotified: listeners };
  }

  disconnectPeer(roomId: string, peerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.peers.has(peerId)) {
      return false;
    }

    room.peers.delete(peerId);
    this.emit('peer:disconnected', { roomId, peerId });
    if (room.peers.size === 0) {
      this.rooms.delete(roomId);
      this.emit('room:closed', { roomId });
    }
    return true;
  }

  getRoomSnapshot(roomId: string): RoomSnapshot | undefined {
    const room = this.rooms.get(roomId);
    if (!room) {
      return undefined;
    }

    return {
      id: room.id,
      maxPeers: room.maxPeers,
      metadata: room.metadata,
      peers: Array.from(room.peers.values()).map((peer) => ({
        id: peer.id,
        metadata: peer.metadata,
        lastSeen: peer.lastSeen,
      })),
    };
  }

  private getPeer(roomId: string, peerId: string): PeerState {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} does not exist`);
    }
    const peer = room.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} is not connected to room ${roomId}`);
    }
    return peer;
  }

  private assertConfig(config: Required<RtcServerConfig>): void {
    if (config.maxPeersPerRoom <= 0) {
      throw new Error('maxPeersPerRoom must be greater than 0');
    }
    if (config.heartbeatIntervalMs <= 0) {
      throw new Error('heartbeatIntervalMs must be greater than 0');
    }
  }
}

export const createRtcServer = (config: RtcServerConfig = {}): RtcServer =>
  new RtcServer(config);

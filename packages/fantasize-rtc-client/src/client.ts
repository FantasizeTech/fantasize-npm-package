import { ConnectResponse, HeartbeatResponse, RelayResponse, RtcSignal } from './types';

export interface RtcClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  headers?: Record<string, string>;
}

export class RtcClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: RtcClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.headers = options.headers ?? { 'Content-Type': 'application/json' };
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async connect(roomId: string, peerId: string, metadata?: Record<string, unknown>): Promise<ConnectResponse> {
    return this.post<ConnectResponse>('/rtc/connect', { roomId, peerId, metadata });
  }

  async heartbeat(roomId: string, peerId: string): Promise<HeartbeatResponse> {
    return this.post<HeartbeatResponse>('/rtc/heartbeat', { roomId, peerId });
  }

  async signal(roomId: string, fromPeerId: string, signal: RtcSignal): Promise<RelayResponse> {
    return this.post<RelayResponse>('/rtc/signal', { roomId, fromPeerId, signal });
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`RTC client error ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  }
}

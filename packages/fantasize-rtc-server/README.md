# @fantasizetech/fantasize-rtc-server

Node 20+ friendly, TypeScript-first helper that stands up a lightweight RTC signaling orchestrator in one line and gives you predictable hooks for connecting peers, relaying SDP/candidate messages, and keeping rooms healthy. Publishable as `@fantasizetech/fantasize-rtc-server` (naming aligned with `@fantasizetech/inventory-support`).

## Quick start

```ts
import { createRtcServer } from '@fantasizetech/fantasize-rtc-server';

const rtc = createRtcServer({
  iceServers: ['stun:stun.l.google.com:19302'],
  heartbeatIntervalMs: 15_000,
});

// One line room spin-up when the first peer joins
const alice = rtc.connectPeer('demo-room', 'alice', { role: 'caller' });

rtc.on('signal', ({ roomId, fromPeerId, signal }) => {
  console.log(`relay ${signal.type} from ${fromPeerId} in ${roomId}`);
});

rtc.relay('demo-room', 'alice', {
  type: 'offer',
  payload: { sdp: 'fake-sdp' },
});
```

## Client + server example

Use the server as an HTTP signaling endpoint and consume it with `@fantasizetech/fantasize-rtc-client`:

```ts
// server.ts
import express from 'express';
import { createRtcServer } from '@fantasizetech/fantasize-rtc-server';

const app = express();
app.use(express.json());
const rtc = createRtcServer();

app.post('/rtc/connect', (req, res) =>
  res.json(rtc.connectPeer(req.body.roomId, req.body.peerId, req.body.metadata))
);
app.post('/rtc/heartbeat', (req, res) =>
  res.json({ lastSeen: rtc.heartbeat(req.body.roomId, req.body.peerId) })
);
app.post('/rtc/signal', (req, res) =>
  res.json(rtc.relay(req.body.roomId, req.body.fromPeerId, req.body.signal))
);

app.listen(3000, () => console.log('RTC server on http://localhost:3000'));
```

```ts
// client.ts
import { RtcClient } from '@fantasizetech/fantasize-rtc-client';

const client = new RtcClient({ baseUrl: 'http://localhost:3000' });

async function main() {
  await client.connect('demo-room', 'alice');
  await client.signal('demo-room', 'alice', { type: 'offer', payload: { sdp: '...' } });
  await client.heartbeat('demo-room', 'alice');
}

main();
```

## Frontend example (React + fetch)

```tsx
import React from 'react';

function useRtcClient(baseUrl: string) {
  const connect = (roomId: string, peerId: string, metadata?: Record<string, unknown>) =>
    fetch(`${baseUrl}/rtc/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, peerId, metadata }),
    }).then((r) => r.json());

  const heartbeat = (roomId: string, peerId: string) =>
    fetch(`${baseUrl}/rtc/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, peerId }),
    }).then((r) => r.json());

  const signal = (roomId: string, fromPeerId: string, signal: { type: string; payload: unknown }) =>
    fetch(`${baseUrl}/rtc/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, fromPeerId, signal }),
    }).then((r) => r.json());

  return { connect, heartbeat, signal };
}

export function RtcDemo() {
  const api = useRtcClient('http://localhost:3000');
  const [roomId, setRoomId] = React.useState('demo-room');
  const [peerId, setPeerId] = React.useState('alice');
  const [log, setLog] = React.useState<string[]>([]);

  const append = (msg: string) => setLog((prev) => [...prev, msg]);

  const handleConnect = async () => {
    const info = await api.connect(roomId, peerId, { role: 'caller' });
    append(`Connected ${info.peerId} to ${info.roomId}`);
  };

  const handleSignal = async () => {
    const res = await api.signal(roomId, peerId, { type: 'offer', payload: { sdp: '...' } });
    append(`Sent offer from ${peerId}, listeners=${res.listenersNotified}`);
  };

  const handleHeartbeat = async () => {
    const res = await api.heartbeat(roomId, peerId);
    append(`Heartbeat at ${res.lastSeen}`);
  };

  return (
    <div>
      <h2>RTC Demo</h2>
      <div>
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="roomId" />
        <input value={peerId} onChange={(e) => setPeerId(e.target.value)} placeholder="peerId" />
      </div>
      <button onClick={handleConnect}>Connect</button>
      <button onClick={handleSignal}>Send Offer</button>
      <button onClick={handleHeartbeat}>Heartbeat</button>
      <pre>{log.join('\n')}</pre>
    </div>
  );
}
```

## API surface

- `createRtcServer(config?)` → `RtcServer`
  - Config: `iceServers?: string[]`, `maxPeersPerRoom?: number` (default `8`), `heartbeatIntervalMs?: number` (default `30000`).
- `rtc.createRoom(roomId, options?)` – optional manual room creation; validates capacity and metadata.
- `rtc.connectPeer(roomId, peerId, metadata?)` – auto-creates the room if needed and returns heartbeat/ICE settings for the peer.
- `rtc.heartbeat(roomId, peerId)` – updates liveness and emits `peer:heartbeat`.
- `rtc.relay(roomId, fromPeerId, signal)` – emits `signal` with metadata so you can fan out to other peers.
- `rtc.disconnectPeer(roomId, peerId)` – removes the peer and closes the room when empty.
- `rtc.getRoomSnapshot(roomId)` – inspect current peers and metadata for debugging or observability.

Events emitted: `room:created`, `room:closed`, `peer:connected`, `peer:disconnected`, `peer:heartbeat`, `signal`.

## Framework snippets

Quick drop-in handlers that reuse the same three routes (`/rtc/connect`, `/rtc/heartbeat`, `/rtc/signal`) so you can immediately wire the server into your transport of choice. Full files live under `packages/fantasize-rtc-server/examples`.

- Express: `packages/fantasize-rtc-server/examples/express.ts`
  ```ts
  import express from 'express';
  import { createRtcServer } from '@fantasizetech/fantasize-rtc-server';

  const app = express();
  app.use(express.json());
  const rtc = createRtcServer();

  app.post('/rtc/connect', (req, res) =>
    res.json(rtc.connectPeer(req.body.roomId, req.body.peerId, req.body.metadata))
  );
  app.post('/rtc/heartbeat', (req, res) =>
    res.json({ lastSeen: rtc.heartbeat(req.body.roomId, req.body.peerId) })
  );
  app.post('/rtc/signal', (req, res) =>
    res.json(rtc.relay(req.body.roomId, req.body.fromPeerId, req.body.signal))
  );
  ```

- NestJS: `packages/fantasize-rtc-server/examples/nestjs.ts`
  ```ts
  import { createRtcServer } from '@fantasizetech/fantasize-rtc-server';

  @Controller('rtc')
  export class RtcController {
    private readonly rtc = createRtcServer();

    @Post('connect')
    connect(@Body() dto: ConnectDto) {
      return this.rtc.connectPeer(dto.roomId, dto.peerId, dto.metadata);
    }

    @Post('heartbeat')
    heartbeat(@Body() dto: HeartbeatDto) {
      return { lastSeen: this.rtc.heartbeat(dto.roomId, dto.peerId) };
    }

    @Post('signal')
    signal(@Body() dto: SignalDto) {
      return this.rtc.relay(dto.roomId, dto.fromPeerId, dto.signal);
    }
  }
  ```

- Hono: `packages/fantasize-rtc-server/examples/hono.ts`
  ```ts
  import { Hono } from 'hono';
  import { createRtcServer } from '@fantasizetech/fantasize-rtc-server';

  const app = new Hono();
  const rtc = createRtcServer();

  app.post('/rtc/connect', async (c) => {
    const { roomId, peerId, metadata } = await c.req.json();
    return c.json(rtc.connectPeer(roomId, peerId, metadata));
  });
  app.post('/rtc/heartbeat', async (c) => {
    const { roomId, peerId } = await c.req.json();
    return c.json({ lastSeen: rtc.heartbeat(roomId, peerId) });
  });
  app.post('/rtc/signal', async (c) => {
    const { roomId, fromPeerId, signal } = await c.req.json();
    return c.json(rtc.relay(roomId, fromPeerId, signal));
  });
  ```

- EliyaJS/Elysia: `packages/fantasize-rtc-server/examples/eliyajs.ts`
  ```ts
  import { Elysia } from 'elysia';
  import { createRtcServer } from '@fantasizetech/fantasize-rtc-server';

  const app = new Elysia();
  const rtc = createRtcServer();

  app.post('/rtc/connect', ({ body }) => rtc.connectPeer(body.roomId, body.peerId, body.metadata));
  app.post('/rtc/heartbeat', ({ body }) => ({ lastSeen: rtc.heartbeat(body.roomId, body.peerId) }));
  app.post('/rtc/signal', ({ body }) => rtc.relay(body.roomId, body.fromPeerId, body.signal));
  ```

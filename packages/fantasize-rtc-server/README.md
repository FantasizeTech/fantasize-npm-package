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

## Testing

Run the Jest suite with strict 100% coverage thresholds enforced:

```bash
npx nx test @fantasizetech/fantasize-rtc-server --coverage
```

All branches, statements, and functions are covered to ensure the RTC workflow surface remains reliable as it evolves.

## Build for npm

Build the distributable (CJS + typings) ready to publish as `@fantasizetech/fantasize-rtc-server`:

```bash
npx nx build @fantasizetech/fantasize-rtc-server
```

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

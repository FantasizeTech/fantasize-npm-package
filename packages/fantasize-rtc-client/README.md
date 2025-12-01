# @fantasizetech/fantasize-rtc-client

Lightweight TypeScript client for `@fantasizetech/fantasize-rtc-server`. Handles connect/heartbeat/signal over HTTP so your frontend (or another service) can talk to the signaling server in a few lines.

## Install

```bash
npm i @fantasizetech/fantasize-rtc-client
```

Peer (server) package:

```bash
npm i @fantasizetech/fantasize-rtc-server
```

## Quick start (frontend-friendly)

```ts
import { RtcClient } from '@fantasizetech/fantasize-rtc-client';

const rtc = new RtcClient({ baseUrl: 'http://localhost:3000' });

// join room
const join = await rtc.connect('demo-room', 'alice', { role: 'caller' });
console.log(join.iceServers, join.heartbeatIntervalMs);

// send offer
await rtc.signal('demo-room', 'alice', {
  type: 'offer',
  payload: { sdp: '...' },
});

// keep alive
await rtc.heartbeat('demo-room', 'alice');
```

## React hook example

```tsx
import React from 'react';
import { RtcClient } from '@fantasizetech/fantasize-rtc-client';

const client = new RtcClient({ baseUrl: 'http://localhost:3000' });

export function RtcWidget() {
  const [roomId, setRoomId] = React.useState('demo-room');
  const [peerId, setPeerId] = React.useState('alice');
  const [log, setLog] = React.useState<string[]>([]);

  const logMsg = (msg: string) => setLog((prev) => [...prev, msg]);

  const handleConnect = async () => {
    const res = await client.connect(roomId, peerId, { role: 'caller' });
    logMsg(`connected ${res.peerId} (heartbeat ${res.heartbeatIntervalMs}ms)`);
  };

  const handleSignal = async () => {
    const res = await client.signal(roomId, peerId, { type: 'offer', payload: { sdp: '...' } });
    logMsg(`offer sent (listeners=${res.listenersNotified})`);
  };

  const handleHeartbeat = async () => {
    const res = await client.heartbeat(roomId, peerId);
    logMsg(`heartbeat at ${res.lastSeen}`);
  };

  return (
    <div>
      <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="room id" />
      <input value={peerId} onChange={(e) => setPeerId(e.target.value)} placeholder="peer id" />
      <button onClick={handleConnect}>Connect</button>
      <button onClick={handleSignal}>Send Offer</button>
      <button onClick={handleHeartbeat}>Heartbeat</button>
      <pre>{log.join('\n')}</pre>
    </div>
  );
}
```

## API

- `new RtcClient({ baseUrl, headers?, fetchImpl? })`
  - `baseUrl`: URL of your `@fantasizetech/fantasize-rtc-server` (no trailing slash needed).
  - `headers`: optional headers (default `Content-Type: application/json`).
  - `fetchImpl`: custom fetch (useful for SSR/tests); defaults to global `fetch` in Node 20+ or browsers.
- `rtc.connect(roomId, peerId, metadata?)` → `ConnectResponse`
- `rtc.heartbeat(roomId, peerId)` → `HeartbeatResponse`
- `rtc.signal(roomId, fromPeerId, signal)` → `RelayResponse`

Types are exported for convenience: `ConnectResponse`, `HeartbeatResponse`, `RelayResponse`, `RtcSignal`, `RtcSignalType`.

## Pairing with @fantasizetech/fantasize-rtc-server

Minimal end-to-end example with the server using Express and this client from another service/frontend:

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
// client.ts (or React hook/component)
import { RtcClient } from '@fantasizetech/fantasize-rtc-client';

const client = new RtcClient({ baseUrl: 'http://localhost:3000' });

async function demo() {
  await client.connect('room-1', 'alice');
  await client.signal('room-1', 'alice', { type: 'offer', payload: { sdp: '...' } });
  await client.heartbeat('room-1', 'alice');
}

demo();
```

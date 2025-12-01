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

rtc.on('signal', ({ roomId, fromPeerId, signal }) => {
  console.log(`[hono] relay ${signal.type} from ${fromPeerId} in ${roomId}`);
});

export default app;

import { Elysia } from 'elysia';
import { createRtcServer } from '@fantasizetech/fantasize-rtc-server';

const app = new Elysia();
const rtc = createRtcServer();

app.post('/rtc/connect', ({ body }) =>
  rtc.connectPeer(body.roomId, body.peerId, body.metadata)
);

app.post('/rtc/heartbeat', ({ body }) => ({
  lastSeen: rtc.heartbeat(body.roomId, body.peerId),
}));

app.post('/rtc/signal', ({ body }) => rtc.relay(body.roomId, body.fromPeerId, body.signal));

rtc.on('signal', ({ roomId, fromPeerId, signal }) => {
  console.log(`[elysia] relay ${signal.type} from ${fromPeerId} in ${roomId}`);
});

app.listen(3000);
console.log('Elysia-based RTC signaling on http://localhost:3000');

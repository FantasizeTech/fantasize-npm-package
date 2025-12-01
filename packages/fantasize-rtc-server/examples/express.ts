import express from 'express';
import { createRtcServer } from '@fantasizetech/fantasize-rtc-server';

const app = express();
app.use(express.json());

const rtc = createRtcServer({
  iceServers: ['stun:stun.l.google.com:19302'],
});

app.post('/rtc/connect', (req, res) => {
  const { roomId, peerId, metadata } = req.body;
  res.json(rtc.connectPeer(roomId, peerId, metadata));
});

app.post('/rtc/heartbeat', (req, res) => {
  const { roomId, peerId } = req.body;
  res.json({ lastSeen: rtc.heartbeat(roomId, peerId) });
});

app.post('/rtc/signal', (req, res) => {
  const { roomId, fromPeerId, signal } = req.body;
  const result = rtc.relay(roomId, fromPeerId, signal);
  res.json(result);
});

// Fan out to your own transport (WebSocket, SSE, etc.)
rtc.on('signal', ({ roomId, fromPeerId, signal }) => {
  console.log(`[express] relay ${signal.type} from ${fromPeerId} in ${roomId}`);
});

app.listen(3000, () => {
  console.log('RTC signaling listening on http://localhost:3000');
});

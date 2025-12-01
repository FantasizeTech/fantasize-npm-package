import { Body, Controller, Post } from '@nestjs/common';
import { createRtcServer } from '@fantasizetech/fantasize-rtc-server';

const rtc = createRtcServer();

class ConnectDto {
  roomId!: string;
  peerId!: string;
  metadata?: Record<string, unknown>;
}

class HeartbeatDto {
  roomId!: string;
  peerId!: string;
}

class SignalDto {
  roomId!: string;
  fromPeerId!: string;
  signal!: { type: string; payload: unknown };
}

@Controller('rtc')
export class RtcController {
  @Post('connect')
  connect(@Body() body: ConnectDto) {
    return rtc.connectPeer(body.roomId, body.peerId, body.metadata);
  }

  @Post('heartbeat')
  heartbeat(@Body() body: HeartbeatDto) {
    return { lastSeen: rtc.heartbeat(body.roomId, body.peerId) };
  }

  @Post('signal')
  signal(@Body() body: SignalDto) {
    return rtc.relay(body.roomId, body.fromPeerId, body.signal);
  }
}

rtc.on('signal', ({ roomId, fromPeerId, signal }) => {
  // push to gateway/websocket as needed
  console.log(`[nestjs] relay ${signal.type} from ${fromPeerId} in ${roomId}`);
});

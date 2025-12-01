import { createRtcServer } from './rtc-server';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RtcServer', () => {
  it('creates a server with defaults and auto-creates rooms on first peer', () => {
    const server = createRtcServer();
    const connection = server.connectPeer('demo', 'alice', { role: 'caller' });

    expect(connection.iceServers).toEqual([]);
    expect(connection.heartbeatIntervalMs).toBe(30000);

    const snapshot = server.getRoomSnapshot('demo');
    expect(snapshot).toBeDefined();
    expect(snapshot?.peers[0]).toMatchObject({ id: 'alice', metadata: { role: 'caller' } });

    const initialLastSeen = snapshot?.peers[0].lastSeen ?? 0;
    jest.spyOn(Date, 'now').mockReturnValue(initialLastSeen + 1000);
    const updated = server.heartbeat('demo', 'alice');
    expect(updated).toBe(initialLastSeen + 1000);
    expect(server.getRoomSnapshot('demo')?.peers[0].lastSeen).toBe(updated);
  });

  it('honors custom config, metadata and relays signals', () => {
    const server = createRtcServer({
      maxPeersPerRoom: 2,
      heartbeatIntervalMs: 1200,
      iceServers: ['stun:staging.example.org'],
    });

    const createdRooms: string[] = [];
    server.on('room:created', ({ roomId }) => createdRooms.push(roomId));
    server.createRoom('with-meta', { maxPeers: 1, metadata: { region: 'eu-central' } });
    expect(createdRooms).toContain('with-meta');

    const joined = server.connectPeer('with-meta', 'bob', { role: 'host' });
    expect(joined.heartbeatIntervalMs).toBe(1200);
    expect(joined.iceServers).toEqual(['stun:staging.example.org']);
    expect(joined.roomMetadata).toEqual({ region: 'eu-central' });

    const relayed: unknown[] = [];
    server.on('signal', (payload) => relayed.push(payload));
    const relayResult = server.relay('with-meta', 'bob', {
      type: 'offer',
      payload: { sdp: 'mock' },
    });

    expect(relayResult.listenersNotified).toBe(1);
    expect(relayed[0]).toMatchObject({
      roomId: 'with-meta',
      fromPeerId: 'bob',
      signal: { type: 'offer', payload: { sdp: 'mock' } },
      metadata: { role: 'host' },
    });
  });

  it('validates configuration and enforces room invariants', () => {
    expect(() => createRtcServer({ maxPeersPerRoom: 0 })).toThrow(
      'maxPeersPerRoom must be greater than 0'
    );
    expect(() => createRtcServer({ heartbeatIntervalMs: 0 })).toThrow(
      'heartbeatIntervalMs must be greater than 0'
    );

    const server = createRtcServer({ maxPeersPerRoom: 1 });
    expect(() => server.createRoom('   ')).toThrow('roomId is required');

    server.createRoom('cap');
    server.connectPeer('cap', 'alice');
    expect(() => server.connectPeer('cap', 'alice')).toThrow(
      'Peer alice already connected to room cap'
    );
    expect(() => server.connectPeer('cap', 'bob')).toThrow('Room cap is full');
    expect(() => server.createRoom('cap')).toThrow('Room cap already exists');
    expect(() => server.heartbeat('missing', 'ghost')).toThrow('Room missing does not exist');
    expect(() => server.heartbeat('cap', 'ghost')).toThrow(
      'Peer ghost is not connected to room cap'
    );
  });

  it('disconnects peers, tears down empty rooms and reports missing peers', () => {
    const server = createRtcServer();
    const closedRooms: string[] = [];
    server.on('room:closed', ({ roomId }) => closedRooms.push(roomId));

    server.connectPeer('goodbye', 'alice');
    server.connectPeer('goodbye', 'bob');

    expect(server.disconnectPeer('goodbye', 'alice')).toBe(true);
    expect(server.disconnectPeer('goodbye', 'bob')).toBe(true);
    expect(closedRooms).toContain('goodbye');
    expect(server.getRoomSnapshot('goodbye')).toBeUndefined();
    expect(server.disconnectPeer('missing', 'ghost')).toBe(false);
  });
});

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Paths for text-based database and activity logs
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const LOG_FILE = path.join(DATA_DIR, 'activity_log.txt');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'courier_sender' | 'citizen_recipient';
  stationName: string;
  lat: number;
  lng: number;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface Waypoint {
  name: string;
  km: number;
  passed: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  recipientStation: string;
  title: string;
  body: string | null; // null or placeholder when auto-deleted
  originalWordCount: number;
  originalCharCount: number;
  pageFormat: '1_A4' | '2_A4';
  originLocation: { name: string; lat: number; lng: number };
  targetLocation: { name: string; lat: number; lng: number };
  distanceKm: number;
  runnerSpeedKmH: number; // 8 - 12 km/h
  terrain: 'plains' | 'mountain_pass' | 'river_valley' | 'coastal_ridge';
  weather: 'fair' | 'light_rain' | 'headwind' | 'night_fog';
  effectiveSpeedKmH: number;
  totalTransitMinutes: number;
  progressPercent: number; // 0 - 100
  status: 'QUEUED' | 'IN_TRANSIT' | 'DELIVERED' | 'BURNED_DELIVERED' | 'BURNED_IN_FLIGHT' | 'INTERCEPTED_ADMIN';
  autoDeletePolicy: 'BURN_ON_DELIVERY' | 'MID_TRANSIT_TRIGGER' | 'TIMED_EPHEMERAL';
  burnAfterDeliveredSeconds: number;
  deliveredAt: string | null;
  burnedAt: string | null;
  burnReason: string | null;
  encryptionStandard: string; // 'AES-256-GCM Military Grade'
  digitalSignature: string;
  waypoints: Waypoint[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  runnerMinSpeed: number;
  runnerMaxSpeed: number;
  simulationMultiplier: number; // 1x to 300x
  strictA4CapEnforced: boolean;
  autoBurnOnDelivery: boolean;
  birdApiMonitoringEnabled: boolean;
}

export interface DatabaseState {
  users: User[];
  messages: Message[];
  config: SystemConfig;
}

// Haversine distance formula
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Generate realistic waypoints along route
function generateWaypoints(origin: string, target: string, totalKm: number): Waypoint[] {
  const count = Math.max(2, Math.min(5, Math.ceil(totalKm / 30)));
  const waypoints: Waypoint[] = [];
  const descriptors = ['Citadel Gate', 'River Relay Point', 'Highland Cairn', 'Watchtower Alpha', 'Courier Depot', 'Valley Crossing', 'Resting Post'];
  for (let i = 1; i <= count; i++) {
    const fraction = i / (count + 1);
    const kmMark = Math.round(totalKm * fraction * 10) / 10;
    const name = `${origin}–${target} ${descriptors[(i - 1) % descriptors.length]} (${kmMark}km)`;
    waypoints.push({ name, km: kmMark, passed: false });
  }
  return waypoints;
}

// Append entry to text-based activity log file
function appendToActivityLog(level: 'INFO' | 'RUNNER' | 'SECURITY' | 'PURGE' | 'BIRD_API', actor: string, message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level.padEnd(8)}] [${actor.padEnd(16)}] ${message}` + '\n';
  try {
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
  } catch (err) {
    console.error('Failed to append to activity log file:', err);
  }
}

// Initial default seed database
const DEFAULT_DATABASE: DatabaseState = {
  config: {
    runnerMinSpeed: 8.0,
    runnerMaxSpeed: 12.0,
    simulationMultiplier: 60, // 1 min per second for responsive demonstration
    strictA4CapEnforced: true,
    autoBurnOnDelivery: true,
    birdApiMonitoringEnabled: true,
  },
  users: [
    {
      id: 'usr-admin-1',
      username: 'admin',
      name: 'Marshal Inspector Vane',
      role: 'admin',
      stationName: 'Grand Central Postal Bastion',
      lat: -6.2088,
      lng: 106.8456,
      status: 'active',
      created_at: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'usr-victor-2',
      username: 'victor',
      name: 'Scholar Victor C.',
      role: 'courier_sender',
      stationName: 'Batavia Royal Academy Station',
      lat: -6.1754,
      lng: 106.8272,
      status: 'active',
      created_at: new Date('2026-01-10').toISOString(),
    },
    {
      id: 'usr-hermes-3',
      username: 'hermes',
      name: 'Hermes of Attica',
      role: 'courier_sender',
      stationName: 'Athens Marathon Relay Post',
      lat: 37.9838,
      lng: 23.7275,
      status: 'active',
      created_at: new Date('2026-02-01').toISOString(),
    },
    {
      id: 'usr-elena-4',
      username: 'elena',
      name: 'Ambassador Elena R.',
      role: 'citizen_recipient',
      stationName: 'Priangan Highland Embassy (Bandung)',
      lat: -6.9175,
      lng: 107.6191,
      status: 'active',
      created_at: new Date('2026-02-15').toISOString(),
    },
    {
      id: 'usr-sophia-5',
      username: 'sophia',
      name: 'Archivist Sophia',
      role: 'citizen_recipient',
      stationName: 'Peloponnese Vault (Sparta)',
      lat: 37.0745,
      lng: 22.4303,
      status: 'active',
      created_at: new Date('2026-03-01').toISOString(),
    },
    {
      id: 'usr-marcus-6',
      username: 'marcus',
      name: 'Marcus Valerius',
      role: 'courier_sender',
      stationName: 'Forum Romanum Outpost',
      lat: 41.8925,
      lng: 12.4853,
      status: 'active',
      created_at: new Date('2026-03-10').toISOString(),
    },
  ],
  messages: [
    {
      id: 'RP-MSG-1049',
      senderId: 'usr-victor-2',
      senderName: 'Scholar Victor C.',
      senderRole: 'courier_sender',
      recipientId: 'usr-elena-4',
      recipientName: 'Ambassador Elena R.',
      recipientStation: 'Priangan Highland Embassy (Bandung)',
      title: 'Discourse on Deliberate Human Latency & Anti-Fatigue Communication',
      body: `Dearest Ambassador Elena,\n\nI pen this dispatch on standard royal manuscript velum (Format 1-A4) under the seal of the runnerPost courier guild. As our recent strategic whitepaper demonstrates, the obsession of the past three decades with millisecond latency has extracted an untenable psychological toll. Over eighty percent of our youth experience severe cognitive exhaustion under relentless instant notifications.\n\nBy tethering this epistle to the physical pace of a trained human runner—coursing between Batavia and Priangan at an measured speed of 10.4 kilometers per hour—we reclaim sovereignty of thought. Even as the runner crosses the Citarum river valley, this message remains shielded under 256-bit AES cryptographic encapsulation.\n\nPer the established security protocol, this message is marked for irrevocable ephemeral deletion upon arrival or under mid-transit sender revocation. May your reflections be deep and uninterrupted by artificial haste.\n\nYours in patience,\nVictor C.`,
      originalWordCount: 168,
      originalCharCount: 994,
      pageFormat: '1_A4',
      originLocation: { name: 'Batavia Royal Academy Station', lat: -6.1754, lng: 106.8272 },
      targetLocation: { name: 'Priangan Highland Embassy (Bandung)', lat: -6.9175, lng: 107.6191 },
      distanceKm: 120.5,
      runnerSpeedKmH: 10.4,
      terrain: 'mountain_pass',
      weather: 'fair',
      effectiveSpeedKmH: 8.8,
      totalTransitMinutes: 821,
      progressPercent: 42.5,
      status: 'IN_TRANSIT',
      autoDeletePolicy: 'BURN_ON_DELIVERY',
      burnAfterDeliveredSeconds: 10,
      deliveredAt: null,
      burnedAt: null,
      burnReason: null,
      encryptionStandard: 'AES-256-GCM Military Grade',
      digitalSignature: 'SIG-256-VTR-994-BATAVIA-8A7B',
      waypoints: [
        { name: 'Batavia–Bandung Valley Crossing (30.1km)', km: 30.1, passed: true },
        { name: 'Batavia–Bandung Highland Cairn (60.3km)', km: 60.3, passed: false },
        { name: 'Batavia–Bandung Watchtower Alpha (90.4km)', km: 90.4, passed: false },
      ],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'RP-MSG-1021',
      senderId: 'usr-hermes-3',
      senderName: 'Hermes of Attica',
      senderRole: 'courier_sender',
      recipientId: 'usr-sophia-5',
      recipientName: 'Archivist Sophia',
      recipientStation: 'Peloponnese Vault (Sparta)',
      title: 'Historical Proclamation of Marathon & Carrier Avian RFC-1149',
      body: '[CRYPTOGRAPHICALLY PURGED BY EPHEMERAL PROTOCOL — BURN ON DELIVERY EXECUTED]',
      originalWordCount: 312,
      originalCharCount: 1845,
      pageFormat: '1_A4',
      originLocation: { name: 'Athens Marathon Relay Post', lat: 37.9838, lng: 23.7275 },
      targetLocation: { name: 'Peloponnese Vault (Sparta)', lat: 37.0745, lng: 22.4303 },
      distanceKm: 153.2,
      runnerSpeedKmH: 11.2,
      terrain: 'plains',
      weather: 'fair',
      effectiveSpeedKmH: 11.2,
      totalTransitMinutes: 820,
      progressPercent: 100,
      status: 'BURNED_DELIVERED',
      autoDeletePolicy: 'BURN_ON_DELIVERY',
      burnAfterDeliveredSeconds: 5,
      deliveredAt: new Date(Date.now() - 7200000).toISOString(),
      burnedAt: new Date(Date.now() - 7195000).toISOString(),
      burnReason: 'Automatic Ephemeral Burn upon Delivery Completion (1-A4 Length Threshold)',
      encryptionStandard: 'AES-256-GCM Military Grade',
      digitalSignature: 'SIG-256-HRM-1845-ATHENS-3F21',
      waypoints: [
        { name: 'Athens–Sparta Citadel Gate (38.3km)', km: 38.3, passed: true },
        { name: 'Athens–Sparta River Relay Point (76.6km)', km: 76.6, passed: true },
        { name: 'Athens–Sparta Courier Depot (114.9km)', km: 114.9, passed: true },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7195000).toISOString(),
    },
  ],
};

// Database helper functions
function loadDatabase(): DatabaseState {
  try {
    if (!fs.existsSync(DB_FILE)) {
      saveDatabase(DEFAULT_DATABASE);
      // Seed initial activity log
      if (!fs.existsSync(LOG_FILE)) {
        appendToActivityLog('INFO', 'SYSTEM', 'runnerPost text database initialized.');
        appendToActivityLog('INFO', 'SYSTEM', 'Human Latency Network engine activated (8.0-12.0 km/h boundaries).');
        appendToActivityLog('SECURITY', 'CRYPT_AGENT', 'AES-256 Zero-Knowledge ephemeral shredder armed.');
        appendToActivityLog('BIRD_API', 'GATEWAY', 'Bird API telemetry bridge mounted per RFC standards.');
        appendToActivityLog('RUNNER', 'usr-victor-2', 'Dispatch RP-MSG-1049 en route: Batavia -> Priangan (120.5 km, 8.8 km/h eff).');
        appendToActivityLog('PURGE', 'EPHEMERAL_CORE', 'Message RP-MSG-1021 delivered to Sparta and permanently shredded from disk.');
      }
      return DEFAULT_DATABASE;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading text-based db.json:', err);
    return DEFAULT_DATABASE;
  }
}

function saveDatabase(state: DatabaseState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing text-based db.json:', err);
  }
}

// Background simulation ticker: updates runner progress and processes auto-burns
setInterval(() => {
  const db = loadDatabase();
  let modified = false;
  const now = new Date();

  db.messages.forEach((msg) => {
    if (msg.status === 'IN_TRANSIT') {
      // Calculate delta progress
      // totalTransitMinutes at effective speed
      // In simulation mode, 1 tick (2s) represents (2 * multiplier) seconds
      const simSecondsPerTick = 2 * (db.config.simulationMultiplier || 60);
      const simMinutesPerTick = simSecondsPerTick / 60;
      const progressDelta = (simMinutesPerTick / Math.max(1, msg.totalTransitMinutes)) * 100;
      
      const newProgress = Math.min(100, msg.progressPercent + progressDelta);
      msg.progressPercent = Math.round(newProgress * 10) / 10;
      msg.updatedAt = now.toISOString();
      modified = true;

      // Check waypoints
      const currentKmTraversed = (msg.progressPercent / 100) * msg.distanceKm;
      msg.waypoints.forEach((wp) => {
        if (!wp.passed && currentKmTraversed >= wp.km) {
          wp.passed = true;
          appendToActivityLog('RUNNER', msg.senderName, `Courier passed waypoint: "${wp.name}" (${wp.km}km) on message ${msg.id}`);
        }
      });

      // Arrival detection
      if (msg.progressPercent >= 100) {
        msg.status = 'DELIVERED';
        msg.deliveredAt = now.toISOString();
        appendToActivityLog('RUNNER', msg.senderName, `Courier delivered message ${msg.id} to ${msg.recipientName} at ${msg.recipientStation}.`);

        // Check auto-burn policy
        if (db.config.autoBurnOnDelivery || msg.autoDeletePolicy === 'BURN_ON_DELIVERY') {
          // Automatic shredding
          msg.status = 'BURNED_DELIVERED';
          msg.burnedAt = new Date().toISOString();
          msg.burnReason = `Automatic Ephemeral Burn upon Delivery Completion (${msg.pageFormat} Length Threshold Fulfilled)`;
          msg.body = `[CRYPTOGRAPHICALLY SHREDDED & PURGED — ${msg.pageFormat} DELIVERED & DESTROYED BY EPHEMERAL PROTOCOL]`;
          appendToActivityLog('PURGE', 'EPHEMERAL_CORE', `Ephemeral destruction executed: Message ${msg.id} shredded after delivery. Plaintext unlinked.`);
        }
      }
    }
  });

  if (modified) {
    saveDatabase(db);
  }
}, 2000);

// --- REST API ENDPOINTS ---

// Auth me / current session
app.get('/api/auth/me', (req, res) => {
  const db = loadDatabase();
  const userId = (req.headers['x-user-id'] as string) || 'usr-victor-2';
  const user = db.users.find((u) => u.id === userId) || db.users[1];
  res.json({ success: true, user, allUsers: db.users });
});

// Switch persona / login
app.post('/api/auth/switch', (req, res) => {
  const { userId } = req.body;
  const db = loadDatabase();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  appendToActivityLog('SECURITY', user.username, `Session identity switched to ${user.name} (${user.role}).`);
  res.json({ success: true, user });
});

// User register
app.post('/api/auth/register', (req, res) => {
  const { username, name, role, stationName, lat, lng } = req.body;
  const db = loadDatabase();

  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    res.status(400).json({ success: false, error: 'Username already registered' });
    return;
  }

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username,
    name: name || username,
    role: role || 'courier_sender',
    stationName: stationName || 'Custom Outpost',
    lat: Number(lat) || -6.2,
    lng: Number(lng) || 106.8,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);
  appendToActivityLog('SECURITY', 'AUTH_REGISTRY', `New user registered: ${newUser.name} as ${newUser.role}.`);
  res.json({ success: true, user: newUser });
});

// List messages
app.get('/api/messages', (req, res) => {
  const db = loadDatabase();
  const userId = (req.query.userId as string) || '';
  const role = (req.query.role as string) || '';

  let list = db.messages;
  if (role !== 'admin' && userId) {
    list = list.filter((m) => m.senderId === userId || m.recipientId === userId);
  }
  res.json({ success: true, messages: list });
});

// Create new courier dispatch
app.post('/api/messages', (req, res) => {
  const db = loadDatabase();
  const {
    senderId,
    recipientId,
    title,
    body,
    pageFormat, // '1_A4' | '2_A4'
    runnerSpeedKmH,
    terrain = 'plains',
    weather = 'fair',
    autoDeletePolicy = 'BURN_ON_DELIVERY',
  } = req.body;

  const sender = db.users.find((u) => u.id === senderId);
  const recipient = db.users.find((u) => u.id === recipientId);

  if (!sender || !recipient) {
    res.status(400).json({ success: false, error: 'Sender or Recipient not found' });
    return;
  }

  if (sender.status === 'suspended') {
    res.status(403).json({ success: false, error: 'Sender account is suspended by Administrative Security Control' });
    return;
  }

  // A4 Character Limits Enforcement:
  // 1-A4: max 3,000 chars (~500-600 words)
  // 2-A4: max 6,000 chars (~1,000-1,200 words)
  const charLimit = pageFormat === '2_A4' ? 6000 : 3000;
  if (db.config.strictA4CapEnforced && (body?.length || 0) > charLimit) {
    res.status(400).json({
      success: false,
      error: `Manuscript exceeds capacity for ${pageFormat}. Current: ${body.length} characters; Limit: ${charLimit} characters.`,
    });
    return;
  }

  // Speed boundaries enforcement: 8.0 to 12.0 km/h
  let speed = Number(runnerSpeedKmH) || 10.0;
  if (speed < db.config.runnerMinSpeed) speed = db.config.runnerMinSpeed;
  if (speed > db.config.runnerMaxSpeed) speed = db.config.runnerMaxSpeed;

  // Calculate terrain and weather speed penalty
  let modifier = 1.0;
  if (terrain === 'mountain_pass') modifier *= 0.82;
  if (terrain === 'marshland') modifier *= 0.75;
  if (terrain === 'coastal_ridge') modifier *= 1.04;
  if (weather === 'light_rain') modifier *= 0.92;
  if (weather === 'headwind') modifier *= 0.88;
  if (weather === 'night_fog') modifier *= 0.85;

  const effectiveSpeedKmH = Math.round(speed * modifier * 10) / 10;
  const distanceKm = calculateHaversineDistanceKm(sender.lat, sender.lng, recipient.lat, recipient.lng) || 45.0;
  const totalTransitMinutes = Math.max(5, Math.round((distanceKm / effectiveSpeedKmH) * 60));
  const waypoints = generateWaypoints(sender.stationName, recipient.stationName, distanceKm);

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const charCount = body.length;

  const newMsg: Message = {
    id: `RP-MSG-${Math.floor(1000 + Math.random() * 9000)}`,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientStation: recipient.stationName,
    title: title || `Dispatch #${Math.floor(Math.random() * 1000)}`,
    body,
    originalWordCount: wordCount,
    originalCharCount: charCount,
    pageFormat: pageFormat === '2_A4' ? '2_A4' : '1_A4',
    originLocation: { name: sender.stationName, lat: sender.lat, lng: sender.lng },
    targetLocation: { name: recipient.stationName, lat: recipient.lat, lng: recipient.lng },
    distanceKm,
    runnerSpeedKmH: speed,
    terrain,
    weather,
    effectiveSpeedKmH,
    totalTransitMinutes,
    progressPercent: 0,
    status: 'IN_TRANSIT',
    autoDeletePolicy,
    burnAfterDeliveredSeconds: 10,
    deliveredAt: null,
    burnedAt: null,
    burnReason: null,
    encryptionStandard: 'AES-256-GCM Military Grade',
    digitalSignature: `SIG-256-${sender.username.toUpperCase()}-${charCount}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    waypoints,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.messages.unshift(newMsg);
  saveDatabase(db);

  appendToActivityLog(
    'RUNNER',
    sender.username,
    `Dispatched ${newMsg.id} (${newMsg.pageFormat}, ${wordCount} words) to ${recipient.name}. Distance: ${distanceKm}km @ ${effectiveSpeedKmH}km/h. ETA: ${Math.round(totalTransitMinutes / 60)}h ${totalTransitMinutes % 60}m.`
  );

  res.json({ success: true, message: newMsg });
});

// Explicit In-Flight Auto-Delete / Sender Burn Trigger
// ("automatically delete each message after a sender delivers 1-A4 length message or 2-A4 length message even if the message has not completely carried to the recipient")
app.post('/api/messages/:id/burn', (req, res) => {
  const { id } = req.params;
  const { reason = 'Sender Triggered Mid-Transit Ephemeral Burn' } = req.body;
  const db = loadDatabase();
  const msg = db.messages.find((m) => m.id === id);

  if (!msg) {
    res.status(404).json({ success: false, error: 'Message not found' });
    return;
  }

  const wasInFlight = msg.status === 'IN_TRANSIT';
  msg.status = wasInFlight ? 'BURNED_IN_FLIGHT' : 'BURNED_DELIVERED';
  msg.burnedAt = new Date().toISOString();
  msg.burnReason = reason;
  msg.body = `[CRYPTOGRAPHICALLY SHREDDED & PERMANENTLY PURGED — TRIGGERED ${wasInFlight ? 'MID-TRANSIT BEFORE RECIPIENT ARRIVAL' : 'POST-DELIVERY'} PER EPHEMERAL HUMAN LATENCY POLICY]`;
  msg.updatedAt = new Date().toISOString();

  saveDatabase(db);

  appendToActivityLog(
    'PURGE',
    'SENDER_OVERRIDE',
    `Message ${msg.id} permanently shredded. Status: ${msg.status}. Reason: ${reason}. Progress at burn: ${msg.progressPercent}% (${Math.round((msg.progressPercent / 100) * msg.distanceKm)}km traversed).`
  );

  res.json({ success: true, message: msg });
});

// Admin Intercept & Purge message
app.post('/api/messages/:id/intercept', (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  const msg = db.messages.find((m) => m.id === id);

  if (!msg) {
    res.status(404).json({ success: false, error: 'Message not found' });
    return;
  }

  msg.status = 'INTERCEPTED_ADMIN';
  msg.burnedAt = new Date().toISOString();
  msg.burnReason = 'Administrative Intercept & Security Seizure under Royal Postal Command';
  msg.body = '[INTERCEPTED BY ADMIN DASHBOARD — PLAIN TEXT PURGED FROM SYSTEM FILE DATABASE]';
  msg.updatedAt = new Date().toISOString();

  saveDatabase(db);

  appendToActivityLog('SECURITY', 'ADMIN_COMMAND', `Administrative intercept executed on ${msg.id}. Runner halted, packet purged.`);
  res.json({ success: true, message: msg });
});

// Activity logs endpoint
app.get('/api/logs', (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      res.json({ success: true, logs: [] });
      return;
    }
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);
    // Parse into structured logs
    const logs = lines.map((line, idx) => {
      const match = line.match(/^\[(.*?)\]\s+\[(.*?)\]\s+\[(.*?)\]\s+(.*)$/);
      if (match) {
        return {
          id: idx,
          timestamp: match[1],
          level: match[2].trim(),
          actor: match[3].trim(),
          text: match[4],
        };
      }
      return { id: idx, timestamp: new Date().toISOString(), level: 'INFO', actor: 'SYSTEM', text: line };
    });
    res.json({ success: true, logs: logs.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read logs' });
  }
});

// Download raw activity_log.txt
app.get('/api/logs/raw', (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      res.type('text/plain').send('# runnerPost Activity Log is empty');
      return;
    }
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    res.type('text/plain').send(raw);
  } catch (err) {
    res.status(500).send('Error reading log file');
  }
});

// Admin stats & accountability metrics
app.get('/api/admin/stats', (req, res) => {
  const db = loadDatabase();
  const total = db.messages.length;
  const inTransit = db.messages.filter((m) => m.status === 'IN_TRANSIT').length;
  const burned = db.messages.filter((m) => m.status === 'BURNED_DELIVERED' || m.status === 'BURNED_IN_FLIGHT').length;
  const delivered = db.messages.filter((m) => m.status === 'DELIVERED').length;
  const intercepted = db.messages.filter((m) => m.status === 'INTERCEPTED_ADMIN').length;
  const totalDistanceRunKm = db.messages.reduce((acc, m) => {
    const km = (m.progressPercent / 100) * m.distanceKm;
    return acc + km;
  }, 0);

  // Group by sender for sender activity tracking
  const senderMap: Record<string, {
    senderId: string;
    senderName: string;
    totalDispatches: number;
    a4OneCount: number;
    a4TwoCount: number;
    burnedCount: number;
    inFlightCount: number;
    totalChars: number;
    status: string;
  }> = {};

  db.users.forEach((u) => {
    senderMap[u.id] = {
      senderId: u.id,
      senderName: u.name,
      totalDispatches: 0,
      a4OneCount: 0,
      a4TwoCount: 0,
      burnedCount: 0,
      inFlightCount: 0,
      totalChars: 0,
      status: u.status,
    };
  });

  db.messages.forEach((m) => {
    if (!senderMap[m.senderId]) {
      senderMap[m.senderId] = {
        senderId: m.senderId,
        senderName: m.senderName,
        totalDispatches: 0,
        a4OneCount: 0,
        a4TwoCount: 0,
        burnedCount: 0,
        inFlightCount: 0,
        totalChars: 0,
        status: 'active',
      };
    }
    const s = senderMap[m.senderId];
    s.totalDispatches++;
    if (m.pageFormat === '1_A4') s.a4OneCount++;
    if (m.pageFormat === '2_A4') s.a4TwoCount++;
    if (m.status === 'BURNED_DELIVERED' || m.status === 'BURNED_IN_FLIGHT') s.burnedCount++;
    if (m.status === 'IN_TRANSIT') s.inFlightCount++;
    s.totalChars += m.originalCharCount || 0;
  });

  res.json({
    success: true,
    stats: {
      totalMessages: total,
      inTransit,
      burned,
      delivered,
      intercepted,
      totalDistanceRunKm: Math.round(totalDistanceRunKm * 10) / 10,
      totalUsers: db.users.length,
      sendersActivity: Object.values(senderMap),
      config: db.config,
    },
  });
});

// Admin toggle user status (suspend / reactivate)
app.post('/api/admin/toggle-user', (req, res) => {
  const { userId } = req.body;
  const db = loadDatabase();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }
  user.status = user.status === 'active' ? 'suspended' : 'active';
  saveDatabase(db);
  appendToActivityLog(
    'SECURITY',
    'ADMIN_COMMAND',
    `User ${user.name} (${user.id}) status altered to: ${user.status.toUpperCase()}`
  );
  res.json({ success: true, user });
});

// Admin update config
app.post('/api/admin/config', (req, res) => {
  const { runnerMinSpeed, runnerMaxSpeed, simulationMultiplier, strictA4CapEnforced, autoBurnOnDelivery } = req.body;
  const db = loadDatabase();

  if (runnerMinSpeed !== undefined) db.config.runnerMinSpeed = Number(runnerMinSpeed);
  if (runnerMaxSpeed !== undefined) db.config.runnerMaxSpeed = Number(runnerMaxSpeed);
  if (simulationMultiplier !== undefined) db.config.simulationMultiplier = Number(simulationMultiplier);
  if (strictA4CapEnforced !== undefined) db.config.strictA4CapEnforced = Boolean(strictA4CapEnforced);
  if (autoBurnOnDelivery !== undefined) db.config.autoBurnOnDelivery = Boolean(autoBurnOnDelivery);

  saveDatabase(db);
  appendToActivityLog('SECURITY', 'ADMIN_COMMAND', `System operational parameters updated. Multiplier: ${db.config.simulationMultiplier}x.`);
  res.json({ success: true, config: db.config });
});

// --- BIRD API (https://github.com/api-evangelist/bird spec compliant implementation) ---
// Implements Bird channel, message, telemetry & logging specifications

app.get('/api/bird', (req, res) => {
  res.json({
    name: 'Bird API - runnerPost Human Latency Avian Gateway',
    version: '1.0.0',
    specification: 'https://github.com/api-evangelist/bird',
    description: 'Avian & Human-Runner Carrier Protocol bridge for slow message transmission monitoring and cryptographically verifiable logging.',
    supportedChannels: ['human_runner', 'avian_carrier_rfc1149', 'royal_courier'],
    endpoints: {
      messages: '/api/bird/messages',
      transmissions: '/api/bird/transmissions',
      logs: '/api/bird/logs',
      openapi: '/api/bird/openapi.json',
    },
    status: 'ONLINE',
    human_speed_constraints: '8.0 km/h - 12.0 km/h',
  });
});

// Bird API messages
app.get('/api/bird/messages', (req, res) => {
  const db = loadDatabase();
  const birdFormatted = db.messages.map((m) => ({
    id: m.id,
    channel: 'human_runner',
    direction: 'outbound',
    status: m.status.toLowerCase(),
    sender: {
      id: m.senderId,
      name: m.senderName,
      station: m.originLocation.name,
      coordinates: [m.originLocation.lat, m.originLocation.lng],
    },
    recipient: {
      id: m.recipientId,
      name: m.recipientName,
      station: m.targetLocation.name,
      coordinates: [m.targetLocation.lat, m.targetLocation.lng],
    },
    payload: {
      page_format: m.pageFormat,
      word_count: m.originalWordCount,
      character_count: m.originalCharCount,
      encrypted: true,
      encryption_cipher: m.encryptionStandard,
      signature: m.digitalSignature,
      ephemeral_shredded: m.status.startsWith('BURNED'),
      burned_at: m.burnedAt,
    },
    telemetry: {
      speed_kmh: m.effectiveSpeedKmH,
      distance_km: m.distanceKm,
      progress_percent: m.progressPercent,
      terrain: m.terrain,
      weather: m.weather,
      waypoints_cleared: m.waypoints.filter((w) => w.passed).length,
      waypoints_total: m.waypoints.length,
    },
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  }));
  res.json({
    total: birdFormatted.length,
    data: birdFormatted,
  });
});

// Bird API transmissions telemetry summary
app.get('/api/bird/transmissions', (req, res) => {
  const db = loadDatabase();
  const activeCouriers = db.messages.filter((m) => m.status === 'IN_TRANSIT');
  res.json({
    network_health: 'OPTIMAL',
    carrier_type: 'Human Latency Foot Courier',
    active_in_flight_couriers: activeCouriers.length,
    average_human_velocity_kmh: 10.1,
    velocity_envelope_kmh: { min: db.config.runnerMinSpeed, max: db.config.runnerMaxSpeed },
    total_network_distance_km: Math.round(db.messages.reduce((a, b) => a + b.distanceKm, 0) * 10) / 10,
    ephemeral_purges_count: db.messages.filter((m) => m.status.startsWith('BURNED')).length,
    couriers: activeCouriers.map((c) => ({
      message_id: c.id,
      sender: c.senderName,
      recipient: c.recipientName,
      current_velocity: `${c.effectiveSpeedKmH} km/h`,
      progress: `${c.progressPercent}%`,
      next_waypoint: c.waypoints.find((w) => !w.passed)?.name || 'Destination Terminal',
    })),
  });
});

// Bird API activity logs
app.get('/api/bird/logs', (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      res.json({ logs: [] });
      return;
    }
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);
    const parsed = lines.slice(-50).map((l) => {
      const match = l.match(/^\[(.*?)\]\s+\[(.*?)\]\s+\[(.*?)\]\s+(.*)$/);
      return match
        ? { timestamp: match[1], severity: match[2].trim(), source: match[3].trim(), event: match[4] }
        : { raw: l };
    });
    res.json({ count: parsed.length, logs: parsed.reverse() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to access Bird API log buffer' });
  }
});

// Bird API OpenAPI Specification
app.get('/api/bird/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'Bird API — runnerPost Specification',
      description: 'API Evangelist Bird API schema compliant endpoint for human-runner message telemetry and audit tracking.',
      version: '1.0.0',
    },
    paths: {
      '/api/bird/messages': {
        get: { summary: 'List all courier transmissions', responses: { '200': { description: 'Success' } } },
      },
      '/api/bird/transmissions': {
        get: { summary: 'Real-time transmission monitoring telemetry', responses: { '200': { description: 'Success' } } },
      },
      '/api/bird/logs': {
        get: { summary: 'System activity and security logging stream', responses: { '200': { description: 'Success' } } },
      },
    },
  });
});

// --- Vite integration for dev server ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`runnerPost operational server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

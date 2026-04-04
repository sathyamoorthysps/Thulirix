/**
 * Thulirix — Minimal Redis Mock Server (RESP protocol)
 * Handles the subset of Redis commands used by Spring Boot + Lettuce.
 * Port: 6005  |  No persistence  |  Dev-only
 */
'use strict';

const net  = require('net');
const PORT = process.env.REDIS_PORT || 6005;
const AUTH_PASSWORD = process.env.REDIS_PASSWORD || 'thulirix_redis_pass';

// ── In-memory store ──────────────────────────────────────────────────────────
const stores   = { 0: new Map() };  // db index → Map<key, {value, expireAt}>
const hashes   = { 0: new Map() };  // db index → Map<key, Map<field, value>>
const lists    = { 0: new Map() };  // db index → Map<key, Array>
const sets_    = { 0: new Map() };  // db index → Map<key, Set>

function getStore(db)  { return stores[db]  || (stores[db]  = new Map()); }
function getHashes(db) { return hashes[db]  || (hashes[db]  = new Map()); }
function getLists(db)  { return lists[db]   || (lists[db]   = new Map()); }

function isExpired(entry) {
  return entry.expireAt !== null && Date.now() > entry.expireAt;
}

function storeGet(db, key) {
  const entry = getStore(db).get(key);
  if (!entry) return null;
  if (isExpired(entry)) { getStore(db).delete(key); return null; }
  return entry;
}

// ── RESP serialisers ─────────────────────────────────────────────────────────
const ok       = () => '+OK\r\n';
const pong     = () => '+PONG\r\n';
const nil      = () => '$-1\r\n';
const nullArr  = () => '*-1\r\n';
const integer  = (n) => `:${n}\r\n`;
const simple   = (s) => `+${s}\r\n`;
const bulk     = (s) => s == null ? nil() : `$${Buffer.byteLength(String(s))}\r\n${s}\r\n`;
const arr      = (items) => {
  if (!items) return nullArr();
  let out = `*${items.length}\r\n`;
  for (const item of items) out += bulk(item);
  return out;
};
const err      = (msg) => `-ERR ${msg}\r\n`;
const wrongType = () => `-WRONGTYPE Operation against a key holding the wrong kind of value\r\n`;

// ── RESP parser ──────────────────────────────────────────────────────────────
function parseRESP(buf) {
  const cmds = [];
  let i = 0;
  const s = buf.toString('utf8');

  while (i < s.length) {
    if (s[i] !== '*') {
      // Inline command (telnet-style)
      const end = s.indexOf('\r\n', i);
      if (end === -1) break;
      const parts = s.slice(i, end).trim().split(/\s+/).filter(Boolean);
      if (parts.length) cmds.push(parts);
      i = end + 2;
      continue;
    }
    const nlIdx = s.indexOf('\r\n', i);
    if (nlIdx === -1) break;
    const argCount = parseInt(s.slice(i + 1, nlIdx), 10);
    i = nlIdx + 2;
    const args = [];
    for (let a = 0; a < argCount; a++) {
      if (s[i] !== '$') break;
      const lenEnd = s.indexOf('\r\n', i);
      if (lenEnd === -1) break;
      const len = parseInt(s.slice(i + 1, lenEnd), 10);
      i = lenEnd + 2;
      args.push(s.slice(i, i + len));
      i += len + 2;
    }
    if (args.length === argCount) cmds.push(args);
  }
  return cmds;
}

// ── Command handler ──────────────────────────────────────────────────────────
function handle(args, state) {
  const cmd  = args[0].toUpperCase();
  const db   = state.db;
  const store = getStore(db);

  switch (cmd) {
    case 'PING':
      return args[1] ? bulk(args[1]) : pong();

    case 'AUTH':
      if (args[1] === AUTH_PASSWORD) { state.authed = true; return ok(); }
      return `-ERR invalid password\r\n`;

    case 'SELECT': {
      const idx = parseInt(args[1], 10);
      if (isNaN(idx) || idx < 0 || idx > 15) return err('DB index out of range');
      state.db = idx;
      return ok();
    }

    case 'QUIT':
      state.quit = true;
      return ok();

    case 'SET': {
      let expireAt = null;
      for (let i = 3; i < args.length; i += 2) {
        const opt = args[i].toUpperCase();
        if (opt === 'EX')  expireAt = Date.now() + parseInt(args[i+1], 10) * 1000;
        if (opt === 'PX')  expireAt = Date.now() + parseInt(args[i+1], 10);
      }
      store.set(args[1], { value: args[2], expireAt });
      return ok();
    }

    case 'GET': {
      const e = storeGet(db, args[1]);
      return bulk(e ? e.value : null);
    }

    case 'MGET': {
      const vals = args.slice(1).map(k => {
        const e = storeGet(db, k); return e ? e.value : null;
      });
      return arr(vals);
    }

    case 'DEL': {
      let count = 0;
      args.slice(1).forEach(k => { if (store.delete(k)) count++; });
      return integer(count);
    }

    case 'EXISTS': {
      let count = 0;
      args.slice(1).forEach(k => { if (storeGet(db, k)) count++; });
      return integer(count);
    }

    case 'EXPIRE': {
      const e = storeGet(db, args[1]);
      if (!e) return integer(0);
      e.expireAt = Date.now() + parseInt(args[2], 10) * 1000;
      return integer(1);
    }

    case 'PEXPIRE': {
      const e = storeGet(db, args[1]);
      if (!e) return integer(0);
      e.expireAt = Date.now() + parseInt(args[2], 10);
      return integer(1);
    }

    case 'TTL': {
      const e = storeGet(db, args[1]);
      if (!e) return integer(-2);
      if (e.expireAt === null) return integer(-1);
      return integer(Math.ceil((e.expireAt - Date.now()) / 1000));
    }

    case 'PTTL': {
      const e = storeGet(db, args[1]);
      if (!e) return integer(-2);
      if (e.expireAt === null) return integer(-1);
      return integer(e.expireAt - Date.now());
    }

    case 'PERSIST': {
      const e = storeGet(db, args[1]);
      if (!e || e.expireAt === null) return integer(0);
      e.expireAt = null;
      return integer(1);
    }

    case 'KEYS': {
      const pattern = (args[1] || '*').replace(/\*/g, '.*').replace(/\?/g, '.');
      const re = new RegExp('^' + pattern + '$');
      const keys = [];
      for (const [k, v] of store) {
        if (!isExpired(v) && re.test(k)) keys.push(k);
      }
      return arr(keys);
    }

    case 'SCAN': {
      // Simplified: always return cursor=0 + all matching keys
      const match = args.includes('MATCH') ? args[args.indexOf('MATCH') + 1] : '*';
      const count = args.includes('COUNT') ? parseInt(args[args.indexOf('COUNT') + 1], 10) : 10;
      const pattern = (match || '*').replace(/\*/g, '.*').replace(/\?/g, '.');
      const re = new RegExp('^' + pattern + '$');
      const keys = [];
      for (const [k, v] of store) {
        if (!isExpired(v) && re.test(k)) keys.push(k);
        if (keys.length >= count * 2) break;
      }
      return `*2\r\n$1\r\n0\r\n${arr(keys)}`;
    }

    case 'INCR': {
      const e = storeGet(db, args[1]);
      const n = e ? parseInt(e.value, 10) : 0;
      const next = n + 1;
      store.set(args[1], { value: String(next), expireAt: e ? e.expireAt : null });
      return integer(next);
    }

    case 'INCRBY': {
      const e = storeGet(db, args[1]);
      const n = e ? parseInt(e.value, 10) : 0;
      const next = n + parseInt(args[2], 10);
      store.set(args[1], { value: String(next), expireAt: e ? e.expireAt : null });
      return integer(next);
    }

    case 'DECR': {
      const e = storeGet(db, args[1]);
      const n = e ? parseInt(e.value, 10) : 0;
      const next = n - 1;
      store.set(args[1], { value: String(next), expireAt: e ? e.expireAt : null });
      return integer(next);
    }

    case 'DECRBY': {
      const e = storeGet(db, args[1]);
      const n = e ? parseInt(e.value, 10) : 0;
      const next = n - parseInt(args[2], 10);
      store.set(args[1], { value: String(next), expireAt: e ? e.expireAt : null });
      return integer(next);
    }

    case 'APPEND': {
      const e = storeGet(db, args[1]);
      const cur = e ? String(e.value) : '';
      const next = cur + args[2];
      store.set(args[1], { value: next, expireAt: e ? e.expireAt : null });
      return integer(Buffer.byteLength(next));
    }

    case 'STRLEN': {
      const e = storeGet(db, args[1]);
      return integer(e ? Buffer.byteLength(String(e.value)) : 0);
    }

    case 'TYPE': {
      if (storeGet(db, args[1]))          return simple('string');
      if (getHashes(db).has(args[1]))     return simple('hash');
      if (getLists(db).has(args[1]))      return simple('list');
      if (sets_(db) && sets_[db] && sets_[db].has && sets_[db].has(args[1])) return simple('set');
      return simple('none');
    }

    // ── Hash commands ──────────────────────────────────────────
    case 'HSET': {
      const h = getHashes(db);
      if (!h.has(args[1])) h.set(args[1], new Map());
      const map = h.get(args[1]);
      let added = 0;
      for (let i = 2; i < args.length; i += 2) {
        if (!map.has(args[i])) added++;
        map.set(args[i], args[i+1]);
      }
      return integer(added);
    }

    case 'HGET': {
      const h = getHashes(db).get(args[1]);
      return bulk(h ? (h.get(args[2]) ?? null) : null);
    }

    case 'HMGET': {
      const h = getHashes(db).get(args[1]);
      const vals = args.slice(2).map(f => h ? (h.get(f) ?? null) : null);
      return arr(vals);
    }

    case 'HGETALL': {
      const h = getHashes(db).get(args[1]);
      if (!h) return arr([]);
      const flat = [];
      for (const [f, v] of h) { flat.push(f); flat.push(v); }
      return arr(flat);
    }

    case 'HDEL': {
      const h = getHashes(db).get(args[1]);
      if (!h) return integer(0);
      let count = 0;
      args.slice(2).forEach(f => { if (h.delete(f)) count++; });
      return integer(count);
    }

    case 'HEXISTS': {
      const h = getHashes(db).get(args[1]);
      return integer(h && h.has(args[2]) ? 1 : 0);
    }

    case 'HLEN': {
      const h = getHashes(db).get(args[1]);
      return integer(h ? h.size : 0);
    }

    case 'HKEYS': {
      const h = getHashes(db).get(args[1]);
      return arr(h ? [...h.keys()] : []);
    }

    case 'HVALS': {
      const h = getHashes(db).get(args[1]);
      return arr(h ? [...h.values()] : []);
    }

    // ── List commands ──────────────────────────────────────────
    case 'LPUSH':
    case 'RPUSH': {
      const ll = getLists(db);
      if (!ll.has(args[1])) ll.set(args[1], []);
      const list = ll.get(args[1]);
      args.slice(2).forEach(v => {
        cmd === 'LPUSH' ? list.unshift(v) : list.push(v);
      });
      return integer(list.length);
    }

    case 'LPOP':
    case 'RPOP': {
      const list = getLists(db).get(args[1]);
      if (!list || !list.length) return nil();
      return bulk(cmd === 'LPOP' ? list.shift() : list.pop());
    }

    case 'LRANGE': {
      const list = getLists(db).get(args[1]) || [];
      let s = parseInt(args[2], 10), e = parseInt(args[3], 10);
      const len = list.length;
      if (s < 0) s = Math.max(0, len + s);
      if (e < 0) e = len + e;
      if (e >= len) e = len - 1;
      return arr(s > e ? [] : list.slice(s, e + 1));
    }

    case 'LLEN': {
      return integer((getLists(db).get(args[1]) || []).length);
    }

    // ── Server commands ────────────────────────────────────────
    case 'FLUSHDB':
      store.clear(); getHashes(db).clear(); getLists(db).clear();
      return ok();

    case 'FLUSHALL':
      Object.keys(stores).forEach(k => { stores[k].clear(); });
      Object.keys(hashes).forEach(k => { hashes[k].clear(); });
      Object.keys(lists).forEach(k  => { lists[k].clear();  });
      return ok();

    case 'DBSIZE':
      return integer(store.size);

    case 'INFO':
      return bulk(`# Server\r\nredis_version:7.0.0-mock\r\nredis_mode:standalone\r\nos:Windows\r\n# Clients\r\nconnected_clients:1\r\n# Memory\r\nused_memory:1000000\r\n# Stats\r\ntotal_commands_processed:${state.cmdCount}\r\n# Replication\r\nrole:master\r\nconnected_slaves:0\r\n# Keyspace\r\n`);

    case 'CONFIG':
      if (args[1] && args[1].toUpperCase() === 'GET') {
        if (args[2] === 'maxmemory') return arr(['maxmemory', '0']);
        if (args[2] === 'hz') return arr(['hz', '10']);
        return arr([]);
      }
      if (args[1] && args[1].toUpperCase() === 'SET') return ok();
      return ok();

    case 'CLIENT':
      if (args[1] && args[1].toUpperCase() === 'SETNAME') return ok();
      if (args[1] && args[1].toUpperCase() === 'GETNAME') return bulk('');
      if (args[1] && args[1].toUpperCase() === 'ID') return integer(1);
      return ok();

    case 'COMMAND':
      return integer(200);

    case 'DEBUG':
      return ok();

    default:
      return err(`unknown command '${cmd}'`);
  }
}

// ── TCP server ───────────────────────────────────────────────────────────────
const server = net.createServer(socket => {
  const state = { db: 0, authed: !AUTH_PASSWORD, quit: false, cmdCount: 0 };
  let buf = Buffer.alloc(0);

  socket.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    const cmds = parseRESP(buf);
    buf = Buffer.alloc(0);   // simple reset — works for non-pipelining clients

    let response = '';
    for (const args of cmds) {
      if (!args.length) continue;
      state.cmdCount++;

      if (!state.authed && args[0].toUpperCase() !== 'AUTH') {
        response += `-NOAUTH Authentication required.\r\n`;
        continue;
      }
      response += handle(args, state);
    }
    if (response) socket.write(response);
    if (state.quit) socket.end();
  });

  socket.on('error', () => {});
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Thulirix Redis Mock] Listening on 127.0.0.1:${PORT}`);
  console.log(`[Thulirix Redis Mock] Password: ${AUTH_PASSWORD}`);
  console.log(`[Thulirix Redis Mock] Supported: GET/SET/DEL/EXPIRE/TTL/KEYS/SCAN/INCR/DECR/HSET/HGET/HGETALL/LPUSH/RPUSH/LRANGE/INFO`);
});

server.on('error', e => {
  console.error(`[Thulirix Redis Mock] Error: ${e.message}`);
  process.exit(1);
});

process.on('SIGINT', () => { server.close(); process.exit(0); });

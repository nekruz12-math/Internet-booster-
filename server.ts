import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Resolver } from 'node:dns/promises';
import os from 'node:os';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANDROID_PROJECT_FILES } from './src/data/androidProjectFiles.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the complete Android Studio project exists on disk under /android-project/
try {
  for (const file of ANDROID_PROJECT_FILES) {
    const targetPath = path.join(__dirname, 'android-project', file.path);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, file.content, 'utf8');
  }
} catch (err) {
  console.error('Failed to materialize android-project:', err);
}

const PORT = 3000;

interface DnsProviderSpec {
  id: string;
  name: string;
  primaryIp: string;
  secondaryIp: string;
  dotHostname: string;
  dohUrl: string;
  regionNote: string;
  securityFeatures: string;
}

const DNS_PROVIDERS: DnsProviderSpec[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare 1.1.1.1',
    primaryIp: '1.1.1.1',
    secondaryIp: '1.0.0.1',
    dotHostname: '1dot1dot1dot1.cloudflare-dns.com',
    dohUrl: 'https://cloudflare-dns.com/dns-query?name=example.com&type=A',
    regionNote: 'Global Anycast (310+ edge PoPs including Central Asia / Frankfurt / Istanbul routes)',
    securityFeatures: 'DNSSEC, DoT (Port 853), DoH, No-log privacy commitment',
  },
  {
    id: 'google',
    name: 'Google Public DNS',
    primaryIp: '8.8.8.8',
    secondaryIp: '8.8.4.4',
    dotHostname: 'dns.google',
    dohUrl: 'https://dns.google/resolve?name=example.com&type=A',
    regionNote: 'High-availability Anycast backbone with broad mobile ISP peering',
    securityFeatures: 'DNSSEC validation, DoT (dns.google), DoH',
  },
  {
    id: 'quad9',
    name: 'Quad9 Security DNS',
    primaryIp: '9.9.9.9',
    secondaryIp: '149.112.112.112',
    dotHostname: 'dns.quad9.net',
    dohUrl: 'https://dns.quad9.net:5053/dns-query?name=example.com&type=A',
    regionNote: 'Swiss privacy jurisdiction + 200+ global Anycast locations',
    securityFeatures: 'Automatic malicious domain & phishing blocklist, DNSSEC, DoT',
  },
  {
    id: 'adguard',
    name: 'AdGuard Public DNS',
    primaryIp: '94.140.14.14',
    secondaryIp: '94.140.15.15',
    dotHostname: 'dns.adguard-dns.com',
    dohUrl: 'https://dns.adguard-dns.com/resolve?name=example.com&type=A',
    regionNote: 'Optimized routing across CIS, Central Asia, and Europe',
    securityFeatures: 'Tracker & telemetry domain filtering, DNSSEC, DoT',
  },
];

// Pre-allocated high-entropy 256KB buffer so gzip/compression cannot inflate throughput measurements
const HIGH_ENTROPY_CHUNK = crypto.randomBytes(256 * 1024);

async function measureProviderDns(provider: DnsProviderSpec, testDomains: string[]) {
  const samples: number[] = [];
  let methodUsed: 'UDP_53' | 'DOH_443' = 'UDP_53';
  let resolvedIps: string[] = [];

  for (const domain of testDomains) {
    const resolver = new Resolver({ timeout: 1800, tries: 1 });
    resolver.setServers([provider.primaryIp, provider.secondaryIp]);
    const t0 = performance.now();
    try {
      const addresses = await resolver.resolve4(domain);
      const elapsed = performance.now() - t0;
      samples.push(Number(elapsed.toFixed(2)));
      if (addresses.length > 0 && resolvedIps.length === 0) {
        resolvedIps = addresses.slice(0, 2);
      }
    } catch {
      // If UDP 53 outbound is restricted by container firewall, fallback to real HTTPS DoH query
      const dohT0 = performance.now();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(provider.dohUrl, {
          headers: { accept: 'application/dns-json' },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const elapsed = performance.now() - dohT0;
          samples.push(Number(elapsed.toFixed(2)));
          methodUsed = 'DOH_443';
        }
      } catch {
        // Fallback failed
      }
    }
  }

  if (samples.length === 0) {
    return {
      ...provider,
      reachable: false,
      avgMs: null,
      minMs: null,
      maxMs: null,
      jitterMs: null,
      samples: [],
      methodUsed,
      resolvedIps,
    };
  }

  const minMs = Number(Math.min(...samples).toFixed(1));
  const maxMs = Number(Math.max(...samples).toFixed(1));
  const avgMs = Number((samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(1));
  const jitterMs =
    samples.length > 1
      ? Number(
          (
            samples.slice(1).reduce((acc, val, idx) => acc + Math.abs(val - samples[idx]), 0) /
            (samples.length - 1)
          ).toFixed(1)
        )
      : 0.5;

  return {
    ...provider,
    reachable: true,
    avgMs,
    minMs,
    maxMs,
    jitterMs,
    samples,
    methodUsed,
    resolvedIps,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(express.raw({ type: 'application/octet-stream', limit: '25mb' }));

  // 1. Real server-side + client network inspection
  app.get('/api/network/info', (req, res) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp =
      (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : null) ||
      req.socket.remoteAddress ||
      '10.0.2.15';

    const interfaces = os.networkInterfaces();
    const activeInterfaces: Array<{ name: string; address: string; family: string; internal: boolean }> = [];
    for (const [name, nets] of Object.entries(interfaces)) {
      if (!nets) continue;
      for (const net of nets) {
        if (!net.internal) {
          activeInterfaces.push({
            name,
            address: net.address,
            family: net.family,
            internal: net.internal,
          });
        }
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      clientIp,
      protocol: req.protocol,
      httpVersion: req.httpVersion,
      tlsEncrypted: req.secure || req.headers['x-forwarded-proto'] === 'https',
      userAgent: req.headers['user-agent'] || 'Android',
      activeInterfaces,
    });
  });

  // 2. Real low-overhead Ping / Echo endpoint for RTT & Jitter measurement
  app.get('/api/network/ping', (req, res) => {
    const clientSentAt = Number(req.query.t || Date.now());
    const serverTime = Date.now();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      seq: Number(req.query.seq || 0),
      clientSentAt,
      serverTime,
    });
  });

  // 3. Real DNS Benchmark endpoint testing Cloudflare, Google, Quad9, AdGuard
  app.get('/api/network/dns-benchmark', async (_req, res) => {
    const testDomains = ['google.com', 'cloudflare.com', 'wikipedia.org'];
    const startedAt = Date.now();
    const results = await Promise.all(
      DNS_PROVIDERS.map((provider) => measureProviderDns(provider, testDomains))
    );
    const sorted = [...results].sort((a, b) => {
      if (a.avgMs === null) return 1;
      if (b.avgMs === null) return -1;
      return a.avgMs - b.avgMs;
    });

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      testedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      domainsTested: testDomains,
      providers: sorted,
      recommendedProvider: sorted.find((p) => p.reachable) || sorted[0],
    });
  });

  // 4. Real Download Speed Test Stream (Streams high-entropy uncompressed binary bytes)
  app.get('/api/network/speedtest/download', (req, res) => {
    const requestedMb = Math.min(Math.max(Number(req.query.sizeMb) || 4, 1), 16);
    const totalBytes = requestedMb * 1024 * 1024;
    const chunksCount = Math.ceil(totalBytes / HIGH_ENTROPY_CHUNK.length);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', String(chunksCount * HIGH_ENTROPY_CHUNK.length));
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Content-Encoding', 'identity');

    let sentChunks = 0;
    function writeNext() {
      let ok = true;
      while (sentChunks < chunksCount && ok) {
        sentChunks++;
        if (sentChunks === chunksCount) {
          res.write(HIGH_ENTROPY_CHUNK);
          res.end();
        } else {
          ok = res.write(HIGH_ENTROPY_CHUNK);
        }
      }
      if (sentChunks < chunksCount) {
        res.once('drain', writeNext);
      }
    }
    writeNext();
  });

  // 5. Real Upload Speed Test Receiver (Measures actual received byte payload & duration)
  app.post('/api/network/speedtest/upload', (req, res) => {
    const startedAt = performance.now();
    const bodyLength = Buffer.isBuffer(req.body)
      ? req.body.length
      : typeof req.body === 'string'
      ? Buffer.byteLength(req.body)
      : Number(req.headers['content-length'] || 0);

    const serverProcessMs = Number((performance.now() - startedAt).toFixed(2));
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      receivedBytes: bodyLength,
      serverProcessMs,
      timestamp: Date.now(),
    });
  });

  // 6. Standard PKZIP Builder for One-Click GitHub Repository (.zip) Download
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  app.get('/api/android/github-zip', (_req, res) => {
    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;

    for (const file of ANDROID_PROJECT_FILES) {
      const nameBuf = Buffer.from(file.path, 'utf8');
      const dataBuf = Buffer.from(file.content, 'utf8');
      const crc = crc32(dataBuf);

      // Local file header (30 bytes + filename)
      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0); // signature
      localHeader.writeUInt16LE(20, 4); // version needed
      localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
      localHeader.writeUInt16LE(0, 8); // compression method: 0 (STORE)
      localHeader.writeUInt16LE(0, 10); // mod time
      localHeader.writeUInt16LE(0x5421, 12); // mod date
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(dataBuf.length, 18);
      localHeader.writeUInt32LE(dataBuf.length, 22);
      localHeader.writeUInt16LE(nameBuf.length, 26);
      localHeader.writeUInt16LE(0, 28);

      localParts.push(localHeader, nameBuf, dataBuf);

      // Central directory header (46 bytes + filename)
      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0x0800, 8);
      centralHeader.writeUInt16LE(0, 10);
      centralHeader.writeUInt16LE(0, 12);
      centralHeader.writeUInt16LE(0x5421, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(dataBuf.length, 20);
      centralHeader.writeUInt32LE(dataBuf.length, 24);
      centralHeader.writeUInt16LE(nameBuf.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(0, 38);
      centralHeader.writeUInt32LE(offset, 42);

      centralParts.push(centralHeader, nameBuf);
      offset += 30 + nameBuf.length + dataBuf.length;
    }

    const centralDirBuf = Buffer.concat(centralParts);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(ANDROID_PROJECT_FILES.length, 8);
    eocd.writeUInt16LE(ANDROID_PROJECT_FILES.length, 10);
    eocd.writeUInt32LE(centralDirBuf.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    const zipBuffer = Buffer.concat([...localParts, centralDirBuf, eocd]);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="InternetTurboTJ-GitHub-Android-Repo.zip"'
    );
    res.setHeader('Content-Length', String(zipBuffer.length));
    res.send(zipBuffer);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Internet Turbo TJ Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

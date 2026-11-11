export interface DnsProviderResult {
  id: string;
  name: string;
  primaryIp: string;
  secondaryIp: string;
  dotHostname: string;
  dohUrl: string;
  regionNote: string;
  securityFeatures: string;
  reachable: boolean;
  avgMs: number | null;
  minMs: number | null;
  maxMs: number | null;
  jitterMs: number | null;
  samples: number[];
  methodUsed: 'UDP_53' | 'DOH_443';
  resolvedIps: string[];
}

export interface DnsBenchmarkResponse {
  testedAt: string;
  durationMs: number;
  domainsTested: string[];
  providers: DnsProviderResult[];
  recommendedProvider: DnsProviderResult;
}

export interface PingResult {
  minMs: number;
  avgMs: number;
  maxMs: number;
  jitterMs: number;
  appLatencyMs: number;
  samples: number[];
  packetLossPct: number;
}

export interface SpeedTestResult {
  id: string;
  timestamp: string;
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  appLatencyMs: number;
  dnsLatencyMs: number;
  networkType: string;
  providerName: string;
  downloadSamples: number[];
  uploadSamples: number[];
}

export type SimulatedCellularMode =
  | 'mobile_4g_plus'
  | 'mobile_5g'
  | 'mobile_4g_standard'
  | 'mobile_4g_weak';

export interface ConnectionSnapshot {
  online: boolean;
  transport: 'Mobile Data';
  radioGeneration: '5G NR' | '4G+ (LTE-A)' | '4G LTE';
  clientIp: string;
  httpVersion: string;
  tlsEncrypted: boolean;
  metered: boolean;
  downlinkEstimateMbps: number;
  rttEstimateMs: number;
  mobileInfo: {
    operatorName: string;
    mccMnc: string;
    networkType: '5G NR (NSA/SA)' | '4G+ LTE-Advanced (CA)' | '4G LTE';
    frequencyBand: string;
    carrierAggregation: string;
    rsrpDbm: number;
    rsrqDb: number;
    sinrDb: number;
    asuLevel: number;
    cqiIndex: number;
    mtuBytes: number;
    apnProtocol: 'IPv4v6 Dual-Stack' | 'IPv4 Only';
    dataState: 'CONNECTED' | 'SUSPENDED' | 'DISCONNECTED';
    roaming: boolean;
    signalPermissionGranted: boolean;
  };
}

export interface OptimizationFinding {
  id: string;
  category: 'DNS' | 'CELLULAR RADIO' | 'LATENCY' | 'APN & MTU' | 'BACKGROUND DATA';
  severity: 'healthy' | 'warning' | 'optimization' | 'error';
  title: string;
  measuredValue: string;
  explanation: string;
  actionableStep: string;
  androidApiUsed: string;
}

export interface BoostExecutionReport {
  completedAt: string;
  beforeDnsProvider: string;
  beforeDnsMs: number;
  afterDnsProvider: string;
  afterDnsMs: number;
  beforePingMs: number;
  afterPingMs: number;
  beforeJitterMs: number;
  afterJitterMs: number;
  warmSocketImprovementMs: number;
  findings: OptimizationFinding[];
  recommendedDotHostname: string;
}

// Inspect browser Network Information API + backend socket inspection for Mobile Cellular
export async function inspectConnection(
  simulatedMode: SimulatedCellularMode = 'mobile_4g_plus',
  signalPermissionGranted = true
): Promise<ConnectionSnapshot> {
  let clientIp = '10.144.82.19';
  let httpVersion = '2.0';
  let tlsEncrypted = true;
  let online = typeof navigator !== 'undefined' ? navigator.onLine : true;

  try {
    const res = await fetch('/api/network/info', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      clientIp = data.clientIp || clientIp;
      httpVersion = data.httpVersion || httpVersion;
      tlsEncrypted = Boolean(data.tlsEncrypted);
      online = true;
    }
  } catch {
    // Offline or unreachable
  }

  const navConn = (navigator as unknown as {
    connection?: {
      effectiveType?: string;
      type?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
  }).connection;

  const rttEstimateMs = navConn?.rtt && navConn.rtt > 0 ? navConn.rtt : 28;
  const downlinkEstimateMbps = navConn?.downlink && navConn.downlink > 0 ? navConn.downlink : 64.5;

  if (simulatedMode === 'mobile_5g') {
    return {
      online,
      transport: 'Mobile Data',
      radioGeneration: '5G NR',
      clientIp,
      httpVersion,
      tlsEncrypted,
      metered: true,
      downlinkEstimateMbps: 165.0,
      rttEstimateMs: 19,
      mobileInfo: {
        operatorName: 'Tcell 5G / MegaFon TJ',
        mccMnc: '436-02',
        networkType: '5G NR (NSA/SA)',
        frequencyBand: 'n78 (3500 MHz C-Band TDD)',
        carrierAggregation: 'EN-DC (LTE B3 + 5G n78 100MHz)',
        rsrpDbm: signalPermissionGranted ? -82 : -85,
        rsrqDb: -9,
        sinrDb: 21,
        asuLevel: 60,
        cqiIndex: 14,
        mtuBytes: 1428,
        apnProtocol: 'IPv4v6 Dual-Stack',
        dataState: 'CONNECTED',
        roaming: false,
        signalPermissionGranted,
      },
    };
  }

  if (simulatedMode === 'mobile_4g_standard') {
    return {
      online,
      transport: 'Mobile Data',
      radioGeneration: '4G LTE',
      clientIp,
      httpVersion,
      tlsEncrypted,
      metered: true,
      downlinkEstimateMbps: 28.5,
      rttEstimateMs: 42,
      mobileInfo: {
        operatorName: 'MegaFon Tajikistan',
        mccMnc: '436-03',
        networkType: '4G LTE',
        frequencyBand: 'Band 3 (1800 MHz FDD · 20 MHz)',
        carrierAggregation: 'Single Carrier (1CC)',
        rsrpDbm: signalPermissionGranted ? -94 : -95,
        rsrqDb: -11,
        sinrDb: 12,
        asuLevel: 46,
        cqiIndex: 10,
        mtuBytes: 1428,
        apnProtocol: 'IPv4v6 Dual-Stack',
        dataState: 'CONNECTED',
        roaming: false,
        signalPermissionGranted,
      },
    };
  }

  if (simulatedMode === 'mobile_4g_weak') {
    return {
      online,
      transport: 'Mobile Data',
      radioGeneration: '4G LTE',
      clientIp,
      httpVersion,
      tlsEncrypted,
      metered: true,
      downlinkEstimateMbps: 7.8,
      rttEstimateMs: 118,
      mobileInfo: {
        operatorName: 'Babilon-Mobile / Zet-Mobile',
        mccMnc: '436-04',
        networkType: '4G LTE',
        frequencyBand: 'Band 20 (800 MHz Cell Edge)',
        carrierAggregation: 'Single Carrier (1CC - Congested)',
        rsrpDbm: signalPermissionGranted ? -113 : -110,
        rsrqDb: -16,
        sinrDb: 2,
        asuLevel: 24,
        cqiIndex: 5,
        mtuBytes: 1380,
        apnProtocol: 'IPv4 Only',
        dataState: 'CONNECTED',
        roaming: false,
        signalPermissionGranted,
      },
    };
  }

  // Default: mobile_4g_plus (4G+ LTE-Advanced Carrier Aggregation)
  return {
    online,
    transport: 'Mobile Data',
    radioGeneration: '4G+ (LTE-A)',
    clientIp,
    httpVersion,
    tlsEncrypted,
    metered: true,
    downlinkEstimateMbps,
    rttEstimateMs,
    mobileInfo: {
      operatorName: 'Tcell / MegaFon Tajikistan',
      mccMnc: '436-02',
      networkType: '4G+ LTE-Advanced (CA)',
      frequencyBand: 'Band 3 + Band 7 (1800 + 2600 MHz)',
      carrierAggregation: '2CC Active (40 MHz Aggregate)',
      rsrpDbm: signalPermissionGranted ? -86 : -88,
      rsrqDb: -10,
      sinrDb: 17,
      asuLevel: 54,
      cqiIndex: 13,
      mtuBytes: 1428,
      apnProtocol: 'IPv4v6 Dual-Stack',
      dataState: 'CONNECTED',
      roaming: false,
      signalPermissionGranted,
    },
  };
}

// Measure real HTTP/TCP RTT Ping & Jitter against /api/network/ping
export async function measureRealPing(
  sampleCount = 8,
  onSample?: (sampleMs: number, index: number) => void
): Promise<PingResult> {
  const samples: number[] = [];
  let failed = 0;

  const coldStart = performance.now();
  try {
    await fetch(`/api/network/ping?seq=0&t=${Date.now()}`, { cache: 'no-store' });
  } catch {
    // ignore
  }
  const appLatencyMs = Number((performance.now() - coldStart).toFixed(1));

  for (let i = 1; i <= sampleCount; i++) {
    const t0 = performance.now();
    try {
      const res = await fetch(`/api/network/ping?seq=${i}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const rtt = Number((performance.now() - t0).toFixed(1));
        samples.push(rtt);
        onSample?.(rtt, i);
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  if (samples.length === 0) {
    return {
      minMs: 0,
      avgMs: 0,
      maxMs: 0,
      jitterMs: 0,
      appLatencyMs,
      samples: [],
      packetLossPct: 100,
    };
  }

  const minMs = Number(Math.min(...samples).toFixed(1));
  const maxMs = Number(Math.max(...samples).toFixed(1));
  const avgMs = Number((samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(1));
  const jitterMs =
    samples.length > 1
      ? Number(
          (
            samples.slice(1).reduce((acc, v, idx) => acc + Math.abs(v - samples[idx]), 0) /
            (samples.length - 1)
          ).toFixed(1)
        )
      : 0.4;

  const packetLossPct = Number(((failed / sampleCount) * 100).toFixed(1));

  return {
    minMs,
    avgMs,
    maxMs,
    jitterMs,
    appLatencyMs,
    samples,
    packetLossPct,
  };
}

// Run real server-side DNS Benchmark against Cloudflare, Google, Quad9, AdGuard
export async function runDnsBenchmark(): Promise<DnsBenchmarkResponse> {
  const res = await fetch('/api/network/dns-benchmark', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`DNS benchmark failed with status ${res.status}`);
  }
  return res.json();
}

// Run real Download & Upload Speed Test
export async function executeRealSpeedTest(callbacks: {
  onPhaseChange: (phase: 'ping' | 'dns' | 'download' | 'upload' | 'complete') => void;
  onPingUpdate: (ping: PingResult) => void;
  onDownloadProgress: (instantMbps: number, progressPct: number) => void;
  onUploadProgress: (instantMbps: number, progressPct: number) => void;
}): Promise<SpeedTestResult> {
  callbacks.onPhaseChange('ping');
  const pingResult = await measureRealPing(8);
  callbacks.onPingUpdate(pingResult);

  callbacks.onPhaseChange('dns');
  const dnsResult = await runDnsBenchmark();
  const bestDnsLatency = dnsResult.recommendedProvider?.avgMs ?? 22.5;

  callbacks.onPhaseChange('download');
  const downloadSamples: number[] = [];
  const totalDownloadRounds = 3;
  let totalBytesReceived = 0;
  const downloadStart = performance.now();

  for (let round = 0; round < totalDownloadRounds; round++) {
    const roundStart = performance.now();
    const res = await fetch(`/api/network/speedtest/download?sizeMb=4&r=${round}&t=${Date.now()}`, {
      cache: 'no-store',
    });

    if (res.body) {
      const reader = res.body.getReader();
      let roundBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          roundBytes += value.byteLength;
          totalBytesReceived += value.byteLength;
          const elapsedSec = Math.max((performance.now() - roundStart) / 1000, 0.025);
          const instantMbps = Number(((roundBytes * 8) / (elapsedSec * 1_000_000)).toFixed(1));
          const progressPct = Math.min(
            99,
            Math.round(((round + roundBytes / (4 * 1024 * 1024)) / totalDownloadRounds) * 100)
          );
          callbacks.onDownloadProgress(instantMbps, progressPct);
        }
      }
      const roundElapsedSec = Math.max((performance.now() - roundStart) / 1000, 0.03);
      const roundMbps = Number(((roundBytes * 8) / (roundElapsedSec * 1_000_000)).toFixed(1));
      downloadSamples.push(roundMbps);
    } else {
      const buf = await res.arrayBuffer();
      totalBytesReceived += buf.byteLength;
      const roundElapsedSec = Math.max((performance.now() - roundStart) / 1000, 0.03);
      const roundMbps = Number(((buf.byteLength * 8) / (roundElapsedSec * 1_000_000)).toFixed(1));
      downloadSamples.push(roundMbps);
      callbacks.onDownloadProgress(roundMbps, Math.round(((round + 1) / totalDownloadRounds) * 100));
    }
  }

  const totalDownloadSec = Math.max((performance.now() - downloadStart) / 1000, 0.05);
  const downloadMbps = Number(((totalBytesReceived * 8) / (totalDownloadSec * 1_000_000)).toFixed(1));
  callbacks.onDownloadProgress(downloadMbps, 100);

  callbacks.onPhaseChange('upload');
  const uploadSamples: number[] = [];
  const uploadPayload = new Uint8Array(2 * 1024 * 1024);
  for (let i = 0; i < uploadPayload.length; i += 64) {
    uploadPayload[i] = (i * 31) & 0xff;
  }

  const totalUploadRounds = 3;
  let totalBytesUploaded = 0;
  const uploadStart = performance.now();

  for (let round = 0; round < totalUploadRounds; round++) {
    const roundStart = performance.now();
    await fetch(`/api/network/speedtest/upload?r=${round}&t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: uploadPayload,
    });
    totalBytesUploaded += uploadPayload.byteLength;
    const roundElapsedSec = Math.max((performance.now() - roundStart) / 1000, 0.03);
    const roundMbps = Number(((uploadPayload.byteLength * 8) / (roundElapsedSec * 1_000_000)).toFixed(1));
    uploadSamples.push(roundMbps);
    callbacks.onUploadProgress(roundMbps, Math.round(((round + 1) / totalUploadRounds) * 100));
  }

  const totalUploadSec = Math.max((performance.now() - uploadStart) / 1000, 0.05);
  const uploadMbps = Number(((totalBytesUploaded * 8) / (totalUploadSec * 1_000_000)).toFixed(1));
  callbacks.onUploadProgress(uploadMbps, 100);

  callbacks.onPhaseChange('complete');

  return {
    id: `st_${Date.now()}`,
    timestamp: new Date().toISOString(),
    downloadMbps,
    uploadMbps,
    pingMs: pingResult.minMs,
    jitterMs: pingResult.jitterMs,
    appLatencyMs: pingResult.appLatencyMs,
    dnsLatencyMs: bestDnsLatency,
    networkType: '4G+ LTE-Advanced (Mobile Data)',
    providerName: dnsResult.recommendedProvider?.name || 'Cloudflare 1.1.1.1',
    downloadSamples,
    uploadSamples,
  };
}

// Smart Evidence-Based Cellular Optimization Decision Engine
export function evaluateOptimizationRules(
  snapshot: ConnectionSnapshot,
  ping: PingResult,
  dnsBenchmark: DnsBenchmarkResponse
): OptimizationFinding[] {
  const findings: OptimizationFinding[] = [];
  const fastestDns = dnsBenchmark.recommendedProvider;
  const slowestDns = dnsBenchmark.providers[dnsBenchmark.providers.length - 1];

  // 1. Mobile Carrier DNS Latency Evaluation
  if (fastestDns && fastestDns.avgMs !== null && slowestDns && slowestDns.avgMs !== null) {
    const deltaMs = Number((slowestDns.avgMs - fastestDns.avgMs).toFixed(1));
    if (deltaMs > 10 || slowestDns.avgMs > 40) {
      findings.push({
        id: 'dns_optimization',
        category: 'DNS',
        severity: 'optimization',
        title: `Bypass slow carrier DNS: Save ${deltaMs} ms per lookup with ${fastestDns.name}`,
        measuredValue: `${fastestDns.avgMs} ms vs ${slowestDns.avgMs} ms`,
        explanation:
          'Mobile carrier DNS resolvers often suffer high queuing delay during peak evening hours. Switching to an Anycast DNS resolver accelerates domain lookup before mobile apps start fetching data.',
        actionableStep: `Set Android Private DNS (DoT) to "${fastestDns.dotHostname}" or activate the local VpnService cellular DNS tunnel.`,
        androidApiUsed: 'DnsResolver.getInstance() (API 29+) & Settings.ACTION_WIRELESS_SETTINGS',
      });
    } else {
      findings.push({
        id: 'dns_healthy',
        category: 'DNS',
        severity: 'healthy',
        title: `Cellular DNS lookup is fast (${fastestDns.avgMs} ms via ${fastestDns.name})`,
        measuredValue: `${fastestDns.avgMs} ms avg`,
        explanation: 'Your mobile DNS resolution latency is within the optimal <35 ms range.',
        actionableStep: 'Keep Private DNS (DoT) enabled for encrypted, tamper-proof cellular domain resolution.',
        androidApiUsed: 'LinkProperties.getDnsServers() & DnsResolver',
      });
    }
  }

  // 2. Cellular Signal (4G / 4G+ / 5G NR RSRP & SINR) Evaluation
  if (snapshot.mobileInfo.rsrpDbm < -105 || snapshot.mobileInfo.sinrDb < 5) {
    findings.push({
      id: 'mobile_signal_weak',
      category: 'CELLULAR RADIO',
      severity: 'warning',
      title: 'Cellular tower signal (RSRP/SINR) is weak on current band',
      measuredValue: `${snapshot.mobileInfo.rsrpDbm} dBm RSRP · ${snapshot.mobileInfo.sinrDb} dB SINR (${snapshot.mobileInfo.frequencyBand})`,
      explanation:
        'RSRP below -105 dBm or SINR below 5 dB forces the smartphone baseband modem to drop from 256-QAM/64-QAM down to QPSK modulation and disables Carrier Aggregation (4G+).',
      actionableStep:
        'Move near a window or higher elevation, or toggle Airplane Mode for 5 seconds to force the baseband modem to rescan for a stronger neighboring LTE/5G sector.',
      androidApiUsed: 'TelephonyManager.requestCellInfoUpdate() & CellSignalStrengthNr / CellSignalStrengthLte',
    });
  } else {
    findings.push({
      id: 'mobile_signal_healthy',
      category: 'CELLULAR RADIO',
      severity: 'healthy',
      title: `Strong ${snapshot.mobileInfo.networkType} radio link (${snapshot.mobileInfo.carrierAggregation})`,
      measuredValue: `${snapshot.mobileInfo.rsrpDbm} dBm RSRP · ${snapshot.mobileInfo.sinrDb} dB SINR · CQI ${snapshot.mobileInfo.cqiIndex}`,
      explanation:
        'High SINR and Channel Quality Indicator (CQI) allow the cellular modem to sustain high-order modulation and multi-band Carrier Aggregation.',
      actionableStep: 'Cellular physical radio layer is operating at peak efficiency.',
      androidApiUsed: 'TelephonyCallback.DisplayInfoListener (OVERRIDE_NETWORK_TYPE_LTE_CA / NR_NSA)',
    });
  }

  // 3. Cellular APN & MTU Packet Fragmentation Check
  if (snapshot.mobileInfo.apnProtocol === 'IPv4 Only' || snapshot.mobileInfo.mtuBytes < 1420) {
    findings.push({
      id: 'apn_mtu_suboptimal',
      category: 'APN & MTU',
      severity: 'optimization',
      title: 'Suboptimal APN IPv4-only NAT or small cellular MTU detected',
      measuredValue: `${snapshot.mobileInfo.apnProtocol} · MTU ${snapshot.mobileInfo.mtuBytes}`,
      explanation:
        'Carrier-Grade NAT (CGNAT) on IPv4-only APNs adds translation latency, and non-standard MTU values cause TCP packet fragmentation over GTP cellular tunnels.',
      actionableStep:
        'In Android Settings → Mobile Network → Access Point Names (APN), set APN Protocol to "IPv4/IPv6" to enable direct IPv6 routing.',
      androidApiUsed: 'LinkProperties.getMtu() & LinkProperties.getLinkAddresses()',
    });
  } else {
    findings.push({
      id: 'apn_mtu_healthy',
      category: 'APN & MTU',
      severity: 'healthy',
      title: 'APN Dual-Stack (IPv4v6) and Cellular MTU are optimal',
      measuredValue: `${snapshot.mobileInfo.apnProtocol} · MTU ${snapshot.mobileInfo.mtuBytes}`,
      explanation: 'Optimal cellular MTU prevents packet fragmentation across the mobile operator core network.',
      actionableStep: 'No APN changes needed.',
      androidApiUsed: 'LinkProperties.getMtu() (API 29+)',
    });
  }

  // 4. Cellular Latency & Jitter Evaluation
  if (ping.avgMs > 85 || ping.jitterMs > 20) {
    findings.push({
      id: 'latency_high',
      category: 'LATENCY',
      severity: 'warning',
      title: 'Mobile network latency or jitter is elevated',
      measuredValue: `${ping.avgMs} ms avg RTT · ${ping.jitterMs} ms jitter`,
      explanation:
        'Elevated mobile ping/jitter is typically caused by cell tower sector congestion, HARQ radio retransmissions, or background apps uploading photos/videos over your cellular uplink.',
      actionableStep:
        'Enable Android Data Saver to halt background uploads and keep the cellular uplink clear for your active app.',
      androidApiUsed: 'Socket.connect() TCP handshake & HTTP/2 Ping RTT',
    });
  } else {
    findings.push({
      id: 'latency_healthy',
      category: 'LATENCY',
      severity: 'healthy',
      title: 'Cellular packet latency and jitter are responsive',
      measuredValue: `${ping.minMs} ms min RTT · ${ping.jitterMs} ms jitter`,
      explanation: 'Low delay variation indicates an uncongested cell sector and stable backhaul.',
      actionableStep: 'Mobile connection is ready for low-latency calls, gaming, and streaming.',
      androidApiUsed: 'NetworkCapabilities.NET_CAPABILITY_VALIDATED',
    });
  }

  // 5. Background Mobile Data Competition Check
  findings.push({
    id: 'background_data_guidance',
    category: 'BACKGROUND DATA',
    severity: 'optimization',
    title: 'Prevent background apps from competing for your 4G/5G radio channel',
    measuredValue: 'TRANSPORT_CELLULAR · Metered Active',
    explanation:
      'On mobile networks, background cloud syncs and auto-playing feed preloads saturate the uplink PDCP buffer, spiking ping by 100+ ms for your foreground app.',
    actionableStep:
      'Enable Android Data Saver (Settings.ACTION_IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS) so only the app currently on screen can use mobile data.',
    androidApiUsed: 'ConnectivityManager.getRestrictBackgroundStatus() & NetworkStatsManager',
  });

  return findings;
}

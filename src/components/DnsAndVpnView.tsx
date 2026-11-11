import React, { useState } from 'react';
import { DnsBenchmarkResponse, DnsProviderResult } from '../services/networkEngine';
import { TranslationStrings } from '../i18n/translations';
import { Check, Copy, Globe, Play, Shield, Lock, AlertCircle } from 'lucide-react';

interface DnsAndVpnViewProps {
  t: TranslationStrings;
  dnsData: DnsBenchmarkResponse | null;
  isBenchmarking: boolean;
  onRunBenchmark: () => void;
  vpnActive: boolean;
  vpnProvider: DnsProviderResult | null;
  onToggleVpn: (provider: DnsProviderResult) => void;
}

export const DnsAndVpnView: React.FC<DnsAndVpnViewProps> = ({
  t,
  dnsData,
  isBenchmarking,
  onRunBenchmark,
  vpnActive,
  vpnProvider,
  onToggleVpn,
}) => {
  const [copiedHost, setCopiedHost] = useState<string | null>(null);
  const [showVpnConsentModal, setShowVpnConsentModal] = useState<DnsProviderResult | null>(null);

  const handleCopyDot = (hostname: string) => {
    navigator.clipboard.writeText(hostname);
    setCopiedHost(hostname);
    setTimeout(() => setCopiedHost(null), 2000);
  };

  const fastest = dnsData?.recommendedProvider || null;
  const maxAvg =
    dnsData?.providers.reduce((acc, p) => Math.max(acc, p.avgMs || 1), 60) || 60;

  return (
    <div className="space-y-8">
      {/* Header & Benchmark Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            RFC-1035 UDP Port 53 · DNS-over-TLS (Port 853) · DNS-over-HTTPS (Port 443)
          </p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {t.dns.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            {t.dns.subtitle}
          </p>
        </div>

        <button
          onClick={onRunBenchmark}
          disabled={isBenchmarking}
          className="min-h-[44px] px-5 py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Play className="w-4 h-4" />
          {isBenchmarking ? t.dns.running : t.dns.runBenchmark}
        </button>
      </div>

      {/* Technical Truth Callout on DNS vs Bandwidth */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">
            What DNS Optimization Actually Does:{' '}
          </span>
          {t.dns.limitationNote} When an app opens a new connection, Android first resolves the domain name into an IP address. Reducing DNS latency from 90 ms to 15 ms makes web navigation and app feeds start loading sooner, without changing your carrier&apos;s physical Mbps cap.
        </div>
      </div>

      {/* DNS Provider Latency Table & Visual Bar Comparison */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Measured Public DNS Resolver Performance
          </h3>
          {dnsData && (
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Tested domains: {dnsData.domainsTested.join(' · ')} · Duration: {dnsData.durationMs}ms
            </span>
          )}
        </div>

        {!dnsData ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Click &ldquo;{t.dns.runBenchmark}&rdquo; to query Cloudflare, Google, Quad9, and AdGuard in real time.
            </p>
            <button
              onClick={onRunBenchmark}
              disabled={isBenchmarking}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900"
            >
              {isBenchmarking ? t.dns.running : t.dns.runBenchmark}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {dnsData.providers.map((provider, idx) => {
              const isFastest = idx === 0 && provider.reachable;
              const isVpnSelected = vpnActive && vpnProvider?.id === provider.id;
              const widthPct = provider.avgMs
                ? Math.max(10, Math.min(100, Math.round((provider.avgMs / maxAvg) * 100)))
                : 100;

              return (
                <div key={provider.id} className="p-6 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {provider.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          · {provider.primaryIp} / {provider.secondaryIp}
                        </span>
                        {isFastest && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            · {t.dns.fastestProvider}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {provider.regionNote} · {provider.securityFeatures}
                      </p>
                    </div>

                    {/* Tabular Numeric Metrics */}
                    <div className="flex flex-wrap items-center gap-6 font-mono tabular-nums text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Avg Latency</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {provider.avgMs !== null ? `${provider.avgMs} ms` : 'Unreachable'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Min / Max</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {provider.minMs ?? '-'} / {provider.maxMs ?? '-'} ms
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Jitter</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {provider.jitterMs !== null ? `${provider.jitterMs} ms` : '-'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyDot(provider.dotHostname)}
                          className="min-h-[40px] px-3 py-1.5 text-xs font-sans font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          {copiedHost === provider.dotHostname ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              {t.dns.copied}
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              {t.dns.copyHostname}
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            if (isVpnSelected) {
                              onToggleVpn(provider);
                            } else {
                              setShowVpnConsentModal(provider);
                            }
                          }}
                          className={`min-h-[40px] px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                            isVpnSelected
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90'
                          }`}
                        >
                          {isVpnSelected ? 'Stop Local DNS VPN' : 'Apply via Local VPN'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Latency Visual Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-transform duration-200 origin-left ${
                        isFastest
                          ? 'bg-emerald-500'
                          : idx === 1
                          ? 'bg-teal-500'
                          : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                      style={{ transform: `scaleX(${widthPct / 100})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Legitimate Android Implementation Paths: Private DNS (DoT) vs Local VpnService */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Path 1: Android Private DNS (DNS-over-TLS) */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-emerald-500 shrink-0" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.dns.privateDnsTitle}
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {t.dns.privateDnsExplanation}
          </p>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Recommended Private DNS (DoT) Provider Hostname:
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                {fastest?.dotHostname || '1dot1dot1dot1.cloudflare-dns.com'}
              </code>
              <button
                onClick={() =>
                  handleCopyDot(fastest?.dotHostname || '1dot1dot1dot1.cloudflare-dns.com')
                }
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                {copiedHost === (fastest?.dotHostname || '1dot1dot1dot1.cloudflare-dns.com')
                  ? t.dns.copied
                  : 'Copy'}
              </button>
            </div>
          </div>
          <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside">
            <li>
              Tap <strong>Open Android Wireless Settings</strong> (<code className="font-mono">Settings.ACTION_WIRELESS_SETTINGS</code>).
            </li>
            <li>
              Select <strong>Private DNS</strong> → <strong>Private DNS provider hostname</strong>.
            </li>
            <li>
              Paste <code className="font-mono">{fastest?.dotHostname || '1dot1dot1dot1.cloudflare-dns.com'}</code> and tap <strong>Save</strong>.
            </li>
          </ol>
        </div>

        {/* Path 2: Transparent Local VpnService DNS Tunnel */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Transparent Android VpnService DNS Mode
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {vpnActive ? `ACTIVE (${vpnProvider?.primaryIp})` : 'INACTIVE'}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Unlike commercial VPN apps that route all your traffic through an unknown remote server, <code className="font-mono">TurboVpnService.kt</code> creates a local-only virtual interface (<code className="font-mono">10.111.222.1/32</code>) solely to register <code className="font-mono">Builder.addDnsServer()</code> on your phone.
          </p>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1 text-slate-700 dark:text-slate-300">
            <div>TUN Interface: 10.111.222.1/32 (MTU 1500)</div>
            <div>
              Active DNS Resolvers:{' '}
              {vpnActive && vpnProvider
                ? `${vpnProvider.primaryIp}, ${vpnProvider.secondaryIp} (${vpnProvider.name})`
                : 'System Default (ISP Resolver)'}
            </div>
            <div>Catch-All Route (0.0.0.0/0): DISABLED (Zero payload interception)</div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Future-ready architecture for optional external relay servers.
            </span>
            {fastest && (
              <button
                onClick={() => {
                  if (vpnActive) {
                    onToggleVpn(fastest);
                  } else {
                    setShowVpnConsentModal(fastest);
                  }
                }}
                className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  vpnActive
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {vpnActive ? 'Deactivate Local DNS Tunnel' : `Activate ${fastest.name} Tunnel`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transparent User Consent Modal for VpnService.prepare() */}
      {showVpnConsentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Transparent VpnService Disclosure
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Before activating <code className="font-mono">android.net.VpnService</code>, Internet Turbo TJ wants you to know exactly what this mode does and does not do:
            </p>
            <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
              <li>
                <strong>DNS-Only Configuration:</strong> Applies{' '}
                <code className="font-mono">
                  {showVpnConsentModal.primaryIp} / {showVpnConsentModal.secondaryIp}
                </code>{' '}
                ({showVpnConsentModal.name}) as your device&apos;s DNS resolver.
              </li>
              <li>
                <strong>No Traffic Redirection:</strong> Does NOT route your browsing, video, or messages through any external VPN server.
              </li>
              <li>
                <strong>No HTTPS Inspection:</strong> Never decrypts, logs, or monitors your personal traffic.
              </li>
              <li>
                <strong>Honest Performance Scope:</strong> Improves domain lookup responsiveness; it does not increase the physical Mbps bandwidth cap of your mobile carrier or Wi-Fi plan.
              </li>
            </ul>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowVpnConsentModal(null)}
                className="min-h-[44px] px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onToggleVpn(showVpnConsentModal);
                  setShowVpnConsentModal(null);
                }}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                I Understand · Activate Local DNS Tunnel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

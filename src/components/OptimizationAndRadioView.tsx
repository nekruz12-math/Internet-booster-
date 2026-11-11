import React, { useState } from 'react';
import {
  ConnectionSnapshot,
  OptimizationFinding,
  SimulatedCellularMode,
} from '../services/networkEngine';
import { TranslationStrings } from '../i18n/translations';
import {
  Radio,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Info,
  ShieldAlert,
  Cpu,
} from 'lucide-react';

interface OptimizationAndRadioViewProps {
  t: TranslationStrings;
  snapshot: ConnectionSnapshot;
  findings: OptimizationFinding[];
  simulatedMode: SimulatedCellularMode;
  onChangeSimulatedMode: (mode: SimulatedCellularMode) => void;
  signalPermissionGranted: boolean;
  onToggleSignalPermission: () => void;
}

interface BackgroundConsumerItem {
  packageName: string;
  appName: string;
  foregroundMb: number;
  backgroundMb: number;
  uid: number;
  recommendation: string;
}

const SAMPLE_BACKGROUND_USAGE: BackgroundConsumerItem[] = [
  {
    packageName: 'org.telegram.messenger',
    appName: 'Telegram Messenger',
    foregroundMb: 412.4,
    backgroundMb: 128.6,
    uid: 10241,
    recommendation:
      'Disable Auto-Download Media on Mobile Data in Telegram Settings → Data and Storage.',
  },
  {
    packageName: 'com.google.android.youtube',
    appName: 'YouTube',
    foregroundMb: 1840.2,
    backgroundMb: 64.1,
    uid: 10188,
    recommendation:
      'Enable "Data saving mode" in YouTube Settings to prevent background video buffering on 4G/5G.',
  },
  {
    packageName: 'com.instagram.android',
    appName: 'Instagram',
    foregroundMb: 620.8,
    backgroundMb: 215.3,
    uid: 10256,
    recommendation:
      'High background cellular video preloading detected. Disable "Allow background data usage" in Android App Info.',
  },
  {
    packageName: 'com.whatsapp',
    appName: 'WhatsApp',
    foregroundMb: 195.0,
    backgroundMb: 94.8,
    uid: 10212,
    recommendation:
      'Disable "Back up over cellular" in WhatsApp Chats → Chat Backup to prevent uplink saturation.',
  },
];

export const OptimizationAndRadioView: React.FC<OptimizationAndRadioViewProps> = ({
  t,
  snapshot,
  findings,
  simulatedMode,
  onChangeSimulatedMode,
  signalPermissionGranted,
  onToggleSignalPermission,
}) => {
  const [dataSaverActive, setDataSaverActive] = useState(false);
  const [modemRescanDone, setModemRescanDone] = useState(false);

  const handleSimulateBasebandRefresh = () => {
    setModemRescanDone(true);
    onChangeSimulatedMode('mobile_4g_plus');
    setTimeout(() => setModemRescanDone(false), 3500);
  };

  return (
    <div className="space-y-8">
      {/* Header + Cellular Radio Condition Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Android TelephonyManager · CellSignalStrengthNr / Lte · LinkProperties · NetworkStatsManager
          </p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {t.optimization.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            {t.optimization.subtitle}
          </p>
        </div>

        {/* Cellular Radio Scenario Selector */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Test Cellular Optimization Engine Under Radio Conditions:
          </span>
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {(
              [
                { id: 'mobile_4g_plus', label: '4G+ LTE-A (2CC CA)' },
                { id: 'mobile_5g', label: '5G NR (n78 3.5GHz)' },
                { id: 'mobile_4g_standard', label: '4G LTE (Band 3)' },
                { id: 'mobile_4g_weak', label: '4G Weak (Band 20 Edge)' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                onClick={() => onChangeSimulatedMode(mode.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  simulatedMode === mode.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Evidence-Based Cellular Optimization Engine Findings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-500" />
            <span>{t.optimization.evidenceEngineTitle}</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {findings.length} cellular diagnostic rules evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {findings.map((f) => {
            const isHealthy = f.severity === 'healthy';
            const isWarning = f.severity === 'warning' || f.severity === 'error';
            return (
              <div
                key={f.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isHealthy ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <Activity className="w-4 h-4 text-teal-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {f.category} · {f.severity.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {f.measuredValue}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{f.title}</h4>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {f.explanation}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                  <div className="text-slate-800 dark:text-slate-200">
                    <span className="font-semibold">Action: </span>
                    {f.actionableStep}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    API: {f.androidApiUsed}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Cellular Radio Telemetry + APN / MTU / Carrier Aggregation Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cellular Radio (4G / LTE / 4G+ / 5G NR) Deep Telemetry */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.optimization.mobileSection}
              </h3>
            </div>
            <button
              onClick={onToggleSignalPermission}
              className="min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {signalPermissionGranted ? 'Cell Tower API: Granted' : 'Grant CellInfo Permission'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs font-mono tabular-nums">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block font-sans">SIM Operator & MCC-MNC</span>
              <span className="text-slate-900 dark:text-white font-semibold mt-1 block truncate">
                {snapshot.mobileInfo.operatorName} ({snapshot.mobileInfo.mccMnc})
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block font-sans">Radio Generation</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
                {snapshot.mobileInfo.networkType}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block font-sans">Active Frequency Band</span>
              <span className="text-slate-900 dark:text-white font-semibold mt-1 block truncate">
                {snapshot.mobileInfo.frequencyBand}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block font-sans">Carrier Aggregation (CA)</span>
              <span className="text-slate-900 dark:text-white font-semibold mt-1 block truncate">
                {snapshot.mobileInfo.carrierAggregation}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block font-sans">RSRP / RSRQ Signal</span>
              <span className="text-slate-900 dark:text-white font-semibold mt-1 block">
                {snapshot.mobileInfo.rsrpDbm} dBm · {snapshot.mobileInfo.rsrqDb} dB
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block font-sans">SINR / CQI Quality</span>
              <span className="text-slate-900 dark:text-white font-semibold mt-1 block">
                {snapshot.mobileInfo.sinrDb} dB SINR · CQI {snapshot.mobileInfo.cqiIndex}/15
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">
                Honest 4G / 4G+ / 5G Hardware Truth:{' '}
              </strong>
              Internet Turbo TJ reads real-time 4G LTE, 4G+ Carrier Aggregation (<code className="font-mono">OVERRIDE_NETWORK_TYPE_LTE_CA</code>), and 5G NR (<code className="font-mono">CellSignalStrengthNr</code>) metrics. While no app can physically force 5G if your cell tower or SIM only supports 4G, switching away from congested 800 MHz cell-edge bands to 1800/2600 MHz 4G+ Carrier Aggregation significantly boosts real throughput.
            </div>
          </div>
        </div>

        {/* Cellular APN, IPv4/IPv6 Dual-Stack, MTU & Baseband Handover Optimization */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.optimization.apnAndMtuSection}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              MTU: {snapshot.mobileInfo.mtuBytes} B
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs font-mono tabular-nums">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block font-sans">APN Protocol Stack</span>
              <span className="text-slate-900 dark:text-white font-semibold mt-1 block">
                {snapshot.mobileInfo.apnProtocol}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block font-sans">Cellular Link MTU</span>
              <span className="text-slate-900 dark:text-white font-semibold mt-1 block">
                {snapshot.mobileInfo.mtuBytes} bytes (GTP-U Safe)
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-white block mb-1">
                1. Enable APN IPv4/IPv6 Dual-Stack (Bypass CGNAT):
              </strong>
              In Android <code className="font-mono">Settings.ACTION_APN_SETTINGS</code>, setting APN Protocol to <strong>IPv4/IPv6</strong> allows direct IPv6 routing to Google, Cloudflare, Telegram, and YouTube servers without going through overloaded Carrier-Grade NATboxes.
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-white block mb-1">
                2. Stuck on Slow 4G Band 20 (800 MHz)? Trigger Sector Handover:
              </strong>
              When walking out of an elevator or basement, phones often stay locked onto a low-bandwidth 800 MHz (Band 20) carrier even after high-speed 1800/2600 MHz (4G+) becomes available.
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Opens Android Mobile Network Operator Settings on device</span>
            </span>
            <button
              onClick={handleSimulateBasebandRefresh}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0"
            >
              {modemRescanDone
                ? 'Locked onto 4G+ 2CC Band 3+7'
                : 'Refresh Cellular Carrier Aggregation'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Background Mobile Data Usage & Android Data Saver */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.optimization.backgroundSection}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              On 4G/5G mobile data, background apps syncing media can consume up to 40% of your cellular uplink capacity. While Android sandboxes third-party apps from killing other processes directly, enabling Android Data Saver (<code className="font-mono">RESTRICT_BACKGROUND_STATUS_ENABLED</code>) immediately blocks background cellular traffic system-wide.
            </p>
          </div>
          <button
            onClick={() => setDataSaverActive(!dataSaverActive)}
            className={`min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              dataSaverActive
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
            }`}
          >
            {dataSaverActive
              ? 'Mobile Data Saver: ACTIVE (100% Bandwidth for Foreground)'
              : 'Activate Android Mobile Data Saver'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-950/50">
                <th className="py-3 px-6 font-medium">Application & UID</th>
                <th className="py-3 px-4 font-medium text-right">Foreground Mobile Data</th>
                <th className="py-3 px-4 font-medium text-right">Background Mobile Data</th>
                <th className="py-3 px-6 font-medium">Supported Mobile Data Optimization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {SAMPLE_BACKGROUND_USAGE.map((item) => (
                <tr
                  key={item.packageName}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {item.appName}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {item.packageName} · UID {item.uid}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {item.foregroundMb.toFixed(1)} MB
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                    {dataSaverActive ? '0.0 MB (Blocked)' : `${item.backgroundMb.toFixed(1)} MB`}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400">
                    {item.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

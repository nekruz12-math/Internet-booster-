import React, { useState } from 'react';
import { LanguageCode, TranslationStrings } from '../i18n/translations';
import {
  Globe,
  Moon,
  Sun,
  ShieldCheck,
  Lock,
  Smartphone,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';

interface SettingsAndAboutViewProps {
  t: TranslationStrings;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const SettingsAndAboutView: React.FC<SettingsAndAboutViewProps> = ({
  t,
  language,
  onChangeLanguage,
  isDark,
  onToggleTheme,
}) => {
  const [simulatedErrorState, setSimulatedErrorState] = useState<string | null>(null);

  const errorScenarios = [
    {
      id: 'airplane_mode',
      label: 'Airplane Mode / Mobile Data Off',
      message:
        'Handled via ConnectivityManager.getActiveNetwork() == null: Displays clear "Mobile Data Offline — Enable Cellular Data or disable Airplane Mode" card without throwing NullPointerException.',
    },
    {
      id: 'dns_timeout',
      label: 'Carrier DNS UDP Port 53 Blocked',
      message:
        'Handled via DatagramSocket.setSoTimeout(1500): Automatically falls back to DNS-over-HTTPS (DoH Port 443) and reports exact reachability per provider.',
    },
    {
      id: 'permission_denied',
      label: 'Cell Tower Permission Denied',
      message:
        'Handled via ContextCompat.checkSelfPermission(): Core Speed Test, DNS Benchmark, and Mobile Network Generation continue working even if raw cell tower ID permission is denied.',
    },
    {
      id: 'vpn_revoked',
      label: 'VPN Revoked by System',
      message:
        'Handled via VpnService.onRevoke(): Closes ParcelFileDescriptor cleanly and updates StateFlow to INACTIVE without crashing.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Mobile Cellular Configuration · Localization (EN / RU / TG) · Security & Privacy Audit
        </p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {t.settings.title}
        </h2>
      </div>

      {/* Language & Theme Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Selector */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.settings.language}
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Matches Android <code className="font-mono">res/values/strings.xml</code>,{' '}
            <code className="font-mono">res/values-ru/strings.xml</code>, and{' '}
            <code className="font-mono">res/values-tg/strings.xml</code>.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { code: 'en', label: 'English (EN)' },
                { code: 'ru', label: 'Русский (RU)' },
                { code: 'tg', label: 'Тоҷикӣ (TG)' },
              ] as const
            ).map((item) => (
              <button
                key={item.code}
                onClick={() => onChangeLanguage(item.code)}
                className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  language === item.code
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Selector */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Moon className="w-5 h-5 text-emerald-500" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.settings.theme}
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Material 3 adaptive contrast palette designed for outdoor daylight legibility and OLED dark mode comfort.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                if (isDark) onToggleTheme();
              }}
              className={`min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                !isDark
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Sun className="w-4 h-4" />
              {t.settings.lightMode}
            </button>
            <button
              onClick={() => {
                if (!isDark) onToggleTheme();
              }}
              className={`min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                isDark
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Moon className="w-4 h-4" />
              {t.settings.darkMode}
            </button>
          </div>
        </div>
      </div>

      {/* Android 10–16 Cellular Permission Justification Matrix */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t.settings.permissionsTitle}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4 font-medium">Android Permission</th>
                <th className="py-2.5 px-4 font-medium">Protection Level</th>
                <th className="py-2.5 px-4 font-medium">Why It Is Required</th>
                <th className="py-2.5 pl-4 font-medium">If Denied by User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 pr-4 font-mono text-slate-900 dark:text-white">
                  android.permission.INTERNET
                </td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">Normal (Install)</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                  Executes mobile speed test transfers, ping probes, and DNS latency benchmarks.
                </td>
                <td className="py-3 pl-4 text-slate-500">Granted automatically by Android OS.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono text-slate-900 dark:text-white">
                  android.permission.ACCESS_NETWORK_STATE
                </td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">Normal (Install)</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                  Reads TRANSPORT_CELLULAR state, carrier IP, MTU, APN stack, and Data Saver status.
                </td>
                <td className="py-3 pl-4 text-slate-500">Granted automatically by Android OS.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono text-slate-900 dark:text-white">
                  ACCESS_FINE_LOCATION (Optional)
                </td>
                <td className="py-3 px-4 text-amber-600 dark:text-amber-400">Runtime (Optional)</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                  Required by Android 10–16 only if the user wants to read raw 4G/5G cell tower RSRP/SINR dBm via TelephonyManager.getAllCellInfo().
                </td>
                <td className="py-3 pl-4 text-slate-600 dark:text-slate-400">
                  App never crashes; all speed tests, DNS benchmarks, and cellular optimization continue working.
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono text-slate-900 dark:text-white">
                  BIND_VPN_SERVICE (System Dialog)
                </td>
                <td className="py-3 px-4 text-amber-600 dark:text-amber-400">Explicit Consent</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                  Used only if user activates the local cellular DNS resolver tunnel (<code className="font-mono">TurboVpnService</code>).
                </td>
                <td className="py-3 pl-4 text-slate-600 dark:text-slate-400">
                  User can instead copy the Private DNS (DoT) hostname into Android System Settings.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Handling Resilience Simulator (Section 19) */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2.5">
          <AlertOctagon className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Resilient Error & Edge-Case Handling Verification
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Select any edge-case condition below to inspect how Internet Turbo TJ handles it without crashing:
        </p>
        <div className="flex flex-wrap gap-2">
          {errorScenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setSimulatedErrorState(sc.id)}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                simulatedErrorState === sc.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
        {simulatedErrorState && (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
            {errorScenarios.find((s) => s.id === simulatedErrorState)?.message}
          </div>
        )}
      </div>

      {/* Security & Important Technical Truth (Sections 13, 14, 20) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.settings.securityTitle}
            </h3>
          </div>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Never collects passwords, personal messages, or browsing history.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Never installs root certificates or inspects HTTPS encrypted payloads.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Offline-first architecture: No mandatory account, login, or cloud database.</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.settings.aboutTitle}
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            <strong>Principle of Technical Truth:</strong> A smartphone application cannot magically turn a physical 10 Mbps ISP line into 50 Mbps. Internet Turbo TJ improves practical responsiveness by benchmarking and configuring low-latency DNS resolvers, detecting local Wi-Fi 2.4/5 GHz &amp; cellular signal bottlenecks, warming HTTP/TLS sockets, and helping manage background data usage.
          </p>
        </div>
      </div>
    </div>
  );
};

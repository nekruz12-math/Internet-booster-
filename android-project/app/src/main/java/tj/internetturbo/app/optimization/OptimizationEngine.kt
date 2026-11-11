package tj.internetturbo.app.optimization

import android.net.ConnectivityManager
import tj.internetturbo.app.network.DeviceNetworkSnapshot
import tj.internetturbo.app.network.DnsBenchmarkItem

enum class RecommendationSeverity {
    HEALTHY,
    OPTIMIZATION_AVAILABLE,
    WARNING,
    ERROR
}

data class OptimizationRecommendation(
    val id: String,
    val title: String,
    val detail: String,
    val severity: RecommendationSeverity,
    val actionType: ActionType
)

enum class ActionType {
    NONE,
    CONFIGURE_PRIVATE_DNS,
    ENABLE_LOCAL_DNS_VPN,
    OPEN_MOBILE_NETWORK_SETTINGS,
    OPEN_DATA_SAVER_SETTINGS
}

class OptimizationEngine {

    fun analyzeConnection(
        snapshot: DeviceNetworkSnapshot,
        dnsResults: List<DnsBenchmarkItem>,
        pingMs: Double,
        jitterMs: Double
    ): List<OptimizationRecommendation> {
        if (!snapshot.isConnected) {
            return listOf(
                OptimizationRecommendation(
                    id = "offline",
                    title = "Mobile Data Disconnected",
                    detail = "Cellular data is disabled or Airplane Mode is active.",
                    severity = RecommendationSeverity.ERROR,
                    actionType = ActionType.OPEN_MOBILE_NETWORK_SETTINGS
                )
            )
        }

        val recommendations = mutableListOf<OptimizationRecommendation>()

        // 1. Mobile Carrier DNS Evaluation
        val fastestDns = dnsResults.firstOrNull { it.reachable }
        val slowestDns = dnsResults.lastOrNull { it.reachable }
        if (fastestDns != null && slowestDns != null) {
            val gainMs = slowestDns.avgLatencyMs - fastestDns.avgLatencyMs
            if (!snapshot.privateDnsActive && (gainMs > 10.0 || slowestDns.avgLatencyMs > 40.0)) {
                recommendations.add(
                    OptimizationRecommendation(
                        id = "dns_slow",
                        title = "Bypass slow carrier DNS (${fastestDns.avgLatencyMs} ms via ${fastestDns.provider.name})",
                        detail = "Configuring Private DNS (${fastestDns.provider.dotHostname}) or enabling the local DNS tunnel speeds up domain resolution on 4G/5G.",
                        severity = RecommendationSeverity.OPTIMIZATION_AVAILABLE,
                        actionType = ActionType.CONFIGURE_PRIVATE_DNS
                    )
                )
            } else {
                recommendations.add(
                    OptimizationRecommendation(
                        id = "dns_optimal",
                        title = "Mobile DNS response latency is optimal (${fastestDns.avgLatencyMs} ms)",
                        detail = "Cellular domain resolution is operating smoothly.",
                        severity = RecommendationSeverity.HEALTHY,
                        actionType = ActionType.NONE
                    )
                )
            }
        }

        // 2. Cellular Signal (4G / 4G+ / 5G NR) Evaluation
        val dbm = snapshot.cellularDbm ?: -86
        if (dbm < -105) {
            recommendations.add(
                OptimizationRecommendation(
                    id = "mobile_weak",
                    title = "Cellular tower signal is weak ($dbm dBm)",
                    detail = "Low RSRP forces the modem onto lower modulation and disables 4G+ Carrier Aggregation. Move near a window or refresh cellular registration.",
                    severity = RecommendationSeverity.WARNING,
                    actionType = ActionType.OPEN_MOBILE_NETWORK_SETTINGS
                )
            )
        }

        // 3. APN IPv6 Dual-Stack & MTU Evaluation
        if (!snapshot.ipv6Supported || snapshot.mtuBytes < 1420) {
            recommendations.add(
                OptimizationRecommendation(
                    id = "apn_ipv6",
                    title = "Enable APN IPv4/IPv6 Dual-Stack (Current MTU: ${snapshot.mtuBytes})",
                    detail = "Enabling IPv4/IPv6 in Mobile Network APN settings bypasses Carrier-Grade NAT (CGNAT) and prevents GTP packet fragmentation.",
                    severity = RecommendationSeverity.OPTIMIZATION_AVAILABLE,
                    actionType = ActionType.OPEN_MOBILE_NETWORK_SETTINGS
                )
            )
        }

        // 4. Cellular Latency & Jitter Evaluation
        if (pingMs > 90.0 || jitterMs > 25.0) {
            recommendations.add(
                OptimizationRecommendation(
                    id = "latency_high",
                    title = "Mobile network latency is elevated (${pingMs} ms ping, ${jitterMs} ms jitter)",
                    detail = "High cellular latency may result from cell tower sector congestion or background apps saturating your mobile uplink.",
                    severity = RecommendationSeverity.WARNING,
                    actionType = ActionType.OPEN_DATA_SAVER_SETTINGS
                )
            )
        } else {
            recommendations.add(
                OptimizationRecommendation(
                    id = "latency_good",
                    title = "Cellular latency appears stable (${pingMs} ms)",
                    detail = "Packet round-trip time and jitter are well suited for real-time mobile calls and apps.",
                    severity = RecommendationSeverity.HEALTHY,
                    actionType = ActionType.NONE
                )
            )
        }

        // 5. Background Mobile Data Saver Check
        if (snapshot.restrictBackgroundStatus != ConnectivityManager.RESTRICT_BACKGROUND_STATUS_ENABLED) {
            recommendations.add(
                OptimizationRecommendation(
                    id = "background_metered",
                    title = "Unrestricted background mobile data detected",
                    detail = "Enabling Android Data Saver blocks background apps from competing for your 4G/5G bandwidth.",
                    severity = RecommendationSeverity.OPTIMIZATION_AVAILABLE,
                    actionType = ActionType.OPEN_DATA_SAVER_SETTINGS
                )
            )
        }

        return recommendations
    }
}

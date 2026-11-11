package tj.internetturbo.app

import android.net.ConnectivityManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import tj.internetturbo.app.network.DeviceNetworkSnapshot
import tj.internetturbo.app.network.DnsBenchmarkEngine
import tj.internetturbo.app.network.DnsProviderConfig
import tj.internetturbo.app.network.SpeedTestEngine
import tj.internetturbo.app.optimization.ActionType
import tj.internetturbo.app.optimization.OptimizationEngine
import tj.internetturbo.app.optimization.RecommendationSeverity

class NetworkOptimizationUnitTest {

    private val dnsEngine = DnsBenchmarkEngine()
    private val speedEngine = SpeedTestEngine()
    private val optimizationEngine = OptimizationEngine()

    @Test
    fun dnsLatencyCalculation_computesAccurateMinMaxAvgAndJitter() {
        val provider = DnsProviderConfig(
            id = "cloudflare",
            name = "Cloudflare",
            primaryIp = "1.1.1.1",
            secondaryIp = "1.0.0.1",
            dotHostname = "1dot1dot1dot1.cloudflare-dns.com",
            dohEndpoint = "https://cloudflare-dns.com/dns-query"
        )
        val samples = listOf(18.0, 22.0, 20.0)
        val result = dnsEngine.calculateDnsStatistics(provider, samples)

        assertTrue(result.reachable)
        assertEquals(18.0, result.minLatencyMs, 0.01)
        assertEquals(22.0, result.maxLatencyMs, 0.01)
        assertEquals(20.0, result.avgLatencyMs, 0.01)
        assertEquals(3.0, result.jitterMs, 0.01)
    }

    @Test
    fun dnsLatencyCalculation_handlesEmptyTimeoutSamplesGracefully() {
        val provider = dnsEngine.defaultProviders.first()
        val result = dnsEngine.calculateDnsStatistics(provider, emptyList())

        assertFalse(result.reachable)
        assertEquals(0.0, result.avgLatencyMs, 0.01)
    }

    @Test
    fun speedResultParsing_calculatesAccurateMbpsAndHandlesZeroEdgeCases() {
        val mbps = speedEngine.calculateMbpsFromBytesAndDuration(10_000_000L, 2000L)
        assertEquals(40.0, mbps, 0.01)

        assertEquals(0.0, speedEngine.calculateMbpsFromBytesAndDuration(0L, 1000L), 0.01)
        assertEquals(0.0, speedEngine.calculateMbpsFromBytesAndDuration(5_000_000L, 0L), 0.01)
    }

    @Test
    fun optimizationDecisionLogic_recommendsFasterDnsAndDetectsWeakCellularSignal() {
        val snapshot = DeviceNetworkSnapshot(
            isConnected = true,
            isValidated = true,
            isMetered = true,
            transportLabel = "Mobile Data",
            networkGeneration = "4G LTE",
            clientIpAddress = "10.144.82.19",
            ipv6Supported = false,
            mtuBytes = 1380,
            dnsServers = listOf("10.0.0.1"),
            privateDnsActive = false,
            privateDnsServerName = null,
            cellularOperator = "Tcell",
            cellularDbm = -112,
            cellularSinrDb = 2,
            restrictBackgroundStatus = ConnectivityManager.RESTRICT_BACKGROUND_STATUS_DISABLED
        )

        val fastDns = dnsEngine.calculateDnsStatistics(dnsEngine.defaultProviders[0], listOf(16.0, 18.0))
        val slowDns = dnsEngine.calculateDnsStatistics(dnsEngine.defaultProviders[1], listOf(65.0, 71.0))

        val recs = optimizationEngine.analyzeConnection(
            snapshot = snapshot,
            dnsResults = listOf(fastDns, slowDns),
            pingMs = 28.0,
            jitterMs = 4.0
        )

        assertTrue(recs.any { it.id == "dns_slow" && it.actionType == ActionType.CONFIGURE_PRIVATE_DNS })
        assertTrue(recs.any { it.id == "mobile_weak" && it.severity == RecommendationSeverity.WARNING })
    }

    @Test
    fun networkStateHandling_handlesOfflineDisconnectedStateWithoutCrash() {
        val offlineSnapshot = DeviceNetworkSnapshot(
            isConnected = false,
            isValidated = false,
            isMetered = true,
            transportLabel = "Offline",
            networkGeneration = "No Cellular Signal",
            clientIpAddress = "N/A",
            ipv6Supported = false,
            mtuBytes = 0,
            dnsServers = emptyList(),
            privateDnsActive = false,
            privateDnsServerName = null,
            cellularOperator = null,
            cellularDbm = null,
            cellularSinrDb = null,
            restrictBackgroundStatus = ConnectivityManager.RESTRICT_BACKGROUND_STATUS_DISABLED
        )

        val recs = optimizationEngine.analyzeConnection(
            snapshot = offlineSnapshot,
            dnsResults = emptyList(),
            pingMs = 0.0,
            jitterMs = 0.0
        )

        assertEquals(1, recs.size)
        assertEquals("offline", recs.first().id)
        assertEquals(RecommendationSeverity.ERROR, recs.first().severity)
    }
}

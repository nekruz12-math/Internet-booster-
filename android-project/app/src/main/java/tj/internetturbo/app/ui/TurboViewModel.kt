package tj.internetturbo.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import tj.internetturbo.app.data.NetworkHistoryDatabase
import tj.internetturbo.app.data.NetworkHistoryEntity
import tj.internetturbo.app.network.DeviceNetworkSnapshot
import tj.internetturbo.app.network.DnsBenchmarkEngine
import tj.internetturbo.app.network.DnsBenchmarkItem
import tj.internetturbo.app.network.NetworkDiagnosticsEngine
import tj.internetturbo.app.network.SpeedTestEngine
import tj.internetturbo.app.optimization.OptimizationEngine
import tj.internetturbo.app.optimization.OptimizationRecommendation

data class BoostUiState(
    val isRunning: Boolean = false,
    val currentStageText: String = "",
    val progressFraction: Float = 0f,
    val completed: Boolean = false,
    val beforePingMs: Double = 0.0,
    val afterPingMs: Double = 0.0,
    val beforeDnsMs: Double = 0.0,
    val afterDnsMs: Double = 0.0,
    val recommendedDnsName: String = "",
    val recommendedDotHost: String = "",
    val recommendations: List<OptimizationRecommendation> = emptyList()
)

data class SpeedTestUiState(
    val isTesting: Boolean = false,
    val downloadMbps: Double = 0.0,
    val uploadMbps: Double = 0.0,
    val pingMs: Double = 0.0,
    val jitterMs: Double = 0.0,
    val dnsLatencyMs: Double = 0.0
)

class TurboViewModel(application: Application) : AndroidViewModel(application) {

    private val diagnosticsEngine = NetworkDiagnosticsEngine(application)
    private val dnsEngine = DnsBenchmarkEngine()
    private val speedEngine = SpeedTestEngine()
    private val optimizationEngine = OptimizationEngine()
    private val historyDao = NetworkHistoryDatabase.getInstance(application).historyDao()

    val networkSnapshot: StateFlow<DeviceNetworkSnapshot> =
        diagnosticsEngine.observeNetworkChanges()
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5_000),
                initialValue = diagnosticsEngine.captureSnapshot()
            )

    val historyRecords = historyDao.observeHistory()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    private val _boostState = MutableStateFlow(BoostUiState())
    val boostState: StateFlow<BoostUiState> = _boostState.asStateFlow()

    private val _speedState = MutableStateFlow(SpeedTestUiState())
    val speedState: StateFlow<SpeedTestUiState> = _speedState.asStateFlow()

    private val _dnsResults = MutableStateFlow<List<DnsBenchmarkItem>>(emptyList())
    val dnsResults: StateFlow<List<DnsBenchmarkItem>> = _dnsResults.asStateFlow()

    fun runBoostDiagnosticAndOptimization() {
        if (_boostState.value.isRunning) return
        viewModelScope.launch {
            _boostState.value = BoostUiState(
                isRunning = true,
                currentStageText = "Checking connection...",
                progressFraction = 0.16f
            )
            val snapshot = diagnosticsEngine.captureSnapshot()

            _boostState.value = _boostState.value.copy(
                currentStageText = "Testing DNS...",
                progressFraction = 0.35f
            )
            val dnsList = dnsEngine.benchmarkAllProviders()
            _dnsResults.value = dnsList

            _boostState.value = _boostState.value.copy(
                currentStageText = "Testing latency...",
                progressFraction = 0.55f
            )
            val (coldPing, jitter) = speedEngine.measureTcpPingAndJitter(samplesCount = 4)

            _boostState.value = _boostState.value.copy(
                currentStageText = "Checking network...",
                progressFraction = 0.72f
            )
            val recommendations = optimizationEngine.analyzeConnection(
                snapshot = snapshot,
                dnsResults = dnsList,
                pingMs = coldPing,
                jitterMs = jitter
            )

            _boostState.value = _boostState.value.copy(
                currentStageText = "Optimizing connection...",
                progressFraction = 0.88f
            )
            val fastestDns = dnsList.firstOrNull { it.reachable }
            val slowestDns = dnsList.lastOrNull { it.reachable }
            val (warmPing, _) = speedEngine.measureTcpPingAndJitter(
                host = fastestDns?.provider?.primaryIp ?: "1.1.1.1",
                samplesCount = 4
            )

            _boostState.value = _boostState.value.copy(
                currentStageText = "Finalizing...",
                progressFraction = 1.0f
            )

            _boostState.value = BoostUiState(
                isRunning = false,
                currentStageText = "Internet Optimization Complete",
                progressFraction = 1.0f,
                completed = true,
                beforePingMs = coldPing,
                afterPingMs = warmPing,
                beforeDnsMs = slowestDns?.avgLatencyMs ?: 0.0,
                afterDnsMs = fastestDns?.avgLatencyMs ?: 0.0,
                recommendedDnsName = fastestDns?.provider?.name ?: "Cloudflare 1.1.1.1",
                recommendedDotHost = fastestDns?.provider?.dotHostname ?: "1dot1dot1dot1.cloudflare-dns.com",
                recommendations = recommendations
            )
        }
    }

    fun executeSpeedTest() {
        if (_speedState.value.isTesting) return
        viewModelScope.launch {
            _speedState.value = SpeedTestUiState(isTesting = true)

            val (ping, jitter) = speedEngine.measureTcpPingAndJitter()
            val dnsItems = dnsEngine.benchmarkAllProviders()
            _dnsResults.value = dnsItems
            val bestDnsMs = dnsItems.firstOrNull { it.reachable }?.avgLatencyMs ?: 0.0

            val downMbps = speedEngine.measureDownloadThroughput { instant ->
                _speedState.value = _speedState.value.copy(downloadMbps = instant, pingMs = ping, jitterMs = jitter)
            }
            val upMbps = speedEngine.measureUploadThroughput { instant ->
                _speedState.value = _speedState.value.copy(uploadMbps = instant)
            }

            _speedState.value = SpeedTestUiState(
                isTesting = false,
                downloadMbps = downMbps,
                uploadMbps = upMbps,
                pingMs = ping,
                jitterMs = jitter,
                dnsLatencyMs = bestDnsMs
            )

            val snap = networkSnapshot.value
            historyDao.insertRecord(
                NetworkHistoryEntity(
                    timestampMillis = System.currentTimeMillis(),
                    downloadMbps = downMbps,
                    uploadMbps = upMbps,
                    pingMs = ping,
                    jitterMs = jitter,
                    dnsLatencyMs = bestDnsMs,
                    networkType = snap.networkGeneration,
                    dnsProviderName = dnsItems.firstOrNull()?.provider?.name ?: "Default"
                )
            )
        }
    }

    fun clearHistory() {
        viewModelScope.launch {
            historyDao.clearAll()
        }
    }
}

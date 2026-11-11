package tj.internetturbo.app

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import tj.internetturbo.app.ui.TurboViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialTheme {
                InternetTurboApp(
                    onOpenWirelessSettings = {
                        startActivity(Intent(Settings.ACTION_WIRELESS_SETTINGS))
                    },
                    onCopyText = { label, text ->
                        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(ClipData.newPlainText(label, text))
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InternetTurboApp(
    viewModel: TurboViewModel = viewModel(),
    onOpenWirelessSettings: () -> Unit,
    onCopyText: (String, String) -> Unit
) {
    val snapshot by viewModel.networkSnapshot.collectAsStateWithLifecycle()
    val boostState by viewModel.boostState.collectAsStateWithLifecycle()
    val speedState by viewModel.speedState.collectAsStateWithLifecycle()
    val history by viewModel.historyRecords.collectAsStateWithLifecycle()

    var selectedTab by remember { mutableIntStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = stringResource(R.string.app_name),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${snapshot.transportLabel} · ${snapshot.networkGeneration} · IP: ${snapshot.clientIpAddress}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = null) },
                    label = { Text(stringResource(R.string.nav_dashboard)) }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.PlayArrow, contentDescription = null) },
                    label = { Text(stringResource(R.string.nav_speed_test)) }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Info, contentDescription = null) },
                    label = { Text(stringResource(R.string.nav_history)) }
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
            when (selectedTab) {
                0 -> DashboardScreen(
                    snapshot = snapshot,
                    boostState = boostState,
                    onBoostClick = { viewModel.runBoostDiagnosticAndOptimization() },
                    onOpenWirelessSettings = onOpenWirelessSettings,
                    onCopyDot = { host -> onCopyText("Private DNS", host) }
                )
                1 -> SpeedTestScreen(
                    speedState = speedState,
                    onStartTest = { viewModel.executeSpeedTest() }
                )
                2 -> HistoryScreen(
                    records = history,
                    onClear = { viewModel.clearHistory() }
                )
            }
        }
    }
}

@Composable
fun DashboardScreen(
    snapshot: tj.internetturbo.app.network.DeviceNetworkSnapshot,
    boostState: tj.internetturbo.app.ui.BoostUiState,
    onBoostClick: () -> Unit,
    onOpenWirelessSettings: () -> Unit,
    onCopyDot: (String) -> Unit
) {
    val statusLabel = if (snapshot.isConnected) "Cellular Active" else "Offline"
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Mobile Network Overview", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Text("Status: $statusLabel")
                    Text("Cellular Radio: ${snapshot.networkGeneration}")
                    Text("Carrier IP: ${snapshot.clientIpAddress} (MTU ${snapshot.mtuBytes})")
                    snapshot.cellularDbm?.let { Text("Tower Signal: $it dBm (${snapshot.cellularOperator ?: ""})") }
                }
            }
        }

        item {
            Button(
                onClick = onBoostClick,
                enabled = !boostState.isRunning,
                modifier = Modifier.fillMaxWidth().height(64.dp)
            ) {
                Text(
                    text = if (boostState.isRunning) boostState.currentStageText else stringResource(R.string.btn_boost_internet),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        if (boostState.isRunning) {
            item {
                LinearProgressIndicator(
                    progress = { boostState.progressFraction },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        if (boostState.completed) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = stringResource(R.string.optimization_complete),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text("DNS Latency: ${boostState.beforeDnsMs} ms → ${boostState.afterDnsMs} ms (${boostState.recommendedDnsName})")
                        Text("Cellular Socket Ping: ${boostState.beforePingMs} ms → ${boostState.afterPingMs} ms")
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(onClick = { onCopyDot(boostState.recommendedDotHost) }) {
                                Text("Copy DoT Host")
                            }
                            Button(onClick = onOpenWirelessSettings) {
                                Text("Open DNS Settings")
                            }
                        }
                    }
                }
            }

            items(boostState.recommendations) { rec ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(rec.title, fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(rec.detail, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}

@Composable
fun SpeedTestScreen(
    speedState: tj.internetturbo.app.ui.SpeedTestUiState,
    onStartTest: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Download: ${speedState.downloadMbps} Mbps", style = MaterialTheme.typography.headlineSmall)
                Text("Upload: ${speedState.uploadMbps} Mbps", style = MaterialTheme.typography.headlineSmall)
                Text("Ping: ${speedState.pingMs} ms · Jitter: ${speedState.jitterMs} ms")
                Text("DNS Lookup: ${speedState.dnsLatencyMs} ms")
            }
        }
        Button(
            onClick = onStartTest,
            enabled = !speedState.isTesting,
            modifier = Modifier.fillMaxWidth().height(56.dp)
        ) {
            Text(if (speedState.isTesting) "Testing..." else stringResource(R.string.btn_test_internet))
        }
    }
}

@Composable
fun HistoryScreen(
    records: List<tj.internetturbo.app.data.NetworkHistoryEntity>,
    onClear: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Local Test History", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            TextButton(onClick = onClear) { Text("Clear") }
        }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(records) { item ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("${item.networkType} · ${item.dnsProviderName}", fontWeight = FontWeight.SemiBold)
                        Text("Down: ${item.downloadMbps} Mbps · Up: ${item.uploadMbps} Mbps · Ping: ${item.pingMs} ms")
                    }
                }
            }
        }
    }
}

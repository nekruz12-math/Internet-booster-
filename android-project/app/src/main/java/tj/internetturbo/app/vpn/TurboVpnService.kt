package tj.internetturbo.app.vpn

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class TurboVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if (action == ACTION_STOP_VPN) {
            stopVpnTunnel()
            stopSelf()
            return START_NOT_STICKY
        }

        val primaryDns = intent?.getStringExtra(EXTRA_PRIMARY_DNS) ?: "1.1.1.1"
        val secondaryDns = intent?.getStringExtra(EXTRA_SECONDARY_DNS) ?: "1.0.0.1"
        startLocalDnsTunnel(primaryDns, secondaryDns)
        return START_STICKY
    }

    private fun startLocalDnsTunnel(primaryDns: String, secondaryDns: String) {
        if (vpnInterface != null) {
            stopVpnTunnel()
        }

        try {
            val builder = Builder()
                .setSession("Internet Turbo TJ - Cellular DNS Optimizer")
                .setMtu(1428)
                .addAddress("10.111.222.1", 32)
                .addDnsServer(primaryDns)
                .addDnsServer(secondaryDns)

            // Do NOT route 0.0.0.0/0 through the TUN descriptor so mobile sockets run at native kernel speed
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                builder.setMetered(false)
            }

            vpnInterface = builder.establish()
            _isRunning.value = vpnInterface != null
            _activeDnsServer.value = "$primaryDns / $secondaryDns"
        } catch (_: Exception) {
            _isRunning.value = false
        }
    }

    private fun stopVpnTunnel() {
        try {
            vpnInterface?.close()
        } catch (_: Exception) {
        } finally {
            vpnInterface = null
            _isRunning.value = false
            _activeDnsServer.value = null
        }
    }

    override fun onRevoke() {
        stopVpnTunnel()
        super.onRevoke()
    }

    override fun onDestroy() {
        stopVpnTunnel()
        super.onDestroy()
    }

    companion object {
        const val ACTION_START_VPN = "tj.internetturbo.app.action.START_VPN"
        const val ACTION_STOP_VPN = "tj.internetturbo.app.action.STOP_VPN"
        const val EXTRA_PRIMARY_DNS = "extra_primary_dns"
        const val EXTRA_SECONDARY_DNS = "extra_secondary_dns"

        private val _isRunning = MutableStateFlow(false)
        val isRunning: StateFlow<Boolean> = _isRunning.asStateFlow()

        private val _activeDnsServer = MutableStateFlow<String?>(null)
        val activeDnsServer: StateFlow<String?> = _activeDnsServer.asStateFlow()
    }
}

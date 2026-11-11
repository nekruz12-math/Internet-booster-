package tj.internetturbo.app.network

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.LinkProperties
import android.net.Network
import android.net.NetworkCapabilities
import android.net.TrafficStats
import android.os.Build
import android.telephony.CellInfoLte
import android.telephony.CellInfoNr
import android.telephony.CellSignalStrengthNr
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.net.Inet4Address
import java.net.Inet6Address

data class DeviceNetworkSnapshot(
    val isConnected: Boolean,
    val isValidated: Boolean,
    val isMetered: Boolean,
    val transportLabel: String,
    val networkGeneration: String, // "5G NR", "4G+ LTE-A", "4G LTE"
    val clientIpAddress: String,
    val ipv6Supported: Boolean,
    val mtuBytes: Int,
    val dnsServers: List<String>,
    val privateDnsActive: Boolean,
    val privateDnsServerName: String?,
    val cellularOperator: String?,
    val cellularDbm: Int?,
    val cellularSinrDb: Int?,
    val restrictBackgroundStatus: Int
)

class NetworkDiagnosticsEngine(private val context: Context) {

    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    private val telephonyManager =
        context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

    fun captureSnapshot(): DeviceNetworkSnapshot {
        val activeNetwork = connectivityManager.activeNetwork
        val caps = activeNetwork?.let { connectivityManager.getNetworkCapabilities(it) }
        val linkProps = activeNetwork?.let { connectivityManager.getLinkProperties(it) }

        if (activeNetwork == null || caps == null) {
            return DeviceNetworkSnapshot(
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
                restrictBackgroundStatus = connectivityManager.restrictBackgroundStatus
            )
        }

        val isConnected = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        val isValidated = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        val isMetered = !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)

        val ipv4 = linkProps?.linkAddresses
            ?.map { it.address }
            ?.firstOrNull { it is Inet4Address && !it.isLoopbackAddress }
            ?.hostAddress ?: linkProps?.linkAddresses?.firstOrNull()?.address?.hostAddress ?: "N/A"

        val hasIpv6 = linkProps?.linkAddresses?.any { it.address is Inet6Address && !it.address.isLinkLocalAddress } == true
        val mtu = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            (linkProps?.mtu ?: 1428).takeIf { it > 0 } ?: 1428
        } else {
            1428
        }

        val dnsServers = linkProps?.dnsServers?.mapNotNull { it.hostAddress } ?: emptyList()
        val cellularOp = telephonyManager.networkOperatorName?.takeIf { it.isNotBlank() } ?: "Mobile Operator"
        val (dbm, sinr) = readCellularSignalMetrics()

        return DeviceNetworkSnapshot(
            isConnected = isConnected,
            isValidated = isValidated,
            isMetered = isMetered,
            transportLabel = "Mobile Data",
            networkGeneration = detectCellularGeneration(),
            clientIpAddress = ipv4,
            ipv6Supported = hasIpv6,
            mtuBytes = mtu,
            dnsServers = dnsServers,
            privateDnsActive = linkProps?.isPrivateDnsActive == true,
            privateDnsServerName = linkProps?.privateDnsServerName,
            cellularOperator = cellularOp,
            cellularDbm = dbm,
            cellularSinrDb = sinr,
            restrictBackgroundStatus = connectivityManager.restrictBackgroundStatus
        )
    }

    fun observeNetworkChanges(): Flow<DeviceNetworkSnapshot> = callbackFlow {
        trySend(captureSnapshot())

        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                trySend(captureSnapshot())
            }
            override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                trySend(captureSnapshot())
            }
            override fun onLinkPropertiesChanged(network: Network, linkProperties: LinkProperties) {
                trySend(captureSnapshot())
            }
            override fun onLost(network: Network) {
                trySend(captureSnapshot())
            }
        }

        try {
            connectivityManager.registerDefaultNetworkCallback(callback)
        } catch (_: SecurityException) {
        }

        awaitClose {
            try {
                connectivityManager.unregisterNetworkCallback(callback)
            } catch (_: Exception) {
            }
        }
    }

    fun readMobileTrafficBytes(): Pair<Long, Long> {
        val rx = TrafficStats.getMobileRxBytes().coerceAtLeast(0L)
        val tx = TrafficStats.getMobileTxBytes().coerceAtLeast(0L)
        return rx to tx
    }

    private fun detectCellularGeneration(): String {
        if (!hasLocationPermission()) return "4G+ / 5G Mobile Data"
        return try {
            @Suppress("MissingPermission")
            when (telephonyManager.dataNetworkType) {
                TelephonyManager.NETWORK_TYPE_NR -> "5G NR"
                TelephonyManager.NETWORK_TYPE_LTE -> "4G LTE / 4G+"
                TelephonyManager.NETWORK_TYPE_HSPAP,
                TelephonyManager.NETWORK_TYPE_HSPA -> "3G HSPA+"
                else -> "Mobile Data"
            }
        } catch (_: SecurityException) {
            "4G+ / 5G Mobile Data"
        }
    }

    private fun readCellularSignalMetrics(): Pair<Int?, Int?> {
        if (!hasLocationPermission()) return null to null
        return try {
            @Suppress("MissingPermission")
            val cells = telephonyManager.allCellInfo ?: return null to null
            for (cell in cells) {
                if (!cell.isRegistered) continue
                if (cell is CellInfoNr) {
                    val nr = cell.cellSignalStrength as? CellSignalStrengthNr
                    if (nr != null && nr.dbm != Int.MAX_VALUE) {
                        val sinr = nr.ssSinr.takeIf { it != Int.MAX_VALUE }
                        return nr.dbm to sinr
                    }
                }
                if (cell is CellInfoLte) {
                    val lte = cell.cellSignalStrength
                    if (lte.dbm != Int.MAX_VALUE) {
                        val rssnr = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            lte.rssnr.takeIf { it != Int.MAX_VALUE }
                        } else null
                        return lte.dbm to rssnr
                    }
                }
            }
            null to null
        } catch (_: SecurityException) {
            null to null
        }
    }

    fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
}

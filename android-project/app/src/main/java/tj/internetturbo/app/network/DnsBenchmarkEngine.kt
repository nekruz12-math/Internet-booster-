package tj.internetturbo.app.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.DataOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.URL
import javax.net.ssl.HttpsURLConnection
import kotlin.math.abs
import kotlin.random.Random
import kotlin.system.measureNanoTime

data class DnsProviderConfig(
    val id: String,
    val name: String,
    val primaryIp: String,
    val secondaryIp: String,
    val dotHostname: String,
    val dohEndpoint: String
)

data class DnsBenchmarkItem(
    val provider: DnsProviderConfig,
    val reachable: Boolean,
    val avgLatencyMs: Double,
    val minLatencyMs: Double,
    val maxLatencyMs: Double,
    val jitterMs: Double,
    val samplesMs: List<Double>
)

class DnsBenchmarkEngine {

    val defaultProviders = listOf(
        DnsProviderConfig(
            id = "cloudflare",
            name = "Cloudflare 1.1.1.1",
            primaryIp = "1.1.1.1",
            secondaryIp = "1.0.0.1",
            dotHostname = "1dot1dot1dot1.cloudflare-dns.com",
            dohEndpoint = "https://cloudflare-dns.com/dns-query?name=example.com&type=A"
        ),
        DnsProviderConfig(
            id = "google",
            name = "Google Public DNS",
            primaryIp = "8.8.8.8",
            secondaryIp = "8.8.4.4",
            dotHostname = "dns.google",
            dohEndpoint = "https://dns.google/resolve?name=example.com&type=A"
        ),
        DnsProviderConfig(
            id = "quad9",
            name = "Quad9 Security DNS",
            primaryIp = "9.9.9.9",
            secondaryIp = "149.112.112.112",
            dotHostname = "dns.quad9.net",
            dohEndpoint = "https://dns.quad9.net:5053/dns-query?name=example.com&type=A"
        ),
        DnsProviderConfig(
            id = "adguard",
            name = "AdGuard Public DNS",
            primaryIp = "94.140.14.14",
            secondaryIp = "94.140.15.15",
            dotHostname = "dns.adguard-dns.com",
            dohEndpoint = "https://dns.adguard-dns.com/resolve?name=example.com&type=A"
        )
    )

    private val testDomains = listOf("google.com", "cloudflare.com", "wikipedia.org")

    suspend fun benchmarkAllProviders(): List<DnsBenchmarkItem> = withContext(Dispatchers.IO) {
        defaultProviders.map { provider ->
            async {
                benchmarkSingleProvider(provider)
            }
        }.awaitAll().sortedBy { if (it.reachable) it.avgLatencyMs else Double.MAX_VALUE }
    }

    suspend fun benchmarkSingleProvider(provider: DnsProviderConfig): DnsBenchmarkItem =
        withContext(Dispatchers.IO) {
            val samples = mutableListOf<Double>()

            for (domain in testDomains) {
                val udpMs = queryUdpDnsLatencyMs(provider.primaryIp, domain, timeoutMs = 1500)
                if (udpMs != null) {
                    samples.add(udpMs)
                } else {
                    val dohMs = queryDohLatencyMs(provider.dohEndpoint, timeoutMs = 2000)
                    if (dohMs != null) {
                        samples.add(dohMs)
                    }
                }
            }

            calculateDnsStatistics(provider, samples)
        }

    fun calculateDnsStatistics(
        provider: DnsProviderConfig,
        samples: List<Double>
    ): DnsBenchmarkItem {
        if (samples.isEmpty()) {
            return DnsBenchmarkItem(
                provider = provider,
                reachable = false,
                avgLatencyMs = 0.0,
                minLatencyMs = 0.0,
                maxLatencyMs = 0.0,
                jitterMs = 0.0,
                samplesMs = emptyList()
            )
        }

        val min = samples.minOrNull() ?: 0.0
        val max = samples.maxOrNull() ?: 0.0
        val avg = samples.average()
        val jitter = if (samples.size > 1) {
            samples.zipWithNext { a, b -> abs(b - a) }.average()
        } else {
            0.0
        }

        return DnsBenchmarkItem(
            provider = provider,
            reachable = true,
            avgLatencyMs = (avg * 10.0).toInt() / 10.0,
            minLatencyMs = (min * 10.0).toInt() / 10.0,
            maxLatencyMs = (max * 10.0).toInt() / 10.0,
            jitterMs = (jitter * 10.0).toInt() / 10.0,
            samplesMs = samples
        )
    }

    private fun queryUdpDnsLatencyMs(serverIp: String, domain: String, timeoutMs: Int): Double? {
        var socket: DatagramSocket? = null
        return try {
            val queryBytes = buildDnsQueryPacket(domain)
            val serverAddress = InetAddress.getByName(serverIp)
            socket = DatagramSocket()
            socket.soTimeout = timeoutMs

            val requestPacket = DatagramPacket(queryBytes, queryBytes.size, serverAddress, 53)
            val responseBuffer = ByteArray(512)
            val responsePacket = DatagramPacket(responseBuffer, responseBuffer.size)

            val elapsedNanos = measureNanoTime {
                socket.send(requestPacket)
                socket.receive(responsePacket)
            }
            if (responsePacket.length >= 12) {
                (elapsedNanos / 1_000_000.0)
            } else {
                null
            }
        } catch (_: Exception) {
            null
        } finally {
            socket?.close()
        }
    }

    private fun queryDohLatencyMs(dohUrl: String, timeoutMs: Int): Double? {
        var connection: HttpsURLConnection? = null
        return try {
            val url = URL(dohUrl)
            val elapsedNanos = measureNanoTime {
                connection = (url.openConnection() as HttpsURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = timeoutMs
                    readTimeout = timeoutMs
                    setRequestProperty("Accept", "application/dns-json")
                    connect()
                    inputStream.use { it.readBytes() }
                }
            }
            if (connection?.responseCode in 200..299) {
                elapsedNanos / 1_000_000.0
            } else {
                null
            }
        } catch (_: Exception) {
            null
        } finally {
            connection?.disconnect()
        }
    }

    fun buildDnsQueryPacket(domain: String): ByteArray {
        val baos = ByteArrayOutputStream()
        val dos = DataOutputStream(baos)

        val transactionId = Random.nextInt(1, 0xFFFF)
        dos.writeShort(transactionId)
        dos.writeShort(0x0100)
        dos.writeShort(1)
        dos.writeShort(0)
        dos.writeShort(0)
        dos.writeShort(0)

        val labels = domain.trim('.').split(".")
        for (label in labels) {
            val bytes = label.toByteArray(Charsets.UTF_8)
            dos.writeByte(bytes.size)
            dos.write(bytes)
        }
        dos.writeByte(0)
        dos.writeShort(1)
        dos.writeShort(1)
        dos.flush()
        return baos.toByteArray()
    }
}

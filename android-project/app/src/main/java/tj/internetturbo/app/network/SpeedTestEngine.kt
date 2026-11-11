package tj.internetturbo.app.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket
import java.net.URL
import javax.net.ssl.HttpsURLConnection
import kotlin.math.abs
import kotlin.random.Random
import kotlin.system.measureNanoTime

data class SpeedTestMeasurement(
    val downloadMbps: Double,
    val uploadMbps: Double,
    val pingMs: Double,
    val jitterMs: Double,
    val appLatencyMs: Double,
    val dnsLatencyMs: Double
)

class SpeedTestEngine {

    suspend fun measureTcpPingAndJitter(
        host: String = "1.1.1.1",
        port: Int = 443,
        samplesCount: Int = 6
    ): Pair<Double, Double> = withContext(Dispatchers.IO) {
        val samples = mutableListOf<Double>()
        repeat(samplesCount) {
            try {
                val socket = Socket()
                val nanos = measureNanoTime {
                    socket.connect(InetSocketAddress(host, port), 1500)
                }
                socket.close()
                samples.add(nanos / 1_000_000.0)
            } catch (_: Exception) {
            }
        }
        calculatePingAndJitter(samples)
    }

    fun calculatePingAndJitter(samples: List<Double>): Pair<Double, Double> {
        if (samples.isEmpty()) return 0.0 to 0.0
        val minPing = samples.minOrNull() ?: 0.0
        val jitter = if (samples.size > 1) {
            samples.zipWithNext { a, b -> abs(b - a) }.average()
        } else {
            0.0
        }
        return roundOneDecimal(minPing) to roundOneDecimal(jitter)
    }

    fun calculateMbpsFromBytesAndDuration(bytesTransferred: Long, durationMillis: Long): Double {
        if (bytesTransferred <= 0L || durationMillis <= 0L) return 0.0
        val bits = bytesTransferred * 8.0
        val seconds = durationMillis / 1000.0
        val mbps = (bits / seconds) / 1_000_000.0
        return roundOneDecimal(mbps)
    }

    suspend fun measureDownloadThroughput(
        downloadUrl: String = "https://speed.cloudflare.com/__down?bytes=10000000",
        onProgress: (Double) -> Unit = {}
    ): Double = withContext(Dispatchers.IO) {
        var connection: HttpsURLConnection? = null
        try {
            val url = URL(downloadUrl)
            connection = (url.openConnection() as HttpsURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 5000
                readTimeout = 12000
                useCaches = false
                setRequestProperty("Cache-Control", "no-cache")
                setRequestProperty("Accept-Encoding", "identity")
            }

            val buffer = ByteArray(32 * 1024)
            var totalBytes = 0L
            val startTimeMs = System.currentTimeMillis()

            connection.inputStream.use { input ->
                var read: Int
                while (input.read(buffer).also { read = it } != -1) {
                    totalBytes += read
                    val elapsed = (System.currentTimeMillis() - startTimeMs).coerceAtLeast(50L)
                    onProgress(calculateMbpsFromBytesAndDuration(totalBytes, elapsed))
                }
            }

            val totalDurationMs = (System.currentTimeMillis() - startTimeMs).coerceAtLeast(50L)
            calculateMbpsFromBytesAndDuration(totalBytes, totalDurationMs)
        } catch (_: Exception) {
            0.0
        } finally {
            connection?.disconnect()
        }
    }

    suspend fun measureUploadThroughput(
        uploadUrl: String = "https://speed.cloudflare.com/__up",
        payloadBytes: Int = 2 * 1024 * 1024,
        onProgress: (Double) -> Unit = {}
    ): Double = withContext(Dispatchers.IO) {
        var connection: HttpsURLConnection? = null
        try {
            val payload = Random.nextBytes(32 * 1024)
            val chunks = payloadBytes / payload.size
            val url = URL(uploadUrl)
            connection = (url.openConnection() as HttpsURLConnection).apply {
                requestMethod = "POST"
                doOutput = true
                connectTimeout = 5000
                readTimeout = 12000
                setFixedLengthStreamingMode(chunks * payload.size)
                setRequestProperty("Content-Type", "application/octet-stream")
            }

            var sentBytes = 0L
            val startTimeMs = System.currentTimeMillis()

            connection.outputStream.use { out: OutputStream ->
                repeat(chunks) {
                    out.write(payload)
                    out.flush()
                    sentBytes += payload.size
                    val elapsed = (System.currentTimeMillis() - startTimeMs).coerceAtLeast(50L)
                    onProgress(calculateMbpsFromBytesAndDuration(sentBytes, elapsed))
                }
            }
            connection.responseCode
            val totalDurationMs = (System.currentTimeMillis() - startTimeMs).coerceAtLeast(50L)
            calculateMbpsFromBytesAndDuration(sentBytes, totalDurationMs)
        } catch (_: Exception) {
            0.0
        } finally {
            connection?.disconnect()
        }
    }

    private fun roundOneDecimal(value: Double): Double {
        return (value * 10.0).toInt() / 10.0
    }
}

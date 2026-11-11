package tj.internetturbo.app.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

data class NetworkHistoryEntity(
    val id: Long = 0,
    val timestampMillis: Long,
    val downloadMbps: Double,
    val uploadMbps: Double,
    val pingMs: Double,
    val jitterMs: Double,
    val dnsLatencyMs: Double,
    val networkType: String,
    val dnsProviderName: String
)

interface NetworkHistoryDao {
    fun observeHistory(): Flow<List<NetworkHistoryEntity>>
    suspend fun insertRecord(record: NetworkHistoryEntity)
    suspend fun clearAll()
}

class NetworkHistoryDatabase private constructor(context: Context) :
    SQLiteOpenHelper(context.applicationContext, "internet_turbo_tj_history.db", null, 1),
    NetworkHistoryDao {

    private val _historyFlow = MutableStateFlow<List<NetworkHistoryEntity>>(emptyList())

    init {
        _historyFlow.value = queryLatestRecords()
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS network_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestampMillis INTEGER NOT NULL,
                downloadMbps REAL NOT NULL,
                uploadMbps REAL NOT NULL,
                pingMs REAL NOT NULL,
                jitterMs REAL NOT NULL,
                dnsLatencyMs REAL NOT NULL,
                networkType TEXT NOT NULL,
                dnsProviderName TEXT NOT NULL
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS network_history")
        onCreate(db)
    }

    fun historyDao(): NetworkHistoryDao = this

    override fun observeHistory(): Flow<List<NetworkHistoryEntity>> = _historyFlow.asStateFlow()

    override suspend fun insertRecord(record: NetworkHistoryEntity) = withContext(Dispatchers.IO) {
        val values = ContentValues().apply {
            put("timestampMillis", record.timestampMillis)
            put("downloadMbps", record.downloadMbps)
            put("uploadMbps", record.uploadMbps)
            put("pingMs", record.pingMs)
            put("jitterMs", record.jitterMs)
            put("dnsLatencyMs", record.dnsLatencyMs)
            put("networkType", record.networkType)
            put("dnsProviderName", record.dnsProviderName)
        }
        writableDatabase.insert("network_history", null, values)
        _historyFlow.value = queryLatestRecords()
    }

    override suspend fun clearAll() = withContext(Dispatchers.IO) {
        writableDatabase.delete("network_history", null, null)
        _historyFlow.value = emptyList()
    }

    private fun queryLatestRecords(): List<NetworkHistoryEntity> {
        val list = mutableListOf<NetworkHistoryEntity>()
        val cursor = readableDatabase.query(
            "network_history",
            null,
            null,
            null,
            null,
            null,
            "timestampMillis DESC",
            "100"
        )
        cursor.use { c ->
            while (c.moveToNext()) {
                list.add(
                    NetworkHistoryEntity(
                        id = c.getLong(c.getColumnIndexOrThrow("id")),
                        timestampMillis = c.getLong(c.getColumnIndexOrThrow("timestampMillis")),
                        downloadMbps = c.getDouble(c.getColumnIndexOrThrow("downloadMbps")),
                        uploadMbps = c.getDouble(c.getColumnIndexOrThrow("uploadMbps")),
                        pingMs = c.getDouble(c.getColumnIndexOrThrow("pingMs")),
                        jitterMs = c.getDouble(c.getColumnIndexOrThrow("jitterMs")),
                        dnsLatencyMs = c.getDouble(c.getColumnIndexOrThrow("dnsLatencyMs")),
                        networkType = c.getString(c.getColumnIndexOrThrow("networkType")),
                        dnsProviderName = c.getString(c.getColumnIndexOrThrow("dnsProviderName"))
                    )
                )
            }
        }
        return list
    }

    companion object {
        @Volatile
        private var INSTANCE: NetworkHistoryDatabase? = null

        fun getInstance(context: Context): NetworkHistoryDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: NetworkHistoryDatabase(context).also { INSTANCE = it }
            }
        }
    }
}

# Keep Room Database Entities and DAOs
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-keepclassmembers class * {
    @androidx.room.* <methods>;
}

# Keep TurboVpnService entry point
-keep class tj.internetturbo.app.vpn.TurboVpnService { *; }

# Preserve line numbers for crash diagnostics
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

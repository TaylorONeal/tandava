# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor finds plugins and their methods by reflection from the WebView bridge.
# Keep plugin classes and the annotated members so R8 does not strip or rename them.
-keep public class * extends com.getcapacitor.Plugin { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
    @com.getcapacitor.annotation.ActivityCallback *;
    @com.getcapacitor.annotation.PermissionCallback *;
    @android.webkit.JavascriptInterface <methods>;
}
-keep class org.apache.cordova.** { *; }

# Readable crash traces after obfuscation.
-keepattributes SourceFile,LineNumberTable,*Annotation*
-renamesourcefileattribute SourceFile

# Barcode scanner (Studio check-in). Its model classes carry Gson annotations but the
# library does not ship Gson, so R8 stops on the missing annotation class without this.
-dontwarn com.google.gson.annotations.SerializedName
-keep class com.outsystems.plugins.barcode.** { *; }
-keep class com.capacitorjs.barcodescanner.** { *; }

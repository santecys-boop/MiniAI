# Mini AI ProGuard Rules
-keep class com.mini.app.** { *; }
-keep class com.mini.plugins.** { *; }
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-dontwarn com.google.mediapipe.**
-keep class com.google.mediapipe.** { *; }

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.aashithkamath.leadloop"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.aashithkamath.leadloop"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Upload key for Play Store. Passwords come from environment variables
            // (never committed): LEADLOOP_STORE_PASS, LEADLOOP_KEY_PASS.
            // Keystore file: ../upload-keystore.jks (kept out of git).
            val storeFileProp = File(rootDir, "upload-keystore.jks")
            if (storeFileProp.exists()) {
                signingConfig = signingConfigs.create("release") {
                    storeFile = storeFileProp
                    storePassword = System.getenv("LEADLOOP_STORE_PASS")
                    keyAlias = "upload"
                    keyPassword = System.getenv("LEADLOOP_KEY_PASS")
                }
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

// No external dependencies: the app is a WebView shell using only the
// Android platform APIs + Kotlin stdlib, so it builds with just the SDK.
dependencies {
}

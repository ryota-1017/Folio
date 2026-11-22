plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "app.folio.planner"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.folio.planner"
        minSdk = 26
        targetSdk = 35
        versionCode = (project.findProperty("versionCode") as String?)?.toIntOrNull() ?: 1
        versionName = (project.findProperty("versionName") as String?) ?: "1.0.0"
    }

    signingConfigs {
        create("folioFixed") {
            storeFile = file("folio-signing.p12")
            storePassword = "folioandroid"
            storeType = "PKCS12"
            keyAlias = "folio"
            keyPassword = "folioandroid"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("folioFixed")
        }
        release {
            signingConfig = signingConfigs.getByName("folioFixed")
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
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

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
}

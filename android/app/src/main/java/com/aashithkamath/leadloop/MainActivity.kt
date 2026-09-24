package com.aashithkamath.leadloop

import android.app.Activity
import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.WindowInsets
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Hosts the LeadLoop coaching site inside a WebView. The resume builder,
 * email capture and all page logic run client-side in the page; the native
 * shell only provides the container.
 *
 * Note: uses the platform Activity (no AndroidX dependency) so the app can
 * be built reproducibly with just the Android SDK + Kotlin compiler.
 *
 * Edge-to-edge: targeting API 36 means Android 15+ enforces edge-to-edge
 * (content draws behind the status and navigation bars). We opt out of the
 * default inset handling and pad the WebView by the system-bar insets so the
 * site header is never obscured.
 */
class MainActivity : Activity() {

    companion object {
        // Served page for the web app.
        private const val APP_URL = "https://aashithk.github.io/leadloop/"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // API 30+: draw behind system bars, we handle insets ourselves.
            window.setDecorFitsSystemWindows(false)
            window.statusBarColor = Color.TRANSPARENT
            window.navigationBarColor = Color.TRANSPARENT
        } else {
            @Suppress("DEPRECATION")
            window.setFlags(
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
            )
        }

        val webView = WebView(this)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            webView.setOnApplyWindowInsetsListener { v, insets ->
                val bars = insets.getInsets(WindowInsets.Type.systemBars())
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
                insets
            }
        }

        setContentView(webView)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        webView.webViewClient = WebViewClient()
        webView.loadUrl(savedInstanceState?.getString("url") ?: APP_URL)
    }

    override fun onBackPressed() {
        val webView = findViewById<WebView>(android.R.id.content).getChildAt(0) as? WebView
        if (webView?.canGoBack() == true) webView.goBack() else super.onBackPressed()
    }
}

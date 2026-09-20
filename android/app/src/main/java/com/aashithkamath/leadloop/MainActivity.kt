package com.aashithkamath.leadloop

import android.app.Activity
import android.annotation.SuppressLint
import android.os.Bundle
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
 */
class MainActivity : Activity() {

    companion object {
        // Served page for the web app.
        private const val APP_URL = "https://aashithk.github.io/leadloop/"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val webView = WebView(this)
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

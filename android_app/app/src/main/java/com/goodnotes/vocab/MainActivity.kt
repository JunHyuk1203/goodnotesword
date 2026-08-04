package com.goodnotes.vocab

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        
        // Configure WebView settings
        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true  // Required for Firebase and LocalStorage
        webSettings.databaseEnabled = true
        webSettings.mediaPlaybackRequiresUserGesture = false  // Allow auto TTS/audio
        webSettings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW  // Allow http audio in https page
        
        // Allow audio permission requests from web page
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                request.grant(request.resources)
            }
        }
        
        webView.webViewClient = WebViewClient()

        // Load the GitHub Pages URL
        webView.loadUrl("https://junhyuk1203.github.io/goodnotesword/")
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}

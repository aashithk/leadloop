# Android app (LeadLoop)

Native wrapper (Kotlin + WebView) around the LeadLoop coaching site at
`https://aashithk.github.io/leadloop/`. The resume builder, email capture and
all page logic run client-side in the page; the native shell is just the
container.

Package: `com.aashithkamath.leadloop`

## Build

Gradle cannot run in the sandboxed build environment (it needs Java TCP
loopback, which is blocked), so releases are built with `build-manual.sh`
(aapt2 + kotlinc 1.9 + d8 + apksigner + bundletool). The app has zero external
dependencies (platform Activity, no AndroidX), so this is sufficient.

```bash
cd android
LEADLOOP_STORE_PASS=... LEADLOOP_KEY_PASS=... ./build-manual.sh
```

Produces `out-manual/leadloop-release.aab` (signed, upload to Play Console)
and `out-manual/leadloop-release.apk`.

You can also open this `android/` folder in Android Studio for IDE builds;
it generates the Gradle wrapper on first sync.

## Release signing

- Upload keystore: `android/upload-keystore.jks` (gitignored, **never
  committed**). This is a dedicated keystore for the LeadLoop app, separate
  from the Kundli app's keystore — one upload key per Play listing.
- Key alias: `upload`.
- Bump `VERSION_CODE` / `VERSION_NAME` env vars (or the `defaultConfig` in
  `app/build.gradle.kts`) for each new release.

## Before publishing to the Play Store

1. Create the Play Console developer account ($25 one-time, identity
   verification required — the account owner must do this).
2. Create the app listing (`com.aashithkamath.leadloop`) and upload
   `leadloop-release.aab` to an internal-testing track first.
3. Complete the store listing (short/full description, screenshots, feature
   graphic), the privacy policy URL, and the data safety form (the app sends
   no data anywhere itself; the WebView loads the LeadLoop site).
4. Promote internal testing → production when ready.

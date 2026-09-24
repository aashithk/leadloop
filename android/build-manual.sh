#!/bin/bash
# Manual release build for the LeadLoop Android app (no Gradle).
#
# Why this exists: the sandboxed build environment blocks Java TCP loopback
# connections ("Other TCP connections is turned off for this assistant"), and
# Gradle's launcher<->daemon handshake requires one, so Gradle cannot run here.
# The app has zero external dependencies (platform APIs + Kotlin stdlib only),
# so aapt2 + kotlinc + d8 + apksigner + bundletool are sufficient.
#
# Requirements (paths overridable via env):
#   Android SDK with platform android-36 and build-tools 36.0.0
#   Kotlin compiler (kotlinc), bundletool jar, JDK 17
#   Upload keystore at android/upload-keystore.jks (gitignored, never committed).
#   This is a SEPARATE keystore from the Kundli app's - one upload key per app.
#
# Usage:
#   LEADLOOP_STORE_PASS=... LEADLOOP_KEY_PASS=... ./build-manual.sh
# Produces: out-manual/leadloop-release.aab (signed, for Play) and
#           out-manual/leadloop-release.apk
set -euo pipefail

export JAVA_HOME="${JAVA_HOME:-$HOME/toolchains/jdk-17.0.13+11}"
export PATH="$JAVA_HOME/bin:$PATH"

PKG="com.aashithkamath.leadloop"
VERSION_CODE="${VERSION_CODE:-1}"
VERSION_NAME="${VERSION_NAME:-1.0.0}"

SDK="${ANDROID_SDK_ROOT:-$HOME/android-sdk}"
BT="$SDK/build-tools/36.0.0"
AAPT2="$BT/aapt2"
D8="$BT/d8"
ZIPALIGN="$BT/zipalign"
APKSIGNER="$BT/apksigner"
ANDROID_JAR="$SDK/platforms/android-36/android.jar"
KOTLINC="${KOTLINC:-$HOME/toolchains/kotlin-compiler-1.9/bin/kotlinc}"
STDLIB="$(dirname "$KOTLINC")/../lib/kotlin-stdlib.jar"
BUNDLETOOL="${BUNDLETOOL:-$HOME/toolchains/bundletool.jar}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$SCRIPT_DIR/app/src/main"
WORK="$SCRIPT_DIR/out-manual"
rm -rf "$WORK"
mkdir -p "$WORK/classes" "$WORK/dex"

echo "==> aapt2 compile (resources)"
$AAPT2 compile --dir "$SRC/res" -o "$WORK/compiled_res.zip"

echo "==> aapt2 link (base APK, no dex yet)"
# Raw aapt2 requires the package attribute; AGP normally injects it from the
# namespace, so we add it to a temp copy and keep the source manifest AGP-clean.
sed "s|<manifest |<manifest package=\"$PKG\" |" \
  "$SRC/AndroidManifest.xml" > "$WORK/AndroidManifest.xml"
$AAPT2 link -o "$WORK/base.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$WORK/AndroidManifest.xml" \
  --min-sdk-version 24 --target-sdk-version 36 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
  "$WORK/compiled_res.zip"

echo "==> kotlinc (MainActivity.kt)"
$KOTLINC "$SRC/java/com/aashithkamath/leadloop/MainActivity.kt" \
  -cp "$ANDROID_JAR" -d "$WORK/classes" -jvm-target 17

echo "==> d8 (dex)"
# shellcheck disable=SC2046
$D8 --lib "$ANDROID_JAR" --min-api 24 --output "$WORK/dex" \
  $(find "$WORK/classes" -name "*.class") "$STDLIB"

echo "==> package APK (add dex, align, sign)"
cp "$WORK/base.apk" "$WORK/unsigned.apk"
(cd "$WORK/dex" && zip -q "$WORK/unsigned.apk" classes*.dex)
$ZIPALIGN -f 4 "$WORK/unsigned.apk" "$WORK/aligned.apk"
: "${LEADLOOP_STORE_PASS:?set LEADLOOP_STORE_PASS}"
: "${LEADLOOP_KEY_PASS:?set LEADLOOP_KEY_PASS}"
$APKSIGNER sign --ks "$SCRIPT_DIR/upload-keystore.jks" \
  --ks-pass env:LEADLOOP_STORE_PASS --ks-key-alias upload --key-pass env:LEADLOOP_KEY_PASS \
  --out "$WORK/leadloop-release.apk" "$WORK/aligned.apk"
$APKSIGNER verify --print-certs "$WORK/leadloop-release.apk" | head -4

echo "==> bundletool (AAB)"
# AAB modules need the manifest/resources in protobuf format: link a second,
# proto-format APK purely as the bundletool input (the binary APK above is
# the installable one).
$AAPT2 link -o "$WORK/base-proto.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$WORK/AndroidManifest.xml" \
  --min-sdk-version 24 --target-sdk-version 36 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
  --proto-format \
  "$WORK/compiled_res.zip"
mkdir -p "$WORK/module/manifest" "$WORK/module/dex"
cp "$WORK"/dex/classes*.dex "$WORK/module/dex/"
(cd "$WORK" && unzip -q -o base-proto.apk -d apkx "AndroidManifest.xml" "resources.pb" "res/*")
cp "$WORK/apkx/AndroidManifest.xml" "$WORK/module/manifest/"
# proto-format link produces resources.pb
cp "$WORK/apkx/resources.pb" "$WORK/module/"
cp -r "$WORK/apkx/res" "$WORK/module/"
(cd "$WORK/module" && zip -q -r ../base.zip .)
java -jar "$BUNDLETOOL" build-bundle --modules="$WORK/base.zip" --output="$WORK/leadloop-release.aab"
# AABs use JAR signing (apksigner's apksig can't parse the bundle layout).
# Passwords via stdin to keep them out of the process list.
printf "%s\n%s\n" "$LEADLOOP_STORE_PASS" "$LEADLOOP_KEY_PASS" | \
  jarsigner -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore "$SCRIPT_DIR/upload-keystore.jks" \
  "$WORK/leadloop-release.aab" upload > /dev/null
jarsigner -verify "$WORK/leadloop-release.aab" | head -1
java -jar "$BUNDLETOOL" validate --bundle="$WORK/leadloop-release.aab" > /dev/null \
  && echo "AAB valid"

echo
echo "==> DONE"
ls -la "$WORK/leadloop-release.apk" "$WORK/leadloop-release.aab"

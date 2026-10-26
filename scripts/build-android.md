# Building the Android app (APK)

The Android app is the same web app wrapped with [Capacitor](https://capacitorjs.com). The static export is bundled inside the APK, so it works offline. It is installed directly (sideloaded), not through the Play Store.

## Requirements

- **JDK 21** at `C:\Users\ferri\jdks\jdk-21.0.12.1+1` (shared with the storytime project; Capacitor 8 won't compile on 17 or 25)
- Android SDK (platform 36, build-tools 36) and `adb`
- A signing key. It lives **outside the repo** so it can't be committed:
  `C:\Users\ferri\AI Projects\chest-run-tracker-keystore\` (`chestrun-release.jks` + `keystore.properties`).
  **Back this folder up.** Android only upgrades an installed app in place when the new APK is signed with the same key. Lose it and you must uninstall first (history is safe in the cloud if you've signed in).

## Build

```powershell
powershell -File scripts\build-android.ps1
```

That runs the static export, syncs it into the Android project and builds the signed APK at
`android\app\build\outputs\apk\release\app-release.apk`. Bump `versionCode` (and `versionName`) in
`android/app/build.gradle` for every release so Android treats it as an update.

## Install

Phone: Settings -> About phone -> tap *Build number* 7 times -> Developer options -> turn on **USB debugging**,
plug it in and accept the prompt on the phone, then:

```powershell
powershell -File scripts\build-android.ps1 -Install    # build and install
adb install -r android\app\build\outputs\apk\release\app-release.apk   # install an existing build
```

Or copy the APK to the phone and open it (allow "Install unknown apps" for your file manager or browser when asked).

## Gotchas

- `android/local.properties` must use forward slashes (`sdk.dir=C:/Users/...`); in a `.properties` file `\f` is a form feed.
- The Capacitor server returns the home page for any address without a file extension, so the app can't be deep-linked or hard-reloaded onto a sub-page. It always launches at `/` and in-app navigation is unaffected.
- Android emulator: the installed AVD has no system image downloaded, so test on a real phone.

## Changing the icon

Edit `scripts/generate-android-icons.py`, then run `python scripts/generate-android-icons.py`.

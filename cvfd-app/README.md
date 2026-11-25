# CVFD app (iPhone, later Android)

One app with the CVFD Field Guide (SOGs, size-up, Firefighter Must Knows, department tools),
the Pocket Pump Chart, the Training Division (training, academy, member records) and the
Cadre Weekly Check-In. Same screens as the claude.ai versions; sign-in and data run on
Google Firebase instead of claude.ai.

## How it is put together

| Folder / file | What it is |
| --- | --- |
| `shared/` | The app screens (`head.html`, `body.html`, `cadre.js`, `badge.txt`). Same code as the claude.ai pages, built in "app" mode. |
| `src/shim.js` | Sign-in screen, Account menu (sign out, delete account, member roles, load starting data) and the Firebase connection. |
| `src/firebase-config.js` | Placeholder. The real Firebase settings go in Codemagic (see below), not in the repo. |
| `src/privacy.html` | Privacy policy shown in the app and linked from the App Store listing. |
| `../web/index.html` | The Pocket Pump Chart, bundled as `pump.html`. |
| `tools/build.py` | Builds `www/` (the web app Capacitor puts inside the iPhone app). |
| `ios/` | The Xcode project (Capacitor 8, Swift Package Manager). Bundle id `org.communityvfd.cvfd`. |
| `firestore.rules` | Who can read and write what. |
| `../codemagic.yaml` | Cloud build that makes the iPhone app and uploads it to TestFlight. |

## Roles

Every account starts as **member**. Roles are stored in `users/{uid}.role`:

- **member**: reads everything public, keeps their own training record.
- **cadre**: Training Division staff. Edits content, sees the Cadre tab, check-in, TD dashboard and roster.
- **admin**: cadre plus changing roles (Account > Manage member roles) and loading starting data.

The first admin has to be set by hand: create your account in the app, then in the Firebase
console open Firestore > `users` > your document and change `role` to `admin`.

## One-time setup

1. **Firebase**: create the project, then
   - Authentication > Sign-in method > enable **Email/Password**.
   - Firestore Database > Create database (production mode, us-central).
   - Firestore > Rules: paste `firestore.rules` and Publish.
   - Project settings > Your apps > add a **Web app** and copy its config.
2. **Apple**: enrolled in the Apple Developer Program. In App Store Connect create the app
   (name CVFD, bundle id `org.communityvfd.cvfd`), and under Users and Access > Integrations
   create an **App Store Connect API key** (App Manager role); download the .p8 once.
3. **Codemagic** (codemagic.io, free tier, sign in with GitHub):
   - Add this repository.
   - Teams > Integrations > App Store Connect: add the API key, name it `CVFD App Store Connect`.
   - Code signing identities > iOS: let Codemagic create a distribution certificate and an App Store profile for `org.communityvfd.cvfd`.
   - Environment variables: group `firebase`, variable `FIREBASE_CONFIG_JS`, value:
     `window.CVFD_FIREBASE_CONFIG = { apiKey: "...", authDomain: "...", projectId: "...", storageBucket: "...", messagingSenderId: "...", appId: "..." };`
4. Start the **cvfd-ios** workflow (or push a tag like `ios-1.0.0`). The build lands in TestFlight.

## Building locally (for testing in a browser)

```
npm ci
python3 tools/build.py      # makes www/
cd www && python3 -m http.server 8790
```

With `useEmulator: true` in `www/firebase-config.js` it talks to the Firebase emulators
(`firebase emulators:start --only auth,firestore`).

## Moving data from the claude.ai apps

`www/seed/seed.json` holds SOG categories, training content, academy, TD dashboard and
check-in weeks exported from the claude.ai apps. An admin loads it once from Account >
Load starting data. Export it again right before launch so nothing entered since is lost.
Member training records are not moved: members sign up in the app and enter them again,
since claude.ai accounts don't carry over.

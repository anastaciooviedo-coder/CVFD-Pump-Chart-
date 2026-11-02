# CVFD Pocket Pump Chart

Created by the CVFD Training Division.

Pump operator reference app for iPhone and Android, built with Expo from the CVFD flow chart.
Screens: Pump (pick a crosslay and nozzle pressure to get PDP and flow), Nozzles, Friction, Colors.
All chart figures live in `src/data.js`; edit that file when the chart changes.

## Try it on your phone
1. `npm install`
2. `npx expo start`
3. Scan the QR code with the Expo Go app (iPhone or Android).

## Build for the stores (EAS)
Needs an Expo account (free), an Apple Developer account ($99/yr) and a Google Play developer account ($25 once).
1. `npx eas-cli@latest login`
2. `npx eas-cli@latest init` (links this project to your Expo account)
3. `npx eas-cli@latest build --platform all --profile production`
4. `npx eas-cli@latest submit --platform ios` and `--platform android`

App ids are `org.cvfd.pumpchart` in `app.json`; change them before the first store build if your department wants a different one.

## Web version
`web/index.html` is the browser version of the same app (one self-contained page).

### Home screen icon and hosting
The Training Division badge is the home screen icon (`web/icons/`, wired up through `web/manifest.webmanifest` and the `apple-touch-icon` link in `web/index.html`).
The icon only shows when the page is opened from its own address, so `web/` is published with GitHub Pages by `.github/workflows/pages.yml` on every push to `main`.
One-time setup: in the repo go to Settings > Pages and set Source to **GitHub Actions**. The app is then at
`https://anastaciooviedo-coder.github.io/CVFD-Pump-Chart-/`.

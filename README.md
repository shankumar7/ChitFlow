<p align="center">
  <img src="assets/icon.png" alt="ChitFlow logo" width="160" />
</p>

<h1 align="center">ChitFlow</h1>

<p align="center">
  Run chit fund groups from your phone: members, auctions, installments and a full payment ledger.
</p>

<p align="center">
  <a href="https://github.com/shankumar7/ChitFlow/releases/latest">Latest release</a> · <a href="CHANGELOG.md">Changelog</a> · <a href="#getting-started">Getting started</a>
</p>

ChitFlow is a mobile app that helps a chit fund organizer run monthly savings circles (called chitti or chit groups) from a phone. It tracks groups, members, monthly installments, auctions (liftings), dividends and a full payment ledger, and keeps everything synchronized in realtime through Firebase.

Current version: **1.1.0**

## Bring your own Firebase keys

ChitFlow is open source and ships **without any Firebase keys**. Everything the app saves goes into a Firebase project that you own, so the project cannot work until you add your own configuration.

* Without keys, the app opens a friendly setup screen that lists the steps instead of crashing.
* Your keys live in a local `.env` file that git ignores, so they are never committed.
* The APK attached to a GitHub release is built without any keys, so it opens on the setup screen. To get a working app, build it yourself with your own keys (see Building an installable Android app below).

Full instructions are in Getting started.

## Why this project exists

A chit fund is a traditional savings and credit scheme common in India. A fixed number of people each pay a fixed amount every month. Every month one member receives the whole pot, decided by an auction where the lowest bidder discount wins. The discount is shared back to everyone as a dividend, and the organizer keeps a commission.

Organizers usually track this in notebooks or spreadsheets, which makes it easy to lose track of who paid, who owes interest and how much each dividend should be. ChitFlow replaces that with one app that does the arithmetic and keeps an audit trail.

## Features

* Register and log in with a name and a four digit security PIN. The PIN can be chosen or generated.
* Create chit groups with a monthly amount, duration, start date and organizer commission.
* Automatically create placeholder members to match the group duration, then rename them and add phone numbers.
* Add and edit members at any time, with one tap calling from the member list.
* Run the monthly auction: enter the winning bid, pick the member, and see the discount, commission and dividend per member before confirming.
* Collect installments month by month, by cash or UPI, with remarks for an audit trail. Amounts are calculated per member automatically.
* Dashboard with monthly revenue, group and member counts, and pending amounts per group.
* Collection feed that shows collection progress for every group in the current month.
* Payment ledger with filters per group.
* Check for updates inside the app, powered by GitHub Releases.
* Realtime sync across devices, so two organizers see the same data instantly.

## Tech stack

* Expo SDK 52 with React Native 0.76 and React 18
* React Navigation 7 (native stack for the flow, bottom tabs for the main screens)
* Firebase Cloud Firestore for storage and realtime listeners
* AsyncStorage for the local session
* Expo Status Bar and the Expo vector icon set (Material Community Icons)
* EAS Build for producing installable Android builds
* GitHub Actions and GitHub Releases for publishing versions

## How the app is structured

The project follows a simple layered layout. Screens never talk to Firebase directly for data. They call a small service module, and the services own every Firestore path and query.

```
ChitFlow
  App.js                     Root component, navigation tree and launch time update check
  index.js                   Registers the root component with Expo
  app.json                   Expo configuration, name, version, icons, Android package
  eas.json                   EAS Build profiles (development, preview, production)
  babel.config.js            Babel preset and the Reanimated plugin
  firestore.indexes.json     Composite index required by the members query
  .env.example               Template for the Firebase environment variables
  CHANGELOG.md               Human written history of every release
  .github/workflows
    release.yml              Publishes a GitHub Release when a version tag is pushed
  assets                     App icon, adaptive icon, splash and favicon
  screens                    One file per screen (UI plus screen level logic)
  services                   Firestore access and the update checker
  utils                      Theme tokens, date helpers and the version constants
```

### Screens

* WelcomeScreen: landing screen with the logo and the current version.
* RegisterScreen: one screen with a Register and Login toggle. Login is by PIN.
* DashboardScreen (tab Home): revenue, totals and groups with pending installments.
* GroupListScreen (tab Groups): all groups with start and maturity dates, plus a button to create a group.
* CollectionFeedScreen (tab Collection): current month collection progress for each group.
* TransactionsScreen (tab Ledger): the payment audit log with group filters.
* ProfileScreen (tab Profile): account details, masked PIN, app version, check for updates and logout.
* CreateGroupScreen: form with validation and a live chit value preview.
* MemberListScreen: members of a group, with entry points to the auction and to collections.
* AddMemberScreen: add or edit a member.
* PaymentScreen: month by month installment collection with a confirm sheet.
* AuctionScreen: records the monthly lifting and previews the dividend maths.

### Services

* firebase.js: initializes Firebase from environment variables and exports the Firestore instance.
* groupService.js: subscribe to, create, update and delete groups.
* memberService.js: subscribe to members (all, or per group), create single or batch members, update, delete.
* paymentService.js: record or reverse a payment, and the ledger and monthly subscriptions. A payment and the matching member totals are committed in a single batch write.
* liftingService.js: record an auction result and flag the winning member, also in a single batch write.
* updateService.js: the update checker described below.

### Utilities

* theme.js: colors, spacing, radius, shadows and the `normalize` helper that scales font and layout sizes across screen widths.
* date.js: month helpers, a strict date validator and the maturity date calculator.
* version.js: reads the version from app.json so there is exactly one place to change it.

## Data model

All data lives under one Firestore document path, `home/chitflow`, in five collections.

* users: document id is the lowercase name. Fields: name, pin, createdAt, groups, teams.
* groups: name, monthlyAmount, duration, commissionPercentage, chitValue, startDate, status, createdAt.
* members: groupId, name, phone, hasTakenChit, chitTakenMonth, chitTakenAmount, totalPaid, pendingAmount, createdAt.
* payments: document id is groupId, memberId and month number joined by underscores, so a member can only ever have one payment record per month. Fields: amount, status, method, remarks, timestamp and the member and group names.
* liftings: groupId, memberId, monthNumber, bidAmount, totalDiscount, organizerCommission, totalDividend, dividendPerMember, timestamp.

## The chit maths

Everything the app calculates comes from a few formulas.

1. Chit value equals monthly amount multiplied by duration in months.
2. Total discount equals chit value minus the winning bid.
3. Organizer commission equals chit value multiplied by the commission percentage divided by 100.
4. Total dividend equals total discount minus the commission.
5. Dividend per member equals total dividend divided by the number of members.
6. Installment for a member who has not yet lifted equals the monthly amount minus the dividend of the current month.
7. Installment for a member who lifted in an earlier month equals the monthly amount plus interest, where interest is one percent of the chit value.
8. Pending amount for a member equals the current month number multiplied by the monthly amount, minus everything they have paid, never below zero.

## How it was built

The app was built in layers, so each layer could be tested before the next one was added.

1. Foundation. A blank Expo project was created, React Navigation was added, and a theme file defined the colors, spacing and a `normalize` function so the layout scales on small and large phones. A native stack holds the onboarding flow and a bottom tab navigator holds the five main screens.
2. Identity. Registration stores a name and PIN in Firestore and the same pair in AsyncStorage. On launch the app reads AsyncStorage and decides whether to show Welcome or go straight to the tabs.
3. Data layer. Every Firestore path lives in the services folder. Screens subscribe with `onSnapshot`, so UI state is always a mirror of the database and no manual refreshing is needed.
4. Groups and members. Creating a group can also create placeholder members through a batched write, so a twelve month group starts with twelve slots ready to be filled in.
5. Money flow. The auction screen turns a bid into discount, commission and dividend. The payment screen reads the lifting for the month and computes each member installment, and writes the payment and the member totals together.
6. Overview screens. The dashboard, collection feed and ledger are read only views over the same live collections.
7. Release engineering. EAS profiles produce an Android APK, and a GitHub Actions workflow turns a version tag into a GitHub Release. The in app update checker reads that release.
8. Version 1.1 hardening. A full review of the code base fixed crashes, data consistency problems and validation gaps, added the update checker and polished the interface. See the changelog for the complete list.

## Check for updates

The Profile screen has an App Version card with a Check button.

* The app calls the public GitHub API for the latest release of this repository.
* It compares the release tag with the installed version using a small semantic version comparison, so 1.10.0 is correctly newer than 1.9.0.
* If a newer version exists, the card shows the release name, the date and the release notes. Download opens the APK attached to the release, or the release page when no APK is attached. Skip this version silences the reminder for that version.
* Once a day, on launch, the app performs the same check silently and only interrupts you when a new, unskipped version exists.
* Failures such as no network, a timeout or a repository with no releases are reported clearly and never crash the app.

Note: the repository must be public for the GitHub API to answer without authentication. Until then the app shows that no releases are published.

## Getting started

### Prerequisites

* Node.js 20 or newer
* A Firebase project with Cloud Firestore enabled
* An Android phone or emulator, an iPhone with Expo Go, or a browser

### Setup

```bash
git clone https://github.com/shankumar7/ChitFlow.git
cd ChitFlow
npm install --legacy-peer-deps
cp .env.example .env
```

Set up your own Firebase project:

1. Go to the Firebase console and create a project.
2. Add a Web app to the project. Firebase then shows a configuration object with values such as apiKey and projectId.
3. Open Build, then Firestore Database, and create a database.
4. Open `.env` and paste each value next to its matching name from `.env.example`.

Your Firestore security rules decide who can read and write your data. While experimenting you can use test mode, but write proper rules before you put real data in.

Create the Firestore index that the members query needs. Either deploy `firestore.indexes.json` with the Firebase CLI, or run the app once and follow the link that Firestore prints in the console the first time the members list is opened.

Start the app:

```bash
npx expo start
```

Then press `a` for Android, `i` for iOS, or `w` for web.

## Building an installable Android app

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

The preview profile produces an APK that you can install directly. Add your `EXPO_PUBLIC_` Firebase values as EAS environment variables so the build can reach your database.

## Publishing a release

1. Update the version in `app.json` and `package.json`, and add a section for it at the top of `CHANGELOG.md`.
2. Commit and push to the main branch.
3. Tag and push:

```bash
git tag v1.1.0
git push origin v1.1.0
```

4. The Release workflow creates the GitHub Release with the changelog section as its notes. If you add an `EXPO_TOKEN` secret to the repository, it also builds an APK with EAS and attaches it, which is what the in app Download button will open.

## Security notes

* The `.env` file is ignored by git. Firebase web configuration values are not secrets by themselves, but your Firestore security rules decide who can read and write. Review them before sharing the app widely.
* Login is PIN based and does not use Firebase Authentication. The PIN is stored in Firestore as plain text, and all signed in users share one data space. This is acceptable for a small trusted team, and is the first thing to harden for public use.

## Known limitations and roadmap

* Months are tracked as numbers one to twelve, so groups longer than twelve months or running across a calendar year need a month index relative to the start date.
* Single tenant data: there is no per organizer separation yet.
* Members and groups can be created and edited, but deleting them from the interface is not built yet.
* Planned: Firebase Authentication, per organizer data, exportable statements, reminders for pending installments, and a dark theme.

## Contributing

Issues and pull requests are welcome. Please describe the problem, keep changes focused, and update the changelog for anything user visible.

## Author

Built by Shankumar.

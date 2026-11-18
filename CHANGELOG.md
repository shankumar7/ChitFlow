# Changelog

All notable changes to ChitFlow are recorded here. The format follows Keep a Changelog and the project uses semantic versioning.

## [1.1.0] 18 November 2026

### Added
* Check for updates inside the app. The Profile screen can look up the newest GitHub Release, show its release notes and open the download link. The app also checks quietly once a day on launch and lets you skip a version.
* An Add Member button on the member list. Previously members could only be edited, never added after group creation.
* A GitHub Actions workflow that publishes a release when a version tag is pushed, with an optional Android APK build.
* A `.env.example` file, a `firestore.indexes.json` file and a full README.
* Show or hide control for the security PIN on the Profile screen.

### Fixed
* Payment and member totals are now written in one atomic batch, so a failed network call can no longer leave them out of sync. The same applies to recording a lifting.
* Undoing a payment now reverses the amount that was actually recorded instead of recalculating it, which prevented totals drifting after a dividend change.
* Undoing a payment now asks for confirmation, and saving shows progress and reports failures.
* Opening Payment from the Collection Feed dropped the duration and commission, which broke interest and dividend maths.
* Creating a group with an empty duration crashed on device because a bare string was rendered outside a Text component.
* An invalid or impossible start date crashed the Groups screen while calculating the maturity date.
* Month names were wrong on days 29 to 31 because of date overflow.
* UPI payments were shown with the cash badge colour and the ledger showed no date.
* Two accounts could end up with the same PIN, which let one person log in as another. PINs are now unique and numeric.
* Auction bids of zero, negative values or above the chit value are rejected.
* An invalid style value on the Collect button and a duplicated status bar were removed.
* Group inputs are validated: positive amount, duration between 2 and 12, commission between 0 and 100.
* The lockfile was out of sync with package.json, which broke clean installs.
* The fake loading delay on the Dashboard and Collection Feed was replaced by real data readiness.
* The version number is now read from a single source instead of being hardcoded as 1.0.2 in several places.

### Changed
* Tab bar labels are larger and easier to read.
* The Profile screen no longer shows a misleading back button on a tab screen.
* Removed the unconfigured expo updates package, five unused dependencies and three unused components, one of which imported a function that did not exist.
* Removed committed .DS_Store files.

## [1.0.2]
* Previous baseline release.

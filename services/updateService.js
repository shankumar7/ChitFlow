import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_VERSION, GITHUB_REPO, RELEASES_URL } from '../utils/version';

const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const REQUEST_TIMEOUT_MS = 10000;
const LAST_CHECK_KEY = 'update_last_check';
const SKIPPED_VERSION_KEY = 'update_skipped_version';
const AUTO_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const UPDATE_STATUS = {
  UP_TO_DATE: 'UP_TO_DATE',
  AVAILABLE: 'AVAILABLE',
  NO_RELEASES: 'NO_RELEASES',
  ERROR: 'ERROR',
};

// Turns "v1.2.3", "1.2" or "1.2.3-beta.1" into [1, 2, 3]. Returns null for unusable input.
export const parseVersion = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.trim().replace(/^v/i, '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2] || 0), Number(match[3] || 0)];
};

// Returns 1 when a is newer than b, -1 when older, 0 when equal or not comparable.
export const compareVersions = (a, b) => {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Asks the GitHub Releases API for the newest published release and compares it with the
 * installed version. Never throws: every failure is reported through the returned status.
 */
export const checkForUpdate = async () => {
  const base = { currentVersion: APP_VERSION, releasesUrl: RELEASES_URL };
  try {
    const response = await fetchWithTimeout(LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (response.status === 404) {
      return { ...base, status: UPDATE_STATUS.NO_RELEASES };
    }
    if (!response.ok) {
      return { ...base, status: UPDATE_STATUS.ERROR, message: `GitHub responded with ${response.status}.` };
    }

    const release = await response.json();
    const latestVersion = (release.tag_name || '').replace(/^v/i, '');
    if (!parseVersion(latestVersion)) {
      return { ...base, status: UPDATE_STATUS.ERROR, message: 'The latest release has an unreadable version tag.' };
    }

    const apkAsset = (release.assets || []).find((asset) => /\.apk$/i.test(asset.name));
    const details = {
      ...base,
      latestVersion,
      releaseName: release.name || `v${latestVersion}`,
      notes: (release.body || '').trim(),
      publishedAt: release.published_at,
      downloadUrl: apkAsset ? apkAsset.browser_download_url : release.html_url || RELEASES_URL,
      releaseUrl: release.html_url || RELEASES_URL,
    };

    return compareVersions(latestVersion, APP_VERSION) > 0
      ? { ...details, status: UPDATE_STATUS.AVAILABLE }
      : { ...details, status: UPDATE_STATUS.UP_TO_DATE };
  } catch (e) {
    const message = e && e.name === 'AbortError'
      ? 'The request timed out. Check your connection and try again.'
      : 'Could not reach GitHub. Check your connection and try again.';
    return { ...base, status: UPDATE_STATUS.ERROR, message };
  }
};

// Background check used on app launch: at most once a day, and silent about versions the user skipped.
export const checkForUpdateOnLaunch = async () => {
  try {
    const last = Number(await AsyncStorage.getItem(LAST_CHECK_KEY)) || 0;
    if (Date.now() - last < AUTO_CHECK_INTERVAL_MS) return null;

    const result = await checkForUpdate();
    if (result.status === UPDATE_STATUS.ERROR) return null;
    await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()));

    if (result.status !== UPDATE_STATUS.AVAILABLE) return null;
    const skipped = await AsyncStorage.getItem(SKIPPED_VERSION_KEY);
    return skipped === result.latestVersion ? null : result;
  } catch (e) {
    return null;
  }
};

export const skipVersion = async (version) => {
  try {
    await AsyncStorage.setItem(SKIPPED_VERSION_KEY, version);
  } catch (e) {
    // Skipping is a convenience only, so a storage failure is safe to ignore.
  }
};

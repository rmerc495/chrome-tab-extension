# Publishing to the Chrome Web Store

This repo publishes **Duplicate Tab** via GitHub Actions:

```
Push tag (vX.Y.Z)
  → GitHub Actions packages extension.zip
  → Authenticates with a Google service account
  → Uploads to the Chrome Web Store API
  → Submits the version for review
  → Google reviews / approves
  → Users receive the update
```

## Prerequisites (one-time)

You need all of these before the pipeline can succeed:

1. A [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole) (one-time $5 fee).
2. The extension **already created** in the Developer Dashboard (at least as a draft with Store listing + Privacy filled in). The API updates existing items; it does not create the first listing.
3. 2-Step Verification enabled on the Google account that owns the publisher account.

---

## Step 1 — Google Cloud: enable API + service account

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. Enable **Chrome Web Store API**:
   - APIs & Services → Library → search “Chrome Web Store API” → Enable.
3. Create a service account:
   - IAM & Admin → Service Accounts → Create Service Account.
   - Name it something like `chrome-webstore-publisher`.
   - No special GCP IAM roles are required.
4. Create a JSON key for that service account:
   - Open the service account → Keys → Add key → Create new key → JSON.
   - Download the file. **Do not commit it.**

## Step 2 — Link the service account to Chrome Web Store

1. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Go to **Account**.
3. Add the service account email (looks like `chrome-webstore-publisher@YOUR_PROJECT.iam.gserviceaccount.com`).

Official docs: [Use a service account with the Chrome Web Store API](https://developer.chrome.com/docs/webstore/service-accounts).

## Step 3 — Collect IDs

| Value | Where to find it |
| --- | --- |
| **Extension ID** | Developer Dashboard → your item → URL ends with `/detail/EXTENSION_ID` (32 characters). |
| **Publisher ID** | Developer Dashboard → Publisher → Settings (also shown under Account). |
| **Service account JSON** | The key file downloaded in Step 1. |

## Step 4 — Add GitHub secrets

In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret name | Value |
| --- | --- |
| `CHROME_SERVICE_ACCOUNT_JSON` | Entire contents of the service account JSON key file |
| `CHROME_EXTENSION_ID` | Your 32-character extension ID |
| `CHROME_PUBLISHER_ID` | Your publisher ID |

## Step 5 — Release flow (after secrets are set)

1. Bump `"version"` in `manifest.json` (must be higher than the live store version).
2. Commit and push to `main`.
3. Tag and push the tag (tag must match the manifest, including the `v` prefix):

```bash
git tag v1.1.2
git push origin v1.1.2
```

4. GitHub Actions runs **Publish to Chrome Web Store**.
5. Watch the run under the Actions tab.
6. Wait for Google’s review; users get the update after approval.

You can also run the workflow manually (**Actions → Publish to Chrome Web Store → Run workflow**) and choose whether to submit for review after upload.

---

## Local packaging

To build `extension.zip` locally (Git Bash / WSL / macOS / Linux):

```bash
chmod +x scripts/package.sh
./scripts/package.sh
```

On Windows PowerShell:

```powershell
./scripts/package.ps1
```

---

## Troubleshooting

| Symptom | Likely fix |
| --- | --- |
| Tag / manifest mismatch | Make `manifest.json` version equal the tag without `v` (tag `v1.2.0` ↔ version `1.2.0`). |
| Upload rejected for version | Store already has that version or higher — bump `manifest.json`. |
| 401 / 403 from API | Service account JSON wrong, or SA email not added under Developer Dashboard → Account. |
| Publish fails on visibility | Manually publish once from the dashboard after changing visibility; API publish then works. |
| First-time listing incomplete | Fill Store listing + Privacy in the dashboard before using the API. |

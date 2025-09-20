# Release Setup Guide

This guide explains how to set up automated releases and auto-updating for the ForgetFunds Electron app.

## GitHub Action Workflow

The release workflow (`.github/workflows/release.yml`) is triggered when you push a tag starting with `v` (e.g., `v1.0.0`).

### Required GitHub Secrets

You need to set up the following secrets in your GitHub repository settings:

#### For macOS Code Signing and Notarization:

- `BUILD_CERTIFICATE_BASE64`: Base64 encoded .p12 certificate file
- `P12_PASSWORD`: Password for the .p12 certificate
- `KEYCHAIN_PASSWORD`: Password for the temporary keychain (can be any secure password)
- `APPLE_ID`: Your Apple ID email
- `APPLE_APP_SPECIFIC_PASSWORD`: App-specific password for your Apple ID
- `APPLE_TEAM_ID`: Your Apple Developer Team ID

#### For Windows Code Signing:

- `WIN_CSC_LINK`: Base64 encoded .p12 certificate file for Windows
- `WIN_CSC_KEY_PASSWORD`: Password for the Windows certificate

#### GitHub Token:

- `GITHUB_TOKEN`: This is automatically provided by GitHub Actions

## Setting Up Code Signing Certificates

### macOS Certificate Setup:

1. **Export Certificate from Keychain:**

   ```bash
   # Export your Developer ID Application certificate as .p12
   # In Keychain Access: Right-click certificate → Export → .p12 format
   ```

2. **Convert to Base64:**

   ```bash
   base64 -i YourCertificate.p12 | pbcopy
   ```

3. **Add to GitHub Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add `BUILD_CERTIFICATE_BASE64` with the base64 string

### Windows Certificate Setup:

1. **Get Code Signing Certificate:**
   - Purchase from a Certificate Authority (Sectigo, DigiCert, etc.)
   - Export as .p12 format

2. **Convert to Base64:**

   ```bash
   base64 -i YourWindowsCertificate.p12 | pbcopy
   ```

3. **Add to GitHub Secrets:**
   - Add `WIN_CSC_LINK` with the base64 string
   - Add `WIN_CSC_KEY_PASSWORD` with the certificate password

## Apple Developer Setup

### App-Specific Password:

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Go to "App-Specific Passwords"
4. Generate a new password for "Electron App Notarization"
5. Add this password to `APPLE_APP_SPECIFIC_PASSWORD` secret

### Team ID:

1. Go to [developer.apple.com](https://developer.apple.com)
2. Sign in and go to "Membership"
3. Copy your Team ID
4. Add to `APPLE_TEAM_ID` secret

## Creating a Release

### Easy Method (Recommended):

```bash
npm run release:patch   # for bug fixes
npm run release:minor   # for new features
npm run release:major   # for breaking changes
```

### Manual Method:

1. **Update Version:**

   ```bash
   npm version patch  # or minor, major
   ```

2. **Push with Tags:**
   ```bash
   git push origin main --tags
   ```

### What Happens Automatically:

1. **GitHub Action Triggers** when a tag starting with `v` is pushed
2. **Release Creation:**
   - Automatically generates release notes from commit history
   - Creates a GitHub release with the tag name
   - Marks as prerelease if tag contains 'alpha', 'beta', or 'rc'
3. **Build Process:**
   - Builds for macOS (DMG and ZIP) with code signing and notarization
   - Builds for Windows (EXE and NUPKG) with code signing
   - Generates update metadata files (latest.yml, latest-mac.yml)
4. **Asset Upload:**
   - Uploads all built files to the GitHub release
   - Names files with version tags (e.g., ForgetFunds-v1.0.0-mac.dmg)
   - Includes update metadata for auto-updater

## Auto-Updater

The app uses `update-electron-app` which automatically:

- Checks for updates every hour
- Downloads updates in the background
- Notifies users when updates are available
- Uses GitHub Releases as the update source

### How it works:

1. **For macOS:** Uses the ZIP file for updates (faster than DMG)
2. **For Windows:** Uses the NSIS installer and .nupkg files
3. **Update Check:** Happens automatically when the app starts and every hour
4. **User Experience:** Users get a notification dialog when updates are ready

## Repository Configuration

Make sure your `package.json` has the correct repository information:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-github-username",
      "repo": "your-repo-name"
    }
  }
}
```

## Testing the Release Process

1. **Test Locally:**

   ```bash
   npm run dist  # Build without publishing
   ```

2. **Test Release:**
   - Create a test tag: `git tag v0.0.1-test`
   - Push: `git push origin v0.0.1-test`
   - Check GitHub Actions tab for build status

## Troubleshooting

### Common Issues:

1. **Code Signing Fails:**
   - Verify certificate is valid and not expired
   - Check that base64 encoding is correct
   - Ensure certificate password is correct

2. **Notarization Fails:**
   - Verify Apple ID and app-specific password
   - Check that Team ID is correct
   - Ensure certificate has proper entitlements

3. **Auto-Updater Not Working:**
   - Check that builds are properly signed
   - Verify GitHub repository settings in package.json
   - Check console logs for update errors

### Debug Commands:

```bash
# Check certificate validity (macOS)
security find-identity -v -p codesigning

# Test electron-builder locally
npm run dist

# Check app signature (macOS)
codesign -dv --verbose=4 /path/to/your/app.app
```

## Security Notes

- Never commit certificates or passwords to the repository
- Use GitHub Secrets for all sensitive information
- Regularly rotate app-specific passwords
- Keep certificates secure and backed up
- Monitor certificate expiration dates

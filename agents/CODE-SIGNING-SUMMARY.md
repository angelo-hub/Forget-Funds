# Code Signing Setup Summary

## ✅ What's Been Configured

### 1. **Entitlements Files Created**

- `build/entitlements.mac.plist` - For regular distribution (DMG/ZIP)
- `build/entitlements.mas.plist` - For Mac App Store (sandboxed)
- `build/entitlements.mas.inherit.plist` - For child processes in MAS

### 2. **Package.json Updated**

- Added Mac App Store target (`mas`)
- Configured proper entitlements for both distribution types
- Added build scripts: `build:mas`, `build:mas-dev`
- Set minimum macOS version to 10.15.0

### 3. **GitHub Actions Enhanced**

- Builds both regular distribution AND Mac App Store versions
- Uploads MAS .pkg file to GitHub releases
- Configured for both certificate types

### 4. **Helper Scripts Created**

- `scripts/setup-codesigning.js` - Check certificate status
- `scripts/check-team-id.js` - Extract your Apple Team ID
- `export-certificates.sh` - Export certificates for GitHub Actions

### 5. **Documentation**

- `MAC-APP-STORE-GUIDE.md` - Complete App Store submission guide
- `RELEASE-SETUP.md` - Updated with MAS information

## 🔍 Current Status

### ✅ **Already Have:**

- Apple Developer Account (Team ID: `REDACTED`)
- 8 provisioning profiles installed
- Team Name: REDACTED

### ❌ **Still Need:**

- Developer ID Application certificate (for DMG/ZIP distribution)
- Mac App Store Distribution certificate (for App Store)

## 🚀 Next Steps

### 1. **Create Certificates** (5 minutes)

Go to [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates):

1. **Click "+" → "Developer ID Application"**
   - For distributing outside the App Store (DMG/ZIP)
   - Download and double-click to install

2. **Click "+" → "Mac App Store Distribution"**
   - For App Store submissions
   - Download and double-click to install

### 2. **Export Certificates for GitHub Actions** (5 minutes)

```bash
# Run the export script
./export-certificates.sh

# Follow the prompts to export .p12 files
# Copy the base64 strings for GitHub Secrets
```

### 3. **Add GitHub Secrets**

Go to your repository → Settings → Secrets and variables → Actions:

**Required Secrets:**

```
BUILD_CERTIFICATE_BASE64: [Developer ID cert base64]
P12_PASSWORD: [Developer ID cert password]
MAS_CERTIFICATE_BASE64: [Mac App Store cert base64]
MAS_P12_PASSWORD: [Mac App Store cert password]
APPLE_ID: [Your Apple ID email]
APPLE_APP_SPECIFIC_PASSWORD: [App-specific password]
APPLE_TEAM_ID: H69V293M7J
KEYCHAIN_PASSWORD: [Any secure password for CI]
```

### 4. **Test Local Builds** (2 minutes)

```bash
# Test regular distribution build
npm run dist

# Test Mac App Store build
npm run build:mas
```

### 5. **Create App Store Connect Record**

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new macOS app with Bundle ID: `com.forgetfunds.app`
3. Fill in app metadata (see MAC-APP-STORE-GUIDE.md)

## 🎯 Build Targets

After setup, your releases will include:

### **Regular Distribution:**

- `ForgetFunds-v1.0.0-mac.dmg` (Intel + Apple Silicon)
- `ForgetFunds-v1.0.0-mac.zip` (for auto-updates)

### **Mac App Store:**

- `ForgetFunds-v1.0.0-mas.pkg` (ready for App Store submission)

## 🔧 Available Commands

```bash
# Check certificate status
npm run setup-codesigning

# Build for distribution
npm run dist

# Build for Mac App Store
npm run build:mas

# Build MAS development version
npm run build:mas-dev

# Create release (triggers GitHub Actions)
npm run release:patch
```

## 📚 Documentation

- **MAC-APP-STORE-GUIDE.md** - Complete App Store submission process
- **RELEASE-SETUP.md** - GitHub Actions and certificate setup
- **CODE-SIGNING-SUMMARY.md** - This file

## 🆘 Troubleshooting

### Certificate Issues:

```bash
# Check installed certificates
security find-identity -v -p codesigning

# Check keychain
security list-keychains
```

### Build Issues:

```bash
# Check app signature
codesign -dv --verbose=4 dist/mas/ForgetFunds.app

# Check entitlements
codesign -d --entitlements - dist/mas/ForgetFunds.app
```

### Need Help?

- Check the detailed guides in MAC-APP-STORE-GUIDE.md
- Apple Developer Documentation
- Electron Mac App Store Guide

---

**You're almost ready!** Just need to create the certificates and you'll be able to distribute both ways. 🚀

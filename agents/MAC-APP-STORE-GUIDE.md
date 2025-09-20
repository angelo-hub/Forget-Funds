# Mac App Store Submission Guide

This guide walks you through submitting ForgetFunds to the Mac App Store.

## Prerequisites

### 1. Apple Developer Account

- Enroll in the Apple Developer Program ($99/year)
- Complete your developer profile
- Accept all agreements

### 2. App Store Connect Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - **Platform**: macOS
   - **Name**: ForgetFunds
   - **Primary Language**: English
   - **Bundle ID**: `com.forgetfunds.app`
   - **SKU**: `forgetfunds-macos` (or similar unique identifier)

### 3. Certificates and Provisioning

#### Required Certificates:

1. **Mac App Store Distribution Certificate**
   - Go to [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates)
   - Click "+" → "Mac App Store Distribution"
   - Follow the instructions to create and download

2. **Mac Installer Distribution Certificate** (for PKG signing)
   - Click "+" → "Mac Installer Distribution"
   - Download and install in Keychain

#### Provisioning Profile:

1. Go to [Provisioning Profiles](https://developer.apple.com/account/resources/profiles)
2. Click "+" → "Mac App Store"
3. Select your App ID (`com.forgetfunds.app`)
4. Select your Mac App Store Distribution certificate
5. Download and install

## Code Signing Setup

### 1. Install Certificates

```bash
# Download certificates from Apple Developer Portal
# Double-click .cer files to install in Keychain Access
```

### 2. Run Setup Script

```bash
npm run setup-codesigning
```

This will:

- Check for available certificates
- Generate export scripts
- Show next steps

### 3. Export Certificates for CI/CD

```bash
# Export certificates as .p12 files
./export-certificates.sh

# Add to GitHub Secrets:
# - MAS_CERTIFICATE_BASE64: Base64 of Mac App Store cert
# - MAS_P12_PASSWORD: Password for the certificate
```

## App Store Metadata

### Required Information:

1. **App Information**:
   - Name: ForgetFunds
   - Subtitle: Local-First Budget Management
   - Category: Finance
   - Content Rights: You own or have rights to use

2. **Version Information**:
   - Version Number: 1.0.0
   - Copyright: © 2024 Your Name
   - Trade Representative Contact: Your contact info

3. **App Description**:

```
ForgetFunds is a powerful, privacy-focused budget management application that keeps your financial data completely local and secure.

KEY FEATURES:
• Complete Privacy - All data stays on your device
• Comprehensive Budget Tracking - Income, expenses, debts, and savings
• AI-Powered Insights - Smart financial recommendations
• Beautiful Charts - Visualize your financial health
• Secure Encryption - Military-grade data protection
• Export/Import - Encrypted backup and restore
• Dark Mode Support - Easy on the eyes

PERFECT FOR:
• Personal budget management
• Debt tracking and payoff planning
• Savings goal monitoring
• Financial habit building
• Privacy-conscious users

Your financial data never leaves your device. No cloud sync, no tracking, no data collection - just pure, local financial management.
```

4. **Keywords**: budget, finance, money, savings, debt, privacy, local, secure

5. **Screenshots**:
   - 6.5" Display (1284 x 2778) - Required
   - 12.9" Display (2048 x 2732) - Optional but recommended

### Privacy Information:

- **Data Collection**: None
- **Data Usage**: None
- **Data Sharing**: None
- **Privacy Policy URL**: Not required (no data collection)

## Building for Mac App Store

### 1. Local Build

```bash
# Build Mac App Store version
npm run build:mas

# The .pkg file will be in the dist/ folder
```

### 2. Verify Build

```bash
# Check code signature
codesign -dv --verbose=4 dist/mas/ForgetFunds.app

# Check entitlements
codesign -d --entitlements - dist/mas/ForgetFunds.app
```

### 3. Test Installation

```bash
# Install locally to test
sudo installer -pkg dist/ForgetFunds-1.0.0.pkg -target /
```

## Submission Process

### 1. Upload to App Store Connect

#### Option A: Using Transporter (Recommended)

1. Download [Transporter](https://apps.apple.com/app/transporter/id1450874784) from Mac App Store
2. Open Transporter
3. Sign in with your Apple ID
4. Drag and drop your .pkg file
5. Click "Deliver"

#### Option B: Using Xcode

1. Open Xcode
2. Go to Window → Organizer
3. Click "Distribute App"
4. Select "App Store Connect"
5. Upload your .pkg file

#### Option C: Using Command Line

```bash
# Upload using altool (deprecated but still works)
xcrun altool --upload-app -f dist/ForgetFunds-1.0.0.pkg -u your-apple-id@email.com -p your-app-specific-password
```

### 2. Complete App Store Connect Setup

1. **App Information**:
   - Fill in all required fields
   - Upload app icon (1024x1024 PNG)
   - Add screenshots

2. **Pricing and Availability**:
   - Set price (Free or paid)
   - Select territories
   - Set availability date

3. **App Review Information**:
   - Contact information
   - Demo account (if needed)
   - Notes for reviewer

4. **Version Information**:
   - What's new in this version
   - Build selection (choose uploaded build)

### 3. Submit for Review

1. Click "Add for Review"
2. Answer additional questions
3. Submit for review

## Review Process

### Timeline:

- **Review Time**: 24-48 hours (usually)
- **First Submission**: May take longer
- **Updates**: Usually faster

### Common Rejection Reasons:

1. **Sandboxing Issues**: App doesn't work properly in sandbox
2. **Entitlements**: Incorrect or unnecessary entitlements
3. **Metadata**: Missing or incorrect app information
4. **Functionality**: App crashes or doesn't work as described
5. **Guidelines**: Violates App Store Review Guidelines

### If Rejected:

1. Read the rejection message carefully
2. Fix the issues mentioned
3. Update your build if needed
4. Resubmit for review

## Post-Approval

### 1. Release Management

- You can release immediately or schedule
- Monitor crash reports and user feedback
- Prepare for updates

### 2. Updates

```bash
# For updates, increment version and build
npm version patch
npm run build:mas
# Upload new build and submit update
```

### 3. Analytics

- Monitor App Store Connect analytics
- Track downloads and user engagement
- Respond to user reviews

## Troubleshooting

### Common Build Issues:

1. **Code Signing Errors**:

```bash
# Check certificates
security find-identity -v -p codesigning

# Verify keychain
security list-keychains
```

2. **Entitlements Issues**:

```bash
# Check app entitlements
codesign -d --entitlements - path/to/app

# Verify sandbox compliance
spctl -a -v path/to/app
```

3. **Native Module Issues**:

```bash
# Rebuild native modules for Mac App Store
npm run postinstall
```

### Upload Issues:

1. **Authentication Errors**:
   - Use app-specific password, not regular password
   - Ensure Apple ID has proper permissions

2. **Build Validation Errors**:
   - Check bundle ID matches App Store Connect
   - Verify all required metadata is present

3. **Size Limits**:
   - Mac App Store limit: 20GB
   - Optimize assets if needed

## Security Considerations

### Sandboxing:

- App runs in restricted environment
- Limited file system access
- Network restrictions apply
- Some APIs unavailable

### Entitlements:

- Only request necessary entitlements
- Document why each entitlement is needed
- Test thoroughly in sandbox environment

### Data Protection:

- All user data stays local
- No network data transmission
- Secure keychain storage for sensitive data

## Resources

- [Mac App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [macOS App Distribution Guide](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)
- [Electron Mac App Store Guide](https://www.electronjs.org/docs/latest/tutorial/mac-app-store-submission-guide)

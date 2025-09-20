#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 ForgetFunds Code Signing Setup\n');

// Check if we're on macOS
if (process.platform !== 'darwin') {
  console.error('❌ This script must be run on macOS');
  process.exit(1);
}

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return result.trim();
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return null;
  }
}

function checkCertificates() {
  console.log('📋 Checking available certificates...\n');
  
  // Check for Developer ID certificates (for distribution outside App Store)
  const devIdResult = runCommand(
    'security find-identity -v -p codesigning | grep "Developer ID"',
    'Looking for Developer ID certificates'
  );
  
  if (devIdResult) {
    console.log('✅ Developer ID certificates found:');
    console.log(devIdResult);
  } else {
    console.log('⚠️  No Developer ID certificates found');
  }
  
  console.log('');
  
  // Check for Mac App Store certificates
  const masResult = runCommand(
    'security find-identity -v -p codesigning | grep "Mac App Store"',
    'Looking for Mac App Store certificates'
  );
  
  if (masResult) {
    console.log('✅ Mac App Store certificates found:');
    console.log(masResult);
  } else {
    console.log('⚠️  No Mac App Store certificates found');
  }
  
  console.log('');
}

function checkProvisioningProfiles() {
  console.log('📋 Checking provisioning profiles...\n');
  
  const os = require('os');
  const profilesDir = path.join(os.homedir(), 'Library/MobileDevice/Provisioning Profiles');
  
  try {
    if (fs.existsSync(profilesDir)) {
      const profiles = fs.readdirSync(profilesDir).filter(f => f.endsWith('.mobileprovision'));
      if (profiles.length > 0) {
        console.log(`✅ Found ${profiles.length} provisioning profile(s):`);
        profiles.forEach(profile => {
          console.log(`   - ${profile}`);
        });
      } else {
        console.log('⚠️  No provisioning profiles found');
      }
    } else {
      console.log('⚠️  Provisioning profiles directory not found');
    }
  } catch (error) {
    console.log('⚠️  Could not check provisioning profiles');
  }
  
  console.log('');
}

function generateCertificateExportScript() {
  const scriptContent = `#!/bin/bash

# Script to export certificates for GitHub Actions
# Run this script and follow the prompts

echo "🔐 Certificate Export Script"
echo ""

# Export Developer ID Application certificate
echo "📤 Exporting Developer ID Application certificate..."
echo "1. Open Keychain Access"
echo "2. Find your 'Developer ID Application: Your Name (TEAM_ID)' certificate"
echo "3. Right-click and select 'Export'"
echo "4. Save as 'developer-id-cert.p12'"
echo "5. Set a strong password and remember it"
echo ""

# Export Mac App Store certificate
echo "📤 Exporting Mac App Store certificate..."
echo "1. Find your '3rd Party Mac Developer Application: Your Name (TEAM_ID)' certificate"
echo "2. Right-click and select 'Export'"
echo "3. Save as 'mas-cert.p12'"
echo "4. Set a strong password and remember it"
echo ""

echo "🔑 Converting to Base64 for GitHub Secrets:"
echo ""

if [ -f "developer-id-cert.p12" ]; then
    echo "Developer ID Certificate (for BUILD_CERTIFICATE_BASE64):"
    base64 -i developer-id-cert.p12
    echo ""
fi

if [ -f "mas-cert.p12" ]; then
    echo "Mac App Store Certificate (for MAS_CERTIFICATE_BASE64):"
    base64 -i mas-cert.p12
    echo ""
fi

echo "🔒 Add these to your GitHub repository secrets:"
echo "- BUILD_CERTIFICATE_BASE64: (Developer ID certificate base64)"
echo "- P12_PASSWORD: (Developer ID certificate password)"
echo "- MAS_CERTIFICATE_BASE64: (Mac App Store certificate base64)"
echo "- MAS_P12_PASSWORD: (Mac App Store certificate password)"
echo "- APPLE_ID: (Your Apple ID email)"
echo "- APPLE_APP_SPECIFIC_PASSWORD: (App-specific password)"
echo "- APPLE_TEAM_ID: (Your team ID)"
`;

  fs.writeFileSync('export-certificates.sh', scriptContent);
  execSync('chmod +x export-certificates.sh');
  
  console.log('✅ Created export-certificates.sh script');
  console.log('   Run ./export-certificates.sh to export your certificates');
  console.log('');
}

function showNextSteps() {
  console.log('📋 Next Steps:\n');
  
  console.log('1. 🏪 Set up certificates in Apple Developer Portal:');
  console.log('   • Go to https://developer.apple.com/account/resources/certificates');
  console.log('   • Create "Developer ID Application" certificate (for distribution)');
  console.log('   • Create "Mac App Store Distribution" certificate (for App Store)');
  console.log('');
  
  console.log('2. 📱 Download and install certificates:');
  console.log('   • Download .cer files from Apple Developer Portal');
  console.log('   • Double-click to install in Keychain Access');
  console.log('');
  
  console.log('3. 🔑 Export certificates for GitHub Actions:');
  console.log('   • Run: ./export-certificates.sh');
  console.log('   • Follow the instructions to export .p12 files');
  console.log('   • Add the base64 strings to GitHub Secrets');
  console.log('');
  
  console.log('4. 🚀 Test local build:');
  console.log('   • Run: npm run dist');
  console.log('   • Check that the app is properly signed');
  console.log('');
  
  console.log('5. 🏪 For App Store submission:');
  console.log('   • Create App Store Connect record');
  console.log('   • Set up provisioning profiles');
  console.log('   • Run: npm run build:mas');
  console.log('   • Upload with Transporter or Xcode');
}

// Main execution
checkCertificates();
checkProvisioningProfiles();
generateCertificateExportScript();
showNextSteps();

console.log('✅ Code signing setup complete!');
console.log('💡 For detailed instructions, see RELEASE-SETUP.md');

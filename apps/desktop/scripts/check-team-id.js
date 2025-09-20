#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Checking Apple Developer Team ID...\n');

try {
  // Check provisioning profiles for team ID
  const profiles = execSync('find ~/Library/MobileDevice/Provisioning\\ Profiles -name "*.mobileprovision" | head -1', { encoding: 'utf8' }).trim();
  
  if (profiles) {
    console.log('📱 Found provisioning profile, extracting team ID...');
    
    try {
      // Extract and decode the provisioning profile
      const decoded = execSync(`security cms -D -i "${profiles}"`, { encoding: 'utf8' });
      
      // Parse the plist to find team ID
      const teamIdMatch = decoded.match(/<key>TeamIdentifier<\/key>\s*<array>\s*<string>([A-Z0-9]+)<\/string>/);
      const teamNameMatch = decoded.match(/<key>TeamName<\/key>\s*<string>([^<]+)<\/string>/);
      
      if (teamIdMatch) {
        console.log(`✅ Team ID: ${teamIdMatch[1]}`);
        if (teamNameMatch) {
          console.log(`✅ Team Name: ${teamNameMatch[1]}`);
        }
        
        console.log('\n📋 Add this to your GitHub Secrets:');
        console.log(`APPLE_TEAM_ID: ${teamIdMatch[1]}`);
      } else {
        console.log('⚠️  Could not extract Team ID from provisioning profile');
      }
    } catch (error) {
      console.log('⚠️  Could not decode provisioning profile');
    }
  } else {
    console.log('⚠️  No provisioning profiles found');
  }
} catch (error) {
  console.log('⚠️  Error checking provisioning profiles');
}

console.log('\n🔗 You can also find your Team ID at:');
console.log('https://developer.apple.com/account/#!/membership/');

console.log('\n💡 Next steps:');
console.log('1. Go to https://developer.apple.com/account/resources/certificates');
console.log('2. Create "Developer ID Application" certificate');
console.log('3. Create "Mac App Store Distribution" certificate');
console.log('4. Download and install both certificates');
console.log('5. Run: ./export-certificates.sh');
console.log('6. Add the base64 certificates to GitHub Secrets');

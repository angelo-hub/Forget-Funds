#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔨 Building ForgetFunds without code signing...\n');

try {
  // Set environment variable to disable code signing
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
  
  console.log('📦 Running build...');
  execSync('npm run dist', { stdio: 'inherit' });
  
  console.log('\n✅ Build completed successfully!');
  console.log('\n📁 Generated files:');
  console.log('   • ForgetFunds-1.0.0.dmg (Intel)');
  console.log('   • ForgetFunds-1.0.0-arm64.dmg (Apple Silicon)');
  console.log('   • ForgetFunds-1.0.0-mac.zip (Intel, for updates)');
  console.log('   • ForgetFunds-1.0.0-arm64-mac.zip (Apple Silicon, for updates)');
  console.log('   • latest-mac.yml (update metadata)');
  
  console.log('\n⚠️  Note: These builds are NOT signed and will show security warnings');
  console.log('💡 To create signed builds, set up distribution certificates first');
  console.log('🔗 Run: node scripts/create-certificates-guide.js for help');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}

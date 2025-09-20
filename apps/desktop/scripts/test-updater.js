#!/usr/bin/env node

// Test script to verify auto-updater configuration
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing auto-updater configuration...\n');

// Check package.json configuration
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('📦 Package Configuration:');
console.log(`   App ID: ${packageJson.build?.appId}`);
console.log(`   Product Name: ${packageJson.build?.productName}`);
console.log(`   Version: ${packageJson.version}`);

if (packageJson.build?.publish) {
  console.log(`   Publisher: ${packageJson.build.publish.provider}`);
  console.log(`   Owner: ${packageJson.build.publish.owner}`);
  console.log(`   Repo: ${packageJson.build.publish.repo}`);
} else {
  console.log('   ❌ No publish configuration found');
}

// Check dependencies
console.log('\n📚 Dependencies:');
const hasUpdater = packageJson.dependencies?.['update-electron-app'];
console.log(`   update-electron-app: ${hasUpdater ? '✅ ' + hasUpdater : '❌ Not found'}`);

// Check build targets
console.log('\n🎯 Build Targets:');
if (packageJson.build?.mac?.target) {
  console.log('   macOS:');
  packageJson.build.mac.target.forEach(target => {
    console.log(`     - ${target.target} (${target.arch.join(', ')})`);
  });
}

if (packageJson.build?.win?.target) {
  console.log('   Windows:');
  packageJson.build.win.target.forEach(target => {
    console.log(`     - ${target.target} (${target.arch.join(', ')})`);
  });
}

// Check GitHub workflow
const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'release.yml');
const hasWorkflow = fs.existsSync(workflowPath);
console.log(`\n🔄 GitHub Workflow: ${hasWorkflow ? '✅ Found' : '❌ Not found'}`);

// Check main.ts for auto-updater
const mainPath = path.join(__dirname, '..', 'src', 'main.ts');
if (fs.existsSync(mainPath)) {
  const mainContent = fs.readFileSync(mainPath, 'utf8');
  const hasUpdaterCode = mainContent.includes('update-electron-app');
  console.log(`🔧 Auto-updater in main.ts: ${hasUpdaterCode ? '✅ Configured' : '❌ Not found'}`);
}

console.log('\n📋 Next Steps:');
console.log('1. Set up GitHub secrets for code signing');
console.log('2. Run: npm run release:patch');
console.log('3. Check GitHub Actions for build status');
console.log('4. Test auto-updater with a real release');

console.log('\n✅ Configuration check complete!');

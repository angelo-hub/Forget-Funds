#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read current version from package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`Current version: ${currentVersion}`);

// Get version type from command line argument
const versionType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('Usage: npm run release [patch|minor|major]');
  console.error('Example: npm run release patch');
  process.exit(1);
}

try {
  console.log(`\n🔄 Updating version (${versionType})...`);
  
  // Update version in package.json and create commit
  execSync(`npm version ${versionType} --message "chore: release v%s

- Updated version to %s
- Prepared for release build
- Auto-updater will distribute to existing users"`, { stdio: 'inherit' });
  
  // Read new version
  const updatedPackageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const newVersion = updatedPackageJson.version;
  
  console.log(`\n✅ Version updated to: ${newVersion}`);
  console.log(`\n🚀 Pushing to GitHub with tags...`);
  
  // Push to GitHub with tags
  execSync('git push origin main --tags', { stdio: 'inherit' });
  
  console.log(`\n🎉 Release v${newVersion} has been created!`);
  console.log(`\n📋 What happens next:`);
  console.log(`   1. GitHub Actions will automatically start building`);
  console.log(`   2. macOS DMG and ZIP files will be built and signed`);
  console.log(`   3. Windows EXE and NUPKG files will be built and signed`);
  console.log(`   4. Release notes will be auto-generated from commits`);
  console.log(`   5. All files will be attached to the GitHub release`);
  console.log(`\n🔗 Links:`);
  console.log(`   • GitHub Actions: https://github.com/angelogirardi/local_first_budget_app/actions`);
  console.log(`   • Release Page: https://github.com/angelogirardi/local_first_budget_app/releases/tag/v${newVersion}`);
  console.log(`\n🔄 Auto-updater will automatically distribute this release to existing users within 1 hour.`);
  
} catch (error) {
  console.error('\n❌ Error creating release:', error.message);
  process.exit(1);
}

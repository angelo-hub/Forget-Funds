#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📊 Bundle Size Analysis\n');

// Check if build exists
if (!fs.existsSync('dist/mac/ForgetFunds.app')) {
  console.log('❌ No build found. Run npm run build:unsigned first.');
  process.exit(1);
}

console.log('🔍 Current Build Sizes:');

try {
  // App bundle size
  const appSize = execSync('du -sh dist/mac/ForgetFunds.app', { encoding: 'utf8' }).trim();
  console.log(`   App Bundle: ${appSize.split('\t')[0]}`);

  // Asar size
  const asarSize = execSync('du -sh dist/mac/ForgetFunds.app/Contents/Resources/app.asar', { encoding: 'utf8' }).trim();
  console.log(`   App Code (asar): ${asarSize.split('\t')[0]}`);

  // Frameworks size
  const frameworksSize = execSync('du -sh dist/mac/ForgetFunds.app/Contents/Frameworks', { encoding: 'utf8' }).trim();
  console.log(`   Electron Framework: ${frameworksSize.split('\t')[0]}`);

  console.log('\n🔍 Largest Components in App Code:');
  
  // Extract asar to analyze
  const tempDir = '/tmp/forgetfunds-analysis';
  if (fs.existsSync(tempDir)) {
    execSync(`rm -rf ${tempDir}`);
  }
  
  execSync(`npx asar extract dist/mac/ForgetFunds.app/Contents/Resources/app.asar ${tempDir}`);
  
  // Analyze contents
  const contents = execSync(`du -sh ${tempDir}/* | sort -hr`, { encoding: 'utf8' }).trim().split('\n');
  contents.slice(0, 10).forEach(line => {
    const [size, path] = line.split('\t');
    const name = path.split('/').pop();
    console.log(`   ${size.padStart(8)} - ${name}`);
  });

  // If node_modules exists, show top modules
  const nodeModulesPath = path.join(tempDir, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('\n🔍 Largest Node Modules:');
    const modules = execSync(`du -sh ${nodeModulesPath}/* | sort -hr | head -10`, { encoding: 'utf8' }).trim().split('\n');
    modules.forEach(line => {
      const [size, path] = line.split('\t');
      const name = path.split('/').pop();
      console.log(`   ${size.padStart(8)} - ${name}`);
    });
  }

  // Clean up
  execSync(`rm -rf ${tempDir}`);

  console.log('\n💡 Optimization Suggestions:');
  console.log('   • Large dependencies can be optimized');
  console.log('   • Consider lazy loading for heavy components');
  console.log('   • Remove unused dependencies');
  console.log('   • Use tree shaking for libraries');

} catch (error) {
  console.error('❌ Analysis failed:', error.message);
}

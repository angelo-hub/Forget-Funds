const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Read the actual piggy bank SVG
async function loadPiggyBankSVG() {
    const svgPath = path.join(__dirname, '..', 'icons', 'piggy_bank.svg');
    const svgContent = await fs.readFile(svgPath, 'utf8');
    
    // Extract the path data from the SVG
    const pathMatch = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/);
    if (!pathMatch) {
        throw new Error('Could not extract path from piggy_bank.svg');
    }
    
    return pathMatch[1]; // Return the path data
}

// Create HTML that exactly matches your ForgetFundsIcon component styling
const createLogoHTML = (size, piggyBankPath) => {
  const iconSize = size - 12; // Match the padding calculation from your component
  const borderRadius = Math.max(size * 0.15, 8);
  const shadowBlur1 = size * 0.025;
  const shadowOffset1 = size * 0.02;
  const shadowSpread1 = -size * 0.005;
  const shadowBlur2 = size * 0.01;
  const shadowOffset2 = size * 0.01;
  const shadowSpread2 = -size * 0.005;
  const dropShadowOffset = size * 0.002;
  const dropShadowBlur = size * 0.004;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ForgetFunds Logo</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${size}px;
            height: ${size}px;
        }
        .logo-container {
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #34d399 0%, #3b82f6 50%, #8b5cf6 100%);
            border-radius: ${borderRadius}px;
            position: relative;
            box-shadow: 0 ${shadowOffset1}px ${shadowBlur1}px ${shadowSpread1}px rgba(0, 0, 0, 0.1), 0 ${shadowOffset2}px ${shadowBlur2}px ${shadowSpread2}px rgba(0, 0, 0, 0.04);
        }
        .logo-container::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: ${borderRadius}px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
        }
        .piggy-bank {
            width: ${iconSize}px;
            height: ${iconSize}px;
            position: relative;
            z-index: 1;
        }
        .piggy-bank svg {
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 ${dropShadowOffset}px ${dropShadowBlur}px rgba(0, 0, 0, 0.25));
        }
    </style>
</head>
<body>
    <div class="logo-container">
        <div class="piggy-bank">
            <!-- Exact PiggyBank SVG from your icons/piggy_bank.svg file -->
            <svg viewBox="0 0 256 256" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="${piggyBankPath}" />
            </svg>
        </div>
    </div>
</body>
</html>
`;
};

async function generateIcons() {
    console.log('🎨 Starting icon generation using actual piggy_bank.svg...');
    
    // Load the actual piggy bank SVG path
    const piggyBankPath = await loadPiggyBankSVG();
    console.log('📄 Loaded piggy_bank.svg successfully');
    
    // Create icons directory if it doesn't exist
    const iconsDir = path.join(__dirname, '..', 'icons');
    await fs.mkdir(iconsDir, { recursive: true });

    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Icon sizes for Electron
    const sizes = [
        { name: '1024x1024', size: 1024 },
        { name: '1024x1024@2x', size: 2048 },
        { name: '1024x1024@3x', size: 3072 },
        { name: '512x512', size: 512 },
        { name: '512x512@2x', size: 1024 },
        { name: '256x256', size: 256 },
        { name: '256x256@2x', size: 512 },
        { name: '128x128', size: 128 },
        { name: '128x128@2x', size: 256 },
        { name: '64x64', size: 64 },
        { name: '64x64@2x', size: 128 },
        { name: '32x32', size: 32 },
        { name: '32x32@2x', size: 64 },
        { name: '16x16', size: 16 },
        { name: '16x16@2x', size: 32 }
    ];

    for (const { name, size } of sizes) {
        console.log(`📸 Generating ${name}.png (${size}x${size})...`);
        
        // Set the HTML content
        await page.setContent(createLogoHTML(size, piggyBankPath));
        
        // Set viewport to exact size
        await page.setViewport({ 
            width: size, 
            height: size,
            deviceScaleFactor: 1
        });

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 100));

        // Take screenshot with transparent background
        const screenshot = await page.screenshot({
            type: 'png',
            omitBackground: true, // This ensures transparent background
            clip: {
                x: 0,
                y: 0,
                width: size,
                height: size
            }
        });

        // Save the file
        const filename = path.join(iconsDir, `${name}.png`);
        await fs.writeFile(filename, screenshot);
        console.log(`✅ Saved ${name}.png`);
    }

    await browser.close();
    console.log('🎉 All icons generated successfully!');
    console.log(`📁 Icons saved to: ${iconsDir}`);
    console.log('💡 Icons now use the exact piggy_bank.svg file!');
}

// Run the script
generateIcons().catch(console.error);
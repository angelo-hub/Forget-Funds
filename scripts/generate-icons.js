const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create the HTML template for rendering the logo
const createLogoHTML = (size) => `
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
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%);
            border-radius: ${size * 0.25}px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            position: relative;
        }
        .logo-container::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: ${size * 0.25}px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%);
        }
        .piggy-bank {
            width: ${size * 0.6}px;
            height: ${size * 0.6}px;
            position: relative;
            z-index: 1;
        }
        /* Custom SVG PiggyBank */
        .piggy-bank svg {
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
    </style>
</head>
<body>
    <div class="logo-container">
        <div class="piggy-bank">
            <svg viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- PiggyBank icon paths (simplified version) -->
                <!-- Main body -->
                <ellipse cx="128" cy="140" rx="80" ry="50" fill="white" fill-opacity="0.95"/>
                
                <!-- Snout -->
                <ellipse cx="60" cy="140" rx="20" ry="12" fill="white" fill-opacity="0.9"/>
                
                <!-- Legs -->
                <rect x="90" y="180" width="8" height="20" rx="4" fill="white" fill-opacity="0.8"/>
                <rect x="110" y="180" width="8" height="20" rx="4" fill="white" fill-opacity="0.8"/>
                <rect x="140" y="180" width="8" height="20" rx="4" fill="white" fill-opacity="0.8"/>
                <rect x="160" y="180" width="8" height="20" rx="4" fill="white" fill-opacity="0.8"/>
                
                <!-- Ear -->
                <ellipse cx="150" cy="100" rx="12" ry="18" fill="white" fill-opacity="0.8"/>
                
                <!-- Tail -->
                <path d="M 200 130 Q 220 120 210 145" stroke="white" stroke-width="6" fill="none" stroke-opacity="0.8" stroke-linecap="round"/>
                
                <!-- Eye -->
                <circle cx="100" cy="125" r="6" fill="white" fill-opacity="0.6"/>
                
                <!-- Coin slot -->
                <rect x="115" y="90" width="25" height="6" rx="3" fill="white" fill-opacity="0.7"/>
                
                <!-- Nostril -->
                <circle cx="60" cy="135" r="3" fill="white" fill-opacity="0.5"/>
            </svg>
        </div>
    </div>
</body>
</html>
`;

async function generateIcons() {
    console.log('🎨 Starting icon generation...');
    
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
        await page.setContent(createLogoHTML(size));
        
        // Set viewport to exact size
        await page.setViewport({ 
            width: size, 
            height: size,
            deviceScaleFactor: 1
        });

        // Take screenshot
        const screenshot = await page.screenshot({
            type: 'png',
            omitBackground: false, // Keep the gradient background
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
}

// Run the script
generateIcons().catch(console.error);

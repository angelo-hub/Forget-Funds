# ForgetFunds Icons

This directory contains the app icons for ForgetFunds in various sizes and resolutions.

## Generated Icons

All icons feature the ForgetFunds gradient logo with a white PiggyBank icon on a gradient background (emerald → blue → purple).

### Standard Sizes

- `16x16.png` - 16×16 pixels
- `32x32.png` - 32×32 pixels
- `64x64.png` - 64×64 pixels
- `128x128.png` - 128×128 pixels
- `256x256.png` - 256×256 pixels
- `512x512.png` - 512×512 pixels
- `1024x1024.png` - 1024×1024 pixels

### High DPI (@2x)

- `16x16@2x.png` - 32×32 pixels (for 16×16 @2x)
- `32x32@2x.png` - 64×64 pixels (for 32×32 @2x)
- `64x64@2x.png` - 128×128 pixels (for 64×64 @2x)
- `128x128@2x.png` - 256×256 pixels (for 128×128 @2x)
- `256x256@2x.png` - 512×512 pixels (for 256×256 @2x)
- `512x512@2x.png` - 1024×1024 pixels (for 512×512 @2x)
- `1024x1024@2x.png` - 2048×2048 pixels (for 1024×1024 @2x)

### Ultra High DPI (@3x)

- `1024x1024@3x.png` - 3072×3072 pixels (for 1024×1024 @3x)

## Generation

Icons are automatically generated using the `npm run generate-icons` script, which uses Puppeteer to render the ForgetFunds logo component to PNG files at various sizes.

## Usage

These icons are used by Electron Builder for:

- macOS app icons (.icns)
- Windows app icons (.ico)
- Linux app icons (.png)
- App store submissions
- Operating system integration

The main icon used is `1024x1024.png` which provides the highest quality base for all platform-specific conversions.

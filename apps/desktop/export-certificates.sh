#!/bin/bash

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

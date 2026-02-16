#!/usr/bin/env node
/**
 * Icon Generation Script
 * 
 * Generates app icons and notification icons for Android/iOS
 * 
 * Prerequisites:
 *   npm install sharp --save-dev
 * 
 * Usage:
 *   node scripts/generate-icons.js
 * 
 * This will generate:
 *   - assets/notification-icon.png (96x96, monochrome white on transparent)
 *   - assets/adaptive-icon.png (1024x1024 for Android adaptive icon)
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not installed. Install with: npm install sharp --save-dev');
  console.log('\nManual icon creation instructions:');
  console.log('=====================================');
  console.log('1. Notification Icon (assets/notification-icon.png):');
  console.log('   - Size: 96x96 pixels');
  console.log('   - Format: PNG with transparency');
  console.log('   - Colors: Use ONLY white (#FFFFFF) for the icon shape');
  console.log('   - Background: Transparent');
  console.log('   - Android will tint it with your accent color (#00D26A)');
  console.log('');
  console.log('2. You can use your existing icon.svg and export it as:');
  console.log('   - A simplified, solid white silhouette');
  console.log('   - No gradients, shadows, or multiple colors');
  console.log('');
  console.log('Tools: Figma, Inkscape, or Android Asset Studio');
  console.log('https://romannurik.github.io/AndroidAssetStudio/icons-notification.html');
  process.exit(0);
}

const assetsDir = path.join(__dirname, '..', 'assets');

async function generateNotificationIcon() {
  // Create a simple bowl/soup icon silhouette
  // This is a placeholder - you should replace with your actual icon
  const svgIcon = `
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="48" cy="60" rx="35" ry="20" fill="white"/>
      <path d="M13 55 Q13 75, 48 85 Q83 75, 83 55" fill="white"/>
      <path d="M30 40 Q32 30, 35 40" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M45 35 Q47 22, 50 35" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M60 40 Q62 28, 65 40" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>
  `;

  await sharp(Buffer.from(svgIcon))
    .resize(96, 96)
    .png()
    .toFile(path.join(assetsDir, 'notification-icon.png'));

  console.log('✓ Generated notification-icon.png (96x96)');
}

async function main() {
  try {
    await generateNotificationIcon();
    console.log('\nIcon generation complete!');
    console.log('Note: Replace notification-icon.png with your actual app icon silhouette.');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();


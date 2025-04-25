const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create the favicons and app icons
function generateIcons() {
  console.log('Generating app icons...');
  
  // Generate favicon.ico (64x64)
  const faviconCanvas = createCanvas(64, 64);
  const faviconCtx = faviconCanvas.getContext('2d');
  
  // Set background color (gradient)
  const gradientFavicon = faviconCtx.createLinearGradient(0, 0, 64, 64);
  gradientFavicon.addColorStop(0, '#0967d2');  // Blue
  gradientFavicon.addColorStop(1, '#3b82f6');  // Lighter blue
  faviconCtx.fillStyle = gradientFavicon;
  faviconCtx.fillRect(0, 0, 64, 64);
  
  // Add chat bubble icon
  faviconCtx.fillStyle = 'white';
  faviconCtx.beginPath();
  faviconCtx.moveTo(15, 20);
  faviconCtx.lineTo(49, 20);
  faviconCtx.arcTo(54, 20, 54, 25, 5);
  faviconCtx.lineTo(54, 39);
  faviconCtx.arcTo(54, 44, 49, 44, 5);
  faviconCtx.lineTo(35, 44);
  faviconCtx.lineTo(28, 52);
  faviconCtx.lineTo(28, 44);
  faviconCtx.lineTo(15, 44);
  faviconCtx.arcTo(10, 44, 10, 39, 5);
  faviconCtx.lineTo(10, 25);
  faviconCtx.arcTo(10, 20, 15, 20, 5);
  faviconCtx.fill();
  
  // Generate logo192.png
  const logo192Canvas = createCanvas(192, 192);
  const logo192Ctx = logo192Canvas.getContext('2d');
  
  // Set background
  const gradient192 = logo192Ctx.createLinearGradient(0, 0, 192, 192);
  gradient192.addColorStop(0, '#0967d2');  // Blue
  gradient192.addColorStop(1, '#3b82f6');  // Lighter blue
  logo192Ctx.fillStyle = gradient192;
  logo192Ctx.fillRect(0, 0, 192, 192);
  
  // Add chat bubble icon
  logo192Ctx.fillStyle = 'white';
  logo192Ctx.beginPath();
  logo192Ctx.moveTo(48, 60);
  logo192Ctx.lineTo(144, 60);
  logo192Ctx.arcTo(154, 60, 154, 70, 10);
  logo192Ctx.lineTo(154, 122);
  logo192Ctx.arcTo(154, 132, 144, 132, 10);
  logo192Ctx.lineTo(100, 132);
  logo192Ctx.lineTo(80, 152);
  logo192Ctx.lineTo(80, 132);
  logo192Ctx.lineTo(48, 132);
  logo192Ctx.arcTo(38, 132, 38, 122, 10);
  logo192Ctx.lineTo(38, 70);
  logo192Ctx.arcTo(38, 60, 48, 60, 10);
  logo192Ctx.fill();
  
  // Generate logo512.png
  const logo512Canvas = createCanvas(512, 512);
  const logo512Ctx = logo512Canvas.getContext('2d');
  
  // Set background
  const gradient512 = logo512Ctx.createLinearGradient(0, 0, 512, 512);
  gradient512.addColorStop(0, '#0967d2');  // Blue
  gradient512.addColorStop(1, '#3b82f6');  // Lighter blue
  logo512Ctx.fillStyle = gradient512;
  logo512Ctx.fillRect(0, 0, 512, 512);
  
  // Add chat bubble icon
  logo512Ctx.fillStyle = 'white';
  logo512Ctx.beginPath();
  logo512Ctx.moveTo(128, 160);
  logo512Ctx.lineTo(384, 160);
  logo512Ctx.arcTo(412, 160, 412, 188, 28);
  logo512Ctx.lineTo(412, 324);
  logo512Ctx.arcTo(412, 352, 384, 352, 28);
  logo512Ctx.lineTo(266, 352);
  logo512Ctx.lineTo(214, 404);
  logo512Ctx.lineTo(214, 352);
  logo512Ctx.lineTo(128, 352);
  logo512Ctx.arcTo(100, 352, 100, 324, 28);
  logo512Ctx.lineTo(100, 188);
  logo512Ctx.arcTo(100, 160, 128, 160, 28);
  logo512Ctx.fill();
  
  // Save the image files
  const faviconBuffer = faviconCanvas.toBuffer('image/png');
  const logo192Buffer = logo192Canvas.toBuffer('image/png');
  const logo512Buffer = logo512Canvas.toBuffer('image/png');
  
  fs.writeFileSync(path.join(__dirname, 'favicon.ico'), faviconBuffer);
  fs.writeFileSync(path.join(__dirname, 'logo192.png'), logo192Buffer);
  fs.writeFileSync(path.join(__dirname, 'logo512.png'), logo512Buffer);
  
  console.log('App icons generated successfully!');
}

// Run the icon generation
generateIcons(); 
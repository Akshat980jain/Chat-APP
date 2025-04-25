const fs = require('fs');
const path = require('path');

// Function to convert data URL to file
function dataURLToFile(dataURL, outputPath) {
  // Extract the base64 data from the URL
  const matches = dataURL.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    console.error('Invalid data URL format');
    return false;
  }

  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  
  try {
    fs.writeFileSync(outputPath, buffer);
    console.log(`File saved: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error saving file: ${error.message}`);
    return false;
  }
}

// Read the data URLs from the existing files
function convertIcons() {
  try {
    // Read the favicon data
    const faviconPath = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(faviconPath)) {
      const faviconData = fs.readFileSync(faviconPath, 'utf8');
      if (faviconData.startsWith('data:')) {
        dataURLToFile(faviconData, faviconPath);
      }
    } else {
      console.error('favicon.ico not found');
    }

    // Read the logo192 data
    const logo192Path = path.join(__dirname, 'logo192.png');
    if (fs.existsSync(logo192Path)) {
      const logo192Data = fs.readFileSync(logo192Path, 'utf8');
      if (logo192Data.startsWith('data:')) {
        dataURLToFile(logo192Data, logo192Path);
      }
    } else {
      console.error('logo192.png not found');
    }

    // Read the logo512 data
    const logo512Path = path.join(__dirname, 'logo512.png');
    if (fs.existsSync(logo512Path)) {
      const logo512Data = fs.readFileSync(logo512Path, 'utf8');
      if (logo512Data.startsWith('data:')) {
        dataURLToFile(logo512Data, logo512Path);
      }
    } else {
      console.error('logo512.png not found');
    }
    
    console.log('Icon conversion completed');
  } catch (error) {
    console.error(`Error during conversion: ${error.message}`);
  }
}

// Run the conversion
convertIcons(); 
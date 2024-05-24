const fs = require('fs');

// Read the image file
const imageData = fs.readFileSync('C:/Users/HP/OneDrive - Manipal Academy of Higher Education/Desktop/prof.jpg');

// Convert the image data to base64
const base64ImageData = imageData.toString('base64');

console.log(base64ImageData);

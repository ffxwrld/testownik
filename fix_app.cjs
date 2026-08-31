const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix the failed replacement
content = content.replace(
  `if (Object.keys(images).length > 0) {
        const { saveSessionImages } = await import('./utils/db');
        await saveSessionImages(sessionId, images);
      }`,
  `const { saveSessionImages, copySessionImages } = await import('./utils/db');
      if (sourceSessionId && existingImages.length > 0) {
         await copySessionImages(sourceSessionId, sessionId, existingImages);
      }
      if (Object.keys(newImages).length > 0) {
        await saveSessionImages(sessionId, newImages);
      }`
);

// If it didn't match perfectly, let's just regex it
content = content.replace(
  /if\s*\(\s*Object\.keys\(images\)\.length\s*>\s*0\s*\)\s*\{\s*const\s*\{\s*saveSessionImages\s*\}\s*=\s*await\s*import\('\.\/utils\/db'\);\s*await\s*saveSessionImages\(sessionId,\s*images\);\s*\}/s,
  `const { saveSessionImages, copySessionImages } = await import('./utils/db');
      if (sourceSessionId && existingImages.length > 0) {
         await copySessionImages(sourceSessionId, sessionId, existingImages);
      }
      if (Object.keys(newImages).length > 0) {
        await saveSessionImages(sessionId, newImages);
      }`
);

// There's another error:
// src/App.tsx(171,73): error TS6133: 'images' is declared but its value is never read.
// src/App.tsx(176,11): error TS2304: Cannot find name 'sourceSessionId'.
// Wait, is handleSaveToTestownik defined TWICE?

fs.writeFileSync('src/App.tsx', content);

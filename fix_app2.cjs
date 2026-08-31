const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const badStartSession = `  const handleStartSession = useCallback(
    async (questions: Question[], repeatMode: number, baseName: string, images: Record<string, Blob> = {}) => {
      const newSession = buildInitialSession(questions, repeatMode, baseName);
      const sessionId = await saveSession(newSession);
      
      const { saveSessionImages, copySessionImages } = await import('./utils/db');
      if (sourceSessionId && existingImages.length > 0) {
         await copySessionImages(sourceSessionId, sessionId, existingImages);
      }
      if (Object.keys(newImages).length > 0) {
        await saveSessionImages(sessionId, newImages);
      }`;

const goodStartSession = `  const handleStartSession = useCallback(
    async (questions: Question[], repeatMode: number, baseName: string, images: Record<string, Blob> = {}) => {
      const newSession = buildInitialSession(questions, repeatMode, baseName);
      const sessionId = await saveSession(newSession);
      
      if (Object.keys(images).length > 0) {
        const { saveSessionImages } = await import('./utils/db');
        await saveSessionImages(sessionId, images);
      }`;

content = content.replace(badStartSession, goodStartSession);
fs.writeFileSync('src/App.tsx', content);

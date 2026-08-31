const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `const { getAllSessionImages } = await import('./utils/db');
    const images = await getAllSessionImages(sessionId);
    
    setCreatorInitialQuestions(editingQuestions);
    setCreatorInitialBaseName(saved.baseName);
    setCreatorInitialImages(images);`,
  `const { getSessionImageNames } = await import('./utils/db');
    const imageNames = await getSessionImageNames(sessionId);
    
    setCreatorInitialQuestions(editingQuestions);
    setCreatorInitialBaseName(saved.baseName);
    setCreatorInitialImages(imageNames as any);
    setCreatorSourceSessionId(sessionId);` // Need to add setCreatorSourceSessionId
);

content = content.replace(
  `const [creatorInitialImages, setCreatorInitialImages] = useState<Record<string, Blob> | null>(null);`,
  `const [creatorInitialImages, setCreatorInitialImages] = useState<string[] | null>(null);
  const [creatorSourceSessionId, setCreatorSourceSessionId] = useState<string | null>(null);`
);

// We also need to fix `setCreatorInitialImages(null)` wherever it occurs
content = content.replace(/setCreatorInitialImages\(null\);/g, 'setCreatorInitialImages(null);\n                setCreatorSourceSessionId(null);');

// Handle Save To Testownik
content = content.replace(
  `const handleSaveToTestownik = useCallback(async (editingQuestions: EditingQuestion[], baseName: string, images: Record<string, Blob> = {}) => {`,
  `const handleSaveToTestownik = useCallback(async (editingQuestions: EditingQuestion[], baseName: string, newImages: Record<string, Blob> = {}, existingImages: string[] = [], sourceSessionId?: string) => {`
);

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

content = content.replace(
  `initialImages={creatorInitialImages || undefined}`,
  `initialImageNames={creatorInitialImages || undefined} sourceSessionId={creatorSourceSessionId || undefined}`
);

fs.writeFileSync('src/App.tsx', content);

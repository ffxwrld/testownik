const fs = require('fs');
let content = fs.readFileSync('src/components/CreatorView.tsx', 'utf8');

// Update Props
content = content.replace(
  `initialImages?: Record<string, Blob>;
  onSaveToTestownik: (questions: EditingQuestion[], baseName: string, images: Record<string, Blob>) => void;`,
  `initialImageNames?: string[];
  sourceSessionId?: string;
  onSaveToTestownik: (questions: EditingQuestion[], baseName: string, newImages: Record<string, Blob>, existingImages: string[], sourceSessionId?: string) => void;`
);

// Component arguments
content = content.replace(
  `onQuit, initialQuestions, initialBaseName, initialImages, onSaveToTestownik`,
  `onQuit, initialQuestions, initialBaseName, initialImageNames, sourceSessionId, onSaveToTestownik`
);

// Engine call
content = content.replace(
  `const engine = useCreatorEngine(
    initialQuestions, initialBaseName, initialImages
  );`,
  `const engine = useCreatorEngine(
    initialQuestions, initialBaseName, initialImageNames, sourceSessionId
  );`
);

// Fix CreatorHeader save call
content = content.replace(
  `onSaveToTestownik={onSaveToTestownik}`,
  `onSaveToTestownik={(q, b, i) => onSaveToTestownik(q, b, i, Array.from(engine.existingImages), engine.sourceSessionId)}`
);

fs.writeFileSync('src/components/CreatorView.tsx', content);

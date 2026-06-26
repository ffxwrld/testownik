import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('/Users/fifi/Documents/TESTOWNIK-app2/src', (filepath) => {
  if (filepath.endsWith('.tsx') || filepath.endsWith('.ts') || filepath.endsWith('.css')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let newContent = content.replace(/(bg|text|border|ring|shadow|from|to|fill|stroke)-blue-([0-9]{2,3}(\/[0-9]+)?)/g, '$1-primary-$2');
    
    // Also handle specific hex or raw blue mentions if any, but let's stick to tailwind classes
    // In index.css: `outline: 2px solid #3b82f6;` -> primary-500
    if (filepath.endsWith('index.css')) {
      newContent = newContent.replace('#3b82f6', 'var(--theme-500)');
    }

    if (content !== newContent) {
      fs.writeFileSync(filepath, newContent, 'utf8');
      console.log('Updated', filepath);
    }
  }
});

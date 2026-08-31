const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const fallback = `<Suspense fallback={<div className="flex-1 flex items-center justify-center p-8"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>}>`;

content = content.replace(
  '<AnimatePresence mode="wait">',
  fallback + '\n            <AnimatePresence mode="wait">'
);

// We need to find the matching </AnimatePresence> inside MainLayout.
content = content.replace(
  '</AnimatePresence>\n          </MainLayout>',
  '</AnimatePresence>\n            </Suspense>\n          </MainLayout>'
);

fs.writeFileSync('src/App.tsx', content);

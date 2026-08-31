const fs = require('fs');

let content = fs.readFileSync('src/components/SummaryView.tsx', 'utf8');

content = content.replace(
  `className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-zinc-200 dark:border-zinc-800"
              onClick={e => e.stopPropagation()}`,
  `role="dialog"
              aria-modal="true"
              aria-labelledby="beer-title"
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-zinc-200 dark:border-zinc-800"
              onClick={e => e.stopPropagation()}`
);

content = content.replace(
  `<h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">`,
  `<h3 id="beer-title" className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">`
);

content = content.replace(
  `<Button onClick={() => setShowBeerModal(false)} variant="primary" className="w-full">`,
  `<Button onClick={() => setShowBeerModal(false)} variant="primary" className="w-full" autoFocus>`
);

fs.writeFileSync('src/components/SummaryView.tsx', content);

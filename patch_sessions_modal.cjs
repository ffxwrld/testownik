const fs = require('fs');

let content = fs.readFileSync('src/components/SessionsList.tsx', 'utf8');

content = content.replace(
  `className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}`,
  `role="dialog"
            aria-modal="true"
            aria-labelledby="restart-title"
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}`
);

content = content.replace(
  `<h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">`,
  `<h3 id="restart-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">`
);

content = content.replace(
  `<Button
                variant="ghost"
                className="flex-1"
                onClick={() => setRestartingId(null)}
              >`,
  `<Button
                variant="ghost"
                className="flex-1"
                onClick={() => setRestartingId(null)}
                autoFocus
              >`
);

fs.writeFileSync('src/components/SessionsList.tsx', content);

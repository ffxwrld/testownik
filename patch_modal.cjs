const fs = require('fs');

let content = fs.readFileSync('src/components/FormatInfoModal.tsx', 'utf8');

content = content.replace(
  `className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}`,
  `role="dialog"
        aria-modal="true"
        aria-labelledby="format-info-title"
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}`
);

content = content.replace(
  `<h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">`,
  `<h2 id="format-info-title" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">`
);

content = content.replace(
  `<Button variant="primary" onClick={onClose}>`,
  `<Button variant="primary" onClick={onClose} autoFocus>`
);

fs.writeFileSync('src/components/FormatInfoModal.tsx', content);

const fs = require('fs');

let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// Import Link
content = content.replace(
  "import { useLocation } from 'wouter';",
  "import { useLocation, Link } from 'wouter';"
);

// Replace button onClick with Link
content = content.replace(
  /<button\s*\n\s*onClick=\{\(\) => setLocation\('\/nauka'\)\}\n\s*className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition"\n\s*>\n\s*Pokaż wszystkie\n\s*<\/button>/g,
  `<Link href="/nauka" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition">\n                Pokaż wszystkie\n              </Link>`
);

content = content.replace(
  /<button\s*\n\s*onClick=\{\(\) => setLocation\('\/nauka'\)\}\n\s*className="mt-3 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"\n\s*>\n\s*Przejdź do nauki\n\s*<\/button>/g,
  `<Link href="/nauka" className="mt-3 inline-block text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">\n                    Przejdź do nauki\n                  </Link>`
);

content = content.replace(
  /<button\s*\n\s*onClick=\{\(\) => setLocation\('\/ranking'\)\}\n\s*className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition"\n\s*>\n\s*Pełny ranking\n\s*<\/button>/g,
  `<Link href="/ranking" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition">\n                  Pełny ranking\n                </Link>`
);

// Replace motion.div with motion.button for sessions
content = content.replace(
  /<motion\.div\s*\n\s*variants=\{itemVariants\}\n\s*key=\{session\.id\}\n\s*className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors rounded-xl overflow-hidden flex flex-col group cursor-pointer shadow-sm hover:shadow-md"\n\s*onClick=\{\(\) => onStartSession\(session\.id\)\}\n\s*>/g,
  `<motion.button type="button"\n                      variants={itemVariants}\n                      key={session.id}\n                      className="text-left w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors rounded-xl overflow-hidden flex flex-col group cursor-pointer shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"\n                      onClick={() => onStartSession(session.id)}\n                    >`
);

// Close tag
content = content.replace(
  /<\/div>\n\s*<\/motion\.div>/g,
  `</div>\n                    </motion.button>`
);

// Fix gradient
content = content.replace(
  `className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"`,
  `className="h-full bg-primary-500 rounded-full"`
);

fs.writeFileSync('src/components/DashboardView.tsx', content);

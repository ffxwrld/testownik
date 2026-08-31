const fs = require('fs');

let content = fs.readFileSync('src/components/LearnView.tsx', 'utf8');

const targetDiv = `<div
                        key={opt.value}
                        onClick={() => setRepeatMode(opt.value)}
                        className={\`p-4 rounded-xl border-2 text-left transition cursor-pointer flex items-center gap-4 \${`;

const newButton = `<button type="button"
                        key={opt.value}
                        onClick={() => setRepeatMode(opt.value)}
                        className={\`w-full p-4 rounded-xl border-2 text-left transition cursor-pointer flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 \${`;

content = content.replace(targetDiv, newButton);

const closeDiv = `</div>
                    ))}
                  </div>`;
                  
const closeButton = `</button>
                    ))}
                  </div>`;
                  
content = content.replace(closeDiv, closeButton);
fs.writeFileSync('src/components/LearnView.tsx', content);

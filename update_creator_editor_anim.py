with open('src/components/creator/CreatorEditor.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-6 lg:p-10 relative">\n      <div className="max-w-4xl mx-auto space-y-8 pb-32">',
    '    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-6 lg:p-10 relative">\n      <AnimatePresence mode="wait">\n        <motion.div\n          key={activeQuestion.id}\n          initial={{ opacity: 0, filter: "blur(4px)" }}\n          animate={{ opacity: 1, filter: "blur(0px)" }}\n          exit={{ opacity: 0, filter: "blur(4px)" }}\n          transition={{ duration: 0.15, ease: "easeOut" }}\n          className="max-w-4xl mx-auto space-y-8 pb-32"\n        >'
)

content = content.replace(
    '        </div>\n      </div>\n    </div>\n  );\n};',
    '        </div>\n        </motion.div>\n      </AnimatePresence>\n    </div>\n  );\n};'
)

with open('src/components/creator/CreatorEditor.tsx', 'w') as f:
    f.write(content)

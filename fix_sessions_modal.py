import re

with open('src/components/SessionsList.tsx', 'r') as f:
    content = f.read()

# Add createPortal import
if "createPortal" not in content:
    content = content.replace("import { useState, useMemo } from 'react';", "import { useState, useMemo } from 'react';\nimport { createPortal } from 'react-dom';")

# Find the modal block
modal_start = """      {restartingId && ("""
modal_end = """        </div>
      )}"""

# We need to wrap the JSX inside createPortal(JSX, document.body)
def repl(match):
    inner = match.group(1)
    return "      {restartingId && createPortal(\n" + inner + "\n      , document.body)}"

pattern = re.compile(r'      \{restartingId && \((.*?)\n      \)\}', re.DOTALL)
content = pattern.sub(repl, content)

with open('src/components/SessionsList.tsx', 'w') as f:
    f.write(content)

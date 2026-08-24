import re

with open('src/components/TestView.tsx', 'r') as f:
    content = f.read()

# 1. Add createPortal to imports
if "createPortal" not in content:
    content = content.replace("import { useEffect, useRef, useState, useCallback, FC, ReactNode, Fragment } from 'react';", "import { useEffect, useRef, useState, useCallback, FC, ReactNode, Fragment } from 'react';\nimport { createPortal } from 'react-dom';")

# 2. Fix the showingPrevious modal with createPortal
modal_pattern = r'      \{showingPrevious && previousQuestion && \((.*?)\n      \)\}'
def modal_repl(m):
    return "      {showingPrevious && previousQuestion && createPortal(\n" + m.group(1) + "\n      , document.body)}"
content = re.sub(modal_pattern, modal_repl, content, flags=re.DOTALL)

# 3. Change Layout from Two Column to Single Column Max-W-2xl
# Before: <div className="w-full max-w-5xl mx-auto flex gap-6 items-stretch">
# After: <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 pb-32">
content = content.replace('<div className="w-full max-w-5xl mx-auto flex gap-6 items-stretch">', '<div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-32 relative">')

# 4. Remove right sidebar wrapper and move its contents to floating bar
# Right sidebar is roughly: <div className="w-52 flex-shrink-0 flex flex-col justify-center gap-3">
# We will just replace it with a fixed bottom bar.
sidebar_start = r'          \{/\* ── Right sidebar: actions ────────────────────────────────────────── \*/\}\n          <div className="w-52 flex-shrink-0 flex flex-col justify-center gap-3">'
sidebar_end_str = "          </div>\n\n        </div>"

# Actually it's easier to just parse the whole file and rewrite it, but we can do it via a more robust script or just use my IDE abilities.

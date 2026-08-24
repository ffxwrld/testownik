import re

# 1. Export types from CreatorView so App.tsx is happy
with open('src/components/CreatorView.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    "import { useCreatorEngine, EditingQuestion } from '../hooks/useCreatorEngine';",
    "import { useCreatorEngine, EditingQuestion, EditingAnswer } from '../hooks/useCreatorEngine';\nexport type { EditingQuestion, EditingAnswer };"
)
# Fix engine.activeImageUrl type issue by casting or asserting in CreatorView
content = content.replace("activeImageUrl={engine.activeImageUrl}", "activeImageUrl={engine.activeImageUrl || null}")
with open('src/components/CreatorView.tsx', 'w') as f:
    f.write(content)

# 2. Fix App.tsx imports if needed
with open('src/App.tsx', 'r') as f:
    app_content = f.read()
# Replace import just in case
app_content = app_content.replace(
    "import { CreatorView, EditingQuestion, EditingAnswer } from './components/CreatorView';",
    "import { CreatorView, type EditingQuestion, type EditingAnswer } from './components/CreatorView';"
)
with open('src/App.tsx', 'w') as f:
    f.write(app_content)


# 3. Clean up useCreatorEngine unused imports
with open('src/hooks/useCreatorEngine.ts', 'r') as f:
    engine = f.read()
engine = engine.replace("import { useState, useRef, useEffect, useMemo, ChangeEvent } from 'react';", "import { useState, useEffect, useMemo } from 'react';")
engine = engine.replace("import JSZip from 'jszip';\nimport { decodeFileContent } from '../utils/parser';\n", "")
# Fix onSaveToTestownik unused var: either use it or remove it. We don't use it in hook.
engine = engine.replace("onSaveToTestownik?: (questions: EditingQuestion[], baseName: string, images: Record<string, Blob>) => void", "")
# Since we removed the parameter, we must adjust the arguments
engine = engine.replace("(initialQuestions?, initialBaseName?, initialImages?)", "(initialQuestions?: EditingQuestion[], initialBaseName?: string, initialImages?: Record<string, Blob>)")

with open('src/hooks/useCreatorEngine.ts', 'w') as f:
    f.write(engine)

# 4. Clean up CreatorSidebar MouseEvent
with open('src/components/creator/CreatorSidebar.tsx', 'r') as f:
    sidebar = f.read()
sidebar = sidebar.replace("import { FC, MouseEvent } from 'react';", "import { FC } from 'react';")
with open('src/components/creator/CreatorSidebar.tsx', 'w') as f:
    f.write(sidebar)

# 5. Clean up CreatorEditor activeImageKey unused
with open('src/components/creator/CreatorEditor.tsx', 'r') as f:
    editor = f.read()
editor = editor.replace("activeImageKey, activeImageUrl,", "activeImageUrl,")
editor = editor.replace("activeImageKey: string | null;\n", "")
with open('src/components/creator/CreatorEditor.tsx', 'w') as f:
    f.write(editor)


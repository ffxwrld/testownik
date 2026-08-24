with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("type EditingAnswer } from './components/CreatorView';", "} from './components/CreatorView';")
content = content.replace("import { useState, useEffect, useCallback, FC } from 'react';", "import { useState, useEffect, useCallback, FC } from 'react';\nimport { mapQuestionsToEditingFormat, mapEditingFormatToQuestions } from './utils/adapters';")

with open('src/App.tsx', 'w') as f:
    f.write(content)

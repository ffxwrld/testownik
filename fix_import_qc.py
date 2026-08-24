with open('src/components/test-view/QuestionCard.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { FC, Fragment } from 'react';", "import { FC } from 'react';")

with open('src/components/test-view/QuestionCard.tsx', 'w') as f:
    f.write(content)

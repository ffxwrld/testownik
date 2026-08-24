with open('src/components/HomeView.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useTranslation } from 'react-i18next';\nimport { motion } from 'framer-motion';", "import { useTranslation } from 'react-i18next';")

with open('src/components/HomeView.tsx', 'w') as f:
    f.write(content)

with open('src/components/CreatorView.tsx', 'r') as f:
    content = f.read()

# Fix the messy useState injection
content = content.replace("import { useState } from 'react';\nexport const CreatorView", "export const CreatorView")
content = content.replace("import { FC, useEffect } from 'react';", "import { FC, useEffect, useState } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';")

with open('src/components/CreatorView.tsx', 'w') as f:
    f.write(content)

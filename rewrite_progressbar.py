import re

with open('src/components/ui/ProgressBar.tsx', 'r') as f:
    content = f.read()

# Add motion import
content = content.replace("import { cn } from '../../utils/cn';", "import { cn } from '../../utils/cn';\nimport { motion } from 'framer-motion';")

# Replace inner div with motion.div and spring physics
old_bar = r"""<div
          className={cn\(
            'h-full rounded-full transition-all duration-500',
            colors\[color\],
            animated && 'ease-out'
          \)}
          style={{ width: `\$\{clamped\}%` }}
        />"""

new_bar = """<motion.div
          className={cn(
            'h-full rounded-full',
            colors[color]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{
            type: 'spring',
            stiffness: 120,
            damping: 18,
            mass: 0.9,
            restDelta: 0.001
          }}
        />"""

content = re.sub(old_bar, new_bar, content, flags=re.DOTALL)

with open('src/components/ui/ProgressBar.tsx', 'w') as f:
    f.write(content)

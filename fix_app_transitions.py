with open('src/App.tsx', 'r') as f:
    content = f.read()

old_variants = """  const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  };

  const pageTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8
  };"""

new_variants = """  const pageVariants = {
    initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
  };

  const pageTransition = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8
  };"""

content = content.replace(old_variants, new_variants)
with open('src/App.tsx', 'w') as f:
    f.write(content)

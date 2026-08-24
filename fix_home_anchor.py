with open('src/components/HomeView.tsx', 'r') as f:
    content = f.read()

old_layout = """    <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-6">"""
new_layout = """    <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex flex-col items-center justify-start pt-12 md:pt-24 p-6 overflow-y-auto">"""

content = content.replace(old_layout, new_layout)
with open('src/components/HomeView.tsx', 'w') as f:
    f.write(content)

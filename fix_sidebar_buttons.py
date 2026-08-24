with open('src/components/creator/CreatorSidebar.tsx', 'r') as f:
    content = f.read()

# 1. Increase right padding for text container
content = content.replace('className="flex-1 min-w-0 pr-6 flex flex-col justify-center min-h-[24px]"', 'className="flex-1 min-w-0 pr-14 flex flex-col justify-center min-h-[24px]"')

# 2. Change absolute container from flex-col top-2 to flex-row vertically centered
old_actions = """            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">"""
new_actions = """            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">"""
content = content.replace(old_actions, new_actions)

with open('src/components/creator/CreatorSidebar.tsx', 'w') as f:
    f.write(content)

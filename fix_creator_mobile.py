with open('src/components/CreatorView.tsx', 'r') as f:
    content = f.read()

# Change flex to flex-col md:flex-row
content = content.replace('<main className="flex-1 flex overflow-hidden">', '<main className="flex-1 flex flex-col md:flex-row overflow-hidden">')

with open('src/components/CreatorView.tsx', 'w') as f:
    f.write(content)

with open('src/components/creator/CreatorSidebar.tsx', 'r') as f:
    sidebar = f.read()

# Change w-80 to w-full md:w-80, border-r to border-b md:border-b-0 md:border-r, height to h-1/3 md:h-full
old_sidebar_container = '<aside className="w-80 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col h-full overflow-hidden">'
new_sidebar_container = '<aside className="w-full md:w-80 h-[35%] md:h-full flex-shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col overflow-hidden">'
sidebar = sidebar.replace(old_sidebar_container, new_sidebar_container)

with open('src/components/creator/CreatorSidebar.tsx', 'w') as f:
    f.write(sidebar)

with open('src/components/creator/CreatorHeader.tsx', 'r') as f:
    header = f.read()

# Hide text on save button on small screens to save space
header = header.replace("{t('creator.saveToTestownik')}", "<span className=\"hidden sm:inline\">{t('creator.saveToTestownik')}</span><span className=\"sm:hidden\">Zapisz</span>")
header = header.replace("{t('creator.title')}", "<span className=\"hidden sm:inline\">{t('creator.title')}</span><span className=\"sm:hidden\">Kreator</span>")

with open('src/components/creator/CreatorHeader.tsx', 'w') as f:
    f.write(header)

with open('src/components/HomeView.tsx', 'r') as f:
    home = f.read()

# Make tabs horizontally scrollable on tiny screens
home = home.replace('<div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700">', '<div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700 overflow-x-auto hide-scrollbar">')
home = home.replace('px-4 py-3', 'px-3 sm:px-4 py-3')

with open('src/components/HomeView.tsx', 'w') as f:
    f.write(home)


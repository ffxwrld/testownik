with open('src/components/creator/CreatorHeader.tsx', 'r') as f:
    header = f.read()

# Add onToggleSidebar prop
header = header.replace(
    "onSaveClick: () => void;\n  questionsCount: number;",
    "onSaveClick: () => void;\n  questionsCount: number;\n  onToggleSidebar?: () => void;"
)
header = header.replace(
    "export const CreatorHeader: FC<CreatorHeaderProps> = ({ onQuit, onSaveClick, questionsCount, baseName, setBaseName }) => {",
    "export const CreatorHeader: FC<CreatorHeaderProps> = ({ onQuit, onSaveClick, questionsCount, baseName, setBaseName, onToggleSidebar }) => {"
)

# Add Hamburger button to header right after back button
hamburger_btn = """
        <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="md:hidden px-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 relative">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </Button>
"""
header = header.replace(
    """<div className="hidden sm:block h-4 w-px bg-zinc-300 dark:bg-zinc-700" />""",
    hamburger_btn + """\n        <div className="hidden sm:block h-4 w-px bg-zinc-300 dark:bg-zinc-700" />"""
)

with open('src/components/creator/CreatorHeader.tsx', 'w') as f:
    f.write(header)

with open('src/components/CreatorView.tsx', 'r') as f:
    view = f.read()

# Remove the massive FAB from CreatorView
import re
fab_regex = re.compile(r'\{\/\* Mobile Toggle Button \(Floating Left\) \*\/\}.*?<\/button>', re.DOTALL)
view = fab_regex.sub('', view)

# Pass onToggleSidebar to CreatorHeader
view = view.replace(
    "setBaseName={engine.setSavePromptName}\n      />",
    "setBaseName={engine.setSavePromptName}\n        onToggleSidebar={() => setIsMobileSidebarOpen(true)}\n      />"
)

with open('src/components/CreatorView.tsx', 'w') as f:
    f.write(view)

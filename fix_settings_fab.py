with open('src/App.tsx', 'r') as f:
    app_content = f.read()

# 1. Remove the floating Settings FAB from App.tsx
import re
fab_regex = re.compile(r'\{\/\* Mobile Settings FAB \*\/\}.*?<\/button>', re.DOTALL)
app_content = fab_regex.sub('', app_content)

# 2. Add onOpenSettings to HomeView, TestView, CreatorView
app_content = app_content.replace(
    "<HomeView\n",
    "<HomeView\n          onOpenSettings={() => setShowMobileSettings(true)}\n"
)
app_content = app_content.replace(
    "<TestView\n",
    "<TestView\n          onOpenSettings={() => setShowMobileSettings(true)}\n"
)

with open('src/App.tsx', 'w') as f:
    f.write(app_content)

# 3. Add Settings button to HomeView
with open('src/components/HomeView.tsx', 'r') as f:
    home_content = f.read()

home_content = home_content.replace(
    "interface HomeViewProps {",
    "interface HomeViewProps {\n  onOpenSettings?: () => void;"
)
home_content = home_content.replace(
    "export const HomeView: FC<HomeViewProps> = ({",
    "export const HomeView: FC<HomeViewProps> = ({\n  onOpenSettings,"
)

settings_btn = """
      {/* Mobile Settings Button */}
      <button 
        onClick={onOpenSettings}
        className="md:hidden absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-full shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
"""

home_content = home_content.replace(
    """<div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex flex-col items-center justify-start pt-12 md:pt-24 p-6 overflow-y-auto">""",
    """<div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex flex-col items-center justify-start pt-12 md:pt-24 p-6 overflow-y-auto relative">""" + settings_btn
)

with open('src/components/HomeView.tsx', 'w') as f:
    f.write(home_content)

# 4. Add Settings button to TestHeader
with open('src/components/test-view/TestHeader.tsx', 'r') as f:
    test_header = f.read()

test_header = test_header.replace(
    "interface TestHeaderProps {",
    "interface TestHeaderProps {\n  onOpenSettings?: () => void;"
)
test_header = test_header.replace(
    "export const TestHeader: FC<TestHeaderProps> = ({",
    "export const TestHeader: FC<TestHeaderProps> = ({\n  onOpenSettings,"
)

test_settings_btn = """
          <div className="flex items-center gap-4">
            <button 
              onClick={onOpenSettings}
              className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
"""

test_header = test_header.replace(
    """          <div className="flex items-center gap-4">""",
    test_settings_btn
)

with open('src/components/test-view/TestHeader.tsx', 'w') as f:
    f.write(test_header)


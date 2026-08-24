import re

# 1. Update CreatorSidebar.tsx classes
with open('src/components/creator/CreatorSidebar.tsx', 'r') as f:
    sidebar_content = f.read()

old_aside = 'className="w-full md:w-80 h-[35%] md:h-full flex-shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col overflow-hidden"'
new_aside = 'className="w-full h-full flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col overflow-hidden"'
sidebar_content = sidebar_content.replace(old_aside, new_aside)

# To automatically close the sidebar on mobile when a question is clicked, we need to pass a callback or do it in CreatorView.
# Better to do it in CreatorView if we intercept setActiveId, but let's just leave it manual or pass it.
# Let's pass `onMobileClose?: () => void` to CreatorSidebar, and call it on click.
if "onMobileClose?: () => void;" not in sidebar_content:
    sidebar_content = sidebar_content.replace(
        "handleDuplicateQuestion: (id: string) => void;\n}",
        "handleDuplicateQuestion: (id: string) => void;\n  onMobileClose?: () => void;\n}"
    )
    sidebar_content = sidebar_content.replace(
        "handleAddQuestion, handleDeleteQuestion, handleDuplicateQuestion\n})",
        "handleAddQuestion, handleDeleteQuestion, handleDuplicateQuestion, onMobileClose\n})"
    )
    # inside SidebarItem onClick, we call setActiveId. 
    # Wait, SidebarItem takes onClick prop which is setActiveId.
    # In CreatorSidebar, we pass onClick={(id) => { setActiveId(id); onMobileClose?.(); }}
    sidebar_content = sidebar_content.replace(
        "onClick={setActiveId}",
        "onClick={(id) => { setActiveId(id); onMobileClose?.(); }}"
    )

with open('src/components/creator/CreatorSidebar.tsx', 'w') as f:
    f.write(sidebar_content)


# 2. Update CreatorView.tsx
with open('src/components/CreatorView.tsx', 'r') as f:
    view_content = f.read()

if "const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);" not in view_content:
    view_content = view_content.replace("export const CreatorView: FC<CreatorViewProps> = ({ ", "import { useState } from 'react';\nexport const CreatorView: FC<CreatorViewProps> = ({ ")
    view_content = view_content.replace("const { t } = useTranslation();", "const { t } = useTranslation();\n  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);")

old_main = """      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <CreatorSidebar 
          questions={engine.questions}
          activeId={engine.activeId}
          setActiveId={engine.setActiveId}
          searchQuery={engine.searchQuery}
          setSearchQuery={engine.setSearchQuery}
          handleAddQuestion={engine.handleAddQuestion}
          handleDeleteQuestion={engine.handleDeleteQuestion}
          handleDuplicateQuestion={engine.handleDuplicateQuestion}
        />
        
        <CreatorEditor"""

new_main = """      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
              onClick={() => setIsMobileSidebarOpen(false)} 
            />
          )}
        </AnimatePresence>

        {/* Sidebar Container */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white dark:bg-zinc-950 shadow-2xl transition-transform duration-300 ease-out flex flex-col
          md:relative md:flex md:w-80 md:h-full md:border-r md:border-zinc-200 md:dark:border-zinc-800 md:shadow-none md:translate-x-0
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <h2 className="font-bold text-zinc-800 dark:text-zinc-200">Lista pytań ({engine.questions.length})</h2>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <CreatorSidebar 
            questions={engine.questions}
            activeId={engine.activeId}
            setActiveId={engine.setActiveId}
            searchQuery={engine.searchQuery}
            setSearchQuery={engine.setSearchQuery}
            handleAddQuestion={engine.handleAddQuestion}
            handleDeleteQuestion={engine.handleDeleteQuestion}
            handleDuplicateQuestion={engine.handleDuplicateQuestion}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
        </div>
        
        {/* Mobile Toggle Button (Floating Left) */}
        <button 
           onClick={() => setIsMobileSidebarOpen(true)}
           className="md:hidden fixed bottom-6 left-6 w-14 h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full shadow-2xl border border-zinc-800 dark:border-zinc-200 flex items-center justify-center z-30 transition-transform active:scale-95"
        >
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
           </svg>
           <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
             {engine.questions.length}
           </div>
        </button>

        <CreatorEditor"""

view_content = view_content.replace(old_main, new_main)

# Add framer-motion import if needed
if "AnimatePresence" not in view_content:
    view_content = view_content.replace("import { motion }", "import { motion, AnimatePresence }")

with open('src/components/CreatorView.tsx', 'w') as f:
    f.write(view_content)


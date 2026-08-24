import re

with open('src/components/TestView.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
import_lucide = "import { Check, X, SkipForward, ArrowLeft, LogOut, Clock, Layers, AlertCircle, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';\nimport { motion, AnimatePresence } from 'framer-motion';\n"
content = content.replace("import { ProgressBar }", import_lucide + "import { ProgressBar }")

# 2. Loader
loader_svg = r'<svg.*?animate-spin.*?>.*?</svg>'
content = re.sub(loader_svg, '<Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />', content, flags=re.DOTALL)

# 3. Quit
quit_svg = r'<svg[^>]*?className="w-4 h-4"[^>]*?fill="none".*?>\s*<path[^>]*?d="M15\.75 9V5\.25A2\.25 2\.25 0 0013\.5 3h-6a2\.25.*?</svg>'
content = re.sub(quit_svg, '<LogOut className="w-4 h-4" />', content, flags=re.DOTALL)

# 4. Timer
timer_svg = r'<svg[^>]*?className="w-3\.5 h-3\.5 text-zinc-500.*?>.*?</svg>'
content = re.sub(timer_svg, '<Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />', content, flags=re.DOTALL)

# 5. Multi correct badge
multi_badge_svg = r'<svg className="w-3 h-3"[^>]*?>\s*<path[^>]*?d="M4\.5 12\.75l6 6 9-13\.5"[^>]*?>\s*</svg>'
content = re.sub(multi_badge_svg, '<Layers className="w-3 h-3" />', content, flags=re.DOTALL)

# 6. Errors Badge SVG
error_badge_svg = r'<svg[^>]*?className="w-3 h-3"[^>]*?>\s*<path[^>]*?d="M12 9v3\.75m9-\.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3\.75h\.008v\.008H12v-\.008z"[^>]*?>\s*</svg>'
content = re.sub(error_badge_svg, '<AlertCircle className="w-3 h-3" />', content, flags=re.DOTALL)

# 7. FileText SVG
file_svg = r'<svg[^>]*?className="w-3 h-3"[^>]*?>\s*<path[^>]*?d="M19\.5 14\.25v-2\.625a3\.375.*?</svg>'
content = re.sub(file_svg, '<FileText className="w-3 h-3" />', content, flags=re.DOTALL)

# 8. CheckCircle2 SVG
check_circle_svg = r'<svg[^>]*?className="w-5 h-5 flex-shrink-0"[^>]*?>\s*<path[^>]*?d="M9 12\.75L11\.25 15 15 9\.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"[^>]*?>\s*</svg>'
content = re.sub(check_circle_svg, '<CheckCircle2 className="w-5 h-5 flex-shrink-0" />', content, flags=re.DOTALL)

# 9. Skip SVG
skip_svg = r'<svg className="w-5 h-5 flex-shrink-0"[^>]*?>\s*<path[^>]*?d="M13\.5 4\.5L21 12m0 0l-7\.5 7\.5M21 12H3"[^>]*?>\s*</svg>'
content = re.sub(skip_svg, '<SkipForward className="w-5 h-5 flex-shrink-0" />', content, flags=re.DOTALL)

# 10. XCircle SVG
x_circle_svg = r'<svg[^>]*?className="w-5 h-5 flex-shrink-0"[^>]*?>\s*<path[^>]*?d="M9\.75 9\.75l4\.5 4\.5m0-4\.5l-4\.5 4\.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"[^>]*?>\s*</svg>'
content = re.sub(x_circle_svg, '<XCircle className="w-5 h-5 flex-shrink-0" />', content, flags=re.DOTALL)

# 11. ArrowLeft SVG
arrow_left_svg = r'<svg className="w-4 h-4[^>]*?"[^>]*?>\s*<path[^>]*?d="M10\.5 19\.5L3 12m0 0l7\.5-7\.5M3 12h18"[^>]*?>\s*</svg>'
content = re.sub(arrow_left_svg, '<ArrowLeft className="w-4 h-4 flex-shrink-0" />', content, flags=re.DOTALL)

# 12. Check SVG (in buttons and badges)
check_svg = r'<svg className="w-4 h-4 text-white"[^>]*?>\s*<path[^>]*?d="M4\.5 12\.75l6 6 9-13\.5"[^>]*?>\s*</svg>'
content = re.sub(check_svg, '<Check className="w-4 h-4 text-white" />', content, flags=re.DOTALL)

check_w5_svg = r'<svg className="w-5 h-5"[^>]*?>\s*<path[^>]*?d="M4\.5 12\.75l6 6 9-13\.5"[^>]*?>\s*</svg>'
content = re.sub(check_w5_svg, '<Check className="w-5 h-5" />', content, flags=re.DOTALL)

# 13. X SVG (in red badge)
x_svg = r'<svg className="w-4 h-4 text-white"[^>]*?>\s*<path[^>]*?d="M6 18L18 6M6 6l12 12"[^>]*?>\s*</svg>'
content = re.sub(x_svg, '<X className="w-4 h-4 text-white" />', content, flags=re.DOTALL)

# 14. Skip button SVG
skip_w5_svg = r'<svg className="w-5 h-5"[^>]*?>\s*<path[^>]*?d="M13\.5 4\.5L21 12m0 0l-7\.5 7\.5M21 12H3"[^>]*?>\s*</svg>'
content = re.sub(skip_w5_svg, '<SkipForward className="w-5 h-5" />', content, flags=re.DOTALL)

# Animations: Framer motion replacement
# Card wrapper
card_replacement = """<AnimatePresence mode="wait">
              <motion.div
                key={`q-${questionKey}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="w-full"
              >
                <Card>"""

content = content.replace('<Card\n              key={`q-${questionKey}`}\n              className="animate-fadeIn"\n            >', card_replacement)
content = content.replace('</Card>\n\n            {/* Feedback banner */}', '</Card>\n              </motion.div>\n            </AnimatePresence>\n\n            {/* Feedback banner */}')

# Feedback banner animation
feedback_banner_start = """<motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                className={`
                  rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-semibold border"""
content = content.replace("""<div
                className={`
                  rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-semibold
                  animate-slideDown border""", feedback_banner_start)
content = content.replace('</span>\n                  </>\n                )}\n              </div>', '</span>\n                  </>\n                )}\n              </motion.div>')

# Answer buttons
answer_button_start = """<motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    key={answer.id}"""
content = content.replace('<button\n                    key={answer.id}', answer_button_start)
content = content.replace('</button>\n                );\n              })}', '</motion.button>\n                );\n              })}')

with open('src/components/TestView.tsx', 'w') as f:
    f.write(content)

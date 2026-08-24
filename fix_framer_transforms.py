import re
import os

files_to_check = [
    'src/components/test-view/QuestionCard.tsx',
    'src/App.tsx',
    'src/components/HomeView.tsx',
    'src/components/SummaryView.tsx'
]

# QuestionCard
with open('src/components/test-view/QuestionCard.tsx', 'r') as f:
    qc = f.read()
qc = qc.replace(
    "initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(8px)' }}",
    "initial={{ opacity: 0, transform: 'translateY(12px) scale(0.98)', filter: 'blur(8px)' }}"
)
qc = qc.replace(
    "animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}",
    "animate={{ opacity: 1, transform: 'translateY(0px) scale(1)', filter: 'blur(0px)' }}"
)
qc = qc.replace(
    "exit={{ opacity: 0, y: -12, scale: 0.98, filter: 'blur(8px)' }}",
    "exit={{ opacity: 0, transform: 'translateY(-12px) scale(0.98)', filter: 'blur(8px)' }}"
)
with open('src/components/test-view/QuestionCard.tsx', 'w') as f:
    f.write(qc)

# App.tsx
with open('src/App.tsx', 'r') as f:
    app = f.read()
app = app.replace(
    "initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' }",
    "initial: { opacity: 0, transform: 'scale(0.98)', filter: 'blur(4px)' }"
)
app = app.replace(
    "animate: { opacity: 1, scale: 1, filter: 'blur(0px)' }",
    "animate: { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }"
)
app = app.replace(
    "exit: { opacity: 0, scale: 0.98, filter: 'blur(4px)' }",
    "exit: { opacity: 0, transform: 'scale(0.98)', filter: 'blur(4px)' }"
)
with open('src/App.tsx', 'w') as f:
    f.write(app)

# HomeView
with open('src/components/HomeView.tsx', 'r') as f:
    hv = f.read()
hv = hv.replace(
    "initial={{ opacity: 0, y: 10 }}",
    "initial={{ opacity: 0, transform: 'translateY(10px)' }}"
)
hv = hv.replace(
    "animate={{ opacity: 1, y: 0 }}",
    "animate={{ opacity: 1, transform: 'translateY(0px)' }}"
)
hv = hv.replace(
    "exit={{ opacity: 0, y: -10 }}",
    "exit={{ opacity: 0, transform: 'translateY(-10px)' }}"
)
with open('src/components/HomeView.tsx', 'w') as f:
    f.write(hv)

# SummaryView
with open('src/components/SummaryView.tsx', 'r') as f:
    sv = f.read()
sv = sv.replace(
    "initial={{ scale: 0.95, y: 10, opacity: 0 }}",
    "initial={{ opacity: 0, transform: 'translateY(10px) scale(0.95)' }}"
)
sv = sv.replace(
    "animate={{ scale: 1, y: 0, opacity: 1 }}",
    "animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}"
)
sv = sv.replace(
    "exit={{ scale: 0.95, y: 10, opacity: 0 }}",
    "exit={{ opacity: 0, transform: 'translateY(10px) scale(0.95)' }}"
)
sv = sv.replace(
    "animate={{ y: [0, -10, 0] }}",
    "animate={{ transform: ['translateY(0px)', 'translateY(-10px)', 'translateY(0px)'] }}"
)
sv = sv.replace(
    'initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}',
    'initial={{ opacity: 0, transform: "translateY(20px)", filter: "blur(4px)" }}'
)
sv = sv.replace(
    'animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}',
    'animate={{ opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" }}'
)

with open('src/components/SummaryView.tsx', 'w') as f:
    f.write(sv)

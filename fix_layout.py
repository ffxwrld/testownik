import re

# Fix TestHeader.tsx
with open('src/components/test-view/TestHeader.tsx', 'r') as f:
    header = f.read()

header = header.replace(
    '<div className="max-w-5xl mx-auto px-4 py-3">',
    '<div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-3">'
)
# And remove the -ml-2 from the quit button to perfectly align the left edge of the icon bounding box with the progress bar / card.
# Actually, the original had -ml-2. Let's keep the -ml-2 for optical alignment of the icon, but it's just 8px.
# I will remove it so it physically perfectly aligns with the card.
header = header.replace(
    'className="group p-2 -ml-2 rounded-xl',
    'className="group p-2 rounded-xl'
)

with open('src/components/test-view/TestHeader.tsx', 'w') as f:
    f.write(header)

# Fix TestView.tsx
with open('src/components/TestView.tsx', 'r') as f:
    view = f.read()

view = view.replace(
    '<main className="flex-1 flex items-start px-4 py-8 pb-16">',
    '<main className="flex-1 flex items-start py-8 pb-16 w-full">'
)

view = view.replace(
    '<div className="w-full max-w-5xl mx-auto flex gap-8 items-center pb-12">',
    '<div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8 items-center pb-12">'
)

with open('src/components/TestView.tsx', 'w') as f:
    f.write(view)

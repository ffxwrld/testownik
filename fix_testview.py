with open('src/components/TestView.tsx', 'r') as f:
    content = f.read()

# Change items-center to items-stretch md:items-start
old_layout = '<div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8 items-center pb-12">'
new_layout = '<div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8 items-stretch md:items-start pb-12">'
content = content.replace(old_layout, new_layout)

with open('src/components/TestView.tsx', 'w') as f:
    f.write(content)

with open('src/components/TestView.tsx', 'r') as f:
    content = f.read()

# Change md:items-start back to md:items-center
old_layout = 'gap-8 items-stretch md:items-start pb-12">'
new_layout = 'gap-8 items-stretch md:items-center pb-12">'
content = content.replace(old_layout, new_layout)

with open('src/components/TestView.tsx', 'w') as f:
    f.write(content)

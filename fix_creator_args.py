with open('src/components/CreatorView.tsx', 'r') as f:
    content = f.read()
content = content.replace("initialImages, onSaveToTestownik", "initialImages")
with open('src/components/CreatorView.tsx', 'w') as f:
    f.write(content)

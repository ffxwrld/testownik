with open('src/components/CreatorView.tsx', 'r') as f:
    content = f.read()

content = content.replace("initialImages \n}) => {", "initialImages, onSaveToTestownik \n}) => {")
content = content.replace("activeImageKey={engine.activeImageKey}\n", "")

with open('src/components/CreatorView.tsx', 'w') as f:
    f.write(content)


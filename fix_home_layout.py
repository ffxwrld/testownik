with open('src/components/HomeView.tsx', 'r') as f:
    content = f.read()

# Replace vertical centering with a top anchor
old_layout = """    <div className="flex-1 overflow-y-auto">
      <div className="min-h-full py-8 flex flex-col justify-center">
        <div className="max-w-xl w-full mx-auto px-4 sm:px-6">"""

new_layout = """    <div className="flex-1 overflow-y-auto">
      <div className="min-h-full pb-12 pt-8 md:pt-16 flex flex-col justify-start">
        <div className="max-w-xl w-full mx-auto px-4 sm:px-6">"""

content = content.replace(old_layout, new_layout)
with open('src/components/HomeView.tsx', 'w') as f:
    f.write(content)

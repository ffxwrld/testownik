with open('src/components/CreatorView.tsx', 'r') as f:
    content = f.read()

old_header = """      <CreatorHeader 
        onQuit={onQuit} 
        onSaveClick={() => engine.setShowSavePrompt(true)} 
        questionsCount={engine.questions.length} 
      />"""

new_header = """      <CreatorHeader 
        onQuit={onQuit} 
        onSaveClick={() => {
          if (engine.savePromptName.trim()) {
            onSaveToTestownik(engine.questions, engine.savePromptName.trim(), engine.images);
          } else {
            engine.setShowSavePrompt(true);
          }
        }} 
        questionsCount={engine.questions.length}
        baseName={engine.savePromptName}
        setBaseName={engine.setSavePromptName}
      />"""

content = content.replace(old_header, new_header)

with open('src/components/CreatorView.tsx', 'w') as f:
    f.write(content)

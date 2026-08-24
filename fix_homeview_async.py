import re

with open('src/components/HomeView.tsx', 'r') as f:
    content = f.read()

old_effect = """  useEffect(() => {
    if (activeTab === 'saved') {
      setSavedSessions(getAllSessionMetadata());
    }
  }, [activeTab]);"""

new_effect = """  useEffect(() => {
    if (activeTab === 'saved') {
      getAllSessionMetadata().then(setSavedSessions);
    }
  }, [activeTab]);"""
content = content.replace(old_effect, new_effect)

# Update handleRenameSession
old_rename = """  const handleRename = (id: string, newName: string) => {
    onRenameSession(id, newName);
    setSavedSessions(getAllSessionMetadata());
  };"""

new_rename = """  const handleRename = async (id: string, newName: string) => {
    await onRenameSession(id, newName);
    setSavedSessions(await getAllSessionMetadata());
  };"""
content = content.replace(old_rename, new_rename)

with open('src/components/HomeView.tsx', 'w') as f:
    f.write(content)

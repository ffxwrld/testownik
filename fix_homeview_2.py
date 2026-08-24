import re

with open('src/components/HomeView.tsx', 'r') as f:
    content = f.read()

# 1. Import SavedSessionMetadata
if "SavedSessionMetadata" not in content[:500]:
    content = content.replace("import { Question } from '../models/types';", "import { Question, SavedSessionMetadata } from '../models/types';")

# 2. Fix handleDeleteAndRefresh
old_del = """  const handleDeleteAndRefresh = (sessionId: string) => {
    onDeleteSession(sessionId);
    setSavedSessions(getAllSessionMetadata());
  };"""

new_del = """  const handleDeleteAndRefresh = async (sessionId: string) => {
    await onDeleteSession(sessionId);
    setSavedSessions(await getAllSessionMetadata());
  };"""
content = content.replace(old_del, new_del)

# 3. Fix onRename
old_rename = """              onRename={(sessionId, newName) => {
                onRenameSession(sessionId, newName);
                setSavedSessions(getAllSessionMetadata());
              }}"""

new_rename = """              onRename={async (sessionId, newName) => {
                await onRenameSession(sessionId, newName);
                setSavedSessions(await getAllSessionMetadata());
              }}"""
content = content.replace(old_rename, new_rename)

with open('src/components/HomeView.tsx', 'w') as f:
    f.write(content)


import re

with open('src/hooks/useTestEngine.ts', 'r') as f:
    content = f.read()

# Replace saveSession calls with catch
content = content.replace("saveSession(updated, sessionId);", "saveSession(updated, sessionId).catch(console.error);")
content = content.replace("saveSession(updatedSession, sessionId);", "saveSession(updatedSession, sessionId).catch(console.error);")

with open('src/hooks/useTestEngine.ts', 'w') as f:
    f.write(content)


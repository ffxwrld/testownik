import re
with open('src/utils/db.ts', 'r') as f:
    content = f.read()

old_get_all = """    const images: Record<string, Blob> = {};
    for (const key of sessionKeys) {
      const blob = await get<Blob>(key);
      if (blob) {
        const fileName = key.substring(prefix.length);
        images[fileName] = blob;
      }
    }
    return images;"""

new_get_all = """    const images: Record<string, Blob> = {};
    const blobs = await Promise.all(sessionKeys.map(key => get<Blob>(key)));
    sessionKeys.forEach((key, index) => {
      const blob = blobs[index];
      if (blob) {
        const fileName = key.substring(prefix.length);
        images[fileName] = blob;
      }
    });
    return images;"""

content = content.replace(old_get_all, new_get_all)
with open('src/utils/db.ts', 'w') as f:
    f.write(content)

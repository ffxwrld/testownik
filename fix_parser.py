with open('src/utils/parser.ts', 'r') as f:
    content = f.read()

# Replace the txtFiles loop
old_txt_loop = """  await Promise.all(
    txtFiles.map(async ({ name, file }) => {
      try {
        const bytes = await file.async('uint8array');
        const content = decodeFileContent(bytes);
        const strippedName = commonPrefix ? name.substring(commonPrefix.length) : name;
        const q = parseQuestionFile(content, strippedName);
        if (q) questions.push(q);
      } catch (err) {
        console.warn(`Failed to read "${name}":`, err);
      }
    })
  );"""

new_txt_loop = """  const BATCH_SIZE = 20;

  for (let i = 0; i < txtFiles.length; i += BATCH_SIZE) {
    const batch = txtFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async ({ name, file }) => {
        try {
          const bytes = await file.async('uint8array');
          const content = decodeFileContent(bytes);
          const strippedName = commonPrefix ? name.substring(commonPrefix.length) : name;
          const q = parseQuestionFile(content, strippedName);
          if (q) questions.push(q);
        } catch (err) {
          console.warn(`Failed to read "${name}":`, err);
        }
      })
    );
    // Yield to the event loop to prevent UI freezing on massive archives
    await new Promise(resolve => setTimeout(resolve, 0));
  }"""
content = content.replace(old_txt_loop, new_txt_loop)

# Replace the imgFiles loop
old_img_loop = """  await Promise.all(
    imgFiles.map(async ({ name, file }) => {
      try {
        const blob = await file.async('blob');
        const fileName = name.split('/').pop() || name;
        images[fileName] = blob;
      } catch (err) {
        console.warn(`Failed to read image "${name}":`, err);
      }
    })
  );"""

new_img_loop = """  for (let i = 0; i < imgFiles.length; i += BATCH_SIZE) {
    const batch = imgFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async ({ name, file }) => {
        try {
          const blob = await file.async('blob');
          const fileName = name.split('/').pop() || name;
          images[fileName] = blob;
        } catch (err) {
          console.warn(`Failed to read image "${name}":`, err);
        }
      })
    );
    // Yield to event loop to clear massive image allocations from memory
    await new Promise(resolve => setTimeout(resolve, 0));
  }"""
content = content.replace(old_img_loop, new_img_loop)

with open('src/utils/parser.ts', 'w') as f:
    f.write(content)

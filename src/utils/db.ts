import { set, get, del, keys } from 'idb-keyval';

/**
 * Zapisuje wszystkie wyciągnięte z ZIPa obrazy do IndexedDB.
 * Kluczem jest połączenie ID sesji oraz nazwy pliku, np. "session123_007.png".
 */
export async function saveSessionImages(
  sessionId: string,
  images: Record<string, Blob>
): Promise<void> {
  const promises = Object.entries(images).map(([imageName, blob]) => {
    const key = `${sessionId}_${imageName}`;
    return set(key, blob);
  });
  await Promise.all(promises);
}

/**
 * Pobiera pojedynczy obraz z IndexedDB.
 */
export async function getSessionImage(
  sessionId: string,
  imageName: string
): Promise<Blob | undefined> {
  const key = `${sessionId}_${imageName}`;
  return await get<Blob>(key);
}

/**
 * Usuwa z IndexedDB wszystkie obrazy przypisane do danej sesji (używane podczas usuwania bazy z "Moich testów").
 */
export async function deleteSessionImages(sessionId: string): Promise<void> {
  try {
    const allKeys = await keys();
    const prefix = `${sessionId}_`;
    const keysToDelete = allKeys.filter(
      (key) => typeof key === 'string' && key.startsWith(prefix)
    );
    
    const promises = keysToDelete.map((key) => del(key));
    await Promise.all(promises);
  } catch (err) {
    console.error('Failed to delete session images:', err);
  }
}

/**
 * Pobiera wszystkie obrazy przypisane do danej sesji. Zwraca mapę: nazwa pliku -> Blob.
 */
export async function getAllSessionImages(
  sessionId: string
): Promise<Record<string, Blob>> {
  try {
    const allKeys = await keys();
    const prefix = `${sessionId}_`;
    const sessionKeys = allKeys.filter(
      (key) => typeof key === 'string' && key.startsWith(prefix)
    ) as string[];

    const images: Record<string, Blob> = {};
    for (const key of sessionKeys) {
      const blob = await get<Blob>(key);
      if (blob) {
        const fileName = key.substring(prefix.length);
        images[fileName] = blob;
      }
    }
    return images;
  } catch (err) {
    console.error('Failed to get all session images:', err);
    return {};
  }
}

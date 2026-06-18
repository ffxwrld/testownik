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

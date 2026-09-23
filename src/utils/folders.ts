import { get, set } from 'idb-keyval';
import { Folder } from '../models/types';

const FOLDERS_IDB_KEY = 'testownik_folders_v1';

export async function getFolders(): Promise<Folder[]> {
  try {
    const folders = await get<Folder[]>(FOLDERS_IDB_KEY);
    return folders || [];
  } catch (err) {
    console.error('Failed to get folders:', err);
    return [];
  }
}

export async function saveFolder(folder: Omit<Folder, 'id' | 'createdAt'> & { id?: string }): Promise<Folder> {
  try {
    const currentFolders = await getFolders();
    const isNew = !folder.id;
    
    const newFolder: Folder = {
      id: folder.id || crypto.randomUUID(),
      name: folder.name,
      color: folder.color,
      createdAt: isNew ? new Date().toISOString() : (currentFolders.find(f => f.id === folder.id)?.createdAt || new Date().toISOString()),
    };

    let nextFolders: Folder[];
    if (isNew) {
      nextFolders = [newFolder, ...currentFolders];
    } else {
      nextFolders = currentFolders.map(f => f.id === folder.id ? newFolder : f);
    }

    await set(FOLDERS_IDB_KEY, nextFolders);
    return newFolder;
  } catch (err) {
    console.error('Failed to save folder:', err);
    throw err;
  }
}

export async function deleteFolder(id: string): Promise<void> {
  try {
    const currentFolders = await getFolders();
    const nextFolders = currentFolders.filter(f => f.id !== id);
    await set(FOLDERS_IDB_KEY, nextFolders);
  } catch (err) {
    console.error('Failed to delete folder:', err);
    throw err;
  }
}

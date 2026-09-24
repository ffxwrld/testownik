import useSWR from 'swr';
import { Folder } from '../models/types';
import { getFolders, saveFolder, deleteFolder as dbDeleteFolder } from '../utils/folders';
import { loadSession, saveSession } from '../utils/session';
const FOLDERS_SWR_KEY = 'local_folders';

export function useFolders() {
  const { data: folders = [], mutate, isLoading } = useSWR<Folder[]>(
    FOLDERS_SWR_KEY,
    getFolders,
    {
      fallbackData: [],
      revalidateOnFocus: true, // Keep in sync across tabs
    }
  );

  const createFolder = async (name: string, color: string) => {
    const newFolder = await saveFolder({ name, color });
    await mutate();
    return newFolder;
  };

  const updateFolder = async (id: string, name: string, color: string) => {
    const updated = await saveFolder({ id, name, color });
    await mutate();
    return updated;
  };

  const deleteFolder = async (id: string) => {
    // 1. Remove folder from DB
    await dbDeleteFolder(id);
    await mutate();
    
    // 2. We should ideally unlink tests that had this folderId, but they won't break if folder doesn't exist.
    // It's a soft relation.
  };

  const assignSessionToFolder = async (sessionId: string, folderId: string | null) => {
    const session = await loadSession(sessionId);
    if (!session) return;

    if (folderId === null) {
      delete session.folderId;
    } else {
      session.folderId = folderId;
    }

    await saveSession(session, sessionId);
  };

  return {
    folders,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    assignSessionToFolder,
  };
}

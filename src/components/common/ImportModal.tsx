import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Question } from '../../models/types';
import { Button } from '../ui/Button';
import { parseMagicText, parseCustomTextSync } from '../../utils/importers/magicImporter';

// Dummy wrapper for parser since it expects raw bytes processing in App.tsx originally
// We will write a small helper to handle ZIP drop here if needed.

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (questions: Question[], baseName: string, images?: Record<string, Blob>) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const { t } = useTranslation();
  const [pasteText, setPasteText] = useState('');
  const [preview, setPreview] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  
  const [termSep, setTermSep] = useState('auto');
  const [customTermSep, setCustomTermSep] = useState('');
  const [rowSep, setRowSep] = useState('auto');
  const [customRowSep, setCustomRowSep] = useState('');

  useEffect(() => {
    if (!pasteText) {
      setPreview([]);
      setError('');
      setTitle('');
      return;
    }

    const timer = setTimeout(async () => {
      const isAuto = termSep === 'auto' && rowSep === 'auto';
      
      let res;
      if (isAuto) {
        res = await parseMagicText(pasteText);
      } else {
        const actualTermSep = termSep === 'custom' ? customTermSep : termSep === '\\t' ? '\t' : termSep === '\\n' ? '\n' : termSep;
        const actualRowSep = rowSep === 'custom' ? customRowSep : rowSep === '\\n' ? '\n' : rowSep === '\\n\\n' ? '\n\n' : rowSep;
        
        // Custom parser
        res = parseCustomTextSync(pasteText, actualTermSep, actualRowSep);
      }

      if (res.error) {
        setError(res.error);
        setPreview([]);
      } else {
        setPreview(res.questions);
        setTitle(res.title || t('importModal.defaultNewPack', 'Nowa paczka'));
        setError('');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [pasteText, termSep, customTermSep, rowSep, customRowSep, t]);

  const handleImport = () => {
    if (preview.length > 0) {
      onImportComplete(preview, title || t('importModal.defaultImported', 'Importowane pytania'), {});
      setPasteText('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh] border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {t('importModal.title', 'Importuj pytania')}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  {t('importModal.desc', 'Wklej poniżej tekst skopiowany z Quizleta, pliku Excel (CSV) lub wygenerowany przez AI. Apka sama rozpozna format.')}
                </p>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={t('importModal.placeholder', 'Skopiuj i wklej tutaj pytania...')}
                  className="w-full h-40 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-zinc-800 dark:text-zinc-200 mb-4"
                />

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                      {t('importModal.termSepLabel', 'Pomiędzy pojęciem a definicją')}
                    </label>
                    <select
                      value={termSep}
                      onChange={(e) => setTermSep(e.target.value)}
                      className="w-full text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 text-zinc-900 dark:text-white"
                    >
                      <option value="auto">{t('importModal.autoSep', 'Automatycznie (Magia)')}</option>
                      <option value="\t">{t('importModal.tabSep', 'Tabulator (\\t)')}</option>
                      <option value=",">{t('importModal.commaSep', 'Przecinek (,)')}</option>
                      <option value="-">{t('importModal.dashSep', 'Myślnik (-)')}</option>
                      <option value="custom">{t('importModal.customSep', 'Niestandardowy...')}</option>
                    </select>
                    {termSep === 'custom' && (
                      <input 
                        type="text" 
                        value={customTermSep}
                        onChange={(e) => setCustomTermSep(e.target.value)}
                        placeholder={t('importModal.customPlaceholder', 'Wpisz separator')}
                        className="mt-2 w-full text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 text-zinc-900 dark:text-white"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                      {t('importModal.rowSepLabel', 'Między rzędami (fiszki)')}
                    </label>
                    <select
                      value={rowSep}
                      onChange={(e) => setRowSep(e.target.value)}
                      className="w-full text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 text-zinc-900 dark:text-white"
                    >
                      <option value="auto">{t('importModal.autoSep', 'Automatycznie (Magia)')}</option>
                      <option value="\n">{t('importModal.newlineSep', 'Nowa linia (\\n)')}</option>
                      <option value="\n\n">{t('importModal.doubleNewlineSep', 'Dwie nowe linie (\\n\\n)')}</option>
                      <option value=";">{t('importModal.semicolonSep', 'Średnik (;)')}</option>
                      <option value="custom">{t('importModal.customSep', 'Niestandardowy...')}</option>
                    </select>
                    {rowSep === 'custom' && (
                      <input 
                        type="text" 
                        value={customRowSep}
                        onChange={(e) => setCustomRowSep(e.target.value)}
                        placeholder={t('importModal.customPlaceholder', 'Wpisz separator')}
                        className="mt-2 w-full text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 text-zinc-900 dark:text-white"
                      />
                    )}
                  </div>
                </div>

                {error && <div className="text-sm text-red-500 font-medium px-2 mb-4">{error}</div>}

                {preview.length > 0 && (
                  <motion.div layout className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-zinc-900 dark:text-white">
                        {t('importModal.previewTitle', 'Podgląd (znaleziono {{count}} pytań)', { count: preview.length })}
                      </h3>
                      <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 w-48 text-zinc-900 dark:text-white font-medium"
                        placeholder={t('importModal.packNamePlaceholder', 'Nazwa paczki...')}
                      />
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                      {preview.slice(0, 3).map((q, i) => (
                        <div key={q.id} className="p-3 text-sm">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{i + 1}. {q.text}</div>
                          <div className="pl-4 space-y-1">
                            {q.answers.map((a, j) => (
                              <div key={j} className={a.isCorrect ? 'text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2' : 'text-zinc-500 dark:text-zinc-400 flex items-center gap-2'}>
                                {a.isCorrect && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                {!a.isCorrect && <span className="w-1.5 h-1.5" />}
                                {a.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {preview.length > 3 && (
                        <div className="p-3 text-center text-xs text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-900">
                          {t('importModal.moreQuestions', '+ {{count}} kolejnych pytań...', { count: preview.length - 3 })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-950">
                <Button variant="secondary" onClick={onClose}>
                  {t('common.cancel', 'Anuluj')}
                </Button>
                <Button variant="primary" disabled={preview.length === 0} onClick={handleImport}>
                  {preview.length > 0 
                    ? t('importModal.importBtn', 'Importuj {{count}} pytań', { count: preview.length })
                    : t('importModal.title', 'Importuj pytania')}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

import { FC } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export const PrivacyPolicyModal: FC<PrivacyPolicyModalProps> = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4 flex-shrink-0">
          <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex-1">{t('privacyModal.title')}</h3>
          <button
            onClick={onClose}
            aria-label={t('privacyModal.close')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6 text-sm text-zinc-600 dark:text-zinc-400 pr-2">
          <section>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-base">{t('privacyModal.section1Title')}</h4>
            <p>
              {t('privacyModal.section1Text')}
            </p>
          </section>

          <section>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-base">{t('privacyModal.section2Title')}</h4>
            <p>
              {t('privacyModal.section2Text')}
            </p>
          </section>

          <section>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-base">{t('privacyModal.section3Title')}</h4>
            <p>
              {t('privacyModal.section3Text')}
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>{t('privacyModal.section3Item1')}</li>
              <li>{t('privacyModal.section3Item2')}</li>
              <li>{t('privacyModal.section3Item3')}</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-base">{t('privacyModal.section4Title')}</h4>
            <p>
              {t('privacyModal.section4Text')}
            </p>
          </section>
        </div>

        <div className="pt-6 mt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl transition-colors shadow-sm"
          >
            {t('privacyModal.understandBtn')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

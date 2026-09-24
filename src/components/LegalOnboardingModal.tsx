import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { TermsOfServiceModal } from './TermsOfServiceModal';

export const LegalOnboardingModal: FC = () => {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [acceptedTOS, setAcceptedTOS] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedAge, setAcceptedAge] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('testownik_legal_accepted');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('testownik_legal_accepted', 'true');
    setIsVisible(false);
  };

  const allAccepted = acceptedTOS && acceptedPrivacy && acceptedAge;

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8" weight="duotone" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{t('legal.onboardingTitle')}</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              {t('legal.onboardingDesc')}
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1">
                <input 
                  type="checkbox" 
                  checked={acceptedTOS}
                  onChange={(e) => setAcceptedTOS(e.target.checked)}
                  className="peer appearance-none w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded-md checked:bg-primary-500 checked:border-primary-500 transition-all"
                />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 select-none">
                {t('legal.acceptTOS').replace('Regulamin', '').replace('Terms of Service', '')}
                <button onClick={(e) => { e.preventDefault(); setShowTerms(true); }} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline ml-1">
                  {i18n.language === 'pl' ? 'Regulamin świadczenia usług' : 'Terms of Service'}
                </button>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1">
                <input 
                  type="checkbox" 
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="peer appearance-none w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded-md checked:bg-primary-500 checked:border-primary-500 transition-all"
                />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 select-none">
                {t('legal.acceptPrivacy').replace('Politykę Prywatności', '').replace('Privacy Policy', '')}
                <button onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline ml-1">
                  {i18n.language === 'pl' ? 'Politykę Prywatności' : 'Privacy Policy'}
                </button>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1">
                <input 
                  type="checkbox" 
                  checked={acceptedAge}
                  onChange={(e) => setAcceptedAge(e.target.checked)}
                  className="peer appearance-none w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded-md checked:bg-primary-500 checked:border-primary-500 transition-all"
                />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 select-none">
                {t('legal.acceptAge')}
              </div>
            </label>
          </div>

          <button
            onClick={handleAccept}
            disabled={!allAccepted}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 shadow-md"
          >
            {t('legal.startLearning')}
            <ArrowRight weight="bold" className="w-5 h-5" />
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
        {showTerms && <TermsOfServiceModal onClose={() => setShowTerms(false)} />}
      </AnimatePresence>
    </>
  );
};

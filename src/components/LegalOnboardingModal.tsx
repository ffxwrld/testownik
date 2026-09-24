import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Translate } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { TermsOfServiceModal } from './TermsOfServiceModal';

const Switch: FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 ${
      checked ? 'bg-primary-500' : 'bg-zinc-200 dark:bg-zinc-700'
    }`}
  >
    <motion.span
      layout
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

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
      // Lock body scroll to prevent interacting with background
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleAccept = () => {
    localStorage.setItem('testownik_legal_accepted', 'true');
    setIsVisible(false);
    document.body.style.overflow = '';
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(nextLang);
  };

  const allAccepted = acceptedTOS && acceptedPrivacy && acceptedAge;

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 sm:p-6" style={{ perspective: '1000px' }}>
        {/* Apple-style deep backdrop blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200, mass: 0.8 }}
          className="relative w-full max-w-[500px] max-h-[85dvh] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-[32px] p-5 sm:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] border border-white/40 dark:border-white/10 flex flex-col mt-auto sm:mt-0"
        >
          {/* Top Header & Language Switcher */}
          <div className="flex justify-between items-start w-full mb-4 sm:mb-8 shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/10 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-inner border border-white/50 dark:border-white/5">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" weight="duotone" />
            </div>
            
            <button
              onClick={toggleLanguage}
              aria-label="Toggle language"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-colors backdrop-blur-md shrink-0"
            >
              <Translate weight="bold" />
              {i18n.language === 'pl' ? 'English' : 'Polski'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar pb-6">
            <div className="flex flex-col mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2 sm:mb-3 tracking-tight" style={{ fontOpticalSizing: 'auto' }}>
                {t('legal.onboardingTitle')}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-[15px] leading-relaxed">
                {t('legal.onboardingDesc')}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent dark:border-zinc-800/50">
                <div className="flex-1 text-sm sm:text-[15px] text-zinc-700 dark:text-zinc-200 leading-snug">
                  {i18n.language === 'pl' ? 'Akceptuję ' : 'I accept the '}
                  <button 
                    onClick={(e) => { e.preventDefault(); setShowTerms(true); }} 
                    className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    {i18n.language === 'pl' ? 'Regulamin świadczenia usług' : 'Terms of Service'}
                  </button>
                </div>
                <Switch checked={acceptedTOS} onChange={setAcceptedTOS} />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent dark:border-zinc-800/50">
                <div className="flex-1 text-sm sm:text-[15px] text-zinc-700 dark:text-zinc-200 leading-snug">
                  {i18n.language === 'pl' ? 'Akceptuję ' : 'I accept the '}
                  <button 
                    onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }} 
                    className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    {i18n.language === 'pl' ? 'Politykę Prywatności' : 'Privacy Policy'}
                  </button>
                  {i18n.language === 'pl' 
                    ? ' i zapis postępów w przeglądarce (IndexedDB).' 
                    : ' and browser storage for my progress (IndexedDB).'}
                </div>
                <Switch checked={acceptedPrivacy} onChange={setAcceptedPrivacy} />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent dark:border-zinc-800/50">
                <div className="flex-1 text-sm sm:text-[15px] text-zinc-700 dark:text-zinc-200 leading-snug">
                  {t('legal.acceptAge')}
                </div>
                <Switch checked={acceptedAge} onChange={setAcceptedAge} />
              </div>
            </div>
          </div>

          <div className="pt-2 shrink-0">
            <motion.button
              whileHover={allAccepted ? { scale: 1.02 } : {}}
              whileTap={allAccepted ? { scale: 0.98 } : {}}
              onClick={handleAccept}
              disabled={!allAccepted}
              className={`
                w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl text-base sm:text-[17px] font-semibold transition-all duration-300
                ${allAccepted 
                  ? 'bg-zinc-900 text-white shadow-lg hover:shadow-xl dark:bg-white dark:text-zinc-900 shadow-zinc-900/20 dark:shadow-white/10' 
                  : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
                }
              `}
            >
              {t('legal.startLearning')}
              <ArrowRight weight="bold" className={`w-5 h-5 transition-transform ${allAccepted ? 'translate-x-0' : '-translate-x-2 opacity-50'}`} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
        {showTerms && <TermsOfServiceModal onClose={() => setShowTerms(false)} />}
      </AnimatePresence>
    </>
  );
};

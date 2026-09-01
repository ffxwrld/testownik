import { FC } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export const PrivacyPolicyModal: FC<PrivacyPolicyModalProps> = ({ onClose }) => {
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
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex-1">Polityka Prywatności</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6 text-sm text-zinc-600 dark:text-zinc-400 pr-2">
          <section>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-base">1. Gromadzenie danych</h4>
            <p>
              Aplikacja Testownik przechowuje Twoje paczki pytań oraz postępy w nauce lokalnie na Twoim urządzeniu (w pamięci przeglądarki za pomocą IndexedDB). 
              Gdy korzystasz z funkcji logowania i synchronizacji (w tym zapisu w chmurze i rankingu), Twoje podstawowe dane profilowe (nazwa użytkownika, avatar) oraz statystyki (ilość zdobytego doświadczenia, ukończone sesje) są bezpiecznie przesyłane i przechowywane w naszej bazie danych (Supabase).
            </p>
          </section>

          <section>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-base">2. Tryb Multiplayer (Wyścig)</h4>
            <p>
              W trybie wyścigu na żywo, paczki pytań oraz zdjęcia przesyłane są bezpośrednio między urządzeniami graczy w technologii Peer-to-Peer (WebRTC). Twoje adresy IP mogą być krótkotrwale widoczne dla serwerów sygnalizacyjnych (STUN) w celu nawiązania połączenia, jednak żadne treści pytań ani przesyłane grafiki w tym trybie nie są zapisywane na naszych serwerach.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-base">3. Wykorzystanie danych</h4>
            <p>
              Gromadzone dane służą wyłącznie do:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Zapewnienia prawidłowego działania aplikacji i synchronizacji Twoich postępów.</li>
              <li>Wyświetlania Twojej pozycji w rankingu ogólnym.</li>
              <li>Umożliwienia rozgrywki wieloosobowej ze znajomymi.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-base">4. Bezpieczeństwo</h4>
            <p>
              Stosujemy nowoczesne standardy zabezpieczeń bazy danych (Row Level Security), aby upewnić się, że nikt niepowołany nie ma dostępu do Twoich wrażliwych danych. Nie udostępniamy i nigdy nie sprzedajemy Twoich danych podmiotom trzecim.
            </p>
          </section>
        </div>

        <div className="pt-6 mt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl transition-colors shadow-sm"
          >
            Rozumiem
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

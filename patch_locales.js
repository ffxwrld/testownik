const fs = require('fs');

function patch(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (file.includes('pl.json')) {
    data.legal = {
      aiDisclaimer: "Podpowiedzi generowane przez AI mogą zawierać błędy (halucynacje). Zawsze weryfikuj je ze źródłem.",
      onboardingTitle: "Witaj w Testowniku!",
      onboardingDesc: "Zanim rozpoczniesz naukę, musimy prosić Cię o akceptację niezbędnych zgód, abyśmy mogli legalnie przechowywać Twoje postępy.",
      acceptTOS: "Akceptuję Regulamin świadczenia usług",
      acceptPrivacy: "Akceptuję Politykę Prywatności i użycie LocalStorage (IndexedDB) do zapisu moich postępów",
      acceptAge: "Mam ukończone 16 lat lub posiadam zgodę opiekuna prawnego",
      startLearning: "Rozpocznij naukę"
    };
    data.termsModal = {
      title: "Regulamin Świadczenia Usług",
      close: "Zamknij",
      content: "1. Postanowienia ogólne\nAplikacja służy do nauki i powtórek materiału.\n\n2. Treści generowane przez użytkowników\nZa wszelkie wgrane pliki (pytania, bazy) pełną odpowiedzialność ponosi Użytkownik. Operator serwisu nie weryfikuje ich pod kątem praw autorskich.\n\n3. Wyłączenie odpowiedzialności\nAplikacja jest dostarczana w modelu 'AS-IS'. Nie gwarantujemy 100% dostępności usług ani poprawności wygenerowanych podpowiedzi AI.\n\n4. Zgłaszanie naruszeń (DSA)\nW przypadku wykrycia nielegalnych treści w trybie udostępniania publicznego, prosimy o kontakt w celu ich zablokowania."
    };
    data.privacyModal.section1Text = "Aplikacja Testownik w architekturze 'offline-first' przechowuje Twoje paczki pytań oraz postępy lokalnie w pamięci przeglądarki (IndexedDB). Gdy korzystasz z funkcji logowania (Supabase), Twoje dane są bezpiecznie szyfrowane. Korzystanie z podpowiedzi 'AI Tutor' wiąże się z anonimowym wysłaniem zapytania do partnerów zewnętrznych (Groq/OpenAI).";
  } else {
    data.legal = {
      aiDisclaimer: "AI-generated hints may contain errors (hallucinations). Always verify with your source material.",
      onboardingTitle: "Welcome to Testownik!",
      onboardingDesc: "Before you start learning, we need your consent to legally store your progress data.",
      acceptTOS: "I accept the Terms of Service",
      acceptPrivacy: "I accept the Privacy Policy and use of LocalStorage (IndexedDB) to save my progress",
      acceptAge: "I am over 16 years old or have legal guardian consent",
      startLearning: "Start Learning"
    };
    data.termsModal = {
      title: "Terms of Service",
      close: "Close",
      content: "1. General Provisions\nThe app is an educational tool.\n\n2. User-Generated Content\nUsers are solely responsible for any files (questions, databases) they upload. The service operator does not monitor them for copyright infringement.\n\n3. Limitation of Liability\nThe application is provided 'AS-IS'. We do not guarantee 100% uptime or the correctness of AI-generated hints.\n\n4. Reporting (DSA)\nIf you spot illegal content in public sharing modes, please contact us for removal."
    };
    data.privacyModal.section1Text = "Testownik uses an offline-first architecture, storing your question packs and progress locally in your browser (IndexedDB). If you use login features (Supabase), your data is securely encrypted. Using the 'AI Tutor' sends anonymous requests to third-party sub-processors (Groq/OpenAI).";
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

patch('src/i18n/locales/pl.json');
patch('src/i18n/locales/en.json');

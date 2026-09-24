import { supabase } from '../lib/supabase';

export async function generateHint(question: string, options: string[], language: string = 'pl'): Promise<string> {
  if (!navigator.onLine) {
    throw new Error('OFFLINE');
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-hint', {
      body: { question, options, language },
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error('Błąd serwera. Spróbuj ponownie później.');
    }

    if (data?.error) {
      console.error('API error:', data.error);
      throw new Error('Błąd serwera. Spróbuj ponownie później.');
    }

    return data?.hint || 'Brak podpowiedzi.';
  } catch (err: any) {
    if (err.message === 'OFFLINE') throw err;
    console.error('generateHint fetch error:', err);
    throw new Error('Nie udało się pobrać podpowiedzi.');
  }
}

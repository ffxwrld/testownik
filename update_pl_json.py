import json

with open('src/i18n/locales/pl.json', 'r') as f:
    data = json.load(f)

# Add missing keys to 'creator'
creator_keys = data.setdefault('creator', {})
creator_keys['quit'] = "Wyjdź"
creator_keys['saveToTestownik'] = "Zapisz do aplikacji"
creator_keys['fileName'] = "Nazwa pliku"
creator_keys['questionContent'] = "Treść pytania"
creator_keys['questionPlaceholder'] = "Wpisz treść pytania..."

with open('src/i18n/locales/pl.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

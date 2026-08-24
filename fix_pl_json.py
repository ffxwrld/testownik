import json

with open('src/i18n/locales/pl.json', 'r') as f:
    data = json.load(f)

if 'creator' in data and 'addQuestion' in data['creator']:
    data['creator']['addQuestion'] = "Dodaj kolejne pytanie"

if 'creator' in data and 'addAnswerVariant' in data['creator']:
    data['creator']['addAnswerVariant'] = "Dodaj wariant odpowiedzi"

with open('src/i18n/locales/pl.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

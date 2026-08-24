import json

with open('package.json', 'r') as f:
    data = json.load(f)

if 'build:web' not in data['scripts']:
    data['scripts']['build:web'] = "tsc -b && vite build"
    
with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)

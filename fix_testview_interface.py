with open('src/components/TestView.tsx', 'r') as f:
    test_view = f.read()

test_view = test_view.replace(
    "interface TestViewProps {\n  session: SessionState;",
    "interface TestViewProps {\n  onOpenSettings?: () => void;\n  session: SessionState;"
)

with open('src/components/TestView.tsx', 'w') as f:
    f.write(test_view)


with open('src/components/TestView.tsx', 'r') as f:
    test_view = f.read()

test_view = test_view.replace(
    "export const TestView: FC<TestViewProps> = ({ session, onQuit, onFinish }) => {",
    "export const TestView: FC<TestViewProps & { onOpenSettings?: () => void }> = ({ session, onQuit, onFinish, onOpenSettings }) => {"
)
test_view = test_view.replace(
    "onQuitConfirm={() => onQuit(engine.session)}",
    "onQuitConfirm={() => onQuit(engine.session)}\n        onOpenSettings={onOpenSettings}"
)

with open('src/components/TestView.tsx', 'w') as f:
    f.write(test_view)


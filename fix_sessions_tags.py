with open('src/components/SessionsList.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip() == "</div>":
        # check if next lines are the end of the card
        if i + 2 < len(lines) and "        );" in lines[i+2]:
            lines[i+1] = "          </motion.div>\n"
    if line.strip() == "})}":
        lines[i] = "      })}\n      </AnimatePresence>\n"

with open('src/components/SessionsList.tsx', 'w') as f:
    f.writelines(lines)

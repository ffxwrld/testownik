with open('src/components/SummaryView.tsx', 'r') as f:
    content = f.read()

# Fix the broken elements
content = content.replace("          </Card>\n        </motion.div>\n\n        {worstQuestions.length > 0", "          </Card>\n        </motion.div>\n\n        {hardest.length > 0")

content = content.replace("</Button>\n        </motion.div>\n      </motion.div>\n    </div>\n  );\n};", "</Button>\n      </motion.div>\n    </div>\n  );\n};")

with open('src/components/SummaryView.tsx', 'w') as f:
    f.write(content)

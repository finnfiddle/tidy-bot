# 🧹 TidyBot

TidyBot is a GitHub Action that selects a random source file once a day (or on demand) and uses OpenAI to refactor it using your preferred style guides and custom rules.

## 📦 Setup

1. Add `.tidy-bot.yml` to the root of your repo:
```yaml
srcDir: "./src"

extensions:
  - ".js"
  - ".ts"
  - ".tsx"

styleGuides:
  - "Airbnb JavaScript/TypeScript style guide"
  - "React best practices"

customInstructions: |
  - Use const where possible.
  - Prefer arrow functions.

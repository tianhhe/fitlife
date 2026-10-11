# Contributing to FitLife

Thank you for your interest in contributing to FitLife! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Android Studio / Xcode (for mobile development)
- Expo CLI: `pnpm add -g expo-cli`

### Installation

```bash
# Clone the repository
git clone https://github.com/tianhhe/fitlife.git
cd fitlife

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Project Structure

```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Main tab screens
│   ├── training/          # Training module
│   ├── nutrition/         # Nutrition module
│   ├── profile/           # Profile & settings
│   └── ai/                # AI coach module
├── components/            # Reusable UI components
├── constants/             # App constants
├── lib/                   # Core business logic
│   ├── nutrition-engine.ts
│   ├── training-plan.ts
│   ├── storage.ts
│   ├── types.ts
│   └── *.test.ts          # Unit tests
├── server/                # tRPC backend
└── scripts/               # Utility scripts
```

## Development Workflow

### Branching Strategy

- `main` - Production ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `chore/*` - Maintenance tasks

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, etc.)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Performance improvement
- `test` - Adding missing tests
- `chore` - Maintenance, dependencies, build config
- `revert` - Reverts a previous commit

**Examples:**

```
feat(training): add rest timer vibration feedback
fix(nutrition): calculate correct carbs for maintenance goal
docs: add contributing guidelines
test(nutrition-engine): add unit tests for all nutrition goals
chore: update dependencies
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Run tests and linting: `pnpm test && pnpm lint && pnpm check`
4. Update documentation if needed
5. Submit PR with:
   - Clear title following commit convention
   - Description of changes
   - Screenshots for UI changes
   - Link to related issue (if applicable)

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Expo config + Prettier
- **File naming**: kebab-case for files, PascalCase for components
- **Imports**: Absolute imports via `@/` alias

```bash
# Format code
pnpm format

# Check types
pnpm check

# Run linting
pnpm lint
```

### Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

**Test Guidelines:**

- Place tests next to source files: `*.test.ts`
- Use descriptive test names: `should calculate correct carbs for maintenance goal`
- Test edge cases and error conditions
- Aim for >80% coverage on business logic

### Adding New Exercises

1. Add to `lib/preset-exercises.ts` in `PRESET_EXERCISES` array
2. Follow existing format: `name`, `muscleGroup`, `equipment`, `description`
3. Run `pnpm test` to ensure no regressions
4. IDs are auto-generated as `preset_<index>`

### Adding New Food Items

1. Add to `FOOD_DATABASE` in `lib/nutrition-engine.ts`
2. Include: `id`, `name`, `category`, macros per 100g, `goal`
3. Categories: `protein`, `carbs`, `fats`, `vegetables`, `fruits`, `other`
4. Goals: `all`, `fat_loss`, `muscle_gain`

### Internationalization

- All user-facing strings should use the translation system
- Add new keys to locale files in `lib/i18n/` (future)

## Issue Reporting

### Bug Reports

Use the bug report template. Include:

- Device/OS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable

### Feature Requests

Use the feature request template. Explain:

- The problem you're solving
- Proposed solution
- Alternatives considered
- Additional context

## Code Review Guidelines

### For Authors

- Keep PRs small and focused (< 400 lines changed)
- Self-review before requesting review
- Respond to feedback promptly
- Squash fixup commits before merge

### For Reviewers

- Be constructive and specific
- Check: correctness, tests, types, performance, UX
- Approve when confident; request changes with clear reasoning
- Use "suggest" for minor improvements

## Release Process

1. Version bump in `package.json` and `app.config.ts`
2. Update `CHANGELOG.md`
3. Create release tag: `git tag v1.x.x`
4. GitHub Actions builds and publishes

## Community

- **Discord**: [Join our community](#) (TBD)
- **Issues**: GitHub Issues for bugs/features
- **Discussions**: GitHub Discussions for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

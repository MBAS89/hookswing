# Contributing to HookSwing

First off, thanks for taking the time to contribute!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/HookSwing.git`
3. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Start infrastructure
docker-compose up -d

# Backend
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev

# Frontend (new terminal)
cd apps/web
npm install
npm run dev
```

## Pull Request Process

1. Ensure your code follows the existing style
2. Update the README.md if needed
3. Make sure TypeScript compiles: `npm run build`
4. Submit your PR with a clear description

## Code Style

- TypeScript strict mode enabled
- Use meaningful variable names
- Comment complex business logic
- Keep functions focused and small

## Reporting Bugs

Use GitHub Issues with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Questions?

Open a GitHub Discussion or email support@hookswing.com

# Prompt-Patch Writing Tool - Project Overview

## Vision
A pure-frontend writing tool that allows users to:
1. Generate documents from prompts (Promptlets)
2. Edit specific sections with localized AI-powered patches
3. Regenerate the original prompt from the final document

## Core Technologies
- **Next.js 14+** (App Router)
- **pnpm** (Package manager)
- **Tailwind CSS + shadcn/ui** (Styling)
- **LangChain.js** (AI integration via APIs)
- **Vitest + Testing Library** (Unit/component tests)
- **Playwright** (E2E tests)

## Key Features
1. **Document Generation**: Users input a Promptlet to generate initial content
2. **Selective Editing**: Double-click text to select and patch with AI
3. **Patch Preview**: Show patches in green above original text
4. **Patch Actions**: Accept, reject, or refine patches
5. **Promptlet Regeneration**: Derive original prompt from edited document

## Development Principles
- Test-first development (TDD)
- Component-driven architecture
- Client-side only (no backend)
- Progressive enhancement
- Accessibility first
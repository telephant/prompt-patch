# Prompt-Patch Development Plan

This directory contains the comprehensive development plan for the Prompt-Patch writing tool.

## Plan Structure

1. **[01-project-overview.md](./01-project-overview.md)** - High-level vision and core principles
2. **[02-architecture.md](./02-architecture.md)** - Component hierarchy and state management design
3. **[03-langchain-integration.md](./03-langchain-integration.md)** - LangChain.ts API integration details
4. **[04-testing-strategy.md](./04-testing-strategy.md)** - Comprehensive testing approach with examples
5. **[05-frontend-limitations.md](./05-frontend-limitations.md)** - Browser constraints and mitigation strategies
6. **[06-implementation-roadmap.md](./06-implementation-roadmap.md)** - Week-by-week development plan
7. **[07-technical-decisions.md](./07-technical-decisions.md)** - Key technology choices and rationale

## Quick Start

1. Read the project overview to understand the vision
2. Review the architecture for component structure
3. Check technical decisions for setup choices
4. Follow the implementation roadmap for development
5. Use the testing strategy for TDD workflow

## Key Decisions Summary

- **State**: Zustand with persistence
- **LLM**: OpenAI/Anthropic APIs via LangChain
- **Testing**: Vitest + Playwright
- **Styling**: Tailwind CSS + shadcn/ui
- **Positioning**: Floating UI
- **Build**: Turbo + pnpm

## Development Principles

1. **Test-First**: Write tests before implementation
2. **Progressive Enhancement**: Core features work everywhere
3. **Performance**: Optimize for browser constraints
4. **Accessibility**: WCAG 2.1 AA compliance
5. **Type Safety**: Strict TypeScript throughout

## Next Steps

1. Initialize the project with the folder structure
2. Set up the testing infrastructure
3. Begin Phase 1 implementation
4. Follow TDD for each feature
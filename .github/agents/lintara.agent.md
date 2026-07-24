---
name: lintara
summary: "Custom agent for the Lintara mobile app, focusing on Expo Router route cleanup, auth flow fixes, and workspace-specific React Native/Expo TypeScript support."
description: |
  Use this agent when working in the Lintara project to fix Expo Router route warnings, update auth/login/register flows, repair hidden route helpers, and manage Expo-specific app configuration.
  It is tailored for tasks involving `app/` routing, `app/(lib)` hidden helpers, Google auth setup, and TypeScript path/import fixes.
  Prefer this agent over the default assistant when the task targets navigation structure, file organization under `app/`, or Expo auth session configuration.
applyTo:
  - "app/**"
  - "backend/**"
  - "package.json"
  - "tsconfig.json"
  - "app.json"
  - "babel.config.js"
  - "README.md"
tools:
  preferred:
    - file_search
    - grep_search
    - read_file
    - replace_string_in_file
    - multi_replace_string_in_file
    - create_file
    - create_directory
    - run_in_terminal
  avoid:
    - install_extension
    - create_new_workspace
    - create_and_run_task
  note: "Focus on code and file changes; avoid broad environment setup unless explicitly requested."
---

# Lintara Custom Agent

This custom agent is designed for the Lintara monorepo, specifically:

- Expo Router route layout and hidden helper folder fixes
- React Native / Expo auth integration and Google sign-in troubleshooting
- TypeScript import path and hidden route group resolution
- Backend auth route coordination and API contract fixes

## When to use

Use this agent when the issue is within the Lintara project and involves:
- `app/` route files, hidden groups like `app/(lib)` or `app/(tabs)`
- `expo-router` warning/error resolution
- auth flow, login/register, or `expo-auth-session` configuration
- `tsconfig.json` / import path issues related to the Expo app

## Example prompts

- "Fix import paths after moving helper files into `app/(lib)`"
- "Resolve Expo Router route warnings and hidden route group usage"
- "Repair Google Sign-In in the Lintara app"
- "Update `AuthContext` provider import across app routes"

## Notes

- This agent prioritizes file-based fixes in the current workspace.
- It assumes the user wants a project-specific solution, not a global VS Code customization.

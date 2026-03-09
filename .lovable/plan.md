
# Update Privacy Page and Add Transparency to Auth Page

## Changes

### 1. Privacy Page (`src/pages/Privacy.tsx`)

Remove the "Sidekick Conversations" bullet that currently reads:

> **Sidekick Conversations:** Your chat history with the Sidekick, so you can pick up where you left off and track your commitments.

Chat history is not persisted across sessions (it lives only in React state via `SidekickContext`), so this claim is inaccurate and should be removed.

### 2. Auth Page (`src/pages/Auth.tsx`)

Add a transparency note below the existing helper text ("We'll send you a link..."). The new text:

> The Relational Tech Studio is offered for free by the Relational Tech Project, a nonprofit project of Raft Foundation. [View our Privacy & Terms](/privacy).

This will be a small `text-muted-foreground` paragraph with a `Link` to `/privacy`, placed after the existing helper text at the bottom of the auth form.

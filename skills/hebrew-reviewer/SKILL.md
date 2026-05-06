---
name: "hebrew-reviewer"
description: "Review Hebrew technical content for clarity, RTL formatting, and proper handling of inline English terms."
author: "MCAPS Israel"
version: "1.4.0"
tags: [Hebrew, Content, RTL]
category: "Content & Localization"
status: "draft"
---

# Hebrew Content Reviewer

> **Status:** Draft / community-contributed. The skill works as a structured prompt today; production tooling is in progress.

## When to use this skill
Use to review Hebrew technical content for clarity, RTL formatting, terminology, and proper handling of inline English terms (product names, code, acronyms).

## What this skill does
1. **Pass  RTL &  directionality, punctuation placement, mixed-script spacing.layout** 1 
2. **Pass   Microsoft-Israel approved terms, consistent translations.Terminology** 2 
3. **Pass   sentence length, active voice, removing English calques.Clarity** 3 
4. **Pass  Inline  product names left in English (e.g., Microsoft Fabric), code in monospace.English** 4 
5. ** diff with comments, severity per change (must-fix / suggested / nit).Output** 

## Inputs to ask the user
- The Hebrew text or markdown
- Audience (technical / business / mixed)
- Microsoft product context

## Output
- Annotated diff with reasoning
- Cleaned final version
- Glossary of any new terms decided


## Compatibility
Works with: ClawPilot, Claude Code, Cursor

## Author
MCAPS Israel

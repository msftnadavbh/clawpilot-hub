---
name: "copilot-studio-builder"
description: "Scaffold Copilot Studio agents with topics, knowledge sources, actions, and authentication."
author: "MCAPS Israel"
version: "0.7.0"
tags: [Copilot Studio, AI, Low Code]
category: "AI & Agents"
status: "draft"
---

# Copilot Studio Builder

> **Status:** Draft / community-contributed. The skill works as a structured prompt today; production tooling is in progress.

## When to use this skill
Use to scaffold a Microsoft Copilot Studio  topics, knowledge sources, actions, authentication, channels.agent 

## What this skill does
1. **Define the bot's  single user goal, success metric.job** 
2. **Topic  trigger phrases, slot filling, fallback to generative.design** 
3. **Knowledge  SharePoint, websites, Dataverse, custom upload.sources** 
4. ** Power Automate flows, MCP tools, custom connectors.Actions** 
5. ** Entra ID SSO, MSA, none.Auth** 
6. ** Teams, web, Power Pages.Channels** 
7. ** solution skeleton + topic YAML stubs + test plan.Output** 

## Inputs to ask the user
- Bot purpose (HR / IT helpdesk / sales assist / domain-specific)
- Where users will use it
- Knowledge sources available
- Existing flows / connectors

## Output
- Topic list with trigger phrases
- Knowledge source manifest
- Action specs (Power Automate or MCP)
- Channel deployment checklist


## Compatibility
Works with: ClawPilot

## Author
MCAPS Israel

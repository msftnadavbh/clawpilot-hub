---
name: "rag-designer"
description: "Design retrieval-augmented generation pipelines on Azure AI Search, Cosmos DB, and Fabric. Includes eval harness."
author: "MCAPS Israel"
version: "1.1.0"
tags: [RAG, Azure AI Search, Embeddings]
category: "AI & Agents"
status: "draft"
---

# RAG Designer

> **Status:** Draft / community-contributed. The skill works as a structured prompt today; production tooling is in progress.

## When to use this skill
Use when the user wants a retrieval-augmented generation pipeline on  Azure AI Search, Cosmos DB vector, Fabric, or hybrid.Azure 

## What this skill does
1. **Source  document types, languages (incl. Hebrew RTL), update cadence.profiling** 
2. **Chunking  fixed, recursive, semantic, parent-child.strategy** 
3. **Embedding  text-embedding-3-large vs Cohere multilingual vs in-Foundry.model** 
4. **Index  Azure AI Search hybrid (BM25 + vector + semantic ranker) or Cosmos DB vector.design** 
5. **Retrieval  query rewriting, hybrid scoring, re-ranking.pipeline** 
6. ** prompt template + grounding + citations.Generation** 
7. **Eval  RAGAS or custom (faithfulness, answer relevance, context precision).harness** 

## Inputs to ask the user
- Corpus size and language(s)
- Latency budget per query
- Update frequency (real-time vs batch)
- Compliance / data residency

## Output
- Architecture diagram
- Chunking & embedding config
- Index schema
- Eval harness starter


## Compatibility
Works with: ClawPilot, Claude Code, Cursor

## Author
MCAPS Israel

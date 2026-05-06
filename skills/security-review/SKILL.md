---
name: "security-review"
description: "Review Azure landing zone security: identity, network, data, monitoring. Aligns to MCSB and Zero Trust."
author: "MCAPS Israel"
version: "1.0.0"
tags: [Security, Zero Trust, MCSB]
category: "Security"
status: "draft"
---

# Azure Security Review

> **Status:** Draft / community-contributed. The skill works as a structured prompt today; production tooling is in progress.

## When to use this skill
Use to review an Azure landing zone or workload for security posture against MCSB (Microsoft Cloud Security Benchmark) and Zero Trust principles.

## What this skill does
1. ** Entra ID config, MFA/CA, PIM, managed identities vs SP, secrets handling.Identity** 
2. ** hub-spoke, private endpoints, NSGs, Azure Firewall, no public IPs on data plane.Network** 
3. ** encryption at rest/in transit, customer-managed keys, classification, DLP.Data** 
4. **Detection &  Defender for Cloud plans, Sentinel ingestion, alert routing.response** 
5. ** Policy/Initiative coverage, deny-by-default for risky resources.Governance** 
6. ** findings table with severity, MCSB control ID, remediation steps.Output** 

## Inputs to ask the user
- Subscription / landing zone scope
- Compliance frameworks (ISO27001, SOC2, Israel-specific)
- Existing Defender / Sentinel deployment

## Output
- Findings table (Severity / MCSB ID / Resource / Fix)
- Quick-wins list (top 5 fixes for the next sprint)
- Maturity score (5) per pillar1


## Compatibility
Works with: ClawPilot, Claude Code, Cursor

## Author
MCAPS Israel

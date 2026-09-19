# HR365 — Platform Overview (DUMMY DATA)

> **DUMMY DATA WARNING**: This document is seed/demo content that ships with
> the HR365 hackathon repository. It describes a fictional product and must
> not be treated as describing any real company, tool, or hackathon event.

## What is HR365?

HR365 is a hypothetical, cloud-based Human Resources platform designed to
centralise the daily operations of an HR team into a single workspace. The
platform combines employee records, leave management, attendance tracking,
analytics, and an AI-assisted query layer that answers natural-language
questions using the organisation's own HR documents.

## Who is it for?

HR365 is aimed at small and medium-sized organisations that want a lightweight
HR system without deploying a large enterprise suite. The intended users are
HR administrators, team managers, and individual employees.

## Core idea

Instead of asking HR staff the same questions repeatedly, employees can ask
the AI assistant directly. The assistant retrieves the relevant passages from
the organisation's HR documentation and answers using only that grounded
context.

## Deployment model

The reference implementation runs entirely locally: document ingestion,
embedding, vector search, and answer generation all execute on the same
machine. An optional external LLM provider can be plugged in for higher
quality natural-language answers.
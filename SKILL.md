---
name: handover
description: Use when the user is about to /clear, reset or compact the context window, end a session, or hand work to a fresh session - "handover", "save state before reset", "write a resume file", "I need to reset your context".
---

# Handover

## Overview

Put everything a fresh session needs on disk, so a /clear loses nothing. After /clear or a compaction, a SessionStart hook (`hook/load-handover.js` in this skill's folder, matcher `clear|compact`) prints `~/.claude/handover/CURRENT.md` into the new context automatically.

**Core rule: verify, don't recall.** Every fact in the handover comes from a command run or a file read *during the handover*, not from memory of the conversation. A topic passed as an argument (`/handover billing-api`) names the RESUME file.

For multi-agent relay campaigns (claim files, baton passing) use the `agent-relay` skill instead.

## Steps

1. **Freeze agents first.** From the moment the handover starts, launch no new agents, subagents, forks or workflows, and give peer sessions no new tasks. Then list every agent still running: name/ID, its task, where it writes. For each one:
   - **Critical** (the next step depends on its result, or it is partway through editing files): let it finish. End your turn saying which agent you are waiting for, and resume the handover when its completion notification arrives. Don't poll. If the user says stop waiting: stop it and record it as unfinished, including the files it may have half-edited.
   - **Not critical** (research or a review that can be re-run): stop it (TaskStop). Record it as "stopped, re-run needed" with the prompt needed to re-run it.
   - **Save every result.** A subagent's final report exists only in this context and is lost on /clear. Write each one to `<repo>/.superpowers/RESUME-<topic>-agents.md`, one section per agent: name, task, outcome, files changed, open issues. Link that file from the RESUME. Its claims are claims: check its file changes with `git diff` before recording them as done.
2. **Inventory** every project/worktree touched this session: path, branch, `git log -1 --oneline`, `git status --short`, unpushed commits (`git log @{u}..` when tracking). Plus: running background shells/servers/monitors (how to check, how to restart), scheduled wakeups/crons, peer Claude sessions and what you are waiting on from them, and the user's pending instructions **quoted verbatim**.
3. **Verify.** Re-run the git commands now. Re-check every "passing / done / sent" claim against its evidence (log file, test output, sent message). Anything you cannot verify gets the word "unverified".
4. **Rescue session-only files.** This session's scratchpad dir is orphaned after /clear. Copy anything that matters into the repo's `.superpowers/` or record its absolute path.
5. **Write the RESUME file** at `<repo>/.superpowers/RESUME-<topic>.md` (no repo: `~/.claude/handover/RESUME-<topic>.md`). If it exists, update it in place: add a dated **UPDATE** line at the top of section 1 and fix statements that are now stale. Do not append a second copy. Layout:
   - Title: `# RESUME: <topic> (handover written <YYYY-MM-DD HH:MM TZ>)`
   - 1. Where we are: phase, last thing done, **the exact next step**, what waits on the user
   - 2. Key paths (table)
   - 3. Running things: servers, ports, URLs; how to check; how to restart. Agents: finished (link to the agents file), stopped or unfinished (and how to re-run them)
   - 4. Decisions the user made (verbatim, dated), then my own calls, labelled as mine for the user to check
   - 5. Done / not done
   - 6. Traps: what will bite a fresh session (branches not to switch, secrets never to copy, commands that need a flag)
   Never paste secrets. Point to the file that holds them.
6. **Update memory** in the auto-memory folder named in your system prompt: edit the matching project memory (fix stale words such as "uncommitted" or "awaiting review"), point it at the RESUME file, and update its `MEMORY.md` line and date. New project: new memory file plus index line.
7. **Write `~/.claude/handover/CURRENT.md`.** First move the old one to `~/.claude/handover/history/<YYYYMMDD-HHMM>-<topic>.md`. If it holds an entry for a *different* topic written in the last 24 h (a parallel session), carry that entry over. Keep it to 25 lines or fewer, one block per topic:
   ```
   # Handover - <YYYY-MM-DD HH:MM TZ>
   ## <topic>
   - Resume file: <absolute path> (read it fully first)
   - Repo: <path> @ <branch> <short-sha>, <clean | N files uncommitted>
   - Next step: <one sentence>
   - Waiting on user: <one sentence | nothing>
   - Agents: <none running | name: finished / stopped / unfinished>
   ```
8. **Report in chat:** the CURRENT.md text (paste-ready), the list of files written, and a verdict. Either "Safe to /clear", or what must happen first: a critical agent still running, uncommitted work the user wants committed, a process that dies with the session, an unanswered question.

## Common mistakes

| Mistake | Fix |
|---|---|
| Launching "one quick agent" during the handover | No new agents once the handover starts |
| A subagent's result kept only in chat | Write it to `RESUME-<topic>-agents.md` before /clear |
| Clearing while a critical agent is mid-edit | Wait for its notification, or stop it and list its half-edited files |
| State from memory ("tests pass") | Re-run or re-read the evidence, else mark "unverified" |
| Paraphrasing the user's decisions | Quote verbatim, with the date |
| User approvals mixed with your own calls | Separate them; label yours |
| Clobbering a parallel session's CURRENT.md entry | Archive to `history/`, carry fresh entries over |
| Work left only in the scratchpad | Copy it out or record the absolute path |
| Secrets in the RESUME file | Reference where they live instead |

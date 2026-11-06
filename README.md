# claude-code-handover

A `/handover` skill for [Claude Code](https://claude.com/claude-code), plus a SessionStart hook.

Run `/handover` before `/clear`. Claude stops launching agents and waits for the ones that matter. It re-checks git state instead of trusting its memory, then writes a RESUME file, memory updates and a short `CURRENT.md` note to disk. After `/clear` (or an auto-compact), the hook loads that note into the new session by itself. Nothing needs pasting.

## Install

1. Clone into your personal skills folder:

   ```sh
   git clone https://github.com/db4xfh/claude-code-handover ~/.claude/skills/handover
   ```

2. Add the hook to `~/.claude/settings.json`. If the file already has a `"hooks"` object, merge this into it:

   ```json
   {
     "hooks": {
       "SessionStart": [
         {
           "matcher": "clear|compact",
           "hooks": [
             {
               "type": "command",
               "command": "node ~/.claude/skills/handover/hook/load-handover.js",
               "timeout": 10
             }
           ]
         }
       ]
     }
   }
   ```

   On Windows, use the full path: `"node \"C:/Users/<you>/.claude/skills/handover/hook/load-handover.js\""`.

3. Restart Claude Code, or open `/hooks` once so it reloads the settings.

Needs Node.js on your PATH.

## Use

1. `/handover`, or `/handover <topic>` to name the RESUME file.
2. Claude ends with either "Safe to /clear" or a list of what must happen first.
3. `/clear`. The new session starts with a `<handover>` block that points at the RESUME file.

## What gets written

| Path | Contents |
|---|---|
| `<repo>/.superpowers/RESUME-<topic>.md` | Full state: where things stand, the next step, key paths, running servers, the user's decisions (verbatim), Claude's own calls, traps |
| `<repo>/.superpowers/RESUME-<topic>-agents.md` | Results of subagents. Their reports otherwise exist only in the conversation and are lost on `/clear` |
| `~/.claude/handover/CURRENT.md` | Short note the hook loads, one block per topic |
| `~/.claude/handover/history/` | Earlier notes. They're moved here instead of being overwritten |
| Claude Code's auto-memory folder | The matching project memory is updated |

Work outside a git repo goes to `~/.claude/handover/RESUME-<topic>.md`. Add `.superpowers/` to `.gitignore` if you don't want RESUME files committed.

## How the hook behaves

- No note: it prints nothing.
- It shows when the note was written. A note older than 24 hours is marked STALE, and Claude is told to check with you first.
- After a compaction, it says the compaction summary wins where the two disagree.
- If several topics are listed (parallel sessions), Claude asks which one to continue.
- To load the note in brand-new sessions too, change the matcher to `startup|clear|compact`.

The skill tells Claude never to put secrets in handover files, only where they live.

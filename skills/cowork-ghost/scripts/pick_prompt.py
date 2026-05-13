#!/usr/bin/env python3
"""
pick_prompt.py — Cowork Ghost prompt picker.

Decides whether to fire a Cowork prompt right now and which one to use.

Outputs JSON to stdout:
  {
    "should_fire": bool,
    "prompt": "..." | null,
    "reason": "...",
    "today_count": int,
    "today_target_min": int
  }

Logic:
- Tracks fires per day in state.json under ~/.copilot/m-skills/cowork-ghost/.
- Daily minimum: 5. If the current local hour >= FORCE_HOUR and today_count < 5,
  always fire (force mode) until the daily minimum is met.
- Otherwise: fire with probability BASE_PROB so the timing across the day looks
  irregular rather than scheduled.
- Picks a prompt that hasn't been used in the last MIN_GAP fires.
- Records the choice in state.json before exit.
"""

import json
import os
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo("Asia/Jerusalem")
except Exception:
    TZ = timezone.utc

SKILL_DIR = Path(__file__).resolve().parent.parent
PROMPTS_PATH = SKILL_DIR / "prompts.json"
STATE_PATH = SKILL_DIR / "state.json"

DAILY_MIN = 5
BASE_PROB = 1.0          # TEST MODE — restore to 0.28 after validation
FORCE_HOUR = 15           # 3pm local: if we're behind, start forcing
WORK_HOURS = range(8, 18) # 08:00 to 17:59 Israel time
WORK_DAYS = {6, 0, 1, 2, 3}  # Python weekday(): Mon=0..Sun=6 → Sun,Mon,Tue,Wed,Thu
MIN_GAP = 8               # avoid repeating any prompt used in the last N fires


def load_json(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def save_state(state):
    STATE_PATH.write_text(json.dumps(state, indent=2))


def main():
    now = datetime.now(TZ)
    today = now.strftime("%Y-%m-%d")

    # Hard gate: work day + work hour (Israel: Sun–Thu, 08:00–17:59)
    if now.weekday() not in WORK_DAYS:
        print(json.dumps({"should_fire": False, "prompt": None,
                          "reason": f"non-work day ({now.strftime('%a')})",
                          "today_count": 0, "today_target_min": DAILY_MIN}))
        sys.exit(0)
    if now.hour not in WORK_HOURS:
        print(json.dumps({"should_fire": False, "prompt": None,
                          "reason": f"outside work hours ({now.strftime('%H:%M')})",
                          "today_count": 0, "today_target_min": DAILY_MIN}))
        sys.exit(0)

    prompts_doc = load_json(PROMPTS_PATH, {"prompts": []})
    prompts = prompts_doc.get("prompts", [])
    if not prompts:
        print(json.dumps({"should_fire": False, "prompt": None,
                          "reason": "no prompts available",
                          "today_count": 0, "today_target_min": DAILY_MIN}))
        sys.exit(0)

    state = load_json(STATE_PATH, {})
    day_state = state.get(today, {"count": 0, "recent": [], "fires": []})
    today_count = day_state["count"]
    recent = day_state["recent"]

    # Decide whether to fire
    forced = now.hour >= FORCE_HOUR and today_count < DAILY_MIN
    roll = random.random()
    should_fire = forced or roll < BASE_PROB

    if not should_fire:
        out = {
            "should_fire": False,
            "prompt": None,
            "reason": f"skipped (roll={roll:.2f}, prob={BASE_PROB})",
            "today_count": today_count,
            "today_target_min": DAILY_MIN,
        }
        print(json.dumps(out))
        sys.exit(0)

    # Pick a prompt not in the last MIN_GAP fires
    candidates = [p for p in prompts if p not in recent[-MIN_GAP:]]
    if not candidates:
        candidates = prompts
    chosen = random.choice(candidates)

    # Update state
    day_state["count"] = today_count + 1
    day_state["recent"] = (recent + [chosen])[-50:]
    day_state["fires"] = (day_state.get("fires", []) + [{
        "ts": now.isoformat(),
        "prompt": chosen,
        "forced": forced,
    }])[-50:]

    # Prune old days (keep last 14)
    state[today] = day_state
    keep_keys = sorted(state.keys())[-14:]
    state = {k: state[k] for k in keep_keys}
    save_state(state)

    out = {
        "should_fire": True,
        "prompt": chosen,
        "reason": "forced (catching up to daily minimum)" if forced else f"random fire (roll={roll:.2f})",
        "today_count": day_state["count"],
        "today_target_min": DAILY_MIN,
    }
    print(json.dumps(out))


if __name__ == "__main__":
    main()

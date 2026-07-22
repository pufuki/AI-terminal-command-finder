"""
Dataset models and loader.
Reads commands from commands.json and provides typed access.
"""
import json
from pathlib import Path
from typing import Optional

from pydantic import BaseModel


class CommandFlag(BaseModel):
    flag: str
    description: str


class CommandEntry(BaseModel):
    id: str
    command: str
    description: str
    category: str
    tags: list[str]
    example: str
    safety: str  # "safe" | "warning" | "dangerous"
    explanation: Optional[str] = None
    flags: Optional[list[CommandFlag]] = None


def _dataset_path() -> Path:
    return Path(__file__).parent / "commands.json"


def load_commands() -> list[CommandEntry]:
    """Load all commands from the JSON dataset file."""
    path = _dataset_path()
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found at {path}")
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [CommandEntry(**item) for item in raw]


def build_search_text(entry: CommandEntry) -> str:
    """Build a single text blob for embedding from a command entry."""
    parts = [
        entry.command,
        entry.description,
        entry.category,
        " ".join(entry.tags),
        entry.example,
    ]
    if entry.explanation:
        parts.append(entry.explanation)
    if entry.flags:
        for flag in entry.flags:
            parts.append(flag.flag)
            parts.append(flag.description)
    return " ".join(parts)

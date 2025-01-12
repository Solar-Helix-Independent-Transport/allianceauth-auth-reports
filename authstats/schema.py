from __future__ import division

from datetime import datetime
from typing import List, Optional

from ninja import Schema


class Message(Schema):
    message: str


class CharacterUpdate(Schema):
    data: str
    updated: datetime


class Character(Schema):
    character_name: str
    character_id: int
    corporation_id: int
    corporation_name: str
    alliance_id: Optional[int] = None
    alliance_name: Optional[str] = None


class Corporation(Schema):
    corporation_id: int
    corporation_name: str
    alliance_id: Optional[int] = None
    alliance_name: Optional[str] = None


class Report(Schema):
    name: str
    id: int


class MenuLink(Schema):
    name: str
    link: str


class MenuCategory(Schema):
    name: str
    links: List[MenuLink]


class CorpHistory(Schema):
    start: datetime
    corporation: Corporation


class CharacterHistory(Schema):
    character: Character
    history: List[CorpHistory] = None


class EveName(Schema):
    id: int
    name: str
    cat: Optional[str] = None

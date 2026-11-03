"""离线检测：合规红线、前 5 秒字数卡点、与对标的相似度。

全部纯本地、无依赖、可单测。判断规则来自 docs/03-文案二创.md 与 docs/02-对标拆解.md。
"""

from __future__ import annotations

import re

# 硬禁词：命中即必须改，AI 写作时也不允许出现
BANNED = {
    "疗效承诺": ["治疗", "治愈", "疗效", "特效", "药到病除", "包治百病", "根治", "立竿见影"],
    "绝对化": ["100%", "百分之百", "彻底", "必定", "一定", "绝对", "永不", "完全逆转"],
    "极限词": ["唯一", "第一名", "史上最", "国家级"],
}

# 软禁词：广告法风险词，但中文里大量正常用法（最后、最近），只能人工确认
SUSPECT = ["最", "第一", "保证", "立刻见效", "逆转", "永久"]

SENTENCE_END = re.compile(r"[。！？!?]")

# 语速 4.2-4.8 字/秒（docs/03），取中值 4.5 换算出的字数上限
LEAD_3S_MAX = 16
LEAD_5S_MAX = 26

SIMILARITY_MAX = 0.10  # docs/02：与对标相似度必须 < 10%
NGRAM = 8  # docs/02：「不得出现与原文相同的连续 8 个字」


def scan(text: str) -> dict:
    """返回 {"errors": [...], "warnings": [...]}，每项是 {word, category, snippet}。"""
    errors, warnings = [], []
    for category, words in BANNED.items():
        for word in words:
            for m in re.finditer(re.escape(word), text):
                errors.append({"word": word, "category": category, "snippet": _snippet(text, m.start())})
    for word in SUSPECT:
        for m in re.finditer(re.escape(word), text):
            warnings.append({"word": word, "category": "需人工确认", "snippet": _snippet(text, m.start())})
    return {"errors": errors, "warnings": warnings}


def _snippet(text: str, index: int, radius: int = 8) -> str:
    return text[max(0, index - radius) : index + radius].replace("\n", " ")


def lead(text: str) -> dict:
    """前 3 秒 / 前 5 秒字数。按句号、问号、感叹号切句。"""
    stripped = text.strip()
    first = SENTENCE_END.split(stripped, maxsplit=1)[0]
    parts = SENTENCE_END.split(stripped)
    second = parts[1] if len(parts) > 1 else ""
    first3 = _count(first)
    first5 = _count(first + second)
    return {
        "first3": {"chars": first3, "text": first.strip(), "ok": first3 <= LEAD_3S_MAX},
        "first5": {"chars": first5, "ok": first5 <= LEAD_5S_MAX},
    }


def _count(text: str) -> int:
    return len(re.sub(r"[\s\W_]", "", text, flags=re.UNICODE))


def similarity(source: str, text: str, n: int = NGRAM) -> float:
    """生成文中有多少比例的 n-gram 原样出现在对标稿里。0.0-1.0。"""
    generated = _ngrams(_normalize(text), n)
    if not generated:
        return 0.0
    original = _ngrams(_normalize(source), n)
    return len(generated & original) / len(generated)


def _normalize(text: str) -> str:
    return re.sub(r"[\s\W_]", "", text, flags=re.UNICODE)


def _ngrams(text: str, n: int) -> set[str]:
    return {text[i : i + n] for i in range(len(text) - n + 1)}


def report(text: str, source: str | None = None) -> dict:
    """汇总所有检测。source 为空时跳过相似度。"""
    result = {"scan": scan(text), "lead": lead(text), "chars": _count(text)}
    if source:
        ratio = similarity(source, text)
        result["similarity"] = {"ratio": ratio, "ok": ratio < SIMILARITY_MAX, "limit": SIMILARITY_MAX}
    result["passed"] = (
        not result["scan"]["errors"]
        and result["lead"]["first3"]["ok"]
        and result["lead"]["first5"]["ok"]
        and result.get("similarity", {"ok": True})["ok"]
    )
    return result

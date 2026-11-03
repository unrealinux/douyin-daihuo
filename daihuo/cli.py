"""命令行入口。

  python -m daihuo gen   --book 抗炎食物 --draft 对标.md [--out out]
  python -m daihuo check --file 文案.md [--draft 对标.md]

gen 需要 LLM_API_KEY；check 完全离线，可用在手工写的文案上。
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

from . import check, llm, prompts


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="daihuo", description="视频号图书带货文案流水线")
    sub = parser.add_subparsers(dest="command", required=True)

    gen = sub.add_parser("gen", help="对标逐字稿 → A/B 两版文案 + 检测报告")
    gen.add_argument("--book", required=True, help="书名")
    gen.add_argument("--draft", required=True, type=pathlib.Path, help="对标逐字稿文件")
    gen.add_argument("--out", default=pathlib.Path("out"), type=pathlib.Path, help="输出目录")

    chk = sub.add_parser("check", help="离线检测一篇现成文案")
    chk.add_argument("--file", required=True, type=pathlib.Path, help="待检测文案")
    chk.add_argument("--draft", type=pathlib.Path, help="对标逐字稿，给了才算相似度")

    args = parser.parse_args(argv)
    if args.command == "gen":
        return _gen(args)
    return _check(args)


def _gen(args) -> int:
    source = _transcript(_read(args.draft))
    if len(source) < 50:
        print(
            f"✗ 对标正文只有 {len(source)} 字，没内容可生成。\n"
            f"  打开 {args.draft}，把元宝提取的逐字稿整段粘到「## 逐字稿」下面。",
            file=sys.stderr,
        )
        return 1
    try:
        llm.config()
    except llm.LLMError as error:
        print(f"✗ {error}", file=sys.stderr)
        return 1

    args.out.mkdir(parents=True, exist_ok=True)
    versions = {
        "A-情感版": prompts.build_a(source, args.book),
        "B-转化版": prompts.build_b(source, args.book),
    }

    failed = False
    for name, user_prompt in versions.items():
        print(f"→ 生成 {name} ...", flush=True)
        try:
            text = llm.chat(prompts.SYSTEM, user_prompt)
        except llm.LLMError as error:
            print(f"✗ {name} 失败：{error}", file=sys.stderr)
            failed = True
            continue
        path = args.out / f"{name}.md"
        path.write_text(text + "\n", encoding="utf-8")
        print(f"  已写入 {path}")
        _print_report(check.report(text, source), name)

    return 1 if failed else 0


def _check(args) -> int:
    text = _read(args.file)
    source = _read(args.draft) if args.draft else None
    result = check.report(text, source)
    _print_report(result, args.file.name)
    return 0 if result["passed"] else 1


def _print_report(result: dict, label: str) -> None:
    scan, lead = result["scan"], result["lead"]
    f3, f5 = lead["first3"], lead["first5"]

    print(f"\n── {label} 检测 ──  正文 {result['chars']} 字")
    print(f"  开头 3 秒：{f3['chars']} 字 {'✓' if f3['ok'] else '✗ 超 16 字'}  「{f3['text'][:20]}」")
    print(f"  开头 5 秒：{f5['chars']} 字 {'✓' if f5['ok'] else '✗ 超 26 字'}")

    if "similarity" in result:
        sim = result["similarity"]
        print(f"  相似度：{sim['ratio']:.1%} {'✓' if sim['ok'] else '✗ 超 10%，必须重写'}")

    if scan["errors"]:
        print(f"  ✗ 硬禁词 {len(scan['errors'])} 处（必须改）：")
        for item in scan["errors"][:10]:
            print(f"      [{item['category']}] {item['word']} … {item['snippet']}")
    else:
        print("  ✓ 无硬禁词")

    if scan["warnings"]:
        print(f"  ! 软禁词 {len(scan['warnings'])} 处（人工确认）：")
        for item in scan["warnings"][:10]:
            print(f"      {item['word']} … {item['snippet']}")

    print(f"  结论：{'通过' if result['passed'] else '不通过'}\n")


def _read(path: pathlib.Path) -> str:
    if not path.exists():
        raise SystemExit(f"文件不存在：{path}")
    return path.read_text(encoding="utf-8")


def _transcript(text: str) -> str:
    """从对标文件里只取正文：去掉元信息、拆解段和注释，避免污染提示词。

    有 `## 逐字稿` 就拿它到 `## 拆解` 之间；没有就当全文都是正文。
    """
    if "## 逐字稿" in text:
        text = text.split("## 逐字稿", 1)[1]
    if "## 拆解" in text:
        text = text.split("## 拆解", 1)[0]
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    lines = [line for line in text.splitlines() if line.strip() and not line.startswith(("#", "- "))]
    return "\n".join(lines).strip()


if __name__ == "__main__":
    raise SystemExit(main())

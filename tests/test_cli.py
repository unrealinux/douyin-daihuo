"""对标文件的正文抽取。python3 -m unittest discover -s tests"""

import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from daihuo.cli import _transcript  # noqa: E402

FULL = """# 对标01

- 链接：https://example.com

## 逐字稿

菜市场里有个东西被低估了。它几块钱一斤。

## 拆解

1. 钩子：菜市场里有个东西被低估了
"""


class TranscriptTest(unittest.TestCase):
    def test_strips_metadata_and_breakdown(self):
        self.assertEqual(_transcript(FULL), "菜市场里有个东西被低估了。它几块钱一斤。")

    def test_plain_text_passes_through(self):
        self.assertEqual(_transcript("一句没有结构的话。\n第二句。"), "一句没有结构的话。\n第二句。")

    def test_removes_html_comment(self):
        text = "## 逐字稿\n<!-- 粘贴位置 -->\n正文在这里。"
        self.assertEqual(_transcript(text), "正文在这里。")

    def test_empty_section_gives_empty_string(self):
        self.assertEqual(_transcript("## 逐字稿\n\n## 拆解\n1. 钩子："), "")


if __name__ == "__main__":
    unittest.main()

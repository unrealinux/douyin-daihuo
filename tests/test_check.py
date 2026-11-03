"""离线检测的回归测试。python3 -m unittest discover -s tests"""

import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from daihuo import check  # noqa: E402


class ScanTest(unittest.TestCase):
    def test_flags_hard_banned_word(self):
        result = check.scan("这本书能根治失眠，彻底改善睡眠。")
        words = {item["word"] for item in result["errors"]}
        self.assertIn("根治", words)
        self.assertIn("彻底", words)

    def test_clean_copy_has_no_errors(self):
        result = check.scan("书中提到，很多人的睡眠问题，其实和晚餐时间有关。")
        self.assertEqual(result["errors"], [])

    def test_suspect_word_is_warning_not_error(self):
        result = check.scan("最后你会发现，最难的是开口。")
        self.assertEqual(result["errors"], [])
        self.assertIn("最", {item["word"] for item in result["warnings"]})

    def test_snippet_contains_context(self):
        result = check.scan("长期失眠不一定要吃药，书中提到了一个办法。")
        self.assertIn("长期失眠", result["errors"][0]["snippet"] if result["errors"] else "")


class LeadTest(unittest.TestCase):
    def test_short_hook_passes(self):
        text = "菜市场里有个东西被低估了。它几块钱一斤，营养高得离谱。"
        result = check.lead(text)
        self.assertTrue(result["first3"]["ok"])
        self.assertEqual(result["first3"]["chars"], 12)
        self.assertTrue(result["first5"]["ok"])

    def test_long_hook_fails(self):
        text = "今天我想跟你聊一个特别重要的话题，关于我们每个人到了中老年之后到底应该怎么吃饭怎么睡觉怎么锻炼身体。"
        result = check.lead(text)
        self.assertFalse(result["first3"]["ok"])
        self.assertFalse(result["first5"]["ok"])

    def test_punctuation_not_counted(self):
        self.assertEqual(check.lead("你好，世界。第二句。")["first3"]["chars"], 4)


class SimilarityTest(unittest.TestCase):
    def test_verbatim_copy_is_flagged(self):
        source = "你有没有注意过菜市场里有一种东西几乎人人都见过，却常年被低估，它价格便宜不起眼。"
        ratio = check.similarity(source, source)
        self.assertGreater(ratio, check.SIMILARITY_MAX)

    def test_rewritten_text_passes(self):
        source = "你有没有注意过菜市场里有一种东西几乎人人都见过，却常年被低估，它价格便宜不起眼。"
        rewritten = "菜摊上那个灰扑扑的袋子，你可能从来没正眼看过。它几块钱一斤，营养却高得离谱。"
        self.assertLess(check.similarity(source, rewritten), check.SIMILARITY_MAX)

    def test_empty_text_is_zero(self):
        self.assertEqual(check.similarity("对标内容在这里", ""), 0.0)


class ReportTest(unittest.TestCase):
    def test_report_fails_on_banned_word(self):
        result = check.report("包治百病的神书。读者都说好。")
        self.assertFalse(result["passed"])

    def test_report_passes_on_clean_short_copy(self):
        text = "很多人以为老了只能认命。书中提到，肌肉还有机会找回来。这不是安慰，是可查的事实。"
        result = check.report(text, source="完全不同的一段对标内容，用来验证相似度为 0。")
        self.assertTrue(result["passed"], result)


if __name__ == "__main__":
    unittest.main()

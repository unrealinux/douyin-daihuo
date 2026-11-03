"""极简 OpenAI 兼容 chat 客户端。只用标准库，不引依赖。

支持 DeepSeek / 通义 / OpenAI / 任何 OpenAI 兼容网关。
配置走环境变量：
  LLM_API_KEY 或 DEEPSEEK_API_KEY   必填
  LLM_BASE_URL   默认 https://api.deepseek.com/v1
  LLM_MODEL      默认 deepseek-chat
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request

DEFAULT_BASE_URL = "https://api.deepseek.com/v1"
DEFAULT_MODEL = "deepseek-chat"
TIMEOUT = 180
RETRIES = 2


class LLMError(RuntimeError):
    pass


def config() -> dict:
    values = {**_dotenv(), **os.environ}
    key = values.get("LLM_API_KEY") or values.get("DEEPSEEK_API_KEY") or values.get("OPENAI_API_KEY")
    if not key:
        raise LLMError(
            "缺少 API key。export DEEPSEEK_API_KEY=sk-xxx（DeepSeek）或 LLM_API_KEY=sk-xxx（其他网关），"
            "也可以直接写进仓库根目录的 .env"
        )
    return {
        "api_key": key,
        "base_url": values.get("LLM_BASE_URL", DEFAULT_BASE_URL).rstrip("/"),
        "model": values.get("LLM_MODEL", DEFAULT_MODEL),
    }


def _dotenv() -> dict:
    """读仓库根目录的 .env（如果存在），省得每次开 shell 都 export。"""
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if not os.path.exists(path):
        return {}
    values = {}
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, _, value = line.partition("=")
            values[name.strip()] = value.strip().strip("\"'")
    return values


def chat(system: str, user: str, temperature: float = 0.8) -> str:
    cfg = config()
    payload = json.dumps(
        {
            "model": cfg["model"],
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
    ).encode()

    last_error = None
    for attempt in range(RETRIES + 1):
        request = urllib.request.Request(
            f"{cfg['base_url']}/chat/completions",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {cfg['api_key']}",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                body = json.loads(response.read().decode())
            return body["choices"][0]["message"]["content"].strip()
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors="replace")[:300]
            last_error = LLMError(f"HTTP {error.code}: {detail}")
            if error.code in (400, 401, 403, 404):
                break
        except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError) as error:
            last_error = LLMError(f"{type(error).__name__}: {error}")
        if attempt < RETRIES:
            time.sleep(2 * (attempt + 1))
    raise last_error or LLMError("调用失败")

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import { EmptyState, ErrorBanner, PageHeader, Skeleton } from "@/components/PageChrome";
import { useToast } from "@/components/Toast";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";
import { PLATFORM_LABEL, TRACKS } from "@/lib/selectionUtils";
import { heatScore } from "@/lib/benchmarkUtils";

interface Benchmark {
  id: number;
  title: string;
  platform?: string | null;
  track?: string | null;
  author?: string | null;
  url?: string | null;
  transcript?: string | null;
  durationSec?: number | null;
  views?: number | null;
  likes?: number | null;
  favorites?: number | null;
  shares?: number | null;
  comments?: number | null;
  publishedAt?: string | null;
  hookType?: string | null;
  breakdown?: string | null;
  note?: string | null;
  createdAt: string;
}

const emptyForm = {
  title: "", platform: "", track: "", author: "", url: "", transcript: "",
  durationSec: "", views: "", likes: "", favorites: "", shares: "", comments: "",
  publishedAt: "", hookType: "", breakdown: "", note: "",
};

type FormState = typeof emptyForm;

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

function toForm(b: Benchmark): FormState {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    title: b.title,
    platform: b.platform ?? "",
    track: b.track ?? "",
    author: s(b.author),
    url: s(b.url),
    transcript: s(b.transcript),
    durationSec: s(b.durationSec),
    views: s(b.views),
    likes: s(b.likes),
    favorites: s(b.favorites),
    shares: s(b.shares),
    comments: s(b.comments),
    publishedAt: b.publishedAt ? b.publishedAt.slice(0, 16) : "",
    hookType: s(b.hookType),
    breakdown: s(b.breakdown),
    note: s(b.note),
  };
}

export default function BenchmarksPage() {
  const toast = useToast();
  const [items, setItems] = useState<Benchmark[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [track, setTrack] = useState("ALL");
  const [platform, setPlatform] = useState("ALL");
  const [sort, setSort] = useState("hot");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<Benchmark | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<Benchmark | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setKeyword(keywordInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [keywordInput]);

  const load = useCallback(async () => {
    setErr("");
    try {
      const q = new URLSearchParams();
      if (track !== "ALL") q.set("track", track);
      if (platform !== "ALL") q.set("platform", platform);
      if (keyword) q.set("keyword", keyword);
      q.set("sort", sort);
      const res = await fetch(`/api/benchmarks?${q.toString()}`);
      if (!res.ok) throw new Error("加载对标库失败");
      const data = await res.json();
      setItems(data.items ?? []);
      setTracks(data.tracks ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [track, platform, keyword, sort]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (b: Benchmark) => {
    setEditing(b);
    setForm(toForm(b));
    setModalOpen(true);
  };

  const set = (k: keyof FormState, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) {
      toast("请填写对标标题", "danger");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      platform: form.platform || null,
      track: form.track || null,
      author: form.author || null,
      url: form.url || null,
      transcript: form.transcript || null,
      durationSec: num(form.durationSec),
      views: num(form.views),
      likes: num(form.likes),
      favorites: num(form.favorites),
      shares: num(form.shares),
      comments: num(form.comments),
      publishedAt: form.publishedAt || null,
      hookType: form.hookType || null,
      breakdown: form.breakdown || null,
      note: form.note || null,
    };
    try {
      const res = await fetch(editing ? `/api/benchmarks/${editing.id}` : "/api/benchmarks", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "保存失败");
      }
      toast(editing ? "对标已更新" : "对标已入库", "success");
      setModalOpen(false);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "danger");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!del) return;
    const res = await fetch(`/api/benchmarks/${del.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("删除失败", "danger");
      return;
    }
    toast("已删除", "success");
    setDel(null);
    load();
  };

  const trackOptions = useMemo(() => Array.from(new Set([...TRACKS, ...tracks])), [tracks]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="对标选题库"
        description="沉淀爆款对标与拆解，二创时锁两头破中间"
        actions={<Button onClick={openCreate}>新增对标</Button>}
      />

      {err && <ErrorBanner message={err} onRetry={load} />}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line/60 bg-surface/60 p-2.5 backdrop-blur">
        <Select value={track} onChange={(e) => setTrack(e.target.value)}>
          <option value="ALL">全部赛道</option>
          {trackOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="ALL">全部平台</option>
          {Object.entries(PLATFORM_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </Select>
        <Input
          placeholder="搜索标题/作者/文案"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          className="w-full sm:w-56"
        />
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="hot">按热度</option>
          <option value="recent">按入库时间</option>
        </Select>
        <span className="ml-auto text-xs text-fg-2">共 {items.length} 条</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {items.map((b, i) => (
            <Reveal key={b.id} delay={Math.min(i % 6, 5) * 60}>
              <Spotlight className="h-full">
                <Card hover className="flex h-full flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 text-[15px] font-medium text-fg">{b.title}</h3>
                    <span className="tnum shrink-0 rounded-md bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                      热度 {heatScore(b)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-fg-2">
                    {b.track && <span className="rounded-md bg-white/5 px-1.5 py-0.5">{b.track}</span>}
                    {b.platform && <span className="rounded-md bg-white/5 px-1.5 py-0.5">{PLATFORM_LABEL[b.platform as keyof typeof PLATFORM_LABEL] ?? b.platform}</span>}
                    {b.author && <span className="truncate">@{b.author}</span>}
                    {b.hookType && <span className="rounded-md bg-white/5 px-1.5 py-0.5">钩子：{b.hookType}</span>}
                  </div>
                  <div className="tnum mt-2 grid grid-cols-3 gap-x-3 gap-y-1 text-xs text-fg-2 sm:grid-cols-5">
                    <div>播放 {b.views ?? "-"}</div>
                    <div>赞 {b.likes ?? "-"}</div>
                    <div>藏 {b.favorites ?? "-"}</div>
                    <div>转 {b.shares ?? "-"}</div>
                    <div>评 {b.comments ?? "-"}</div>
                  </div>
                  {b.breakdown && (
                    <p className={`mt-2 text-xs leading-relaxed text-fg-2 ${expanded === b.id ? "" : "line-clamp-2"}`}>{b.breakdown}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/50 pt-3">
                    <Link href={`/scripts/generate?benchmarkId=${b.id}${b.track ? `&track=${encodeURIComponent(b.track)}` : ""}`}>
                      <Button>用它对标二创</Button>
                    </Link>
                    {(b.transcript || b.breakdown) && (
                      <Button variant="ghost" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                        {expanded === b.id ? "收起" : "查看拆解"}
                      </Button>
                    )}
                    {b.url && <a href={b.url} target="_blank" rel="noreferrer" className="text-sm text-fg-2 hover:text-accent">原视频</a>}
                    <Button variant="ghost" className="ml-auto" onClick={() => openEdit(b)}>编辑</Button>
                    <Button variant="ghost" className="text-danger/80 hover:bg-danger/10 hover:text-danger" onClick={() => setDel(b)}>删除</Button>
                  </div>
                  {expanded === b.id && b.transcript && (
                    <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-line/50 bg-black/20 p-3 text-xs leading-relaxed text-fg-2">{b.transcript}</pre>
                  )}
                </Card>
              </Spotlight>
            </Reveal>
          ))}
          {items.length === 0 && (
            <EmptyState
              title="对标库还是空的"
              description="刷到爆款对标时，把口播文案、数据和结构拆解录进来，形成可复用的选题资产"
            />
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        wide
        title={editing ? "编辑对标" : "新增对标"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={save} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div><Label>标题 *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>赛道</Label>
              <Select value={form.track} onChange={(e) => set("track", e.target.value)}>
                <option value="">未指定</option>
                {trackOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label>平台</Label>
              <Select value={form.platform} onChange={(e) => set("platform", e.target.value)}>
                <option value="">未指定</option>
                {Object.entries(PLATFORM_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </Select>
            </div>
            <div><Label>作者</Label><Input value={form.author} onChange={(e) => set("author", e.target.value)} /></div>
          </div>
          <div><Label>原视频链接</Label><Input value={form.url} onChange={(e) => set("url", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div><Label>播放</Label><Input type="number" value={form.views} onChange={(e) => set("views", e.target.value)} /></div>
            <div><Label>点赞</Label><Input type="number" value={form.likes} onChange={(e) => set("likes", e.target.value)} /></div>
            <div><Label>收藏</Label><Input type="number" value={form.favorites} onChange={(e) => set("favorites", e.target.value)} /></div>
            <div><Label>转发</Label><Input type="number" value={form.shares} onChange={(e) => set("shares", e.target.value)} /></div>
            <div><Label>评论</Label><Input type="number" value={form.comments} onChange={(e) => set("comments", e.target.value)} /></div>
            <div><Label>时长（秒）</Label><Input type="number" value={form.durationSec} onChange={(e) => set("durationSec", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Label>钩子类型</Label><Input placeholder="悬念 / 反常识 / 痛点" value={form.hookType} onChange={(e) => set("hookType", e.target.value)} /></div>
            <div><Label>发布时间</Label><Input type="datetime-local" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} /></div>
          </div>
          <div>
            <Label>口播逐字稿（二创参考，禁止搬运）</Label>
            <Textarea rows={5} value={form.transcript} onChange={(e) => set("transcript", e.target.value)} />
          </div>
          <div>
            <Label>结构拆解（开场/卖点/痛点/承接）</Label>
            <Textarea rows={4} value={form.breakdown} onChange={(e) => set("breakdown", e.target.value)} />
          </div>
          <div><Label>备注</Label><Input value={form.note} onChange={(e) => set("note", e.target.value)} /></div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        title="删除对标"
        message={`确认删除「${del?.title ?? ""}」？已引用它的脚本会保留，但失去对标来源。`}
        onCancel={() => setDel(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

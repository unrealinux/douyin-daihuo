"use client";

import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState, ErrorBanner, PageHeader, Skeleton } from "@/components/PageChrome";
import { useToast } from "@/components/Toast";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";
import { PLATFORM_LABEL, TRACKS } from "@/lib/selectionUtils";

interface AccountStats {
  total: number;
  published: number;
  measured: number;
  views: number;
  orderCount: number;
  gmv: number;
  commission: number;
  avgViews: number;
  avgCompletionRate: number | null;
  avgThreeSecRate: number | null;
  conversionRate: number | null;
  gmvPerPost: number;
}

interface Account {
  id: number;
  name: string;
  platform?: string | null;
  track?: string | null;
  handle?: string | null;
  status: string;
  followerCount?: number | null;
  note?: string | null;
  stats: AccountStats;
}

const emptyForm = {
  name: "", platform: "", track: "", handle: "", status: "ACTIVE", followerCount: "", note: "",
};
type FormState = typeof emptyForm;

const fmt = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 0 });

function toForm(a: Account): FormState {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    name: a.name,
    platform: a.platform ?? "",
    track: a.track ?? "",
    handle: s(a.handle),
    status: a.status,
    followerCount: s(a.followerCount),
    note: s(a.note),
  };
}

export default function AccountsPage() {
  const toast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<Account | null>(null);

  const load = useCallback(async () => {
    setErr("");
    try {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("加载账号失败");
      setAccounts(await res.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof FormState, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setForm(toForm(a));
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast("请填写账号名称", "danger");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      platform: form.platform || null,
      track: form.track || null,
      handle: form.handle || null,
      status: form.status,
      followerCount: form.followerCount === "" ? null : Number(form.followerCount),
      note: form.note || null,
    };
    try {
      const res = await fetch(editing ? `/api/accounts/${editing.id}` : "/api/accounts", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "保存失败");
      }
      toast(editing ? "账号已更新" : "账号已创建", "success");
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
    const res = await fetch(`/api/accounts/${del.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("删除失败", "danger");
      return;
    }
    toast("账号已删除，排期已解除关联", "success");
    setDel(null);
    load();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="账号矩阵"
        description="一个账号可承载多条排期，横向对比多账号表现"
        actions={<Button onClick={openCreate}>新增账号</Button>}
      />

      {err && <ErrorBanner message={err} onRetry={load} />}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a, i) => (
            <Reveal key={a.id} delay={Math.min(i % 6, 5) * 60}>
              <Spotlight className="h-full">
                <Card hover className="flex h-full flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-medium text-fg">{a.name}</div>
                      <div className="mt-0.5 text-xs text-fg-2">
                        {a.handle ? `@${a.handle}` : "未填账号 ID"}
                        {a.followerCount != null ? ` · 粉丝 ${fmt(a.followerCount)}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-fg-2">
                    {a.track && <span className="rounded-md bg-white/5 px-1.5 py-0.5">{a.track}</span>}
                    {a.platform && <span className="rounded-md bg-white/5 px-1.5 py-0.5">{PLATFORM_LABEL[a.platform as keyof typeof PLATFORM_LABEL] ?? a.platform}</span>}
                  </div>
                  <div className="tnum mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-fg-2">
                    <div>排期 {a.stats.total} · 已发布 {a.stats.published}</div>
                    <div>已测 {a.stats.measured}</div>
                    <div>播放 {fmt(a.stats.views)}</div>
                    <div>GMV ¥{fmt(a.stats.gmv)}</div>
                    <div>佣金 ¥{fmt(a.stats.commission)}</div>
                    <div>均播 {fmt(a.stats.avgViews)}</div>
                    <div>完播率 {a.stats.avgCompletionRate != null ? `${a.stats.avgCompletionRate}%` : "-"}</div>
                    <div>转化率 {a.stats.conversionRate != null ? `${a.stats.conversionRate}%` : "-"}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-line/50 pt-3">
                    <Button variant="ghost" onClick={() => openEdit(a)}>编辑</Button>
                    <Button variant="ghost" className="ml-auto text-danger/80 hover:bg-danger/10 hover:text-danger" onClick={() => setDel(a)}>删除</Button>
                  </div>
                </Card>
              </Spotlight>
            </Reveal>
          ))}
          {accounts.length === 0 && (
            <EmptyState
              title="还没有账号"
              description="把在运营的抖音 / 视频号账号建进来，排期时选择账号即可统计矩阵表现"
            />
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? "编辑账号" : "新增账号"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={save} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div><Label>账号名称 *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>平台</Label>
              <Select value={form.platform} onChange={(e) => set("platform", e.target.value)}>
                <option value="">未指定</option>
                {Object.entries(PLATFORM_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </Select>
            </div>
            <div>
              <Label>赛道</Label>
              <Select value={form.track} onChange={(e) => set("track", e.target.value)}>
                <option value="">未指定</option>
                {TRACKS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
          </div>
          <div><Label>账号 ID / 昵称</Label><Input value={form.handle} onChange={(e) => set("handle", e.target.value)} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>状态</Label>
              <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="ACTIVE">运营中</option>
                <option value="PAUSED">已暂停</option>
                <option value="DEAD">已弃用</option>
              </Select>
            </div>
            <div><Label>粉丝数</Label><Input type="number" value={form.followerCount} onChange={(e) => set("followerCount", e.target.value)} /></div>
          </div>
          <div><Label>备注</Label><Input value={form.note} onChange={(e) => set("note", e.target.value)} /></div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        title="删除账号"
        message={`确认删除「${del?.name ?? ""}」？相关排期会保留，但解除账号关联。`}
        onCancel={() => setDel(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { EmptyState, ErrorBanner, PageHeader, Skeleton } from "@/components/PageChrome";
import { useToast } from "@/components/Toast";
import Modal from "@/components/Modal";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import Reveal from "@/components/Reveal";
import Spotlight from "@/components/Spotlight";
import { diagnosePerformance } from "@/lib/performanceUtils";
import { PLATFORM_LABEL } from "@/lib/selectionUtils";
import {
  PUBLISH_CHECKLIST,
  checklistProgress,
  parseChecklist,
  serializeChecklist,
  type ChecklistState,
} from "@/lib/publishChecklist";

interface Asset {
  id: number; fileName: string; filePath: string; fileType: string; size: number;
  title?: string | null; status: string; createdAt: string;
  product?: { id: number; name: string } | null;
  script?: { id: number; title?: string | null } | null;
  schedules: Schedule[];
}

interface Schedule {
  id: number; assetId?: number; scheduledAt: string; publishStatus: string; publishUrl?: string | null;
  accountId?: number | null; account?: { id: number; name: string } | null;
  checklist?: string | null; publishTitle?: string | null; publishHashtags?: string | null; commentScript?: string | null;
  asset?: { title?: string | null; fileName: string } | null;
}

interface ProductOpt { id: number; name: string }
interface AccountOpt { id: number; name: string; platform?: string | null }
interface ScriptOpt { id: number; title?: string | null; product?: { id: number; name: string } | null }

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function schedulePresets(): { value: string; label: string }[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(10, 0, 0, 0);

  const friday = new Date();
  const day = friday.getDay();
  let daysUntilFri = (5 - day + 7) % 7;
  if (daysUntilFri === 0 && friday.getHours() >= 19) daysUntilFri = 7;
  friday.setDate(friday.getDate() + daysUntilFri);
  friday.setHours(19, 0, 0, 0);

  return [
    { value: toLocalInputValue(tomorrow), label: "明早10点" },
    { value: toLocalInputValue(dayAfter), label: "后天10点" },
    { value: toLocalInputValue(friday), label: "周五晚7点" },
  ];
}

function filePublicUrl(filePath: string) {
  const name = filePath.split(/[/\\]/).pop();
  return name ? `/api/files/${encodeURIComponent(name)}` : "";
}

export default function AssetsPage() {
  const toast = useToast();
  const presets = useMemo(() => schedulePresets(), []);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [accounts, setAccounts] = useState<AccountOpt[]>([]);
  const [scripts, setScripts] = useState<ScriptOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProductId, setUploadProductId] = useState("");
  const [uploadScriptId, setUploadScriptId] = useState("");
  const [del, setDel] = useState<Asset | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<Record<number, string>>({});
  const [publishTarget, setPublishTarget] = useState<Schedule | null>(null);
  const [publishUrl, setPublishUrl] = useState("");
  const [checklist, setChecklist] = useState<ChecklistState>(() => parseChecklist(null));
  const [publishTitle, setPublishTitle] = useState("");
  const [publishHashtags, setPublishHashtags] = useState("");
  const [publishComment, setPublishComment] = useState("");
  const [publishAccountId, setPublishAccountId] = useState("");
  const [perfTarget, setPerfTarget] = useState<Schedule | null>(null);
  const [perfForm, setPerfForm] = useState({ views: "", likes: "", comments: "", shares: "", favorites: "", orderCount: "", gmv: "", commission: "", completionRate: "", threeSecRate: "", avgWatchSec: "" });

  const load = useCallback(async () => {
    setErr("");
    try {
      const [aRes, sRes, pRes, scRes, acRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/schedules"),
        fetch("/api/products?status=ALL"),
        fetch("/api/scripts"),
        fetch("/api/accounts"),
      ]);
      if (!aRes.ok || !sRes.ok) throw new Error("加载失败");
      setAssets(await aRes.json());
      setSchedules(await sRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (scRes.ok) setScripts(await scRes.json());
      if (acRes.ok) setAccounts(await acRes.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredScripts = uploadProductId
    ? scripts.filter((s) => !s.product || String(s.product.id) === uploadProductId)
    : scripts;

  const submitUpload = async () => {
    if (!uploadFile) {
      toast("请选择文件", "danger");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", uploadFile);
    if (uploadProductId) fd.append("productId", uploadProductId);
    if (uploadScriptId) fd.append("scriptId", uploadScriptId);
    try {
      const res = await fetch("/api/assets/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "上传失败", "danger");
      } else {
        toast("素材已上传", "success");
        setUploadOpen(false);
        setUploadFile(null);
        setUploadProductId("");
        setUploadScriptId("");
        load();
      }
    } catch (e) {
      toast(String(e), "danger");
    }
    setUploading(false);
  };

  const linkAsset = async (id: number, field: "productId" | "scriptId", value: string) => {
    const body = { [field]: value === "" ? null : Number(value) };
    const res = await fetch(`/api/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast("关联失败", "danger");
      return;
    }
    load();
  };

  const createSchedule = async (assetId: number) => {
    const dateStr = scheduleDraft[assetId];
    if (!dateStr) {
      toast("请选择或填写排期时间", "danger");
      return;
    }
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, scheduledAt: dateStr }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error ?? "创建排期失败", "danger");
      return;
    }
    toast("已添加排期", "success");
    setScheduleDraft((prev) => ({ ...prev, [assetId]: "" }));
    load();
  };

  const openPublish = (s: Schedule) => {
    setPublishTarget(s);
    setPublishUrl(s.publishUrl ?? "");
    setChecklist(parseChecklist(s.checklist));
    setPublishTitle(s.publishTitle ?? "");
    setPublishHashtags(s.publishHashtags ?? "");
    setPublishComment(s.commentScript ?? s.asset?.title ?? "");
    setPublishAccountId(s.accountId ? String(s.accountId) : "");
  };

  const toggleCheck = (key: string) => setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const publishProgress = checklistProgress(checklist);

  const saveChecklist = async () => {
    if (!publishTarget) return;
    const res = await fetch(`/api/schedules/${publishTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checklist: serializeChecklist(checklist),
        publishTitle: publishTitle || undefined,
        publishHashtags: publishHashtags || undefined,
        commentScript: publishComment || undefined,
        accountId: publishAccountId ? Number(publishAccountId) : null,
      }),
    });
    if (!res.ok) {
      toast("保存自检失败", "danger");
      return;
    }
    toast("自检已保存", "success");
    load();
  };

  const confirmPublish = async () => {
    if (!publishTarget) return;
    const res = await fetch(`/api/schedules/${publishTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publishStatus: "PUBLISHED",
        publishUrl: publishUrl || undefined,
        publishedAt: new Date().toISOString(),
        checklist: serializeChecklist(checklist),
        publishTitle: publishTitle || undefined,
        publishHashtags: publishHashtags || undefined,
        commentScript: publishComment || undefined,
        accountId: publishAccountId ? Number(publishAccountId) : null,
      }),
    });
    if (!res.ok) {
      toast("标记发布失败", "danger");
      return;
    }
    toast("已标记为已发布", "success");
    setPublishTarget(null);
    setPublishUrl("");
    load();
  };

  const openPerformance = (s: Schedule) => {
    setPerfTarget(s);
    setPerfForm({ views: "", likes: "", comments: "", shares: "", favorites: "", orderCount: "", gmv: "", commission: "", completionRate: "", threeSecRate: "", avgWatchSec: "" });
  };

  const submitPerformance = async () => {
    if (!perfTarget) return;
    const toNum = (v: string) => (v === "" ? undefined : Number(v));
    const res = await fetch(`/api/performance/${perfTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        views: toNum(perfForm.views),
        likes: toNum(perfForm.likes),
        comments: toNum(perfForm.comments),
        shares: toNum(perfForm.shares),
        favorites: toNum(perfForm.favorites),
        orderCount: toNum(perfForm.orderCount),
        gmv: toNum(perfForm.gmv),
        commission: toNum(perfForm.commission),
        completionRate: toNum(perfForm.completionRate),
        threeSecRate: toNum(perfForm.threeSecRate),
        avgWatchSec: toNum(perfForm.avgWatchSec),
      }),
    });
    if (!res.ok) {
      toast("保存效果失败", "danger");
      return;
    }
    toast("效果已保存", "success");
    setPerfTarget(null);
    load();
  };

  const delAsset = async () => {
    if (!del) return;
    const res = await fetch(`/api/assets/${del.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("删除失败", "danger");
      return;
    }
    toast("素材已删除", "success");
    setDel(null);
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="素材与排期"
        description="上传、关联商品/脚本，再安排发布时间"
        actions={<Button onClick={() => setUploadOpen(true)}>上传素材</Button>}
      />

      {err && <ErrorBanner message={err} onRetry={load} />}

      <section>
        <h2 className="mb-3 text-sm font-medium text-fg-2">素材库（{assets.length}）</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {assets.map((a, idx) => {
              const url = filePublicUrl(a.filePath);
              const draft = scheduleDraft[a.id] ?? "";
              return (
                <Reveal key={a.id} delay={Math.min(idx % 8, 7) * 50}>
                  <Spotlight className="h-full">
                    <Card hover className="h-full overflow-hidden p-0">
                      <div className="relative aspect-video bg-black/40">
                        {url && a.fileType === "IMAGE" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={a.fileName} className="h-full w-full object-cover" />
                        ) : url ? (
                          <video src={url} className="h-full w-full object-cover" muted preload="metadata" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-fg-2">无预览</div>
                        )}
                        {url && a.fileType !== "IMAGE" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover/spot:bg-black/30">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white opacity-0 backdrop-blur transition-all duration-300 ease-out-expo group-hover/spot:scale-100 group-hover/spot:opacity-100">
                              <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px]" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          </div>
                        )}
                        <div className="absolute left-2 top-2"><StatusBadge status={a.status} /></div>
                        <button onClick={() => setDel(a)} className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white/80 backdrop-blur transition-colors duration-150 hover:bg-danger/90 hover:text-white">删除</button>
                      </div>
                      <div className="space-y-2 p-3">
                        <div className="truncate text-[15px] font-medium text-fg">{a.title ?? a.fileName}</div>
                    <Select
                      value={a.product?.id ? String(a.product.id) : ""}
                      onChange={(e) => linkAsset(a.id, "productId", e.target.value)}
                      className="w-full text-xs"
                    >
                      <option value="">未关联商品</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Select>
                    <Select
                      value={a.script?.id ? String(a.script.id) : ""}
                      onChange={(e) => linkAsset(a.id, "scriptId", e.target.value)}
                      className="w-full text-xs"
                    >
                      <option value="">未关联脚本</option>
                      {scripts.map((s) => (
                        <option key={s.id} value={s.id}>{s.title ?? `脚本 #${s.id}`}</option>
                      ))}
                    </Select>
                    <div className="space-y-1.5">
                      <Select
                        value={!draft ? "" : presets.some((p) => p.value === draft) ? draft : "__custom__"}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "__custom__") {
                            setScheduleDraft((prev) => ({ ...prev, [a.id]: toLocalInputValue(new Date()) }));
                          } else {
                            setScheduleDraft((prev) => ({ ...prev, [a.id]: v }));
                          }
                        }}
                        className="w-full text-xs"
                      >
                        <option value="">+ 选择排期</option>
                        {presets.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        <option value="__custom__">自定义时间…</option>
                      </Select>
                      {draft && !presets.some((p) => p.value === draft) && (
                        <Input
                          type="datetime-local"
                          value={draft}
                          onChange={(e) => setScheduleDraft((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          className="text-xs"
                        />
                      )}
                      <Button className="w-full text-xs" onClick={() => createSchedule(a.id)}>
                        确定排期
                      </Button>
                    </div>
                    {a.schedules.length > 0 && (
                      <div className="space-y-1 text-xs">
                        {a.schedules.map((s) => (
                          <div key={s.id} className="flex items-center justify-between gap-1 rounded-lg bg-white/5 px-2 py-1">
                            <span className="tnum text-fg-2">{new Date(s.scheduledAt).toLocaleString()}</span>
                            <div className="flex items-center gap-1">
                              <StatusBadge status={s.publishStatus} />
                              {(() => {
                                const cp = checklistProgress(parseChecklist(s.checklist));
                                return (
                                  <span className={`text-[10px] ${cp.redlineMissing.length ? "text-danger" : cp.ready ? "text-success" : "text-fg-2"}`}>
                                    自检 {cp.done}/{cp.total}
                                  </span>
                                );
                              })()}
                              {s.publishStatus === "PLANNED" && (
                                <Button
                                  variant="ghost"
                                  className="text-xs"
                                  onClick={() => openPublish(s)}
                                >
                                  发布
                                </Button>
                              )}
                              {s.publishStatus === "PUBLISHED" && (
                                <Button
                                  variant="ghost"
                                  className="text-xs"
                                  onClick={() => openPerformance(s)}
                                >
                                  记效果
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </Card>
                  </Spotlight>
                </Reveal>
              );
            })}
            {assets.length === 0 && (
              <EmptyState title="暂无素材" description="上传时可关联商品和脚本，再安排发布排期" />
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-fg-2">排期时间线</h2>
        <div className="space-y-1.5">
          {schedules.map((s, idx) => {
            const fromList =
              assets.find((a) => a.id === s.assetId) ??
              assets.find((a) => a.schedules.some((x) => x.id === s.id));
            const title =
              s.asset?.title ?? s.asset?.fileName ?? fromList?.title ?? fromList?.fileName ?? "素材已删除";
            return (
              <Reveal key={s.id} delay={Math.min(idx % 10, 9) * 40}>
                <div className="group relative flex items-stretch gap-3">
                  <div className="flex flex-col items-center pt-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.publishStatus === "PUBLISHED" ? "bg-success" : s.publishStatus === "PLANNED" ? "bg-cyan-400 animate-pulse" : "bg-warning"}`} />
                    {idx < schedules.length - 1 && <span className="mt-1 w-px flex-1 bg-line/60" />}
                  </div>
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-xl border border-line/60 bg-surface px-3.5 py-2.5 text-sm transition-colors duration-150 group-hover:border-white/10">
                    <div className="min-w-0">
                      <span className="tnum font-medium text-fg">{new Date(s.scheduledAt).toLocaleString()}</span>
                      <span className="ml-3 text-fg-2">{title}</span>
                      {s.account && (
                        <span className="ml-2 rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-fg-2">{s.account.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.publishStatus} />
                      {(() => {
                        const cp = checklistProgress(parseChecklist(s.checklist));
                        return (
                          <span className={`text-[10px] ${cp.redlineMissing.length ? "text-danger" : cp.ready ? "text-success" : "text-fg-2"}`}>
                            自检 {cp.done}/{cp.total}
                          </span>
                        );
                      })()}
                      {s.publishUrl && (
                        <a href={s.publishUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-300 transition-colors hover:text-cyan">
                          链接
                        </a>
                      )}
                      {s.publishStatus === "PLANNED" && (
                        <Button
                          variant="ghost"
                          className="text-xs"
                          onClick={() => openPublish(s)}
                        >
                          标记发布
                        </Button>
                      )}
                      {s.publishStatus === "PUBLISHED" && (
                        <Button
                          variant="ghost"
                          className="text-xs"
                          onClick={() => openPerformance(s)}
                        >
                          记效果
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
          {!loading && schedules.length === 0 && (
            <div className="py-6 text-center text-sm text-fg-2">暂无排期</div>
          )}
        </div>
      </section>

      <Modal
        open={uploadOpen}
        title="上传素材"
        onClose={() => { if (!uploading) setUploadOpen(false); }}
        footer={
          <>
            <Button variant="secondary" onClick={() => setUploadOpen(false)} disabled={uploading}>取消</Button>
            <Button onClick={submitUpload} disabled={uploading || !uploadFile}>{uploading ? "上传中..." : "上传"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block cursor-pointer rounded-xl border border-dashed border-line bg-white/[0.03] px-4 py-8 text-center text-sm text-fg-2 transition-all duration-200 ease-out-expo hover:border-accent/50 hover:bg-accent/[0.04] hover:text-white active:scale-[0.99]">
            {uploadFile ? <span className="font-medium text-fg">{uploadFile.name}</span> : "点击选择视频或图片"}
            <input
              type="file"
              accept="video/*,image/*,.mp4,.mov,.webm,.jpg,.jpeg,.png,.gif,.webp"
              className="hidden"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div>
            <Label htmlFor="up-product">关联商品（可选）</Label>
            <Select
              id="up-product"
              value={uploadProductId}
              onChange={(e) => {
                setUploadProductId(e.target.value);
                setUploadScriptId("");
              }}
              className="w-full"
            >
              <option value="">不关联</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="up-script">关联脚本（可选）</Label>
            <Select id="up-script" value={uploadScriptId} onChange={(e) => setUploadScriptId(e.target.value)} className="w-full">
              <option value="">不关联</option>
              {filteredScripts.map((s) => (
                <option key={s.id} value={s.id}>{s.title ?? `脚本 #${s.id}`}</option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!publishTarget}
        title="发布前自检与标记发布"
        onClose={() => setPublishTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPublishTarget(null)}>取消</Button>
            <Button variant="ghost" onClick={saveChecklist}>保存自检</Button>
            <Button onClick={confirmPublish} disabled={publishProgress.redlineMissing.length > 0}>
              确认发布
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-fg-2">发布前自检清单</span>
              <span className={`text-xs ${publishProgress.redlineMissing.length ? "text-danger" : publishProgress.ready ? "text-success" : "text-warning"}`}>
                {publishProgress.done}/{publishProgress.total}
                {publishProgress.redlineMissing.length ? " · 红线未过" : publishProgress.ready ? " · 可发布" : " · 待完成"}
              </span>
            </div>
            <div className="space-y-1.5">
              {PUBLISH_CHECKLIST.map((item) => (
                <label key={item.key} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded accent-accent"
                    checked={!!checklist[item.key]}
                    onChange={() => toggleCheck(item.key)}
                  />
                  <span className={item.redline ? "text-fg" : "text-fg-2"}>
                    {item.label}
                    {item.redline && <span className="ml-1 text-[10px] text-danger">红线</span>}
                  </span>
                </label>
              ))}
            </div>
            {publishProgress.redlineMissing.length > 0 && (
              <p className="mt-2 text-xs text-danger">完成全部红线项后才能标记发布：{publishProgress.redlineMissing.join("、")}</p>
            )}
          </div>

          <div className="space-y-3 border-t border-line/50 pt-3">
            <div>
              <Label htmlFor="publish-account">发布账号</Label>
              <Select id="publish-account" value={publishAccountId} onChange={(e) => setPublishAccountId(e.target.value)}>
                <option value="">未指定</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.platform ? ` · ${PLATFORM_LABEL[a.platform as keyof typeof PLATFORM_LABEL] ?? a.platform}` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="publish-title">发布标题</Label>
              <Input id="publish-title" value={publishTitle} onChange={(e) => setPublishTitle(e.target.value)} placeholder="沿用脚本标题即可" />
            </div>
            <div>
              <Label htmlFor="publish-tags">话题标签</Label>
              <Input id="publish-tags" value={publishHashtags} onChange={(e) => setPublishHashtags(e.target.value)} placeholder="#历史 #读书" />
            </div>
            <div>
              <Label htmlFor="publish-comment">评论区带货话术</Label>
              <Textarea id="publish-comment" rows={2} value={publishComment} onChange={(e) => setPublishComment(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="publish-url">抖音链接（可留空）</Label>
              <Input
                id="publish-url"
                value={publishUrl}
                onChange={(e) => setPublishUrl(e.target.value)}
                placeholder="https://www.douyin.com/..."
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!perfTarget}
        title="记录发布效果"
        onClose={() => setPerfTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPerfTarget(null)}>取消</Button>
            <Button onClick={submitPerformance}>保存</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          {([
            ["views", "播放量"],
            ["likes", "点赞"],
            ["comments", "评论"],
            ["shares", "分享"],
            ["favorites", "收藏"],
            ["orderCount", "成交单"],
            ["gmv", "成交金额 ¥"],
            ["commission", "佣金 ¥"],
            ["completionRate", "完播率 %"],
            ["threeSecRate", "3 秒播放率 %"],
            ["avgWatchSec", "平均播放时长 秒"],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`perf-${key}`}>{label}</Label>
              <Input
                id={`perf-${key}`}
                type="number"
                min="0"
                value={perfForm[key]}
                onChange={(e) => setPerfForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {(() => {
          const n = (v: string) => (v === "" ? undefined : Number(v));
          const d = diagnosePerformance({
            views: n(perfForm.views),
            completionRate: n(perfForm.completionRate),
            threeSecRate: n(perfForm.threeSecRate),
          });
          if (d.level === "unknown") {
            return <p className="mt-3 text-xs text-fg-2">合格线：完播率 &gt;20%、3 秒播放率 &gt;30%</p>;
          }
          return (
            <div className={`mt-3 rounded-lg border p-3 text-xs ${d.level === "good" ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}>
              <p className="font-medium">{d.level === "good" ? "复盘诊断：指标达标" : "复盘诊断：需优化"}</p>
              {d.issues.map((s) => <p key={s} className="mt-1">· {s}</p>)}
              {d.suggestions.map((s) => <p key={s} className="mt-1 opacity-90">→ {s}</p>)}
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog
        open={!!del}
        title="删除素材"
        message={`确定删除「${del?.title ?? del?.fileName}」？将同时删除磁盘文件。`}
        onConfirm={delAsset}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}

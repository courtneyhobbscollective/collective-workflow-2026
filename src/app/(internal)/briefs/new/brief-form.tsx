"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrief } from "@/app/actions";

type ClientOption = { id: string; name: string };
type ScopeOption = { id: string; name: string; clientId: string };

export type BriefTypeUI = "web_design_dev" | "app_dev" | "video" | "photo" | "design" | "content";

function labelForType(t: BriefTypeUI) {
  switch (t) {
    case "web_design_dev":
      return "Web Design & Dev";
    case "app_dev":
      return "App Dev";
    case "video":
      return "Video";
    case "photo":
      return "Photo";
    case "design":
      return "Design";
    case "content":
      return "Content";
  }
}

export function BriefForm(props: {
  clients: ClientOption[];
  scopes: ScopeOption[];
  initialClientId?: string | null;
  fromWonLeadId?: string | null;
  initialBriefType?: BriefTypeUI | null;
  initialTitle?: string | null;
  initialDescription?: string | null;
}) {
  const [scopeId, setScopeId] = useState<string>("");
  const preferredClient =
    props.initialClientId && props.clients.some((c) => c.id === props.initialClientId)
      ? props.initialClientId
      : (props.clients[0]?.id ?? "");
  const [clientId, setClientId] = useState<string>(preferredClient);
  const [briefType, setBriefType] = useState<BriefTypeUI>(props.initialBriefType ?? "content");

  useEffect(() => {
    if (props.clients.length === 0) return;
    if (props.initialClientId && props.clients.some((c) => c.id === props.initialClientId)) {
      setClientId(props.initialClientId);
      return;
    }
    const exists = props.clients.some((c) => c.id === clientId);
    if (!exists) setClientId(props.clients[0].id);
  }, [props.clients, clientId, props.initialClientId]);

  // Type-specific fields
  const [videoLong, setVideoLong] = useState<number>(0);
  const [videoShort, setVideoShort] = useState<number>(0);
  const [photoFinal, setPhotoFinal] = useState<number>(0);
  const [webPages, setWebPages] = useState<number>(0);
  const [webCms, setWebCms] = useState<string>("webflow");
  const [appPlatforms, setAppPlatforms] = useState<{ ios: boolean; android: boolean; web: boolean }>({ ios: true, android: true, web: false });
  const [designAssets, setDesignAssets] = useState<number>(0);
  const [contentPieces, setContentPieces] = useState<number>(0);

  const selectedScope = useMemo(() => props.scopes.find((s) => s.id === scopeId) ?? null, [props.scopes, scopeId]);

  const typeDetails = useMemo(() => {
    switch (briefType) {
      case "video":
        return { longForms: videoLong, shortForms: videoShort };
      case "photo":
        return { finalImages: photoFinal };
      case "web_design_dev":
        return { pagesCount: webPages, cms: webCms };
      case "app_dev":
        return { platforms: Object.entries(appPlatforms).filter(([, v]) => v).map(([k]) => k) };
      case "design":
        return { assetsCount: designAssets };
      case "content":
        return { piecesCount: contentPieces };
    }
  }, [briefType, videoLong, videoShort, photoFinal, webPages, webCms, appPlatforms, designAssets, contentPieces]);

  return (
    <form action={createBrief} className="space-y-4">
      {props.fromWonLeadId ? <input type="hidden" name="fromWonLeadId" value={props.fromWonLeadId} /> : null}
      {/* Scope at top (optional) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900">Scope (optional)</label>
        <select
          name="scopeId"
          value={scopeId}
          onChange={(e) => {
            const next = e.target.value;
            setScopeId(next);
            const scope = props.scopes.find((s) => s.id === next);
            if (scope) setClientId(scope.clientId);
          }}
          className="w-full"
        >
          <option value="">No scope</option>
          {props.scopes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {selectedScope ? <p className="text-xs text-zinc-500">Client auto-set from scope.</p> : null}
      </div>

      {/* Client */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900">Client</label>
        <select name="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full">
          {props.clients.length === 0 ? <option value="">No clients available</option> : null}
          {props.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Title + description */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900">Brief title</label>
          <input
            name="title"
            required
            placeholder="e.g. Spring landing page refresh"
            className="w-full"
            defaultValue={props.initialTitle ?? ""}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900">Urgency</label>
          <select name="priority" defaultValue="medium" className="w-full">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900">Short description</label>
        <textarea
          name="description"
          required
          placeholder="High-level summary for internal + client context"
          className="w-full min-h-28 resize-none"
          defaultValue={props.initialDescription ?? ""}
        />
      </div>

      {/* Brief type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900">Brief type</label>
        <select
          name="briefType"
          value={briefType}
          onChange={(e) => setBriefType(e.target.value as BriefTypeUI)}
          className="w-full"
        >
          {(["web_design_dev", "app_dev", "video", "photo", "design", "content"] as const).map((t) => (
            <option key={t} value={t}>
              {labelForType(t)}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional scope fields */}
      {briefType === "video" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900">Number of long forms</label>
            <input type="number" min={0} step={1} value={videoLong} onChange={(e) => setVideoLong(Number(e.target.value))} className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900">Number of short forms</label>
            <input type="number" min={0} step={1} value={videoShort} onChange={(e) => setVideoShort(Number(e.target.value))} className="w-full" />
          </div>
        </div>
      ) : null}

      {briefType === "photo" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900">Number of finalised images</label>
          <input type="number" min={0} step={1} value={photoFinal} onChange={(e) => setPhotoFinal(Number(e.target.value))} className="w-full" />
        </div>
      ) : null}

      {briefType === "web_design_dev" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900">Estimated page count</label>
            <input type="number" min={0} step={1} value={webPages} onChange={(e) => setWebPages(Number(e.target.value))} className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900">CMS</label>
            <select value={webCms} onChange={(e) => setWebCms(e.target.value)} className="w-full">
              <option value="webflow">Webflow</option>
              <option value="wordpress">WordPress</option>
              <option value="custom">Custom</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      ) : null}

      {briefType === "app_dev" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900">Platforms</label>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {(["ios", "android", "web"] as const).map((k) => (
              <label key={k} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
                <span className="text-zinc-700">{k.toUpperCase()}</span>
                <input
                  type="checkbox"
                  checked={appPlatforms[k]}
                  onChange={(e) => setAppPlatforms((p) => ({ ...p, [k]: e.target.checked }))}
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {briefType === "design" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900">Assets count</label>
          <input type="number" min={0} step={1} value={designAssets} onChange={(e) => setDesignAssets(Number(e.target.value))} className="w-full" />
        </div>
      ) : null}

      {briefType === "content" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-900">Pieces count</label>
          <input type="number" min={0} step={1} value={contentPieces} onChange={(e) => setContentPieces(Number(e.target.value))} className="w-full" />
        </div>
      ) : null}

      {/* Deadline */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900">Deadline</label>
        <input type="date" name="deadline" required className="w-full" />
      </div>

      {/* Hidden JSON payload */}
      <input type="hidden" name="typeDetails" value={JSON.stringify(typeDetails)} />

      <button className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800" type="submit">
        Create brief
      </button>
    </form>
  );
}


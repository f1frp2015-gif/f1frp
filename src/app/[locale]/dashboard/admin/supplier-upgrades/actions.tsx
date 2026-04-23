"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApprovalActions({
  requestId,
  enterpriseId,
  targetTier,
  targetCategory,
}: {
  requestId: string;
  enterpriseId: string;
  targetTier: "basic" | "pro";
  targetCategory?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "reject" | "paid") {
    if (action === "approve" && !enterpriseId) {
      alert("企业未关联，请先到企业资料补全。");
      return;
    }
    if (!confirm(`确认 ${action} 这条申请？`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/supplier-upgrade/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetTier, targetCategory }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`失败：${(j as { reason?: string }).reason ?? res.status}`);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      <button
        type="button"
        disabled={busy}
        onClick={() => act("approve")}
        className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs disabled:opacity-50"
      >
        通过 + 升级
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => act("paid")}
        className="px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs disabled:opacity-50"
      >
        标记已付款
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => act("reject")}
        className="px-2 py-1 rounded bg-zinc-300 hover:bg-zinc-400 text-zinc-800 text-xs disabled:opacity-50"
      >
        拒绝
      </button>
    </div>
  );
}

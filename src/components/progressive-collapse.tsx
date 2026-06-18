"use client";

// 通用"先显示 N 条 / 点击展开更多"折叠器。
// 用作 list grid 的替身：
//   <ProgressiveCollapse className="grid gap-4 md:grid-cols-2" pageSize={50}>
//     {items.map(it => <Card key={...}>...</Card>)}
//   </ProgressiveCollapse>
// 通过 DOM 操作直接 hide/show 子元素，对各库的 filter/render 逻辑零侵入。

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  /** 默认 50 条 */
  pageSize?: number;
  /** 包裹元素的 className（grid / flex 等布局类） */
  className?: string;
}

export function ProgressiveCollapse({
  children,
  pageSize = 50,
  className,
}: Props) {
  const isEn = useLocale() === "en";
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(pageSize);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    const items = Array.from(list.children) as HTMLElement[];
    setTotal(items.length);
    items.forEach((el, i) => {
      el.style.display = i < shown ? "" : "none";
    });
  }, [children, shown]);

  // 在 children 数发生变化（filter 重置等）时把 shown 收回 pageSize
  // 避免 filter 切换后还显示更多条但实际没东西可显示
  const childCount = Array.isArray(children) ? children.length : 1;
  useEffect(() => {
    setShown(pageSize);
  }, [childCount, pageSize]);

  const remaining = Math.max(0, total - shown);

  return (
    <>
      <div ref={ref} className={className}>
        {children}
      </div>
      {remaining > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShown((s) => Math.min(total, s + pageSize))}
          >
            {isEn ? `Show ${remaining} more` : `展开剩余 ${remaining} 条`}
          </Button>
        </div>
      )}
    </>
  );
}

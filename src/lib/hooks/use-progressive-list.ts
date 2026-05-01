"use client";

// 通用"先显示 N 条 / 点击展开 N 条"列表分页 hook。
// 用法：const { visible, remaining, expand } = useProgressiveList(filtered, 50);
// 然后渲染 visible.map(...) + 末尾加一个 expand 按钮。
// 当 items 长度变化（过滤切换）时自动重置 shown 到 pageSize。

import { useEffect, useState, useCallback } from "react";

export function useProgressiveList<T>(items: T[], pageSize = 50) {
  const [shown, setShown] = useState(pageSize);

  useEffect(() => {
    setShown(pageSize);
  }, [items.length, pageSize]);

  const visible = items.slice(0, shown);
  const remaining = Math.max(0, items.length - shown);
  const expand = useCallback(() => {
    setShown((s) => Math.min(items.length, s + pageSize));
  }, [items.length, pageSize]);

  return { visible, remaining, total: items.length, shown, expand };
}

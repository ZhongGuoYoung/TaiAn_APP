import type { HoleEvaluate, Evaluate, EvaluateItem } from "@/types/evaluateItem";

/**
 * 将接口返回的 Items 数组转换为 HoleEvaluate 格式
 * @param items 接口返回的 Items 数组
 */
export function convertItemsToHoleEvaluate(items: any[]): HoleEvaluate {
  if (!items || items.length === 0) {
    return { title: "暂无数据", element: [], allRate: 0 };
  }

  const mergedMap = new Map<string, any>();

  for (const it of items) {
    const code = it.EvaluationCode || "";
    // 如果已有相同code，且是textarea，优先保留非空的DescResult
    if (mergedMap.has(code) && it.EvaluationType === "textarea") {
      const exist = mergedMap.get(code);
      if (!exist.DescResult && it.DescResult) {
        mergedMap.set(code, it); // 用新数据覆盖
      }
    } else {
      mergedMap.set(code, it);
    }
  }

  const mergedItems = Array.from(mergedMap.values());

  const totalRate = mergedItems.reduce((sum, it) => sum + (it.ScoreValue || 0), 0);

  const evaluateItems: EvaluateItem[] = mergedItems.map((it, index) => ({
    id: it.EvaluationCode || String(index),
    type: it.EvaluationType === "number" ? "rate" : it.EvaluationType,
    name: it.ScoringRules || "",
    value:
      it.EvaluationType === "radio"
        ? String(it.BooleanResult ?? "")
        : it.EvaluationType === "number"
        ? Number(it.ScoreResult ?? 0)
        : String(it.DescResult ?? ""),
    totalRate: it.ScoreValue || 0,
    photos: it.PhotoUrl ? it.PhotoUrl.split(",") : [],
    desc: it.EvaluationType === "photo" && it.DescResult ? it.DescResult : ""
  }));

  const summaryDesc =
    mergedItems.find(it => it.EvaluationType === "textarea")?.DescResult || "";

  return {
    title: mergedItems[0].EvaluationItem || "评估任务",
    allRate: totalRate,
    element: [
      {
        title: mergedItems[0].EvaluationItem || "评估任务",
        element: evaluateItems
      }
    ],
    ...(summaryDesc ? { summary: summaryDesc } : {})
  };
}

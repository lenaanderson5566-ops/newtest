# Docs 目录说明

本目录已在 2026-03-29 进行一次版本迭代清理，目标是移除过时且重复的分析文档，降低维护成本。

## 清理原则
- 删除**强时效性**且已过期的阶段性审计报告（日期快照类文档）。
- 删除与当前落地状态重复、且未被代码或流程引用的分析稿。
- 保留一个稳定入口文件，避免后续继续堆积“同主题多版本”文档。

## 本次清理结果
已移除：
- `redundancy-optimization-audit-2026-03-28.md`
- `style-unification-analysis.md`
- `style-unification-status-2026-03-28.md`

新增：
- `README.md`（本文件）

## 后续建议
如需继续记录版本迁移工作，建议统一使用以下命名：
- `docs/changelog/<yyyy-mm-dd>-<topic>.md`（变更事实）
- `docs/adr/<yyyy-mm-dd>-<decision>.md`（架构决策）

避免再次在根目录堆积“临时分析稿”。

# RTM運用ルール

## 目的
RTM（Requirements Traceability Matrix）は「要件→受け入れ条件→テスト→証跡」を紐づけて、
- 要件抜け（MissingFeature）
- 要件未達（NotMet）
- 要件曖昧（Ambiguous）
- 未検証（Untested）

を機械的に可視化する。

---

## rtm.csv 列定義

| 列 | 説明 |
|----|------|
| ReqID | 要件ID（SUB-X） |
| SortKey | 並び順 |
| SourceDoc | 出どころ（Plane, ROADMAP等） |
| Title | 要件名 |
| AC_ID | 受け入れ条件ファイルパス |
| TestIDs | テストID（E2E-01;UT-01 等） |
| Evidence | 証跡URL（CI run URL等） |
| Status | Pass/Fail/NotRun/Blocked/Unknown |
| GapType | MissingFeature/NotMet/Ambiguous/Untested |
| Owner | 担当 |
| Notes | 補足 |

---

## Status 定義

- `Pass`：ACを満たしている（証跡あり）
- `Fail`：ACを満たしていない（証跡あり）
- `NotRun`：テスト未実施
- `Blocked`：環境や外部依存で実行不能
- `Unknown`：状態不明

---

## GapType 定義

- `MissingFeature`：機能が存在しない
- `NotMet`：機能はあるがAC未達
- `Ambiguous`：ACが書けない（要件が曖昧）
- `Untested`：ACはあるがテストがない

---

## 更新フロー

1. 要件追加 → RTM行作成 → AC作成
2. 実装PR → テストID紐づけ
3. CI実行 → Evidence貼付 → Status更新

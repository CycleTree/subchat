# Prompt Template: Generate Test from AC (Playwright)

## 目的
- AC（受け入れ条件）を入力に、Playwright テストの「骨格」を生成する
- 推測で要素/URL/仕様を作らない

## 入力
1. 対象ACファイル全文
2. 対象画面の観測情報（URL、キャプチャ、DOM等）
3. 既存のテスト基盤情報

## ルール
- 推測で selector / URL / UI要素 を仮定しない → **TODO を残す**
- ロケータ優先順位：
  1. getByRole / getByLabel / getByText
  2. data-testid（例外）
  3. CSS/XPath 禁止
- `waitForTimeout` 禁止 → 状態待ち（expect）で安定化
- テストデータは API/seed 推奨（不明なら TODO）
- 出力は「そのままコミット可能」な TypeScript

## 出力フォーマット
1. ReqID / TestID 提案
2. テスト概要（AC との対応）
3. 前提（ログイン/権限/データ）
4. Playwright テストコード
5. TODO（観測不足で埋められない箇所）
6. RTM 更新案

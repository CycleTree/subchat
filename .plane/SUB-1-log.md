# SUB-1: ダークモードの追加

## 設定
- started_at: 2026-03-09T19:27:05Z
- status: completed

## 実行ログ
2026-03-09T19:27:05Z
- status: running - Claude Code 起動

2026-03-09T19:28:00Z
- コードベース確認: ダークモード機能は既に実装済みであることを確認
  - `store.ts`: ThemeMode type、toggleTheme action、localStorage永続化 (THEME_STORAGE_KEY)
  - `theme.ts`: CSS変数でカラー管理、createAppTheme関数でlight/darkテーマ生成
  - `App.tsx`: ThemeProvider適用、applyCssVariables効果
  - `SessionList.tsx`: テーマ切り替えボタン (DarkMode/LightModeアイコン)
- TypeCheckとビルド成功
- status: completed - 機能は既に実装済み

## 実装詳細
### テーマ切り替えボタン
- 場所: `packages/ui/src/components/SessionList.tsx` (65-74行目)
- Material-UI IconButton + Tooltip
- DarkMode/LightModeアイコンで切り替え

### localStorage永続化
- キー: `subchat_theme_mode`
- 保存: store.ts の setThemeMode/toggleTheme で自動保存
- 読み込み: getInitialTheme関数でシステム設定も考慮

### CSS変数カラー管理
- 場所: `packages/ui/src/theme.ts`
- light/darkそれぞれ12色のCSS変数を定義
- applyCssVariables関数でdocument.documentElement.styleに適用

## 結果
- completed_at: 2026-03-09T19:29:15Z
- status: completed
- note: 既に実装済み。commit 76a8659, a2868fb 確認

## Plane 更新
- state: Todo → Done

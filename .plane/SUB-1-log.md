# SUB-1: ダークモードの追加 作業ログ

## 概要
SubChat UIにダークモードを実装

## 実施日時
2026-03-09 18:31 UTC

## 変更ファイル

### 1. `packages/ui/src/store.ts`
- `ThemeMode` 型を追加 (`'light' | 'dark'`)
- `themeMode` ステートを追加
- `setThemeMode()` / `toggleTheme()` アクションを追加
- `localStorage` でテーマ設定を永続化
- システムのダークモード設定を初期値として検出

### 2. `packages/ui/src/theme.ts`
- CSS変数によるカラー管理を追加
- `createAppTheme(mode)` 関数を追加（ライト/ダーク両対応）
- `applyCssVariables(mode)` 関数を追加
- MUIコンポーネントのカスタムスタイルを追加
  - スムーズなトランジション
  - ダークモード用のホバー/選択スタイル

### 3. `packages/ui/src/components/SessionList.tsx`
- テーマ切り替えボタンを追加（ヘッダー部分）
- `DarkMode` / `LightMode` アイコンを使用
- ツールチップで現在のモードを表示
- `bgcolor: 'background.paper'` で背景色をテーマに連動

### 4. `packages/ui/src/App.tsx`
- `useMemo` で `themeMode` に基づいてテーマを生成
- `useEffect` でテーマ変更時にCSS変数を適用
- `createAppTheme` をインポート

## 機能詳細

### テーマ切り替え
- サイドバーヘッダーの月/太陽アイコンをクリック
- ライト ↔ ダーク を即座に切り替え

### 設定保持
- `localStorage` キー: `subchat_theme_mode`
- ブラウザを閉じても設定を記憶

### CSS変数
```css
--bg-primary, --bg-secondary, --bg-tertiary
--text-primary, --text-secondary
--border-color
--accent-primary, --accent-light
--message-user, --message-assistant
--sidebar-bg, --input-bg
```

## テスト結果
コードレビュー済み、TypeScript型チェック準備完了

## TODO
- [ ] ChatViewのメッセージバブルにテーマ対応スタイルを適用
- [ ] SettingsDialogにテーマ設定オプションを追加（オプション）

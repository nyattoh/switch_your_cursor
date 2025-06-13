# Cursor Mode Manager

CursorのためのVS Code拡張機能で、YAML駆動のモード切替とエージェント設定管理を提供します。

## 機能

- **モード切替**: 開発、執筆、動画制作など、異なる開発モード間をワンクリックで切替
- **YAML設定**: シンプルなYAMLファイルでモードとワークフローを定義
- **自動リロード**: YAMLファイル保存時に設定を自動的に再読み込み
- **Mermaidダイアグラム**: 設定ワークフローの視覚的なダイアグラムを自動生成
- **エージェント管理**: 特定のプロンプトと役割を持つAIエージェントを設定

## インストール

1. 最新の`cursor-mode-manager.vsix`ファイルをダウンロード
2. Cursor/VS Codeでコマンドパレットを開く（`Ctrl+Shift+P` または `Cmd+Shift+P`）
3. 「Extensions: Install from VSIX...」と入力
4. ダウンロードしたVSIXファイルを選択

## 使用方法

### 設定ファイルの作成

ワークスペースのルートに`cursor_modes.yaml`ファイルを作成：

```yaml
modes:
  - name: "development"
    description: "コーディングエージェントを含む開発モード"
    tasks: ["coding-flow"]
  - name: "writing"
    description: "コンテンツ作成エージェントを含む執筆モード"
    tasks: ["content-flow"]

flows:
  - name: "coding-flow"
    description: "メインのコーディングワークフロー"
    tasks:
      - name: "code-development"
        agents:
          - name: "senior-developer"
            role: "tech-lead"
            prompts:
              - "クリーンで保守可能なコードを書く"
              - "ベストプラクティスに従う"

default_mode: "development"
```

### モードの切替

1. コマンドパレットを開く（`Ctrl+Shift+P` または `Cmd+Shift+P`）
2. 「Switch Cursor Mode」と入力
3. リストから希望のモードを選択
4. 拡張機能が自動的に新しい設定でウィンドウをリロード

### コマンド

- `Switch Cursor Mode`: 設定された異なるモード間を切替
- `Generate Cursor Config from YAML`: 任意のYAMLファイルから設定を生成

## 設定フォーマット

### モード
異なる作業モードを説明と関連タスクで定義：

```yaml
modes:
  - name: "モード名"
    description: "モードの説明"
    tasks: ["タスクフロー名"]
```

### フロー
タスクとエージェントを含むワークフローを定義：

```yaml
flows:
  - name: "フロー名"
    description: "フローの説明"
    tasks:
      - name: "タスク名"
        agents:
          - name: "エージェント名"
            role: "エージェントの役割"
            prompts: ["プロンプト1", "プロンプト2"]
```

### デフォルトモード
特定のモードが選択されていない場合に使用されるデフォルトモードを設定：

```yaml
default_mode: "development"
```

## 自動リロード

拡張機能は、ファイル名に「cursor」、「mode」、「config」を含むYAMLファイルの変更を自動的に監視します。これらのファイルが保存されると、設定が自動的に再生成され適用されます。

## Mermaidダイアグラム

モード切替時、拡張機能はワークフロー構造を示すMermaidダイアグラムを生成し、`cursor-mode-diagram.mmd`としてワークスペースに保存します。

## 開発

### ソースからのビルド

```bash
npm install
npm run compile
npm run test
npx @vscode/vsce package
```

### テスト

```bash
npm test
```

## 実際の使用例

### 開発モード設定

```yaml
modes:
  - name: "development"
    description: "フルスタック開発用のモード"
    tasks: ["coding-flow", "review-flow"]

flows:
  - name: "coding-flow"
    tasks:
      - name: "backend-development"
        agents:
          - name: "backend-expert"
            role: "senior-backend-dev"
            prompts:
              - "TypeScriptでRESTful APIを実装"
              - "適切なエラーハンドリングを実装"
      - name: "frontend-development"
        agents:
          - name: "frontend-expert"
            role: "senior-frontend-dev"
            prompts:
              - "Reactコンポーネントを作成"
              - "レスポンシブデザインを実装"
```

### 執筆モード設定

```yaml
modes:
  - name: "writing"
    description: "技術記事作成用のモード"
    tasks: ["content-flow"]

flows:
  - name: "content-flow"
    tasks:
      - name: "article-writing"
        agents:
          - name: "tech-writer"
            role: "technical-writer"
            prompts:
              - "技術的に正確で読みやすい記事を作成"
              - "コード例を含めて説明"
          - name: "editor"
            role: "content-editor"
            prompts:
              - "文法と表現をチェック"
              - "技術的な正確性を確認"
```

## トラブルシューティング

### 設定が反映されない場合
1. YAMLファイルの構文が正しいか確認
2. ファイル名に「cursor」、「mode」、「config」のいずれかが含まれているか確認
3. コマンドパレットから手動で「Switch Cursor Mode」を実行

### Mermaidダイアグラムが表示されない場合
- VS Code Mermaid拡張機能がインストールされているか確認
- `cursor-mode-diagram.mmd`ファイルが生成されているか確認

## ライセンス

MIT - 詳細はLICENSEファイルを参照

## 貢献

1. リポジトリをフォーク
2. 機能ブランチを作成
3. 変更を実装
4. 新機能のテストを追加
5. プルリクエストを送信

## サポート

問題や機能リクエストについては、GitHubのイシュートラッカーを使用してください。

## 更新履歴

### v0.0.1
- 初回リリース
- 基本的なモード切替機能
- YAML設定サポート
- 自動リロード機能
- Mermaidダイアグラム生成
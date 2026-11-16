# Folio — Android タブレット・スマホ対応デジタルプランナー

Material Design 3 の紙の手帳をモチーフにした、予定管理・Daily Note・大学時間割・課題締切管理アプリ **Folio** の Android アプリおよび Web ソースリポジトリです。

## 構成

- `app/` — Android アプリ本体（Kotlin / WebView シェル、スマホ縦型・タブレット横型両対応、Google OAuth・カレンダー1年分同期・JSONバックアップ対応）
- `web/` — Web 版ソースコード（Vercel 本番配信用: https://folio-planner-gamma.vercel.app ）
- `.github/workflows/build-apk.yml` — GitHub Actions による APK 自動ビルドワークフロー

## Android スマホ・タブレットへのインストール方法

### 方法1: GitHub Actions から APK をダウンロードしてインストール（PC不要）
1. このリポジトリ上部の **Actions** タブを開きます。
2. 最新の **Build Android APK** ワークフローを開きます。
3. 下部の **Artifacts** から `Folio-Android-APK` をダウンロードし、ZIP を解凍して `app-debug.apk` を Android スマホまたはタブレットで開いてインストールします。

### 方法2: Android Studio で開いてビルド・実行
1. このリポジトリをクローンまたは ZIP ダウンロードします。
2. Android Studio でルートフォルダを開きます。
3. Android スマホまたはタブレットを USB 接続（またはエミュレータを起動）し、実行ボタンを押します。

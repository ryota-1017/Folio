<div align="center">

<br />

<img src="web/icon.svg" alt="Vellora Logo" width="112" height="112" />

<h1>Vellora</h1>

<p>
  <strong>紙の手帳の温もりと、研ぎ澄まされたデジタルの心地よさを融合したパーソナルプランナー</strong>
</p>

<p>
  <em>Vellum（上質な羊皮紙） × Hora（時） — 毎日の予定・大学時間割・ノートを一冊に。</em>
</p>

<p>
  <a href="https://folio-planner-gamma.vercel.app/">
    <img src="https://img.shields.io/badge/Web_App-Live_Demo-231F1C?style=for-the-badge" alt="Web App" />
  </a>
  <a href="https://github.com/ryota-1017/Folio/releases/latest">
    <img src="https://img.shields.io/github/v/release/ryota-1017/Folio?style=for-the-badge&color=8C2D25&label=Release" alt="Latest Release" />
  </a>
  <a href="https://github.com/ryota-1017/Folio/stargazers">
    <img src="https://img.shields.io/github/stars/ryota-1017/Folio?style=for-the-badge&color=366B47" alt="GitHub Stars" />
  </a>
  <img src="https://img.shields.io/badge/Platform-Web_PWA_%7C_Android-224363?style=for-the-badge" alt="Platform" />
</p>

<p>
  <a href="#features">機能</a> •
  <a href="#design-philosophy">デザイン思想</a> •
  <a href="#installation">インストール</a> •
  <a href="#updates">アップデート</a> •
  <a href="#tech-stack">技術構成</a>
</p>

</div>

---

## Overview

**Vellora** は、紙の手帳をめくるような静かな質感と、現代的なモバイル・デスクトップUIの軽快さを両立させたデジタルプランナーです。  
月間カレンダー、日別スケジュール、自由記述の Daily Note、大学モード（時間割・出席管理・課題管理）をひとつのシームレスな空間に統合しています。

---

## Features

| カテゴリ | 主な機能 |
| :--- | :--- |
| **月間・日別カレンダー** | 12ヶ月インデックス、前月・翌月ミニカレンダー、タップした日付から全体へ滑らかに広がる **Hero Expand アニメーション**。 |
| **モバイル最適化操作** | 画面上部2/3に月間カレンダー・下部1/3に1日の予定を固定表示。上下スワイプで月間と日別をシームレスに切り替え。 |
| **大学モード** | Googleカレンダーの直近3週間から月〜土の授業時間割を自動生成。場所・担当教員の表示、出席・欠席・遅刻カウンター、課題・提出物トラッカーを搭載。 |
| **Daily Note & AI 抽出** | 罫線 / ドット方眼を切り替えられる自由記述ノート。Gemini API によるメモからのスケジュール自動抽出に対応。 |
| **Google 同期** | Google Calendar・Google Drive との双方向同期。キャッシュを活用した高速起動とバックグラウンド同期を実現。 |
| **通知・アップデート** | 画面領域を奪わないフローティング・グラスポップアップ通知と、Web Notification API によるシステム通知。GitHub Releases からの新バージョン検知にも対応。 |
| **ライト / ダークテーマ** | 温かみのあるリネン調ライトモードと、目に優しいウォームグラファイト調ダークモードを設定からワンタップ切替。 |

---

## Design Philosophy

- **Warm Tactile Minimalism**: 紙の手帳の持つ温度感とほのかな立体感を保ちつつ、Appleライクな余白・タイポグラフィ・ガラス質感で視認性を高めています。
- **Smooth Launch Experience**: 起動時はロゴとタイポグラフィを映すスタート画面を表示し、裏側でデータを読み込んでから自然にホームへ遷移します。
- **Clear Action Hierarchy**: ヘッダー右上の操作を **モード切替 → ログイン → 同期 → 設定** の順に統一し、迷いのない操作体験を提供します。

---

## Installation

### 1. Web / PWA（PC・タブレット・スマートフォン）

ブラウザからそのまま利用でき、ホーム画面に追加することでアプリのように動作します。

- Live URL: [https://folio-planner-gamma.vercel.app/](https://folio-planner-gamma.vercel.app/)

### 2. Android アプリ（GitHub Releases / Obtainium）

1. [GitHub Releases](https://github.com/ryota-1017/Folio/releases) から最新の APK をダウンロードしてインストールします。
2. 自動アップデートを行いたい場合は、Android の **[Obtainium](https://github.com/ImranR98/Obtainium)** にこのリポジトリ URL（`https://github.com/ryota-1017/Folio`）を登録すると、新しいリリース公開時に自動で更新通知・インストールが行えます。

### 3. ソースコードからビルド

```bash
git clone https://github.com/ryota-1017/Folio.git
cd Folio
./gradlew assembleDebug
```

---

## Updates

- **Web / PWA**: Service Worker により新しいバージョンを自動検出し、フローティング通知からワンタップで最新版へ更新できます。
- **GitHub リリース検知**: アプリ起動時および「設定 → バージョン・アップデート」から GitHub Releases API を参照し、新バージョンがあれば通知および GitHub リリースページへの導線を表示します。

---

## Tech Stack

- **Web Frontend**: Vanilla JavaScript (Modular `s1–s5`, `r1–r4`), Tailwind CSS, Web Animations API, Service Worker (PWA)
- **Android Wrapper**: Kotlin, AndroidX WebView, Custom Tabs
- **Cloud & AI**: Google Identity Services (OAuth 2.0), Google Calendar API, Google Drive API, Gemini API

---

<div align="center">
  <sub>Crafted with care for calm, focused daily planning — <strong>Vellora</strong></sub>
</div>

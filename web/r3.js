function renderModalHtml() {
let modalHtml = "";
if (state.modal === 'add') {
modalHtml = `
<div onclick="if(event.target===this) closeModal()" class="fixed inset-0 z-50 bg-[#231F1C]/35 backdrop-blur-xs flex items-center justify-center p-4">
<div class="w-full max-w-md soft-card-3d rounded-[32px] p-6 m3-fab">
<div class="flex items-center justify-between pb-4 border-b grid-hairline">
<h3 class="text-base font-bold text-[#231F1C]">新規スケジュール追加</h3>
<button type="button" onclick="closeModal()" title="閉じる"
class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">
${ICONS.close}
</button>
</div>
<form onsubmit="submitNewItem(event)" class="mt-4 space-y-4 text-xs">
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">タイトル</label>
<input id="new-title" type="text" required placeholder="予定のタイトルを入力"
class="w-full px-4 py-3 rounded-2xl bg-[#EFECE6] shadow-inner text-sm text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
<div class="grid grid-cols-3 gap-2.5">
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">日付</label>
<input id="new-date" type="date" value="${state.selectedDate || TODAY_STR}"
class="w-full px-3 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">開始時間</label>
<input id="new-start" type="time" value="10:00"
class="w-full px-3 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">終了時間</label>
<input id="new-end" type="time" value="11:30"
class="w-full px-3 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
</div>
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">種類（カテゴリー）</label>
<div class="grid grid-cols-4 gap-2.5">
${['class', 'deadline', 'parttime', 'personal'].map(cat => {
const st = CATEGORY_STYLES[cat];
const active = state.newCategory === cat;
return `
<button type="button" data-cat-btn="${cat}" onclick="selectNewCategory('${cat}')" title="${st.label}"
class="h-11 rounded-2xl shadow-sm border border-white/70 flex items-center justify-center transition-all ${st.bg} ${st.text} ${
active ? 'ring-2 ring-[#231F1C] scale-105 shadow-md' : 'hover:-translate-y-0.5'
}">
${ICONS[st.icon]}
</button>
`;
}).join('')}
</div>
</div>
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">メモ</label>
<textarea id="new-memo" rows="3" placeholder="場所や持ち物、詳細メモを入力"
class="w-full p-3.5 rounded-2xl bg-[#EFECE6] shadow-inner text-xs text-[#231F1C] resize-none focus:outline-none focus:ring-2 focus:ring-[#5C554D]"></textarea>
</div>
<div class="pt-1 flex justify-end">
<button type="submit" title="保存"
class="w-12 h-12 rounded-full m3-fab-dark hover:scale-105 text-white flex items-center justify-center transition">
${ICONS.check}
</button>
</div>
</form>
</div>
</div>
`;
} else if (state.modal === 'course' && state.activeCourseSlot) {
const course = state.courses.find(c => c.dayOfWeek === state.activeCourseSlot.dayOfWeek && c.period === state.activeCourseSlot.period);
const dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][state.activeCourseSlot.dayOfWeek];
modalHtml = `
<div onclick="if(event.target===this) closeModal()" class="fixed inset-0 z-50 bg-[#231F1C]/35 backdrop-blur-xs flex items-center justify-center p-4">
<div class="w-full max-w-md soft-card-3d rounded-[32px] p-6 m3-fab">
<div class="flex items-center justify-between pb-4 border-b grid-hairline">
<h3 class="text-base font-bold text-[#231F1C]">${dayLabel} ${state.activeCourseSlot.period}限</h3>
<div class="flex items-center gap-2">
${course ? `
<button type="button" onclick="toggleCourseEdit()" title="授業情報を編集" class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">${ICONS.edit}</button>
<button type="button" onclick="deleteCourseSlot('${course.id}')" title="このコマを削除" class="w-9 h-9 rounded-full pill-thumb hover:scale-105 text-[#B83B2E] flex items-center justify-center transition">${ICONS.delete}</button>
` : ''}
<button type="button" onclick="closeModal()" title="閉じる" class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">${ICONS.close}</button>
</div>
</div>
${state.editingCourseMode || !course ? `
<form onsubmit="saveCourseSlot(event)" class="mt-4 space-y-3 text-xs">
<div>
<label class="block font-semibold text-[#5C554D] mb-1">授業名</label>
<input id="course-name" type="text" required value="${course ? course.name : ''}" placeholder="例：経済学入門"
class="w-full px-3.5 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-sm text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
<div class="grid grid-cols-2 gap-2.5">
<div>
<label class="block font-semibold text-[#5C554D] mb-1">教室</label>
<input id="course-room" type="text" value="${course ? course.room : ''}" placeholder="例：1号館 201"
class="w-full px-3.5 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none" />
</div>
<div>
<label class="block font-semibold text-[#5C554D] mb-1">単位数</label>
<input id="course-credits" type="number" min="1" max="8" value="${course ? course.credits : 2}"
class="w-full px-3.5 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none" />
</div>
</div>
<div>
<label class="block font-semibold text-[#5C554D] mb-1">担当教員</label>
<input id="course-instructor" type="text" value="${course ? course.instructor : ''}" placeholder="例：山田 教授"
class="w-full px-3.5 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none" />
</div>
<div>
<label class="block font-semibold text-[#5C554D] mb-1">評価基準メモ</label>
<input id="course-eval" type="text" value="${course ? course.evaluation : ''}" placeholder="例：期末試験60% / レポート40%"
class="w-full px-3.5 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none" />
</div>
<div class="pt-1 flex justify-end">
<button type="submit" title="保存" class="w-11 h-11 rounded-full m3-fab-dark text-white flex items-center justify-center transition">
${ICONS.check}
</button>
</div>
</form>
` : `
<div class="mt-4 space-y-4">
<div>
<div class="text-lg font-bold text-[#231F1C]">${course.name}</div>
<div class="text-xs text-[#5C554D] mt-1">${course.instructor} ・ ${course.room} ・ ${course.credits}単位</div>
<div class="mt-2 text-xs bg-[#EFECE6] px-3.5 py-2.5 rounded-2xl text-[#231F1C] shadow-inner">評価基準: ${course.evaluation}</div>
</div>
<div class="grid grid-cols-3 gap-3">
${[
{ key: 'attended', label: '出席', color: 'text-[#244E32]' },
{ key: 'absent', label: '欠席', color: 'text-[#B83B2E]' },
{ key: 'late', label: '遅刻', color: 'text-[#876529]' }
].map(cnt => `
<div class="p-3.5 rounded-2xl bg-[#EFECE6] shadow-inner flex flex-col items-center">
<span class="text-xs font-semibold text-[#5C554D]">${cnt.label}</span>
<span class="text-xl font-bold my-1 ${cnt.color}">${course[cnt.key]}</span>
<div class="flex items-center gap-2">
<button type="button" onclick="updateCourseStat('${course.id}', '${cnt.key}', -1)" title="減らす" class="w-7 h-7 rounded-full pill-thumb flex items-center justify-center">${ICONS.remove}</button>
<button type="button" onclick="updateCourseStat('${course.id}', '${cnt.key}', 1)" title="増やす" class="w-7 h-7 rounded-full bg-gradient-to-b from-[#F2E6CE] to-[#E2D3B5] shadow-sm flex items-center justify-center">${ICONS.add}</button>
</div>
</div>
`).join('')}
</div>
</div>
`}
</div>
</div>
`;
} else if (state.modal === 'sync') {
modalHtml = `
<div onclick="if(event.target===this) closeModal()" class="fixed inset-0 z-50 bg-[#231F1C]/35 backdrop-blur-xs flex items-center justify-center p-4">
<div class="w-full max-w-md soft-card-3d rounded-[32px] p-6 m3-fab">
<div class="flex items-center justify-between pb-4 border-b grid-hairline">
<h3 class="text-base font-bold text-[#231F1C]">Google カレンダー / API 連携設定</h3>
<button type="button" onclick="closeModal()" title="閉じる" class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">${ICONS.close}</button>
</div>
<form onsubmit="saveSettings(event)" class="mt-4 space-y-4 text-xs">
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">Gemini API キー</label>
<input id="settings-gemini-key" type="password" value="${state.geminiApiKey}" placeholder="AIzaSy..."
class="w-full px-3.5 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
<div>
<div class="flex items-center justify-between mb-1.5">
<label class="font-semibold text-[#5C554D]">Google OAuth クライアントID（カレンダー・Drive同期）</label>
<span class="text-[11px] font-semibold ${state.driveSyncStatus === 'synced' ? 'text-[#244E32]' : 'text-[#6E665E]'}">
${state.driveSyncStatus === 'synced' ? `同期済 ${state.driveLastSynced || ''}` : '未接続'}
</span>
</div>
<div class="flex items-center gap-2">
<input id="settings-google-cid" type="text" value="${state.googleClientId}" placeholder="1234567890-xxx.apps.googleusercontent.com"
class="flex-1 px-3.5 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
<button type="button" onclick="copySetupLink()" title="スマホ等にクライアントIDを引き継ぐURLをコピー"
class="w-10 h-10 shrink-0 rounded-full pill-thumb text-[#231F1C] hover:scale-105 flex items-center justify-center transition">
${ICONS.link}
</button>
<button type="button" onclick="handleGoogleLoginClick()" title="${state.driveAccessToken ? 'Googleアカウントを切り替え' : 'Googleでログインして自動同期を開始'}"
class="w-10 h-10 shrink-0 rounded-full ${state.driveAccessToken ? 'bg-gradient-to-b from-[#E5EFE8] to-[#D1E4D7] text-[#244E32]' : 'bg-gradient-to-b from-[#E5EDF5] to-[#D2E2F2] text-[#224363]'} shadow-sm hover:scale-105 flex items-center justify-center transition">
${state.driveAccessToken ? ICONS.account_circle : ICONS.login}
</button>
${state.driveAccessToken ? `
<button type="button" onclick="disconnectGoogleDrive()" title="Googleからログアウト"
class="w-10 h-10 shrink-0 rounded-full pill-thumb text-[#8C2D25] hover:scale-105 flex items-center justify-center transition">
${ICONS.logout}
</button>
` : ''}
</div>
<p class="text-[11px] text-[#6E665E] mt-1">一度Googleでログインすると自動で同期されます。リンクボタンで他端末にもクライアントIDを引き継げます。</p>
</div>
<div class="pt-2 border-t grid-hairline">
<div class="font-semibold text-[#5C554D] mb-2">データバックアップ（JSON）</div>
<div class="flex items-center gap-3">
<button type="button" onclick="exportBackupJson()" title="バックアップを書き出す"
class="w-10 h-10 rounded-full pill-thumb hover:scale-105 flex items-center justify-center text-[#231F1C] transition">
${ICONS.download}
</button>
<label title="バックアップを読み込む"
class="w-10 h-10 rounded-full pill-thumb hover:scale-105 flex items-center justify-center text-[#231F1C] cursor-pointer transition">
${ICONS.upload}
<input type="file" accept=".json" onchange="importBackupJson(event)" class="hidden" />
</label>
<span class="text-[11px] text-[#6E665E]">手動書き出し / 読み込み</span>
</div>
</div>
<div class="pt-1 flex justify-end">
<button type="submit" title="設定を保存"
class="w-11 h-11 rounded-full m3-fab-dark hover:scale-105 text-white flex items-center justify-center transition">
${ICONS.check}
</button>
</div>
</form>
</div>
</div>
`;
}
return modalHtml;
}
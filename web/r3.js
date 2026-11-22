function renderModalHtml() {
let modalHtml = "";
if (state.modal === 'add') {
const editingItem = state.editingItemId ? state.items.find(x => x.id === state.editingItemId) : null;
const defaultDate = editingItem ? editingItem.date : (state.selectedDate || state.selectedMobileDay || TODAY_STR);
modalHtml = `
<div onclick="if(event.target===this) closeModal()" class="fixed inset-0 z-50 bg-[#231F1C]/35 backdrop-blur-xs flex items-center justify-center p-4">
<div class="w-full max-w-md soft-card-3d rounded-[32px] p-6 m3-fab">
<div class="flex items-center justify-between pb-4 border-b grid-hairline">
<h3 class="text-base font-bold text-[#231F1C]">${editingItem ? 'スケジュール編集' : '新規スケジュール追加'}</h3>
<button type="button" onclick="closeModal()" title="閉じる"
class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">
${ICONS.close}
</button>
</div>
<form onsubmit="submitNewItem(event)" class="mt-4 space-y-4 text-xs">
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">タイトル</label>
<input id="new-title" type="text" required value="${editingItem ? editingItem.title.replace(/"/g, '&quot;') : ''}" placeholder="予定のタイトルを入力"
class="w-full px-4 py-3 rounded-2xl bg-[#EFECE6] shadow-inner text-sm text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
<div class="grid grid-cols-3 gap-2.5">
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">日付</label>
<input id="new-date" type="date" value="${defaultDate}"
class="w-full px-3 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">開始時間</label>
<input id="new-start" type="time" value="${editingItem && editingItem.startTime ? editingItem.startTime : '10:00'}"
class="w-full px-3 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">終了時間</label>
<input id="new-end" type="time" value="${editingItem && editingItem.endTime ? editingItem.endTime : '11:30'}"
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
class="w-full p-3.5 rounded-2xl bg-[#EFECE6] shadow-inner text-xs text-[#231F1C] resize-none focus:outline-none focus:ring-2 focus:ring-[#5C554D]">${editingItem && editingItem.memo ? editingItem.memo : ''}</textarea>
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
const dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][state.activeCourseSlot.dayOfWeek] || 'Day';
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
const linkedAccounts = Object.values(state.accountLinks || {});
modalHtml = `
<div onclick="if(event.target===this) closeModal()" class="fixed inset-0 z-50 bg-[#231F1C]/35 backdrop-blur-xs flex items-center justify-center p-4">
<div class="w-full max-w-md soft-card-3d rounded-[32px] p-6 m3-fab flex flex-col max-h-[86vh]">
<div class="flex items-center justify-between pb-4 border-b grid-hairline shrink-0">
<h3 class="text-base font-bold text-[#231F1C]">Google カレンダー / API 連携設定</h3>
<button type="button" onclick="closeModal()" title="閉じる" class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">${ICONS.close}</button>
</div>
<form onsubmit="saveSettings(event)" class="mt-4 space-y-4 text-xs flex-1 overflow-y-auto pr-1">
<div>
<label class="block font-semibold text-[#5C554D] mb-1.5">Gemini API キー</label>
<input id="settings-gemini-key" type="password" value="${state.geminiApiKey}" placeholder="AIzaSy..."
class="w-full px-3.5 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
<div>
<div class="flex items-center justify-between mb-1.5">
<label class="font-semibold text-[#5C554D]">Google OAuth クライアントID</label>
<span class="text-[11px] font-semibold ${state.driveSyncStatus === 'synced' ? 'text-[#244E32]' : 'text-[#6E665E]'}">
${state.driveSyncStatus === 'synced' ? `${state.googleAccountEmail ? state.googleAccountEmail + ' ・ ' : ''}同期済 ${state.driveLastSynced || ''}` : '未接続'}
</span>
</div>
<div class="flex items-center gap-1.5">
<input id="settings-google-cid" type="text" value="${escapeHtml(state.googleClientId)}" oninput="this.value=sanitizeGoogleClientId(this.value)" placeholder="1234567890-xxx.apps.googleusercontent.com"
class="flex-1 min-w-0 px-3 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
<button type="button" onclick="copyClientIdOnly()" title="クライアントIDだけをコピー"
class="w-9 h-9 shrink-0 rounded-full pill-thumb text-[#231F1C] hover:scale-105 flex items-center justify-center transition">
${ICONS.content_copy}
</button>
<button type="button" onclick="copySetupLink()" title="スマホ等にクライアントIDを引き継ぐURLをコピー"
class="w-9 h-9 shrink-0 rounded-full pill-thumb text-[#231F1C] hover:scale-105 flex items-center justify-center transition">
${ICONS.link}
</button>
<button type="button" onclick="handleGoogleLoginClick()" title="${state.driveAccessToken ? 'Googleアカウントを切り替え' : 'Googleでログインして自動同期を開始'}"
class="w-9 h-9 shrink-0 rounded-full ${state.driveAccessToken ? 'bg-gradient-to-b from-[#E5EFE8] to-[#D1E4D7] text-[#244E32]' : 'bg-gradient-to-b from-[#E5EDF5] to-[#D2E2F2] text-[#224363]'} shadow-sm hover:scale-105 flex items-center justify-center transition">
${state.driveAccessToken ? ICONS.account_circle : ICONS.login}
</button>
${state.driveAccessToken ? `
<button type="button" onclick="disconnectGoogleDrive()" title="Googleからログアウト"
class="w-9 h-9 shrink-0 rounded-full pill-thumb text-[#8C2D25] hover:scale-105 flex items-center justify-center transition">
${ICONS.logout}
</button>
` : ''}
</div>
<p class="text-[11px] text-[#6E665E] mt-1">ログインするとGoogleアカウントとクライアントIDが自動連結され、次回からログインだけで同期できます。</p>
</div>
${linkedAccounts.length > 0 ? `
<div class="pt-2 border-t grid-hairline">
<div class="font-semibold text-[#5C554D] mb-1.5">連結済みGoogleアカウント（ワンタップ同期）</div>
<div class="space-y-1.5">
${linkedAccounts.map(acc => `
<div class="p-2.5 rounded-2xl bg-[#F4EFE7] border border-[#E5DFD5] flex items-center justify-between gap-2">
<button type="button" onclick="selectLinkedAccount('${escapeHtml(acc.email)}')" class="text-left min-w-0 flex-1">
<div class="font-bold text-[#231F1C] truncate">${escapeHtml(acc.email)}</div>
<div class="text-[10px] text-[#6E665E] truncate">ID: ${escapeHtml(acc.clientId)}</div>
</button>
<button type="button" onclick="removeLinkedAccount('${escapeHtml(acc.email)}')" title="連結を解除" class="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center text-[#8C2D25] shrink-0">${ICONS.close}</button>
</div>
`).join('')}
</div>
</div>
` : ''}
<div class="pt-2 border-t grid-hairline">
<div class="font-semibold text-[#5C554D] mb-1.5">自動カテゴリー分類ルール（キーワード指定）</div>
<div class="flex items-center gap-1.5 mb-2">
<input id="rule-keyword-input" type="text" placeholder="例: 睡眠, 塾, 部活"
class="flex-1 px-3 py-2 rounded-xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none" />
<select id="rule-category-select" class="px-2.5 py-2 rounded-xl bg-[#EFECE6] shadow-inner text-[#231F1C] focus:outline-none">
<option value="personal">行事・その他</option>
<option value="class">学校・授業</option>
<option value="deadline">塾・重要手続</option>
<option value="parttime">プライベート</option>
</select>
<button type="button" onclick="addCustomCategoryRule()" class="px-3 py-2 rounded-xl bg-[#231F1C] text-white font-semibold shrink-0">追加</button>
</div>
${state.customCategoryRules && state.customCategoryRules.length > 0 ? `
<div class="flex flex-wrap gap-1.5">
${state.customCategoryRules.map((r, idx) => {
const rSt = CATEGORY_STYLES[r.category] || CATEGORY_STYLES.personal;
return `
<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${rSt.bg} ${rSt.text}">
<span>${escapeHtml(r.keyword)} → ${rSt.label}</span>
<button type="button" onclick="removeCustomCategoryRule(${idx})" class="hover:opacity-70 ml-0.5">×</button>
</span>
`;
}).join('')}
</div>
` : '<div class="text-[11px] text-[#8C847A]">カスタムルールは未登録です</div>'}
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
} else if (state.modal === 'search') {
const q = (state.searchQuery || '').trim().toLowerCase();
const matchedItems = q
? state.items.filter(it =>
(it.title || '').toLowerCase().includes(q) ||
(it.memo || '').toLowerCase().includes(q) ||
(it.location || '').toLowerCase().includes(q)
).slice(0, 30)
: [];
modalHtml = `
<div onclick="if(event.target===this) closeModal()" class="fixed inset-0 z-50 bg-[#231F1C]/35 backdrop-blur-xs flex items-center justify-center p-4">
<div class="w-full max-w-md soft-card-3d rounded-[32px] p-6 m3-fab flex flex-col max-h-[80vh]">
<div class="flex items-center justify-between pb-3 border-b grid-hairline shrink-0">
<h3 class="text-base font-bold text-[#231F1C]">予定・ノート検索</h3>
<button type="button" onclick="closeModal()" title="閉じる" class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">${ICONS.close}</button>
</div>
<div class="mt-3 shrink-0">
<input type="text" value="${(state.searchQuery || '').replace(/"/g, '&quot;')}" oninput="setSearchQuery(this.value)" placeholder="授業名・レポート・キーワードを入力..." autofocus
class="w-full px-4 py-2.5 rounded-2xl bg-[#EFECE6] shadow-inner text-sm text-[#231F1C] focus:outline-none focus:ring-2 focus:ring-[#5C554D]" />
</div>
<div class="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
${!q ? '<div class="text-xs text-[#8C847A] py-8 text-center">キーワードを入力すると1年分の同期済み予定から検索します</div>' :
matchedItems.length === 0 ? '<div class="text-xs text-[#8C847A] py-8 text-center">一致する予定が見つかりませんでした</div>' :
matchedItems.map(it => {
const st = CATEGORY_STYLES[it.category] || CATEGORY_STYLES.personal;
return `
<button type="button" onclick="closeModal(); selectDate('${it.date}');" class="w-full text-left p-3 rounded-2xl bg-[#F4EFE7] hover:bg-[#ECE5DA] border border-[#E5DFD5] transition flex items-center justify-between gap-2">
<div class="min-w-0">
<div class="text-xs font-bold text-[#231F1C] truncate">${it.title}</div>
<div class="text-[11px] text-[#6E665E] mt-0.5">${it.date} ${it.startTime || '終日'}</div>
</div>
<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${st.bg} ${st.text}">${st.label}</span>
</button>
`;
}).join('')}
</div>
</div>
</div>
`;
} else if (state.modal === 'timetable_audit') {
const info = state.timetableDebugInfo || { included: [], skipped: [], rangeStart: '', rangeEnd: '' };
modalHtml = `
<div onclick="if(event.target===this) closeModal()" class="fixed inset-0 z-50 bg-[#231F1C]/35 backdrop-blur-xs flex items-center justify-center p-4">
<div class="w-full max-w-lg soft-card-3d rounded-[32px] p-6 m3-fab flex flex-col max-h-[82vh]">
<div class="flex items-center justify-between pb-3 border-b grid-hairline shrink-0">
<div>
<h3 class="text-base font-bold text-[#231F1C]">授業の自動反映・未反映確認</h3>
<div class="text-[11px] text-[#6E665E]">対象期間: ${info.rangeStart || '-'} 〜 ${info.rangeEnd || '-'}（月〜土）</div>
</div>
<div class="flex items-center gap-2">
<button type="button" onclick="reanalyzeTimetable()" title="直近3週間を再分析" class="px-3 h-8 rounded-full pill-thumb text-xs font-semibold text-[#231F1C] flex items-center gap-1">${ICONS.sync}<span>再分析</span></button>
<button type="button" onclick="closeModal()" title="閉じる" class="w-9 h-9 rounded-full pill-thumb flex items-center justify-center">${ICONS.close}</button>
</div>
</div>
<div class="mt-3 flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
<div>
<div class="font-bold text-[#244E32] mb-1.5">時間割に反映済み（${info.included.length}件）</div>
<div class="space-y-1.5">
${info.included.length > 0 ? info.included.map(inc => `
<div class="p-2.5 rounded-2xl bg-[#E5EFE8]/70 border border-[#C6DFCD] flex items-center justify-between gap-2">
<div>
<span class="font-bold text-[#244E32]">${inc.dayLabel}</span>
<span class="ml-1.5 font-semibold text-[#231F1C]">${inc.name}</span>
</div>
<span class="text-[11px] text-[#244E32] shrink-0">${inc.time || ''}（${inc.count}回）</span>
</div>
`).join('') : '<div class="text-[#8C847A] py-2">自動反映された授業はありません</div>'}
</div>
</div>
<div>
<div class="font-bold text-[#8C2D25] mb-1.5">未反映・除外された予定（${info.skipped.length}件）</div>
<div class="space-y-1.5">
${info.skipped.length > 0 ? info.skipped.map(sk => `
<div class="p-2.5 rounded-2xl bg-[#F4EFE7] border border-[#E5DFD5] flex items-center justify-between gap-2">
<div class="min-w-0">
<div class="font-bold text-[#231F1C] truncate">${sk.item.title}</div>
<div class="text-[11px] text-[#6E665E]">${sk.item.date} ${sk.item.startTime || ''} ・ ${sk.reason}</div>
</div>
<button type="button" onclick="addSkippedToTimetable('${sk.item.id}')" class="px-2.5 py-1 rounded-full bg-[#231F1C] text-white text-[11px] font-semibold shrink-0 hover:opacity-90">追加</button>
</div>
`).join('') : '<div class="text-[#8C847A] py-2">未反映の授業予定はありません</div>'}
</div>
</div>
</div>
</div>
</div>
`;
} else if (state.modal === 'detail' && state.detailItemId) {
const it = state.items.find(x => x.id === state.detailItemId);
if (it) {
const st = CATEGORY_STYLES[it.category] || CATEGORY_STYLES.personal;
const formattedMemo = formatMemoText(it.memo);
modalHtml = `
<div onclick="if(event.target===this) closeModal()" class="fixed inset-0 z-50 bg-[#231F1C]/35 backdrop-blur-xs flex items-center justify-center p-4">
<div class="w-full max-w-md soft-card-3d rounded-[32px] p-6 m3-fab flex flex-col max-h-[84vh]">
<div class="flex items-center justify-between pb-3 border-b grid-hairline shrink-0 gap-2">
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}">
${st.label}
</span>
<div class="flex items-center gap-1.5 shrink-0">
<button type="button" onclick="openEditItemModal('${it.id}')" title="編集" class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center text-[#231F1C] transition">${ICONS.edit}</button>
<button type="button" onclick="deleteItem('${it.id}'); closeModal();" title="削除" class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center text-[#B83B2E] transition">${ICONS.delete}</button>
<button type="button" onclick="closeModal()" title="閉じる" class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">${ICONS.close}</button>
</div>
</div>
<div class="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
<div>
<h3 class="text-lg font-bold text-[#231F1C] leading-snug">${escapeHtml(it.title)}</h3>
<div class="text-xs font-medium text-[#5C554D] mt-1.5">
${it.date.replace(/-/g, '.')}（${getDayName(it.date).split('・')[1] || ''}） ${it.startTime ? `${it.startTime}${it.endTime ? ' - ' + it.endTime : ''}` : '終日'}
</div>
${it.location ? `<div class="text-xs text-[#4A6A8A] mt-1">場所: ${escapeHtml(it.location)}</div>` : ''}
</div>
<div>
<div class="text-[11px] font-semibold text-[#5C554D] mb-1.5">カテゴリーを変更（同じ予定名にも自動適用）</div>
<div class="grid grid-cols-2 gap-1.5">
${['class', 'deadline', 'parttime', 'personal'].map(cat => {
const cSt = CATEGORY_STYLES[cat];
const active = it.category === cat;
return `
<button type="button" onclick="changeItemCategory('${it.id}', '${cat}')"
class="px-3 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition border ${
active ? `${cSt.bg} ${cSt.text} border-[#231F1C] shadow-sm` : 'bg-[#F4EFE7] text-[#5C554D] border-[#E5DFD5] hover:bg-[#EAE3D8]'
}">
<span class="w-2 h-2 rounded-full shrink-0 ${cSt.dot}"></span>
<span class="truncate">${cSt.label}</span>
</button>
`;
}).join('')}
</div>
</div>
<div>
<div class="text-[11px] font-semibold text-[#5C554D] mb-1.5">詳細・メモ</div>
<div class="p-3.5 rounded-2xl bg-[#F4EFE7] border border-[#E5DFD5] text-xs text-[#231F1C] leading-relaxed whitespace-pre-wrap break-words">
${formattedMemo ? escapeHtml(formattedMemo) : '<span class="text-[#8C847A]">詳細はありません</span>'}
</div>
</div>
</div>
</div>
</div>
`;
}
} else if (state.modal === 'school_day' && state.schoolDayModalDate) {
const dDate = state.schoolDayModalDate;
const schoolItems = state.items
.filter(it => it.date === dDate && it.category === 'class')
.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
modalHtml = `
<div onclick="if(event.target===this) closeModal()" class="fixed inset-0 z-50 bg-[#231F1C]/35 backdrop-blur-xs flex items-center justify-center p-4">
<div class="w-full max-w-md soft-card-3d rounded-[32px] p-6 m3-fab flex flex-col max-h-[82vh]">
<div class="flex items-center justify-between pb-3 border-b grid-hairline shrink-0">
<div>
<h3 class="text-base font-bold text-[#231F1C]">学校の予定（${schoolItems.length}件）</h3>
<div class="text-xs text-[#6E665E]">${dDate.replace(/-/g, '.')}（${getDayName(dDate).split('・')[1] || ''}）</div>
</div>
<button type="button" onclick="closeModal()" title="閉じる" class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">${ICONS.close}</button>
</div>
<div class="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
${schoolItems.length > 0 ? schoolItems.map(it => {
const formattedMemo = formatMemoText(it.memo);
const transitCls = (it.isTransit || /登校|下校|移動/.test(it.title)) ? 'opacity-65' : '';
return `
<div onclick="openItemDetail('${it.id}')" class="p-3 rounded-2xl bg-[#F4EFE7] hover:bg-[#ECE5DA] border border-[#E5DFD5] transition cursor-pointer flex items-start gap-3 ${transitCls}">
<div class="w-12 shrink-0 text-right">
<div class="text-xs font-bold text-[#231F1C]">${it.startTime || '終日'}</div>
${it.endTime ? `<div class="text-[11px] text-[#6E665E]">${it.endTime}</div>` : ''}
</div>
<div class="w-1 self-stretch rounded-full bg-[#C94035]"></div>
<div class="flex-1 min-w-0">
<div class="text-xs font-bold text-[#231F1C] leading-snug">${escapeHtml(it.title)}</div>
${formattedMemo ? `<div class="text-[11px] text-[#5C554D] mt-1 whitespace-pre-wrap line-clamp-2 break-words">${escapeHtml(formattedMemo)}</div>` : ''}
</div>
</div>
`;
}).join('') : '<div class="text-xs text-[#8C847A] py-8 text-center">この日の学校の予定はありません</div>'}
</div>
</div>
</div>
`;
}
return modalHtml;
}
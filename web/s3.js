window.deleteItem = (id) => {
state.items = state.items.filter(x => x.id !== id);
state.completedItemIds = state.completedItemIds.filter(cid => cid !== id);
render();
};
window.toggleDeadlineDone = (id) => {
if (state.completedItemIds.includes(id)) {
state.completedItemIds = state.completedItemIds.filter(cid => cid !== id);
} else {
state.completedItemIds.push(id);
}
render();
};
window.aiExtractFromNote = async () => {
const target = state.selectedDate || TODAY_STR;
const noteEl = document.getElementById('daily-note-input');
if (noteEl) state.notes[target] = noteEl.value;
const raw = (state.notes[target] || '').trim();
if (!raw) {
state.aiBannerMessage = 'ノートにメモが入力されていません。';
render();
return;
}
const existing = new Set(state.items.filter(i => i.date === target).map(i => i.title));
if (state.geminiApiKey) {
state.aiLoading = true;
render();
try {
const prompt = `以下のメモから予定・タスクを抽出し、JSON配列のみで返してください（マークダウン不要）。各要素は {"title": string, "startTime": "HH:mm", "endTime": "HH:mm", "category": "class"|"deadline"|"parttime"|"personal", "memo": string}。\nメモ:\n${raw}`;
const text = await callGemini(prompt);
const cleaned = text.replace(/```json|```/g, '').trim();
const parsed = JSON.parse(cleaned);
let added = 0;
if (Array.isArray(parsed)) {
parsed.forEach((p, idx) => {
if (p.title && !existing.has(p.title)) {
state.items.push({
id: 'gem-' + Date.now() + '-' + idx,
date: target,
title: p.title,
startTime: p.startTime || '13:00',
endTime: p.endTime || '14:00',
category: ['class','deadline','parttime','personal'].includes(p.category) ? p.category : 'personal',
memo: p.memo || 'Geminiにより抽出'
});
added++;
}
});
}
state.aiBannerMessage = added > 0
? `Geminiがノートから ${added} 件の予定を抽出し、左のスケジュールへ追加しました。`
: 'ノート内の項目はすでにスケジュールへ反映されています。';
} catch (err) {
state.aiBannerMessage = 'Gemini APIでの抽出に失敗しました。APIキーをご確認ください。';
} finally {
state.aiLoading = false;
render();
}
return;
}
const lines = raw.split('\n').map(l => l.replace(/^[・\-*\s]+/, '').trim()).filter(l => l.length > 2);
let added = 0;
lines.forEach((line, idx) => {
if (!existing.has(line)) {
const sh = 13 + (idx % 5);
state.items.push({
id: 'ext-' + Date.now() + '-' + idx,
date: target,
title: line,
startTime: `${String(sh).padStart(2, '0')}:00`,
endTime: `${String(sh + 1).padStart(2, '0')}:00`,
category: /レポート|課題|ゼミ|図書館|テスト/.test(line) ? 'deadline' : 'personal',
memo: 'Daily Noteから抽出'
});
added++;
}
});
state.aiBannerMessage = added > 0
? `ノートから ${added} 件の予定を抽出しました（右上の設定でGemini APIキーを登録すると高精度抽出が使えます）。`
: 'ノート内の項目はすでにスケジュールへ反映されています。';
render();
};
window.updateNote = (val) => {
if (state.selectedDate) { state.notes[state.selectedDate] = val; saveState(); }
};
window.openCourseModal = (dayIdx, period) => {
state.activeCourseSlot = { dayOfWeek: dayIdx, period };
const existing = state.courses.find(c => c.dayOfWeek === dayIdx && c.period === period);
state.editingCourseMode = !existing;
state.modal = 'course';
render();
};
window.toggleCourseEdit = () => {
state.editingCourseMode = !state.editingCourseMode;
render();
};
window.saveCourseSlot = (e) => {
e.preventDefault();
if (!state.activeCourseSlot) return;
const { dayOfWeek, period } = state.activeCourseSlot;
const name = document.getElementById('course-name').value.trim();
if (!name) return;
const room = document.getElementById('course-room').value.trim() || '未定';
const instructor = document.getElementById('course-instructor').value.trim() || '未設定';
const credits = Number(document.getElementById('course-credits').value) || 2;
const evaluation = document.getElementById('course-eval').value.trim() || '未設定';
const idx = state.courses.findIndex(c => c.dayOfWeek === dayOfWeek && c.period === period);
if (idx >= 0) {
state.courses[idx] = { ...state.courses[idx], name, room, instructor, credits, evaluation, isManual: true, isAuto: false };
} else {
state.courses.push({
id: 'c-' + Date.now(),
dayOfWeek,
period,
name,
room,
instructor,
credits,
evaluation,
attended: 0,
absent: 0,
late: 0,
isManual: true
});
}
state.editingCourseMode = false;
render();
};
window.deleteCourseSlot = (courseId) => {
state.courses = state.courses.filter(c => c.id !== courseId);
state.modal = null;
state.activeCourseSlot = null;
render();
};
window.updateCourseStat = (courseId, field, delta) => {
const c = state.courses.find(x => x.id === courseId);
if (c) c[field] = Math.max(0, c[field] + delta);
render();
};
window.generateUniAiPlan = async () => {
const pendingDeadlines = state.items
.filter(it => it.category === 'deadline' && !state.completedItemIds.includes(it.id))
.sort((a, b) => a.date.localeCompare(b.date));
const freeSlots = [];
const dayLabels = ['月', '火', '水', '木', '金'];
for (let d = 0; d < 5; d++) {
for (const p of UNIVERSITY_PERIODS) {
if (!state.courses.find(c => c.dayOfWeek === d && c.period === p.period)) {
freeSlots.push(`${dayLabels[d]}曜${p.period}限(${p.start}-${p.end})`);
}
}
}
if (pendingDeadlines.length === 0) {
state.uniAiAdvice = '未完了の課題・締切はありません。空きコマは予習や復習に活用できます。';
render();
return;
}
if (state.geminiApiKey) {
state.aiLoading = true;
render();
try {
const prompt = `大学生のスケジュールアドバイザーとして、以下の空きコマと未完了課題をもとに、2〜3文の簡潔で具体的な学習計画を日本語で提案してください。\n空きコマ: ${freeSlots.slice(0, 8).join(', ')}\n課題: ${pendingDeadlines.map(d => `${d.title}(${d.date})`).join(', ')}`;
const advice = await callGemini(prompt);
state.uniAiAdvice = advice.trim();
} catch (err) {
state.uniAiAdvice = 'Gemini APIでのプラン生成に失敗しました。APIキーをご確認ください。';
} finally {
state.aiLoading = false;
render();
}
return;
}
const urgent = pendingDeadlines[0];
const slotSuggestion = freeSlots.slice(0, 2).join(' と ');
state.uniAiAdvice = `直近の締切「${urgent.title}（${urgent.date}）」があります。空きコマ（${slotSuggestion || '放課後'}）の90分を使って進めるのがおすすめです。`;
render();
};
window.openEditItemModal = (id) => {
const it = state.items.find(x => x.id === id);
if (!it) return;
state.editingItemId = id;
state.newCategory = it.category || 'personal';
state.modal = 'add';
render();
};
window.addSkippedToTimetable = (itemId) => {
const it = state.items.find(x => x.id === itemId);
if (!it || !it.date) return;
const [y, m, d] = it.date.split('-').map(Number);
const dow = Math.min(5, (new Date(y, m - 1, d).getDay() + 6) % 7);
let targetPeriod = 1;
for (let p = 1; p <= UNIVERSITY_PERIODS.length; p++) {
if (!state.courses.find(c => c.dayOfWeek === dow && c.period === p)) {
targetPeriod = p;
break;
}
}
state.activeCourseSlot = { dayOfWeek: dow, period: targetPeriod };
state.courses.push({
id: 'c-' + Date.now(),
dayOfWeek: dow,
period: targetPeriod,
timeLabel: it.startTime || '',
name: cleanCourseTitle(it.title),
room: extractRoomFromItems([it]),
instructor: extractInstructorFromMemo(it.memo),
credits: 2,
evaluation: '未反映予定から手動追加',
attended: 1,
absent: 0,
late: 0,
isManual: true
});
state.aiBannerMessage = `「${cleanCourseTitle(it.title)}」を時間割に追加しました。`;
analyzeTimetableFromRecentWeeks(false);
render();
};
window.submitNewItem = async (e) => {
e.preventDefault();
const title = document.getElementById('new-title').value.trim();
const date = document.getElementById('new-date').value || TODAY_STR;
const start = document.getElementById('new-start').value || '10:00';
const end = document.getElementById('new-end').value || '11:00';
const memo = document.getElementById('new-memo').value.trim();
if (!title) return;
if (state.editingItemId) {
const idx = state.items.findIndex(x => x.id === state.editingItemId);
if (idx >= 0) {
const prev = state.items[idx];
state.items[idx] = {
...prev,
date,
title,
startTime: start,
endTime: end,
category: state.newCategory || 'personal',
memo: memo || undefined
};
const updated = state.items[idx];
state.editingItemId = null;
state.modal = null;
render();
if (state.driveAccessToken && updated.gcalEventId) {
try {
await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(updated.gcalEventId)}`, {
method: 'PATCH',
headers: {
Authorization: `Bearer ${state.driveAccessToken}`,
'Content-Type': 'application/json'
},
body: JSON.stringify({
summary: title,
description: memo || '',
start: { dateTime: `${date}T${start}:00+09:00` },
end: { dateTime: `${date}T${end}:00+09:00` }
})
});
} catch (err) {}
}
return;
}
}
const newItem = {
id: 'new-' + Date.now(),
date,
title,
startTime: start,
endTime: end,
category: state.newCategory || 'personal',
memo: memo || undefined
};
state.items.push(newItem);
state.modal = null;
render();
if (state.driveAccessToken) {
try {
const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
method: 'POST',
headers: {
Authorization: `Bearer ${state.driveAccessToken}`,
'Content-Type': 'application/json'
},
body: JSON.stringify({
summary: title,
description: memo || '',
start: { dateTime: `${date}T${start}:00+09:00` },
end: { dateTime: `${date}T${end}:00+09:00` }
})
});
if (res.ok) {
const ev = await res.json();
newItem.gcalEventId = ev.id;
saveState();
state.aiBannerMessage = '予定をGoogleカレンダーにも登録しました。';
render();
}
} catch (err) {}
}
};
window.saveSettings = (e) => {
e.preventDefault();
const keyInput = document.getElementById('settings-gemini-key').value.trim();
const cidInput = document.getElementById('settings-google-cid').value.trim();
state.geminiApiKey = keyInput;
state.googleClientId = cidInput;
if (keyInput) localStorage.setItem(API_KEY_STORAGE, keyInput);
else localStorage.removeItem(API_KEY_STORAGE);
if (cidInput) localStorage.setItem(CLIENT_ID_STORAGE, cidInput);
else localStorage.removeItem(CLIENT_ID_STORAGE);
state.aiBannerMessage = 'APIキー・Google連携設定を保存しました。';
state.modal = null;
render();
};
let driveSyncTimer = null;
let lastScheduledPayload = null;
let lastAutoSyncAt = 0;
function buildSyncPayloadString() {
return JSON.stringify({
items: state.items,
notes: state.notes,
courses: state.courses,
completedItemIds: state.completedItemIds,
customCategoryRules: state.customCategoryRules,
categoryOverrides: state.categoryOverrides,
paperStyle: state.paperStyle
});
}
window.addCustomCategoryRule = () => {
const kwEl = document.getElementById('rule-keyword-input');
const catEl = document.getElementById('rule-category-select');
const kw = kwEl ? kwEl.value.trim() : '';
const cat = catEl ? catEl.value : 'personal';
if (!kw) return;
state.customCategoryRules = state.customCategoryRules.filter(r => r.keyword !== kw);
state.customCategoryRules.unshift({ keyword: kw, category: cat });
state.items.forEach(it => {
if ((it.title || '').includes(kw) && !(state.categoryOverrides && state.categoryOverrides[it.title])) {
it.category = cat;
}
});
if (kwEl) kwEl.value = '';
state.aiBannerMessage = `「${kw}」の自動分類ルールを追加しました。`;
render();
};
window.removeCustomCategoryRule = (idx) => {
state.customCategoryRules.splice(idx, 1);
render();
};
window.selectLinkedAccount = (email) => {
const link = state.accountLinks && state.accountLinks[email];
if (!link || !link.clientId) return;
state.googleClientId = link.clientId;
state.googleAccountEmail = email;
localStorage.setItem(CLIENT_ID_STORAGE, link.clientId);
localStorage.setItem(EMAIL_STORAGE, email);
window.connectGoogleDrive(false, '');
};
window.removeLinkedAccount = (email) => {
if (!state.accountLinks) return;
delete state.accountLinks[email];
localStorage.setItem(ACCOUNT_LINKS_STORAGE, JSON.stringify(state.accountLinks));
render();
};
function scheduleDriveSync() {
if (!state.driveAccessToken) return;
const currentPayload = buildSyncPayloadString();
if (currentPayload === lastScheduledPayload) return;
lastScheduledPayload = currentPayload;
clearTimeout(driveSyncTimer);
driveSyncTimer = setTimeout(() => {
uploadToGoogleDrive(true);
}, 1200);
}
function clearStoredGoogleToken(fullSignOut = false) {
state.driveAccessToken = null;
localStorage.removeItem(TOKEN_STORAGE);
localStorage.removeItem(TOKEN_EXP_STORAGE);
if (fullSignOut) {
localStorage.removeItem(LOGGED_IN_STORAGE);
state.driveSyncStatus = 'disconnected';
state.driveLastSynced = null;
}
}
window.disconnectGoogleDrive = () => {
clearStoredGoogleToken(true);
state.aiBannerMessage = 'Googleアカウントからログアウトしました。';
render();
};
window.handleGoogleLoginClick = () => {
const cidEl = document.getElementById('settings-google-cid');
const cid = cidEl ? cidEl.value.trim() : state.googleClientId;
if (!cid) {
state.aiBannerMessage = 'Googleログインを使うには、先にGoogle OAuthクライアントIDを設定してください。';
state.modal = 'sync';
render();
return;
}
window.connectGoogleDrive(false, state.driveAccessToken ? 'select_account' : 'consent');
};
function formatDateKey(y, m, d) {
return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function shiftDate(dateStr, delta) {
const [y, m, d] = dateStr.split('-').map(Number);
const dt = new Date(y, m - 1, d + delta);
return formatDateKey(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}
function daysUntil(fromStr, toStr) {
const [y1, m1, d1] = fromStr.split('-').map(Number);
const [y2, m2, d2] = toStr.split('-').map(Number);
const t1 = new Date(y1, m1 - 1, d1).getTime();
const t2 = new Date(y2, m2 - 1, d2).getTime();
return Math.round((t2 - t1) / 86400000);
}
const _now = new Date();
const TODAY_STR = formatDateKey(_now.getFullYear(), _now.getMonth() + 1, _now.getDate());
const STORAGE_KEY = 'folio_planner_v2';
const API_KEY_STORAGE = 'folio_gemini_api_key';
const CLIENT_ID_STORAGE = 'folio_google_client_id';
const TOKEN_STORAGE = 'folio_drive_token';
const TOKEN_EXP_STORAGE = 'folio_drive_token_exp';
const LOGGED_IN_STORAGE = 'folio_google_logged_in';
const EMAIL_STORAGE = 'folio_google_email';
const ACCOUNT_LINKS_STORAGE = 'folio_account_links';
const DRIVE_FILE_NAME = 'folio-planner-data.json';
const state = {
currentYear: _now.getFullYear(),
currentMonth: _now.getMonth() + 1,
appMode: 'calendar',
selectedDate: null,
selectedMobileDay: TODAY_STR,
mobileHomeView: 'calendar',
showPastAgenda: false,
mobileDailyTab: 'schedule',
mobileUniTab: 'timetable',
uniSelectedDay: Math.min(5, (_now.getDay() + 6) % 7),
uniGridMobile: false,
paperStyle: 'ruled',
modal: null,
activeCourseSlot: null,
editingCourseMode: false,
editingItemId: null,
detailItemId: null,
schoolDayModalDate: null,
newCategory: 'personal',
categoryFilter: 'all',
categoryOverrides: {},
customCategoryRules: [],
searchQuery: '',
aiBannerMessage: null,
aiLoading: false,
uniAiAdvice: null,
timetableDebugInfo: { included: [], skipped: [], rangeStart: '', rangeEnd: '' },
geminiApiKey: localStorage.getItem(API_KEY_STORAGE) || '',
googleClientId: localStorage.getItem(CLIENT_ID_STORAGE) || '',
googleAccountEmail: localStorage.getItem(EMAIL_STORAGE) || '',
accountLinks: (() => { try { return JSON.parse(localStorage.getItem(ACCOUNT_LINKS_STORAGE) || '{}') || {}; } catch (e) { return {}; } })(),
isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
driveAccessToken: null,
driveFileId: null,
driveSyncStatus: 'disconnected',
driveLastSynced: null,
items: [],
notes: {},
courses: [],
completedItemIds: [],
showCompletedDeadlines: true
};
function timeToMinutes(t) {
if (!t) return 9999;
const [h, m] = t.split(':').map(Number);
return h * 60 + (m || 0);
}
function getDayName(dateStr) {
const [y, m, d] = dateStr.split('-').map(Number);
const dt = new Date(y, m - 1, d);
return ['Sunday・日', 'Monday・月', 'Tuesday・火', 'Wednesday・水', 'Thursday・木', 'Friday・金', 'Saturday・土'][dt.getDay()];
}
function getCalendarWeeks(year, month) {
const firstDay = new Date(year, month - 1, 1);
const lastDay = new Date(year, month, 0);
const daysInMonth = lastDay.getDate();
const startOffset = (firstDay.getDay() + 6) % 7;
const cells = [];
for (let i = 0; i < startOffset; i++) {
cells.push({ dateStr: null, dayNumber: null });
}
for (let d = 1; d <= daysInMonth; d++) {
cells.push({ dateStr: formatDateKey(year, month, d), dayNumber: d });
}
while (cells.length % 7 !== 0 || cells.length < 35) {
cells.push({ dateStr: null, dayNumber: null });
}
const weeks = [];
for (let i = 0; i < cells.length; i += 7) {
weeks.push({ days: cells.slice(i, i + 7) });
}
return weeks;
}
function buildMiniMonthHtml(year, month) {
const mIndex = ((month - 1) % 12 + 12) % 12;
const actualYear = month < 1 ? year - 1 : month > 12 ? year + 1 : year;
const actualMonth = mIndex + 1;
const firstDay = new Date(actualYear, actualMonth - 1, 1);
const daysInMonth = new Date(actualYear, actualMonth, 0).getDate();
const offset = (firstDay.getDay() + 6) % 7;
const cells = [];
for (let i = 0; i < offset; i++) cells.push('');
for (let d = 1; d <= daysInMonth; d++) cells.push(d);
return `
<div class="text-xs select-none">
<div class="flex items-baseline gap-1 border-b border-[#D6D0C6] pb-0.5 mb-1">
<span class="font-bold text-[#231F1C]">${actualMonth}</span>
<span class="text-[#6E665E]">${MONTH_NAMES_EN[mIndex]}</span>
</div>
<div class="grid grid-cols-7 gap-x-1 gap-y-0.5 text-center leading-tight">
${['月','火','水','木','金','土','日'].map((w, i) => `
<span class="text-[#8C847A] ${i === 5 ? 'text-[#2B5B84]' : i === 6 ? 'text-[#B83B2E]' : ''}">${w}</span>
`).join('')}
${cells.map((d, idx) => {
const col = idx % 7;
const color = col === 5 ? 'text-[#2B5B84]' : col === 6 ? 'text-[#B83B2E]' : 'text-[#4A443E]';
return `<span class="${color}">${d}</span>`;
}).join('')}
</div>
</div>
`;
}
async function callGemini(prompt) {
if (!state.geminiApiKey) return null;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(state.geminiApiKey)}`;
const res = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
contents: [{ parts: [{ text: prompt }] }]
})
});
if (!res.ok) throw new Error('Gemini API Error: ' + res.status);
const data = await res.json();
return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
window.setYear = (delta) => {
state.currentYear += delta;
render();
if (state.driveAccessToken) window.syncWithGoogleDrive(true);
};
window.selectMonth = (m) => {
state.currentMonth = m;
state.selectedDate = null;
state.appMode = 'calendar';
render();
if (state.driveAccessToken) window.syncWithGoogleDrive(true);
};
window.toggleShowCompletedDeadlines = () => {
state.showCompletedDeadlines = !state.showCompletedDeadlines;
render();
};
function cleanCourseTitle(raw) {
return (raw || '')
.replace(/【[^】]*】/g, '')
.replace(/（[^）]*）/g, '')
.replace(/\([^)]*\)/g, '')
.trim() || raw;
}
function extractInstructorFromMemo(memo) {
if (!memo) return '未設定';
const m = memo.match(/担当[:：]\s*([^\n\r]+)/);
return m ? m[1].trim() : '未設定';
}
function extractRoomFromItems(items) {
for (const it of items) {
if (it.location && it.location.trim()) return it.location.trim();
if (it.memo && it.memo.trim()) {
const plain = it.memo
.replace(/<br\s*\/?>/gi, '\n')
.replace(/<[^>]+>/g, ' ')
.replace(/&nbsp;/g, ' ')
.trim();
const m = plain.match(/(?:教室|場所|ルーム)[:：]\s*([^\n\r]+)/);
if (m && m[1].trim()) return m[1].trim();
const firstLine = plain.split(/\r?\n/).map(s => s.trim()).find(Boolean);
if (firstLine) return firstLine.slice(0, 32);
}
}
return '詳細なし';
}
function analyzeTimetableFromRecentWeeks(showBanner = false) {
const dayLabels = ['月', '火', '水', '木', '金', '土'];
const start21 = shiftDate(TODAY_STR, -21);
const end21 = TODAY_STR;
const next21 = shiftDate(TODAY_STR, 21);
const collectInRange = (startStr, endStr) => state.items.filter(it => {
if (!it.date || !it.startTime || it.category !== 'class') return false;
if (it.date < startStr || it.date > endStr) return false;
const [y, m, d] = it.date.split('-').map(Number);
const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
return dow >= 0 && dow <= 5;
});
let usedStart = start21;
let usedEnd = end21;
let allClassItems = collectInRange(start21, end21);
if (allClassItems.length === 0) {
usedStart = TODAY_STR;
usedEnd = next21;
allClassItems = collectInRange(TODAY_STR, next21);
}
const skipped = [];
const targetItems = [];
allClassItems.forEach(it => {
const t = it.title || '';
if (/登校|下校|移動|HR|LHR/.test(t)) {
skipped.push({ item: it, reason: '登下校・HR等のため除外' });
return;
}
if (/自習|宿題|行事|鑑賞/.test(t)) {
skipped.push({ item: it, reason: '自習・行事等のため自動除外（手動追加可）' });
return;
}
targetItems.push(it);
});
if (targetItems.length === 0) {
state.timetableDebugInfo = { included: [], skipped, rangeStart: usedStart, rangeEnd: usedEnd };
return 0;
}
const slotMap = new Map();
targetItems.forEach(it => {
const [y, m, d] = it.date.split('-').map(Number);
const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
const mins = timeToMinutes(it.startTime);
const bucket = Math.round(mins / 15) * 15;
const key = `${dow}-${bucket}`;
if (!slotMap.has(key)) slotMap.set(key, { dow, bucket, items: [] });
slotMap.get(key).items.push(it);
});
const entries = Array.from(slotMap.values());
const distinctBuckets = Array.from(new Set(entries.map(e => e.bucket))).sort((a, b) => a - b);
const clusters = [];
distinctBuckets.forEach(b => {
if (clusters.length === 0 || b - clusters[clusters.length - 1].center > 30) {
clusters.push({ center: b, buckets: [b] });
} else {
clusters[clusters.length - 1].buckets.push(b);
}
});
const bucketToPeriod = new Map();
clusters.slice(0, UNIVERSITY_PERIODS.length).forEach((cl, idx) => {
cl.buckets.forEach(b => bucketToPeriod.set(b, idx + 1));
});
const manualCourses = state.courses.filter(c => c.isManual);
const occupied = new Set(manualCourses.map(c => `${c.dayOfWeek}-${c.period}`));
const autoCourses = [];
const included = [];
entries.forEach(e => {
const period = bucketToPeriod.get(e.bucket);
if (!period) {
skipped.push({ item: e.items[0], reason: `時限枠(${UNIVERSITY_PERIODS.length}限)超過のため未反映` });
return;
}
const slotKey = `${e.dow}-${period}`;
if (occupied.has(slotKey)) {
skipped.push({ item: e.items[0], reason: `${dayLabels[e.dow]}${period}限が既存枠と重複` });
return;
}
occupied.add(slotKey);
const freq = new Map();
e.items.forEach(it => {
const name = cleanCourseTitle(it.title);
if (!freq.has(name)) freq.set(name, { count: 0, sample: it });
freq.get(name).count++;
});
const sortedNames = Array.from(freq.entries()).sort((a, b) => b[1].count - a[1].count);
const best = sortedNames[0];
if (!best) return;
const [bestName, info] = best;
sortedNames.slice(1).forEach(([altName, altInfo]) => {
skipped.push({ item: altInfo.sample, reason: `${dayLabels[e.dow]}${period}限は「${bestName}」を優先` });
});
const courseObj = {
id: `auto-${e.dow}-${period}`,
dayOfWeek: e.dow,
period,
timeLabel: info.sample.startTime || '',
name: bestName,
room: extractRoomFromItems(e.items),
instructor: extractInstructorFromMemo(info.sample.memo),
credits: 2,
evaluation: 'カレンダー直近3週間から自動反映',
attended: e.items.length,
absent: 0,
late: 0,
isAuto: true
};
autoCourses.push(courseObj);
included.push({ dayLabel: `${dayLabels[e.dow]}${period}限`, name: bestName, count: e.items.length, time: info.sample.startTime });
});
state.timetableDebugInfo = { included, skipped, rangeStart: usedStart, rangeEnd: usedEnd };
if (autoCourses.length === 0) return 0;
state.courses = [...manualCourses, ...autoCourses];
if (showBanner) {
state.aiBannerMessage = `直近3週間の予定（月〜土）を分析し、${autoCourses.length}コマの授業を時間割に反映しました。`;
}
return autoCourses.length;
}
window.reanalyzeTimetable = () => {
analyzeTimetableFromRecentWeeks(true);
render();
};
window.setSelectedMobileDay = (dateStr) => { state.selectedMobileDay = dateStr; render(); };
window.setUniSelectedDay = (d) => { state.uniSelectedDay = d; render(); };
window.toggleUniGridMobile = () => { state.uniGridMobile = !state.uniGridMobile; render(); };
window.setCategoryFilter = (cat) => { state.categoryFilter = cat; render(); };
window.setSearchQuery = (q) => { state.searchQuery = q; render(); };
function escapeHtml(str) {
return String(str || '')
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;');
}
function sanitizeGoogleClientId(raw) {
const cleaned = String(raw || '').replace(/[\s\u200B-\u200D\uFEFF"'`<>]/g, '').trim();
const m = cleaned.match(/[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com/);
return m ? m[0] : cleaned;
}
function formatMemoText(raw) {
if (!raw) return '';
return String(raw)
.replace(/<\s*br\s*\/?>/gi, '\n')
.replace(/<\/\s*(?:p|div|li|tr|h[1-6])\s*>/gi, '\n')
.replace(/<\s*li[^>]*>/gi, '・')
.replace(/<[^>]+>/g, '')
.replace(/&nbsp;/gi, ' ')
.replace(/&amp;/gi, '&')
.replace(/&lt;/gi, '<')
.replace(/&gt;/gi, '>')
.replace(/&quot;/gi, '"')
.replace(/&#39;/gi, "'")
.replace(/\r\n/g, '\n')
.replace(/\n{3,}/g, '\n\n')
.trim();
}
window.openItemDetail = (id) => {
state.detailItemId = id;
state.modal = 'detail';
render();
};
window.openSchoolDayModal = (dateStr) => {
state.schoolDayModalDate = dateStr;
state.modal = 'school_day';
render();
};
window.changeItemCategory = (id, newCat) => {
const target = state.items.find(x => x.id === id);
if (!target) return;
target.category = newCat;
if (target.title) {
state.categoryOverrides[target.title] = newCat;
state.items.forEach(it => {
if (it.title === target.title) it.category = newCat;
});
}
const st = CATEGORY_STYLES[newCat] || CATEGORY_STYLES.personal;
state.aiBannerMessage = `「${target.title}」を「${st.label}」に変更しました（今後の同期でも記憶されます）。`;
render();
};
window.setAppMode = (mode) => {
state.appMode = mode;
if (mode === 'university') analyzeTimetableFromRecentWeeks(true);
render();
};
window.setMobileDailyTab = (t) => { state.mobileDailyTab = t; render(); };
window.toggleMobileHomeView = () => {
state.mobileHomeView = state.mobileHomeView === 'calendar' ? 'agenda' : 'calendar';
state.showPastAgenda = false;
render();
};
window.togglePastAgenda = () => { state.showPastAgenda = !state.showPastAgenda; render(); };
window.setMobileUniTab = (t) => { state.mobileUniTab = t; render(); };
window.selectDate = (dateStr) => { state.selectedDate = dateStr || null; render(); };
function isPortraitLayout() {
return window.innerWidth < window.innerHeight || window.innerWidth < 768;
}
let _lastPortrait = isPortraitLayout();
window.addEventListener('resize', () => {
const next = isPortraitLayout();
if (next !== _lastPortrait) {
_lastPortrait = next;
render();
}
});
window.moveDay = (delta) => { state.selectedDate = shiftDate(state.selectedDate, delta); render(); };
window.togglePaperStyle = () => { state.paperStyle = state.paperStyle === 'ruled' ? 'dots' : 'ruled'; render(); };
window.jumpToToday = () => {
state.currentYear = _now.getFullYear();
state.currentMonth = _now.getMonth() + 1;
state.appMode = 'calendar';
state.selectedMobileDay = TODAY_STR;
if (!isPortraitLayout() || state.selectedDate) state.selectedDate = TODAY_STR;
render();
};
window.openModal = (m) => {
if (m === 'add') state.editingItemId = null;
state.modal = m;
render();
};
window.closeModal = () => {
state.modal = null;
state.activeCourseSlot = null;
state.editingCourseMode = false;
state.editingItemId = null;
state.detailItemId = null;
state.schoolDayModalDate = null;
render();
};
window.closeBanner = () => { state.aiBannerMessage = null; render(); };
let _toastTimer = null;
let _lastToastMsg = null;
function syncToastTimer() {
if (state.aiBannerMessage && state.aiBannerMessage !== _lastToastMsg) {
_lastToastMsg = state.aiBannerMessage;
clearTimeout(_toastTimer);
_toastTimer = setTimeout(() => {
state.aiBannerMessage = null;
_lastToastMsg = null;
render();
}, 3500);
} else if (!state.aiBannerMessage) {
_lastToastMsg = null;
clearTimeout(_toastTimer);
}
}
function getNextStatusSummary() {
const now = new Date();
const nowMins = now.getHours() * 60 + now.getMinutes();
const todayUpcoming = state.items
.filter(it => it.date === TODAY_STR && it.startTime && !it.isTransit && timeToMinutes(it.startTime) >= nowMins)
.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const nextEvent = todayUpcoming[0] || null;
let nextDiffText = '';
if (nextEvent) {
const diffMins = timeToMinutes(nextEvent.startTime) - nowMins;
nextDiffText = diffMins === 0 ? 'まもなく' : diffMins < 60 ? `あと${diffMins}分` : `あと${Math.floor(diffMins / 60)}時間${diffMins % 60 > 0 ? (diffMins % 60) + '分' : ''}`;
}
const nextDeadline = state.items
.filter(it => it.category === 'deadline' && !state.completedItemIds.includes(it.id) && it.date >= TODAY_STR)
.sort((a, b) => a.date.localeCompare(b.date))[0] || null;
let deadlineBadge = '';
if (nextDeadline) {
const d = daysUntil(TODAY_STR, nextDeadline.date);
deadlineBadge = d === 0 ? '今日' : `あと${d}日`;
}
return { nextEvent, nextDiffText, nextDeadline, deadlineBadge };
}
function getPrepPickupItems() {
const limitStr = shiftDate(TODAY_STR, 7);
const results = [];
state.items
.filter(it => it.date >= TODAY_STR && it.date <= limitStr)
.sort((a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
.forEach(it => {
const plain = formatMemoText(it.memo);
const text = `${it.title || ''}\n${plain}`;
if (it.hasPrepAlert || /持ち物|持参|用意|小テスト|テスト|提出|締切|予習|復習|宿題|課題/.test(text)) {
const lines = plain.split('\n').filter(l => /持ち物|持参|用意|小テスト|テスト|提出|締切|予習|復習|宿題|課題/.test(l));
results.push({
item: it,
snippet: lines[0] || plain.split('\n')[0] || '詳細を確認'
});
}
});
return results.slice(0, 8);
}
window.addEventListener('online', () => {
state.isOffline = false;
render();
if (state.driveAccessToken) syncWithGoogleDrive(true);
});
window.addEventListener('offline', () => {
state.isOffline = true;
render();
});
let _touchStartX = 0;
let _touchStartY = 0;
let _touchIgnore = false;
window.addEventListener('touchstart', (e) => {
if (e.touches.length !== 1 || state.modal) { _touchIgnore = true; return; }
const el = e.target;
if (el && el.closest && el.closest('input, textarea, select, .hide-scrollbar')) { _touchIgnore = true; return; }
_touchIgnore = false;
_touchStartX = e.touches[0].clientX;
_touchStartY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', (e) => {
if (_touchIgnore || e.changedTouches.length !== 1 || state.modal) return;
const dx = e.changedTouches[0].clientX - _touchStartX;
const dy = e.changedTouches[0].clientY - _touchStartY;
if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
if (state.appMode === 'calendar') {
if (state.selectedDate) {
moveDay(dx < 0 ? 1 : -1);
} else {
const delta = dx < 0 ? 1 : -1;
let nm = state.currentMonth + delta;
let ny = state.currentYear;
if (nm < 1) { nm = 12; ny--; }
if (nm > 12) { nm = 1; ny++; }
state.currentYear = ny;
selectMonth(nm);
}
}
}, { passive: true });
window.selectNewCategory = (cat) => {
state.newCategory = cat;
document.querySelectorAll('[data-cat-btn]').forEach(btn => {
const isMatch = btn.getAttribute('data-cat-btn') === cat;
btn.classList.toggle('ring-2', isMatch);
btn.classList.toggle('ring-[#231F1C]', isMatch);
btn.classList.toggle('scale-105', isMatch);
});
};
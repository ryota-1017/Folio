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
const DRIVE_FILE_NAME = 'folio-planner-data.json';
const state = {
currentYear: _now.getFullYear(),
currentMonth: _now.getMonth() + 1,
appMode: 'calendar',
selectedDate: null,
mobileDailyTab: 'schedule',
mobileUniTab: 'timetable',
paperStyle: 'ruled',
modal: null,
activeCourseSlot: null,
editingCourseMode: false,
newCategory: 'personal',
aiBannerMessage: null,
aiLoading: false,
uniAiAdvice: null,
geminiApiKey: localStorage.getItem(API_KEY_STORAGE) || '',
googleClientId: localStorage.getItem(CLIENT_ID_STORAGE) || '',
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
const collectInRange = (startStr, endStr) => state.items.filter(it => {
if (!it.date || !it.startTime || it.category !== 'class') return false;
if (it.date < startStr || it.date > endStr) return false;
if (/登校|下校|移動|自習|宿題|HR|LHR|行事|鑑賞/.test(it.title || '')) return false;
const [y, m, d] = it.date.split('-').map(Number);
const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
return dow >= 0 && dow <= 4;
});
let targetItems = collectInRange(shiftDate(TODAY_STR, -21), TODAY_STR);
if (targetItems.length === 0) {
targetItems = collectInRange(TODAY_STR, shiftDate(TODAY_STR, 21));
}
if (targetItems.length === 0) return 0;
const slotMap = new Map();
targetItems.forEach(it => {
const [y, m, d] = it.date.split('-').map(Number);
const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
const mins = timeToMinutes(it.startTime);
const bucket = Math.round(mins / 20) * 20;
const key = `${dow}-${bucket}`;
if (!slotMap.has(key)) slotMap.set(key, { dow, bucket, items: [] });
slotMap.get(key).items.push(it);
});
let entries = Array.from(slotMap.values());
const repeated = entries.filter(e => e.items.length >= 2);
if (repeated.length > 0) entries = repeated;
const distinctBuckets = Array.from(new Set(entries.map(e => e.bucket))).sort((a, b) => a - b);
const clusters = [];
distinctBuckets.forEach(b => {
if (clusters.length === 0 || b - clusters[clusters.length - 1].center > 25) {
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
entries.forEach(e => {
const period = bucketToPeriod.get(e.bucket);
if (!period) return;
const slotKey = `${e.dow}-${period}`;
if (occupied.has(slotKey)) return;
occupied.add(slotKey);
const freq = new Map();
e.items.forEach(it => {
const name = cleanCourseTitle(it.title);
if (!freq.has(name)) freq.set(name, { count: 0, sample: it });
freq.get(name).count++;
});
const best = Array.from(freq.entries()).sort((a, b) => b[1].count - a[1].count)[0];
if (!best) return;
const [bestName, info] = best;
autoCourses.push({
id: `auto-${e.dow}-${period}`,
dayOfWeek: e.dow,
period,
name: bestName,
room: extractRoomFromItems(e.items),
instructor: extractInstructorFromMemo(info.sample.memo),
credits: 2,
evaluation: 'カレンダー直近3週間から自動反映',
attended: e.items.length,
absent: 0,
late: 0,
isAuto: true
});
});
if (autoCourses.length === 0) return 0;
state.courses = [...manualCourses, ...autoCourses];
if (showBanner) {
state.aiBannerMessage = `直近3週間の予定を分析し、${autoCourses.length}コマの授業を時間割に反映しました。`;
}
return autoCourses.length;
}
window.setAppMode = (mode) => {
state.appMode = mode;
if (mode === 'university') analyzeTimetableFromRecentWeeks(true);
render();
};
window.setMobileDailyTab = (t) => { state.mobileDailyTab = t; render(); };
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
state.selectedDate = TODAY_STR;
render();
};
window.openModal = (m) => { state.modal = m; render(); };
window.closeModal = () => { state.modal = null; state.activeCourseSlot = null; state.editingCourseMode = false; render(); };
window.closeBanner = () => { state.aiBannerMessage = null; render(); };
window.selectNewCategory = (cat) => {
state.newCategory = cat;
document.querySelectorAll('[data-cat-btn]').forEach(btn => {
const isMatch = btn.getAttribute('data-cat-btn') === cat;
btn.classList.toggle('ring-2', isMatch);
btn.classList.toggle('ring-[#231F1C]', isMatch);
btn.classList.toggle('scale-105', isMatch);
});
};
function loadSavedState() {
try {
const params = new URLSearchParams(window.location.search);
const cidParam = params.get('cid');
if (cidParam && cidParam.trim()) {
state.googleClientId = cidParam.trim();
localStorage.setItem(CLIENT_ID_STORAGE, state.googleClientId);
params.delete('cid');
const qs = params.toString();
window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
state.aiBannerMessage = 'Google連携設定を引き継ぎました。右上のログインボタンからGoogleでログインできます。';
}
const raw = localStorage.getItem(STORAGE_KEY);
if (raw) {
const saved = JSON.parse(raw);
const sampleItemIds = new Set(['it-1', 'it-2', 'it-3', 'it-4', 'it-5', 'it-6']);
const sampleCourseIds = new Set(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9']);
if (Array.isArray(saved.items)) state.items = saved.items.filter(it => !sampleItemIds.has(it.id));
if (saved.notes && typeof saved.notes === 'object') {
const cleanedNotes = { ...saved.notes };
Object.keys(cleanedNotes).forEach(k => {
if (typeof cleanedNotes[k] === 'string' && cleanedNotes[k].includes('ミクロ経済学のレポートは「需要の価格弾力性の実例」')) {
delete cleanedNotes[k];
}
});
state.notes = cleanedNotes;
}
if (Array.isArray(saved.courses)) state.courses = saved.courses.filter(c => !sampleCourseIds.has(c.id));
if (Array.isArray(saved.completedItemIds)) state.completedItemIds = saved.completedItemIds;
if (typeof saved.showCompletedDeadlines === 'boolean') state.showCompletedDeadlines = saved.showCompletedDeadlines;
if (saved.categoryOverrides && typeof saved.categoryOverrides === 'object') state.categoryOverrides = saved.categoryOverrides;
if (Array.isArray(saved.customCategoryRules)) state.customCategoryRules = saved.customCategoryRules;
if (saved.paperStyle) state.paperStyle = saved.paperStyle;
state.items.forEach(it => {
if (it.title && state.categoryOverrides[it.title]) {
it.category = state.categoryOverrides[it.title];
} else if (/睡眠|就寝|起床|仮眠|休憩|風呂|入浴|食事|朝食|昼食|夕食|朝ご飯|昼ご飯|夜ご飯|身支度|ルーティン/.test(it.title || '')) {
it.category = 'personal';
}
});
}
const savedToken = localStorage.getItem(TOKEN_STORAGE);
const savedExp = Number(localStorage.getItem(TOKEN_EXP_STORAGE) || '0');
if (savedToken && savedExp > Date.now()) {
state.driveAccessToken = savedToken;
state.driveSyncStatus = 'synced';
} else {
localStorage.removeItem(TOKEN_STORAGE);
localStorage.removeItem(TOKEN_EXP_STORAGE);
}
lastScheduledPayload = buildSyncPayloadString();
} catch (e) {}
}
function saveState() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify({
items: state.items,
notes: state.notes,
courses: state.courses,
completedItemIds: state.completedItemIds,
showCompletedDeadlines: state.showCompletedDeadlines,
categoryOverrides: state.categoryOverrides,
customCategoryRules: state.customCategoryRules,
paperStyle: state.paperStyle
}));
scheduleDriveSync();
} catch (e) {}
}
loadSavedState();
window.addEventListener('load', () => {
if (state.driveAccessToken) {
syncWithGoogleDrive(true);
} else if (state.googleClientId && localStorage.getItem(LOGGED_IN_STORAGE) === '1') {
setTimeout(() => connectGoogleDrive(true, ''), 800);
}
});
window.addEventListener('focus', () => {
if (state.driveAccessToken && Date.now() - lastAutoSyncAt > 60000) {
syncWithGoogleDrive(true);
}
});
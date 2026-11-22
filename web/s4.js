window.copySetupLink = async () => {
const cidEl = document.getElementById('settings-google-cid');
const cid = (cidEl ? cidEl.value.trim() : state.googleClientId);
if (!cid) {
state.aiBannerMessage = '先にGoogle OAuthクライアントIDを入力してください。';
render();
return;
}
state.googleClientId = cid;
localStorage.setItem(CLIENT_ID_STORAGE, cid);
const url = `${window.location.origin}${window.location.pathname}?cid=${encodeURIComponent(cid)}`;
try {
await navigator.clipboard.writeText(url);
state.aiBannerMessage = '他端末引き継ぎ用URLをコピーしました。スマホ等で開くとクライアントIDが自動設定されます。';
} catch (e) {
state.aiBannerMessage = `引き継ぎURL: ${url}`;
}
render();
};
window.handleSyncClick = () => {
if (state.driveAccessToken) {
window.syncWithGoogleDrive(false);
return;
}
if (state.googleClientId) {
window.connectGoogleDrive(false, '');
return;
}
state.aiBannerMessage = '未ログインです。右端の設定ボタンからGoogleクライアントIDを登録し、ログインしてください。';
render();
};
window.connectGoogleDrive = (silent = false, promptMode = 'consent') => {
const cidEl = document.getElementById('settings-google-cid');
const cid = (cidEl ? cidEl.value.trim() : state.googleClientId);
if (!cid) {
if (!silent) {
state.aiBannerMessage = '先にGoogle OAuthクライアントIDを入力してください。';
state.modal = 'sync';
render();
}
return;
}
state.googleClientId = cid;
localStorage.setItem(CLIENT_ID_STORAGE, cid);
if (!window.google || !google.accounts || !google.accounts.oauth2) {
if (!silent) {
state.aiBannerMessage = 'Google認証ライブラリの読み込み中です。数秒後にもう一度お試しください。';
render();
}
return;
}
const tokenClient = google.accounts.oauth2.initTokenClient({
client_id: cid,
scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events',
callback: async (resp) => {
if (resp.error || !resp.access_token) {
if (!silent) {
state.driveSyncStatus = 'error';
state.aiBannerMessage = 'Googleログインに失敗しました。';
render();
}
return;
}
const expiresInSec = Number(resp.expires_in) || 3500;
const expiresAt = Date.now() + Math.max(60, expiresInSec - 120) * 1000;
state.driveAccessToken = resp.access_token;
localStorage.setItem(TOKEN_STORAGE, resp.access_token);
localStorage.setItem(TOKEN_EXP_STORAGE, String(expiresAt));
localStorage.setItem(LOGGED_IN_STORAGE, '1');
if (state.modal === 'sync') state.modal = null;
await syncWithGoogleDrive(silent);
}
});
tokenClient.requestAccessToken({ prompt: promptMode });
};
function classifyGcalEvent(ev) {
const title = ev.summary || '';
const colorId = ev.colorId;
if (state.categoryOverrides && state.categoryOverrides[title]) {
return state.categoryOverrides[title];
}
if (/睡眠|就寝|起床|仮眠|休憩|風呂|入浴|食事|朝食|昼食|夕食|朝ご飯|昼ご飯|夜ご飯|身支度|ルーティン/.test(title)) {
return 'personal';
}
if (/【塾】|フリーステップ|【立教大推薦】|出願|志願票|受験票|納金|模試|面談|課題|締切|レポート|提出|テスト|試験|小テスト|quiz/i.test(title)) {
return 'deadline';
}
if (/【学校】|登校|下校|自習|宿題|HR|LHR|授業|講義|ゼミ|補講|ホームルーム|^(?:英語|国語|古典|現代文|漢文|日本史|世界史|地理|数学|物理|化学|生物|地学|体育|保健|情報|美術|音楽|家庭)/.test(title)) {
return 'class';
}
if (/【プライベート】|外食|バイト|シフト|遊び|映画|旅行|買い物/.test(title)) {
return 'parttime';
}
if (colorId === '11') return 'class';
if (colorId === '9') return 'deadline';
if (colorId === '2') return 'parttime';
if (colorId === '8') return 'personal';
return 'personal';
}
async function readGoogleApiError(res) {
let detail = '';
try {
const errJson = await res.json();
detail = errJson?.error?.message || '';
} catch (e) {}
const shortDetail = detail ? ` ${detail.slice(0, 80)}` : '';
return `${res.status}${shortDetail}`;
}
async function fetchGoogleCalendarEvents() {
if (!state.driveAccessToken) return 0;
const startDt = new Date(state.currentYear, state.currentMonth - 7, 1);
const endDt = new Date(state.currentYear, state.currentMonth + 6, 0, 23, 59, 59);
const timeMin = startDt.toISOString();
const timeMax = endDt.toISOString();
const minDateStr = formatDateKey(startDt.getFullYear(), startDt.getMonth() + 1, startDt.getDate());
const maxDateStr = formatDateKey(endDt.getFullYear(), endDt.getMonth() + 1, endDt.getDate());
const events = [];
let pageToken = '';
for (let page = 0; page < 15; page++) {
const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250${pageParam}`;
const res = await fetch(url, {
headers: { Authorization: `Bearer ${state.driveAccessToken}` }
});
if (!res.ok) throw new Error(await readGoogleApiError(res));
const data = await res.json();
if (Array.isArray(data.items)) events.push(...data.items);
if (!data.nextPageToken) break;
pageToken = data.nextPageToken;
}
const keptItems = state.items.filter(it => !it.gcalEventId || it.date < minDateStr || it.date > maxDateStr);
const existingLocalGcalIds = new Set(keptItems.map(it => it.gcalEventId).filter(Boolean));
const gcalItems = [];
events.forEach(ev => {
if (ev.status === 'cancelled' || existingLocalGcalIds.has(ev.id)) return;
const startRaw = ev.start?.dateTime || ev.start?.date;
const endRaw = ev.end?.dateTime || ev.end?.date;
if (!startRaw) return;
const dateStr = startRaw.slice(0, 10);
const startTime = startRaw.includes('T') ? startRaw.slice(11, 16) : '';
const endTime = endRaw && endRaw.includes('T') ? endRaw.slice(11, 16) : '';
const title = ev.summary || '(無題の予定)';
const desc = ev.description || ev.location || '';
gcalItems.push({
id: 'gcal-' + ev.id,
gcalEventId: ev.id,
date: dateStr,
title,
startTime,
endTime,
category: classifyGcalEvent(ev),
isTransit: /登校|下校|移動/.test(title),
hasPrepAlert: /小テスト|提出|締切|※要予習/.test(desc),
location: ev.location || undefined,
memo: desc || undefined
});
});
state.items = [...keptItems, ...gcalItems];
return gcalItems.length;
}
window.syncWithGoogleDrive = async (silent = false) => {
if (!state.driveAccessToken) {
if (!silent) window.handleSyncClick();
return;
}
if (state.driveSyncStatus === 'syncing') return;
state.driveSyncStatus = 'syncing';
render();
let gcalCount = 0;
let gcalError = null;
let driveOk = false;
let driveError = null;
try {
try {
gcalCount = await fetchGoogleCalendarEvents();
} catch (e) {
const msg = String(e.message || e || 'Unknown error');
if (msg.startsWith('401')) throw new Error('401');
gcalError = msg;
}
try {
const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`, {
headers: { Authorization: `Bearer ${state.driveAccessToken}` }
});
if (searchRes.status === 401) throw new Error('401');
if (!searchRes.ok) throw new Error(await readGoogleApiError(searchRes));
const searchData = await searchRes.json();
const existingFile = searchData.files && searchData.files[0];
if (existingFile) {
state.driveFileId = existingFile.id;
const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
headers: { Authorization: `Bearer ${state.driveAccessToken}` }
});
if (dlRes.ok) {
const remoteData = await dlRes.json();
if (remoteData.notes) state.notes = { ...remoteData.notes, ...state.notes };
if (Array.isArray(remoteData.courses) && remoteData.courses.length) state.courses = remoteData.courses;
if (Array.isArray(remoteData.completedItemIds)) state.completedItemIds = remoteData.completedItemIds;
}
await uploadToGoogleDrive(true);
} else {
await uploadToGoogleDrive(false);
}
driveOk = true;
} catch (e) {
const msg = String(e.message || e || 'Unknown error');
if (msg.startsWith('401')) throw new Error('401');
driveError = msg;
}
lastScheduledPayload = buildSyncPayloadString();
lastAutoSyncAt = Date.now();
if (state.appMode === 'university') analyzeTimetableFromRecentWeeks(false);
if (!gcalError || driveOk) {
state.driveSyncStatus = 'synced';
state.driveLastSynced = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
if (!silent) {
if (!gcalError && driveOk) {
state.aiBannerMessage = `Googleカレンダー（${gcalCount}件）とGoogleドライブを同期しました。`;
} else if (!gcalError) {
state.aiBannerMessage = `Googleカレンダー（${gcalCount}件）を同期しました（Drive未同期: ${driveError}）。`;
} else {
state.aiBannerMessage = `Googleドライブを同期しました（カレンダー未同期: ${gcalError}）。`;
}
}
} else {
state.driveSyncStatus = 'error';
if (!silent) {
state.aiBannerMessage = `同期に失敗しました（カレンダー: ${gcalError} / Drive: ${driveError}）。`;
}
}
} catch (err) {
if (String(err.message || '').startsWith('401')) {
clearStoredGoogleToken(false);
state.driveSyncStatus = 'disconnected';
if (!silent) state.aiBannerMessage = 'ログインの有効期限が切れました（401）。再度ログインしてください。';
} else {
state.driveSyncStatus = 'error';
if (!silent) state.aiBannerMessage = `同期に失敗しました（${err.message || '通信エラー'}）。`;
}
}
render();
};
async function uploadToGoogleDrive(silent) {
if (!state.driveAccessToken) return;
const content = JSON.stringify({
items: state.items,
notes: state.notes,
courses: state.courses,
completedItemIds: state.completedItemIds,
paperStyle: state.paperStyle,
updatedAt: new Date().toISOString()
}, null, 2);
const metadata = { name: DRIVE_FILE_NAME, mimeType: 'application/json' };
const form = new FormData();
form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
form.append('file', new Blob([content], { type: 'application/json' }));
const url = state.driveFileId
? `https://www.googleapis.com/upload/drive/v3/files/${state.driveFileId}?uploadType=multipart`
: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const method = state.driveFileId ? 'PATCH' : 'POST';
const res = await fetch(url, {
method,
headers: { Authorization: `Bearer ${state.driveAccessToken}` },
body: form
});
if (res.ok) {
const result = await res.json();
if (result.id) state.driveFileId = result.id;
state.driveSyncStatus = 'synced';
state.driveLastSynced = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
if (!silent) render();
}
}
window.exportBackupJson = () => {
const payload = JSON.stringify({
items: state.items,
notes: state.notes,
courses: state.courses,
completedItemIds: state.completedItemIds,
paperStyle: state.paperStyle
}, null, 2);
const blob = new Blob([payload], { type: 'application/json' });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = `folio-backup-${TODAY_STR}.json`;
a.click();
URL.revokeObjectURL(a.href);
};
window.importBackupJson = (e) => {
const file = e.target.files && e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = () => {
try {
const data = JSON.parse(reader.result);
if (Array.isArray(data.items)) state.items = data.items;
if (data.notes) state.notes = data.notes;
if (Array.isArray(data.courses)) state.courses = data.courses;
if (Array.isArray(data.completedItemIds)) state.completedItemIds = data.completedItemIds;
if (data.paperStyle) state.paperStyle = data.paperStyle;
state.aiBannerMessage = 'バックアップデータを復元しました。';
state.modal = null;
render();
} catch (err) {
state.aiBannerMessage = 'JSONファイルの読み込みに失敗しました。';
render();
}
};
reader.readAsText(file);
};
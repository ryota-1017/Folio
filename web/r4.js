function render() {
if (typeof document !== 'undefined') {
document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : 'light');
}
saveState();
syncToastTimer();
const scrollMap = {};
document.querySelectorAll('[data-scroll-key]').forEach(el => {
scrollMap[el.getAttribute('data-scroll-key')] = el.scrollTop;
});
const prevPills = Array.from(document.querySelectorAll('.pill-track')).map(track => {
const thumb = track.querySelector('.pill-thumb');
if (!thumb) return null;
const r = thumb.getBoundingClientRect();
const tr = track.getBoundingClientRect();
return { left: r.left - tr.left, width: r.width, trackWidth: tr.width };
});
const root = document.getElementById('app');
const isPortrait = isPortraitLayout();
const steppedTabsHtml = Array.from({ length: 12 }, (_, idx) => {
const m = idx + 1;
const active = m === state.currentMonth;
return `
<button type="button" onclick="selectMonth(${m})" title="${m}月 (${MONTH_NAMES_EN[idx]})"
class="w-11 md:w-12 flex-1 rounded-l-2xl text-xs md:text-sm flex items-center justify-center ${
active ? 'index-tab-active' : 'index-tab'
}">
${m}
</button>
`;
}).join('');
const mobileMonthStripHtml = isPortrait ? `
<div class="px-3 pb-1.5 shrink-0">
<div class="grid grid-cols-12 gap-0.5 p-0.5 rounded-xl pill-track">
${Array.from({ length: 12 }, (_, idx) => {
const m = idx + 1;
const active = m === state.currentMonth;
return `
<button type="button" onclick="selectMonth(${m})" title="${m}月"
class="h-7 rounded-lg text-[11px] font-semibold flex items-center justify-center transition-all ${
active ? 'pill-thumb text-[#231F1C]' : 'text-[#47413B]'
}">
${m}
</button>
`;
}).join('')}
</div>
</div>
` : '';
const sheetBodyHtml = state.appMode === "calendar" ? renderCalendarBody(isPortrait) : renderUniversityBody(isPortrait);
const modalHtml = renderModalHtml();
root.innerHTML = `
${!isPortrait ? `
<nav aria-label="月インデックス" class="flex flex-col justify-between pt-14 pb-6 pl-1 z-10 shrink-0 gap-1">
<button type="button" onclick="setYear(-1)" title="1年前 (${state.currentYear - 1})"
class="w-11 md:w-12 h-8 shrink-0 rounded-l-2xl index-tab flex items-center justify-center">
${ICONS.keyboard_arrow_up}
</button>
${steppedTabsHtml}
<button type="button" onclick="setYear(1)" title="来年 (${state.currentYear + 1})"
class="w-11 md:w-12 h-8 shrink-0 rounded-l-2xl index-tab flex items-center justify-center">
${ICONS.keyboard_arrow_down}
</button>
</nav>
` : ''}
<div class="flex-1 planner-sheet ${isPortrait ? 'rounded-[24px]' : 'rounded-[32px]'} flex flex-col h-full overflow-hidden relative z-20 border border-white/70">
<header class="${isPortrait ? 'px-3 pt-2.5 pb-1.5' : 'px-6 pt-5 pb-2.5'} flex items-center justify-between shrink-0 gap-2">
<div class="flex items-center ${isPortrait ? 'gap-2' : 'gap-3'} min-w-0">
${state.appMode === 'calendar' && state.selectedDate ? `
<button type="button" onclick="closeDailyToHome()" title="月間カレンダーに戻る"
class="${isPortrait ? 'w-8 h-8' : 'mr-1 w-10 h-10'} rounded-full pill-thumb hover:scale-105 flex items-center justify-center text-[#231F1C] transition shrink-0">
${ICONS.arrow_back}
</button>
` : ''}
<span class="${isPortrait ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold tracking-tighter leading-none text-[#231F1C]">
${state.currentMonth}
</span>
<div class="flex flex-col justify-center min-w-0">
<span class="${isPortrait ? 'text-xs' : 'text-sm md:text-base'} font-semibold leading-tight text-[#231F1C] truncate">
${MONTH_NAMES_EN[state.currentMonth - 1]}
</span>
<div class="flex items-center gap-0.5 mt-0.5 text-xs text-[#38322D]">
<button type="button" onclick="setYear(-1)" title="前の年"
class="w-5 h-5 rounded-full hover:bg-[#EAE5DC] flex items-center justify-center transition">
${ICONS.chevron_left}
</button>
<span class="font-semibold tracking-wider text-[#231F1C]">${state.currentYear}</span>
<button type="button" onclick="setYear(1)" title="次の年"
class="w-5 h-5 rounded-full hover:bg-[#EAE5DC] flex items-center justify-center transition">
${ICONS.chevron_right}
</button>
</div>
</div>
</div>
<div class="flex items-center ${isPortrait ? 'gap-1.5' : 'gap-2'} shrink-0">
<div class="inline-flex items-center pill-track p-1 rounded-full gap-0.5">
<button type="button" onclick="setAppMode('calendar')" title="カレンダーモード"
class="${isPortrait ? 'w-8 h-7' : 'w-10 h-8'} rounded-full flex items-center justify-center transition-all ${
state.appMode === 'calendar'
? 'pill-thumb text-[#231F1C]'
: 'text-[#47413B] hover:text-[#231F1C]'
}">
${ICONS.calendar_month}
</button>
<button type="button" onclick="setAppMode('university')" title="大学モード"
class="${isPortrait ? 'w-8 h-7' : 'w-10 h-8'} rounded-full flex items-center justify-center transition-all ${
state.appMode === 'university'
? 'pill-thumb text-[#231F1C]'
: 'text-[#47413B] hover:text-[#231F1C]'
}">
${ICONS.school}
</button>
</div>
<button type="button" onclick="openModal('sync')" title="${state.driveAccessToken ? 'Googleアカウント・ログイン管理' : 'Googleでログイン'}"
class="relative ${isPortrait ? 'w-8 h-8' : 'w-10 h-10'} rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition ${
state.driveAccessToken ? 'text-[#244E32]' : 'text-[#224363]'
}">
${state.driveAccessToken ? ICONS.account_circle : ICONS.login}
${state.driveAccessToken ? `<span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#366B47] ring-2 ring-white"></span>` : ''}
</button>
<button type="button" onclick="handleSyncClick()" title="${state.driveAccessToken ? (state.driveSyncStatus === 'synced' ? '同期済（タップで今すぐ再同期）' : '今すぐ同期') : '同期（要ログイン）'}"
class="${isPortrait ? 'w-8 h-8' : 'w-10 h-10'} rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition ${
state.driveSyncStatus === 'synced' && state.driveAccessToken
? 'text-[#244E32]'
: state.driveSyncStatus === 'error'
? 'text-[#B83B2E]'
: 'text-[#38322D]'
} ${state.driveSyncStatus === 'syncing' ? 'animate-spin' : ''}">
${state.driveSyncStatus === 'synced' && state.driveAccessToken ? ICONS.cloud_done : ICONS.sync}
</button>
<button type="button" onclick="openModal('settings')" title="設定"
class="${isPortrait ? 'w-8 h-8' : 'w-10 h-10'} rounded-full pill-thumb hover:scale-105 flex items-center justify-center text-[#231F1C] transition">
${ICONS.tune}
</button>
</div>
</header>
${mobileMonthStripHtml}
${sheetBodyHtml}
${(() => {
if (state.aiBannerMessage) {
return `
<div class="vellora-toast fixed top-3 left-1/2 z-[60] max-w-[92vw] sm:max-w-md px-4 py-2.5 rounded-full flex items-center gap-2.5 text-xs font-semibold pointer-events-auto anim-toast-drop">
<span class="text-[#D4A853] shrink-0">${ICONS.auto_awesome}</span>
<span class="truncate">${escapeHtml(state.aiBannerMessage)}</span>
<button type="button" onclick="closeBanner()" title="閉じる" class="w-5 h-5 rounded-full hover:bg-white/15 flex items-center justify-center shrink-0">${ICONS.close}</button>
</div>`;
}
if (state.swUpdateReady) {
return `
<div class="vellora-toast fixed top-3 left-1/2 z-[60] max-w-[92vw] sm:max-w-md px-4 py-2 rounded-full flex items-center gap-2.5 text-xs font-semibold pointer-events-auto anim-toast-drop">
<span class="truncate">新しい更新が準備できています</span>
<button type="button" onclick="applySwUpdate()" class="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-bold shrink-0 transition">更新</button>
</div>`;
}
if (state.latestRelease) {
return `
<div class="vellora-toast fixed top-3 left-1/2 z-[60] max-w-[92vw] sm:max-w-md px-4 py-2 rounded-full flex items-center gap-2.5 text-xs font-semibold pointer-events-auto anim-toast-drop">
<span class="truncate">新バージョン v${escapeHtml(state.latestRelease.version)} が公開されています</span>
<a href="${escapeHtml(state.latestRelease.url)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-bold shrink-0 transition">GitHub</a>
<button type="button" onclick="dismissLatestRelease()" title="閉じる" class="w-5 h-5 rounded-full hover:bg-white/15 flex items-center justify-center shrink-0">${ICONS.close}</button>
</div>`;
}
if (state.needsRelogin) {
return `
<div class="vellora-toast fixed top-3 left-1/2 z-[60] max-w-[92vw] sm:max-w-md px-4 py-2 rounded-full flex items-center gap-2.5 text-xs font-semibold pointer-events-auto anim-toast-drop">
<span class="truncate">Googleのセッション期限が切れました</span>
<button type="button" onclick="handleGoogleLoginClick()" class="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-bold shrink-0 transition">再ログイン</button>
</div>`;
}
if (state.isOffline) {
return `
<div class="vellora-toast fixed top-3 left-1/2 z-[60] max-w-[92vw] sm:max-w-md px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold pointer-events-auto anim-toast-drop">
<span class="w-2 h-2 rounded-full bg-[#E66A5F] shrink-0"></span>
<span class="truncate">オフラインで表示中</span>
</div>`;
}
return '';
})()}
<div class="fixed ${isPortrait ? 'bottom-3.5 right-3.5 gap-2' : 'bottom-7 right-7 gap-3'} z-30 flex items-center">
<button type="button" onclick="openModal('search')" title="予定・ノートを検索"
class="${isPortrait ? 'p-3' : 'p-3.5'} rounded-full m3-fab-light text-[#231F1C] border border-white/90 flex items-center justify-center transition-transform hover:-translate-y-0.5 active:scale-95">
${ICONS.search}
</button>
${isPortrait && state.appMode === 'calendar' && !state.selectedDate ? `
<button type="button" onclick="toggleMobileHomeView()" title="${state.mobileHomeView === 'calendar' ? 'スケジュール順表示に切替' : 'カレンダー表示に切替'}"
class="p-3 rounded-full m3-fab-light text-[#231F1C] border border-white/90 flex items-center justify-center transition-transform hover:-translate-y-0.5 active:scale-95">
${state.mobileHomeView === 'calendar' ? ICONS.list_alt : ICONS.calendar_month}
</button>
` : ''}
<button type="button" onclick="jumpToToday()" title="今日へ移動"
class="${isPortrait ? 'p-3' : 'p-3.5'} rounded-full m3-fab-light text-[#231F1C] border border-white/90 flex items-center justify-center transition-transform hover:-translate-y-0.5 active:scale-95">
${ICONS.today}
</button>
<button type="button" onclick="openModal('add')" title="新規スケジュール追加"
class="${isPortrait ? 'p-3' : 'p-3.5'} rounded-full m3-fab-dark text-white flex items-center justify-center transition-transform hover:-translate-y-0.5 active:scale-95">
${ICONS.add}
</button>
</div>
</div>
${modalHtml}
`;
Object.keys(scrollMap).forEach(k => {
const el = document.querySelector(`[data-scroll-key="${k}"]`);
if (el) el.scrollTop = scrollMap[k];
});
const expandRect = typeof consumeExpandRect === 'function' ? consumeExpandRect() : null;
if (expandRect && state.selectedDate) {
const target = document.querySelector('[data-daily-expand-root="1"]');
if (target && typeof target.animate === 'function') {
const tr = target.getBoundingClientRect();
if (tr.width > 0 && tr.height > 0) {
const dx = (expandRect.left + expandRect.width / 2) - (tr.left + tr.width / 2);
const dy = (expandRect.top + expandRect.height / 2) - (tr.top + tr.height / 2);
const sx = Math.max(0.12, Math.min(0.95, expandRect.width / tr.width));
const sy = Math.max(0.12, Math.min(0.95, expandRect.height / tr.height));
target.animate([
{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.35, borderRadius: '20px' },
{ transform: 'translate(0px, 0px) scale(1, 1)', opacity: 1, borderRadius: '28px' }
], {
duration: 340,
easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
});
}
}
}
const nextTracks = document.querySelectorAll('.pill-track');
if (prevPills.length > 0 && prevPills.length === nextTracks.length && typeof requestAnimationFrame === 'function') {
nextTracks.forEach((track, idx) => {
const prev = prevPills[idx];
const thumb = track.querySelector('.pill-thumb');
if (!prev || !thumb) return;
const r = thumb.getBoundingClientRect();
const tr = track.getBoundingClientRect();
const dx = prev.left - (r.left - tr.left);
if (Math.abs(dx) > 2 && Math.abs(prev.trackWidth - tr.width) < 12 && r.width > 0) {
thumb.style.transition = 'none';
thumb.style.transformOrigin = 'left center';
thumb.style.transform = `translateX(${dx}px) scaleX(${prev.width / r.width})`;
requestAnimationFrame(() => {
requestAnimationFrame(() => {
thumb.style.transition = 'transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1)';
thumb.style.transform = 'translateX(0) scaleX(1)';
});
});
}
});
}
}
render();

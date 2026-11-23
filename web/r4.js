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
<div class="flex items-center ${isPortrait ? 'gap-1' : 'gap-2.5'} shrink-0">
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
<button type="button" onclick="openModal('search')" title="予定を検索"
class="${isPortrait ? 'w-8 h-8' : 'w-10 h-10'} rounded-full pill-thumb hover:scale-105 flex items-center justify-center text-[#231F1C] transition">
${ICONS.search}
</button>
${isPortrait ? `
<button type="button" onclick="openModal('sync')" title="${state.driveAccessToken ? 'Googleログイン・APIキー同期' : 'Googleでログイン・APIキー設定'}"
class="w-8 h-8 rounded-full pill-thumb flex items-center justify-center transition ${
state.driveSyncStatus === 'synced' && state.driveAccessToken
? 'text-[#244E32]'
: state.driveSyncStatus === 'error'
? 'text-[#B83B2E]'
: 'text-[#224363]'
} ${state.driveSyncStatus === 'syncing' ? 'animate-spin' : ''}">
${state.driveAccessToken ? (state.driveSyncStatus === 'synced' ? ICONS.cloud_done : ICONS.sync) : ICONS.login}
</button>
` : `
<div class="inline-flex items-center pill-track p-1 rounded-full gap-0.5">
<button type="button" onclick="openModal('sync')" title="${state.driveAccessToken ? 'Googleログイン済・APIキー同期設定' : 'Googleでログイン・APIキー設定'}"
class="w-9 h-8 rounded-full flex items-center justify-center transition-all ${
state.driveAccessToken ? 'pill-thumb text-[#244E32]' : 'text-[#224363] hover:text-[#1A334D]'
}">
${state.driveAccessToken ? ICONS.account_circle : ICONS.login}
</button>
<button type="button" onclick="handleSyncClick()" title="${state.driveAccessToken ? (state.driveSyncStatus === 'synced' ? '同期済・自動同期ON（クリックで今すぐ再同期）' : 'Googleカレンダーと今すぐ同期') : 'Googleと同期（要ログイン）'}"
class="w-9 h-8 rounded-full flex items-center justify-center transition-all ${
state.driveSyncStatus === 'synced' && state.driveAccessToken
? 'pill-thumb text-[#244E32]'
: state.driveSyncStatus === 'error'
? 'text-[#B83B2E]'
: 'text-[#47413B] hover:text-[#231F1C]'
} ${state.driveSyncStatus === 'syncing' ? 'animate-spin' : ''}">
${state.driveSyncStatus === 'synced' && state.driveAccessToken ? ICONS.cloud_done : ICONS.sync}
</button>
</div>
`}
<button type="button" onclick="openModal('settings')" title="アプリ設定"
class="${isPortrait ? 'w-8 h-8' : 'w-10 h-10'} rounded-full pill-thumb hover:scale-105 flex items-center justify-center text-[#231F1C] transition">
${ICONS.tune}
</button>
</div>
</header>
${mobileMonthStripHtml}
${(state.isOffline || state.needsRelogin || state.swUpdateReady) ? `
<div class="${isPortrait ? 'px-3 pb-1' : 'px-6 pb-1.5'} flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0 text-[11px]">
${state.isOffline ? `<span class="px-2.5 py-0.5 rounded-full bg-[#F9E4E2] text-[#8C2D25] font-semibold shrink-0">オフライン表示中</span>` : ''}
${state.needsRelogin ? `
<button type="button" onclick="handleGoogleLoginClick()" class="px-2.5 py-0.5 rounded-full bg-[#E5EDF5] hover:bg-[#D8E5F2] text-[#224363] font-semibold shrink-0 transition">
セッション切れ・タップで再ログイン
</button>
` : ''}
${state.swUpdateReady ? `
<button type="button" onclick="applySwUpdate()" class="px-2.5 py-0.5 rounded-full bg-[#E5EFE8] hover:bg-[#D5E6DB] text-[#244E32] font-semibold shrink-0 transition">
新しい更新があります・タップで再読み込み
</button>
` : ''}
</div>
` : ''}
${sheetBodyHtml}
${state.aiBannerMessage ? `
<div style="background-color:#1F1B18;" class="fixed top-3 left-1/2 z-50 max-w-[92vw] sm:max-w-md px-4 py-2.5 rounded-full bg-[#1F1B18] text-[#FAF8F4] shadow-2xl border border-[#4A433C] flex items-center gap-2.5 text-xs font-semibold pointer-events-auto anim-toast-drop">
<span class="text-[#F2E6CE] shrink-0">${ICONS.auto_awesome}</span>
<span class="truncate">${escapeHtml(state.aiBannerMessage)}</span>
<button type="button" onclick="closeBanner()" title="閉じる" class="w-5 h-5 rounded-full hover:bg-white/15 flex items-center justify-center shrink-0">${ICONS.close}</button>
</div>
` : ''}
<div class="fixed ${isPortrait ? 'bottom-3.5 right-3.5 gap-2' : 'bottom-7 right-7 gap-3'} z-30 flex items-center">
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

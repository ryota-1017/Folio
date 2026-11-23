function renderScheduleCardHtml(it) {
const st = CATEGORY_STYLES[it.category] || CATEGORY_STYLES.personal;
const formattedMemo = formatMemoText(it.memo);
let liveBadge = '';
let liveRing = '';
if (it.date === TODAY_STR && it.startTime && !it.isTransit) {
const now = new Date();
const nowMins = now.getHours() * 60 + now.getMinutes();
const sMins = timeToMinutes(it.startTime);
const eMins = it.endTime ? timeToMinutes(it.endTime) : sMins + 60;
if (nowMins >= sMins && nowMins < eMins) {
liveBadge = `<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#366B47] text-white">進行中</span>`;
liveRing = 'ring-2 ring-[#366B47]/60 anim-live-glow';
} else if (sMins > nowMins && sMins - nowMins <= 60) {
liveBadge = `<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F2E6CE] text-[#231F1C]">まもなく</span>`;
}
}
return `
<div onclick="openItemDetail('${it.id}')" class="group relative rounded-[20px] p-3 sm:p-4 transition-all soft-card-3d anim-card-in hover:-translate-y-0.5 flex items-start gap-3 sm:gap-4 cursor-pointer ${liveRing}">
<div class="w-12 sm:w-16 shrink-0 pt-0.5 text-right">
<div class="text-xs sm:text-sm font-bold text-[#231F1C]">${it.startTime || '終日'}</div>
${it.endTime ? `<div class="text-[11px] sm:text-xs text-[#47413B] mt-0.5">${it.endTime}</div>` : ''}
</div>
<div class="w-1.5 self-stretch rounded-full ${st.dot}"></div>
<div class="flex-1 min-w-0">
<div class="flex items-center justify-between gap-2">
<div class="flex items-center gap-1.5 flex-wrap">
<span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-sm ${st.bg} ${st.text}">
${st.label}
</span>
${liveBadge}
${(it.hasPrepAlert || (it.memo && /小テスト|提出|締切|※要予習/.test(it.memo))) ? `
<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F9E4E2] text-[#8C2D25]">要予習・提出</span>
` : ''}
</div>
<div class="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition shrink-0">
<button type="button" onclick="event.stopPropagation(); openEditItemModal('${it.id}')" title="編集"
class="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center text-[#38322D] transition">
${ICONS.edit}
</button>
<button type="button" onclick="event.stopPropagation(); deleteItem('${it.id}')" title="削除"
class="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center text-[#8C2D25] transition">
${ICONS.delete}
</button>
</div>
</div>
<div class="text-sm sm:text-base font-bold text-[#231F1C] mt-1 leading-snug">${escapeHtml(it.title)}</div>
${it.location && (!formattedMemo || !formattedMemo.includes(it.location)) ? `
<div class="mt-1 text-xs text-[#4A6A8A] break-words">場所: ${escapeHtml(it.location)}</div>
` : ''}
${formattedMemo ? `
<p class="mt-1.5 text-xs text-[#2B2622] leading-relaxed bg-[#F4EFE7] px-3 py-2 rounded-2xl border border-[#E5DFD5] whitespace-pre-wrap break-words">${escapeHtml(formattedMemo)}</p>
` : ''}
</div>
</div>
`;
}

function renderSchoolGroupCardHtml(classItems, targetDate) {
const st = CATEGORY_STYLES.class;
const sorted = [...classItems].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const firstStart = sorted.find(it => it.startTime)?.startTime || '';
const lastEnd = [...sorted].reverse().find(it => it.endTime || it.startTime);
const endStr = lastEnd ? (lastEnd.endTime || lastEnd.startTime || '') : '';
const hasAlert = sorted.some(it => it.hasPrepAlert || (it.memo && /小テスト|提出|締切|※要予習/.test(it.memo)));
const isExpanded = (state.expandedSchoolDays && targetDate in state.expandedSchoolDays)
? Boolean(state.expandedSchoolDays[targetDate])
: !isPortraitLayout();
const nonTransit = sorted.filter(it => !it.isTransit && !/登校|下校|移動/.test(it.title || ''));
const displayCourses = nonTransit.length > 0 ? nonTransit : sorted;
return `
<div class="space-y-1.5 anim-card-in">
<div onclick="toggleSchoolDayExpand('${targetDate}')" class="group relative rounded-[20px] p-3 sm:p-4 transition-all soft-card-3d hover:-translate-y-0.5 flex items-start gap-3 sm:gap-4 cursor-pointer">
<div class="w-12 sm:w-16 shrink-0 pt-0.5 text-right">
<div class="text-xs sm:text-sm font-bold text-[#231F1C]">${firstStart || '学校'}</div>
${endStr ? `<div class="text-[11px] sm:text-xs text-[#47413B] mt-0.5">${endStr}</div>` : ''}
</div>
<div class="w-1.5 self-stretch rounded-full ${st.dot}"></div>
<div class="flex-1 min-w-0">
<div class="flex items-center justify-between gap-2">
<div class="flex items-center gap-1.5 flex-wrap">
<span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-sm ${st.bg} ${st.text}">
${st.label}
</span>
${hasAlert ? `<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F9E4E2] text-[#8C2D25]">要予習・提出</span>` : ''}
</div>
<span class="text-[11px] font-semibold text-[#8C2D25] shrink-0">${isExpanded ? '折りたたむ' : '広げて詳細を見る'}</span>
</div>
<div class="text-sm sm:text-base font-bold text-[#231F1C] mt-1 leading-snug">学校（${sorted.length}件）</div>
<div class="mt-1.5 flex flex-wrap gap-1">
${displayCourses.map(it => `
<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F9E4E2]/70 text-[#8C2D25] text-[11px] font-medium leading-snug break-words">
${it.startTime ? `<span class="font-bold opacity-80">${it.startTime}</span>` : ''}
<span>${escapeHtml(cleanCourseTitle(it.title))}</span>
</span>
`).join('')}
</div>
</div>
</div>
${isExpanded ? `
<div class="pl-3 sm:pl-5 space-y-1.5 border-l-2 border-[#C94035]/35 ml-2 anim-expand-in">
${sorted.map(it => renderScheduleCardHtml(it)).join('')}
</div>
` : ''}
</div>
`;
}

function getSchoolTimeBounds(classItems) {
const sorted = [...classItems].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const nonTransit = sorted.filter(it => !it.isTransit && !/登校|下校|移動/.test(it.title || ''));
const basis = nonTransit.length > 0 ? nonTransit : sorted;
const starts = basis.map(it => timeToMinutes(it.startTime)).filter(m => m < 9999);
const ends = basis.map(it => timeToMinutes(it.endTime || it.startTime)).filter(m => m < 9999);
if (starts.length === 0) {
const fbStarts = sorted.map(it => timeToMinutes(it.startTime)).filter(m => m < 9999);
const fbEnds = sorted.map(it => timeToMinutes(it.endTime || it.startTime)).filter(m => m < 9999);
return {
startMins: fbStarts.length > 0 ? Math.min(...fbStarts) : 9999,
endMins: fbEnds.length > 0 ? Math.max(...fbEnds) : 9999
};
}
return {
startMins: Math.min(...starts),
endMins: ends.length > 0 ? Math.max(...ends) : Math.min(...starts)
};
}

function buildOrderedDayDisplayItems(dayItems, dateStr, isMobileCell = false) {
const classItems = dayItems.filter(it => it.category === 'class');
const otherItems = dayItems.filter(it => it.category !== 'class');
const allDayOthers = otherItems.filter(it => !it.startTime);
const timedOthers = otherItems.filter(it => Boolean(it.startTime)).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
if (classItems.length === 0) {
return [...allDayOthers, ...timedOthers];
}
const sortedClasses = [...classItems].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const actualClasses = sortedClasses.filter(it => !it.isTransit && !/登校|下校|移動/.test(it.title || ''));
const subItemsForCell = actualClasses.length > 0 ? actualClasses : sortedClasses;
const bounds = getSchoolTimeBounds(sortedClasses);
const firstStart = sortedClasses.find(it => it.startTime)?.startTime || '';
const lastEndObj = [...sortedClasses].reverse().find(it => it.endTime || it.startTime);
const lastEnd = lastEndObj ? (lastEndObj.endTime || lastEndObj.startTime || '') : '';
const beforeSchool = timedOthers.filter(it => timeToMinutes(it.startTime) < bounds.startMins);
const afterSchool = timedOthers.filter(it => timeToMinutes(it.startTime) >= bounds.startMins);
const schoolChip = {
id: 'school-group-' + dateStr,
title: isMobileCell
? (subItemsForCell.length === 1 ? cleanCourseTitle(subItemsForCell[0].title) : `学校(${subItemsForCell.length})`)
: (actualClasses.length > 0
? (actualClasses.length === 1 ? cleanCourseTitle(actualClasses[0].title) : `授業（${actualClasses.length}件）`)
: (sortedClasses.length === 1 ? sortedClasses[0].title : `学校（${sortedClasses.length}件）`)),
startTime: isMobileCell ? '' : firstStart,
endTime: isMobileCell ? '' : lastEnd,
category: 'class',
isSchoolGroup: true,
schoolSubItems: isMobileCell ? sortedClasses : subItemsForCell,
hasPrepAlert: sortedClasses.some(it => it.hasPrepAlert || (it.memo && /小テスト|提出|締切|※要予習/.test(it.memo)))
};
return [...allDayOthers, ...beforeSchool, schoolChip, ...afterSchool];
}

function renderGroupedScheduleListHtml(dayItems, targetDate) {
const classItems = dayItems.filter(it => it.category === 'class');
const otherItems = dayItems.filter(it => it.category !== 'class');
const bounds = classItems.length > 0 ? getSchoolTimeBounds(classItems) : { startMins: 9999, endMins: 9999 };
const entries = otherItems.map(it => {
const m = timeToMinutes(it.startTime);
return {
sortMins: !it.startTime ? -1 : (m < bounds.startMins ? m : Math.max(bounds.startMins + 0.5, m)),
html: renderScheduleCardHtml(it)
};
});
if (classItems.length > 0) {
entries.push({
sortMins: bounds.startMins,
html: renderSchoolGroupCardHtml(classItems, targetDate)
});
}
entries.sort((a, b) => a.sortMins - b.sortMins);
return entries.map(e => e.html).join('');
}

function renderCalendarBody(isPortrait) {
let sheetBodyHtml = "";
const sheetAnimClass = consumeSheetAnim();
const filterFn = (it) => state.categoryFilter === 'all' || it.category === state.categoryFilter;

if (!state.selectedDate) {
const weeks = getCalendarWeeks(state.currentYear, state.currentMonth);
if (isPortrait) {
if (state.mobileHomeView === 'agenda') {
const monthPrefix = `${state.currentYear}-${String(state.currentMonth).padStart(2, '0')}`;
const anchorDay = (state.selectedMobileDay && state.selectedMobileDay.startsWith(monthPrefix))
? state.selectedMobileDay
: (TODAY_STR.startsWith(monthPrefix) ? TODAY_STR : `${monthPrefix}-01`);
const monthItems = state.items
.filter(it => it.date && it.date.startsWith(monthPrefix) && filterFn(it))
.sort((a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const upcomingItems = monthItems.filter(it => it.date >= anchorDay);
const pastItems = monthItems.filter(it => it.date < anchorDay);
const buildAgendaGroupsHtml = (itemsList) => {
const byDate = new Map();
itemsList.forEach(it => {
if (!byDate.has(it.date)) byDate.set(it.date, []);
byDate.get(it.date).push(it);
});
return Array.from(byDate.entries()).map(([dStr, list]) => {
const isToday = dStr === TODAY_STR;
return `
<div class="space-y-1.5">
<div class="flex items-center justify-between px-1 pt-1">
<button type="button" onclick="selectDate('${dStr}')" class="flex items-center gap-1.5 text-left">
<span class="text-xs font-bold ${isToday ? 'px-2 py-0.5 rounded-full bg-[#231F1C] text-white' : 'text-[#231F1C]'}">${dStr.slice(5).replace('-', '/')}</span>
<span class="text-[11px] font-medium text-[#47413B]">${getDayName(dStr).split('・')[1] || ''}</span>
</button>
<button type="button" onclick="selectDate('${dStr}')" class="text-[11px] font-semibold text-[#38322D] hover:underline">ノート</button>
</div>
<div class="space-y-1.5">${renderGroupedScheduleListHtml(list, dStr)}</div>
</div>
`;
}).join('');
};
const upcomingHtml = upcomingItems.length > 0
? buildAgendaGroupsHtml(upcomingItems)
: `<div class="py-8 text-center text-xs text-[#59524A]">${anchorDay.slice(5).replace('-', '/')}以降の予定はありません</div>`;
const pastSectionHtml = pastItems.length > 0 ? `
<div class="pt-2 border-t grid-hairline space-y-2">
<button type="button" onclick="togglePastAgenda()"
class="w-full py-2 px-3 rounded-2xl bg-[#EFEAE1]/80 hover:bg-[#E7E0D4] text-[11px] font-semibold text-[#38322D] flex items-center justify-between transition">
<span>${anchorDay.slice(5).replace('-', '/')}より前の予定（${pastItems.length}件）</span>
<span>${state.showPastAgenda ? '閉じる' : '表示する'}</span>
</button>
${state.showPastAgenda ? `<div class="space-y-3 opacity-85">${buildAgendaGroupsHtml(pastItems)}</div>` : ''}
</div>
` : '';
const agendaHtml = monthItems.length > 0
? `${upcomingHtml}${pastSectionHtml}`
: `<div class="py-12 text-center text-xs text-[#59524A]">${state.currentMonth}月の予定はありません</div>`;
sheetBodyHtml = `
<div class="flex-1 flex flex-col overflow-hidden px-3 pb-2 pt-0.5 gap-2 ${sheetAnimClass}">
<div class="flex items-center justify-between gap-2 shrink-0">
<span class="text-xs font-bold text-[#38322D] truncate">${anchorDay.slice(5).replace('-', '/')}〜の予定</span>
<div class="inline-flex items-center pill-track p-0.5 rounded-full gap-0.5 shrink-0">
${[
{ id: 'all', label: '全' },
{ id: 'class', label: '学' },
{ id: 'deadline', label: '塾' },
{ id: 'parttime', label: '私' }
].map(f => `
<button type="button" onclick="setCategoryFilter('${f.id}')"
class="px-2 h-6 rounded-full text-[10px] font-semibold transition-all ${
state.categoryFilter === f.id ? 'pill-thumb text-[#231F1C]' : 'text-[#47413B]'
}">${f.label}</button>
`).join('')}
</div>
</div>
<div data-scroll-key="agenda" class="flex-1 min-h-0 overflow-y-auto space-y-3 pb-20 pr-0.5">${agendaHtml}</div>
</div>
`;
} else {
const activeDay = state.selectedMobileDay || TODAY_STR;
const mobileRowsHtml = weeks.map(w => {
const cellsHtml = w.days.map((cell, cIdx) => {
if (!cell.dateStr) {
return `<div class="rounded-xl day-tile-slot"></div>`;
}
const dayItems = state.items
.filter(it => it.date === cell.dateStr && filterFn(it))
.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const cellChips = buildOrderedDayDisplayItems(dayItems, cell.dateStr, true);
const isToday = cell.dateStr === TODAY_STR;
const isSelected = cell.dateStr === activeDay;
const hasNote = Boolean(state.notes[cell.dateStr] && state.notes[cell.dateStr].trim());
const numColor = cIdx === 5 ? 'text-[#2B5B84]' : cIdx === 6 ? 'text-[#B83B2E]' : 'text-[#231F1C]';
return `
<div onclick="handleMobileDayTap('${cell.dateStr}')"
class="rounded-xl p-1 flex flex-col overflow-hidden min-h-0 cursor-pointer transition-all relative ${
isToday ? 'today-cell-frame' : 'day-tile'
} ${isSelected ? 'ring-2 ring-[#231F1C] selected-day-ring z-10' : ''}">
<div class="flex items-center justify-between shrink-0 mb-0.5">
<span class="text-[11px] leading-none ${numColor} ${isToday || isSelected ? 'font-bold' : 'font-semibold'}">
${cell.dayNumber}
</span>
${hasNote ? `<span class="text-[8px] font-bold text-[#6D5E4C]">記</span>` : ''}
</div>
<div class="flex-1 min-h-0 overflow-hidden space-y-0.5">
${cellChips.slice(0, 2).map(ch => {
const st = CATEGORY_STYLES[ch.category] || CATEGORY_STYLES.personal;
return `<div class="px-1 py-[1px] rounded text-[9px] leading-[1.15] font-medium ${st.bg} ${st.text} line-clamp-2 break-all">${escapeHtml(ch.title)}</div>`;
}).join('')}
${cellChips.length > 2 ? `<div class="text-[8px] text-[#47413B] text-right leading-none">+${cellChips.length - 2}</div>` : ''}
</div>
</div>
`;
}).join('');
return `<div class="grid grid-cols-7 gap-1 flex-1 min-h-0">${cellsHtml}</div>`;
}).join('');

const activeItems = state.items
.filter(it => it.date === activeDay && filterFn(it))
.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const dayPreviewAnim = consumeDayPreviewAnim();

sheetBodyHtml = `
<div class="flex-1 min-h-0 flex flex-col overflow-hidden px-3 pb-2 pt-0.5 gap-1.5">
<div class="flex-[2.25] min-h-0 flex flex-col gap-1 ${sheetAnimClass}">
<div class="grid grid-cols-7 gap-1 py-1 rounded-xl bg-[#EFEAE1]/70 border border-white/60 shadow-inner shrink-0">
${WEEKDAY_HEADERS.map(h => `<div class="text-center text-[11px] font-semibold ${h.color}">${h.ja}</div>`).join('')}
</div>
<div class="flex-1 min-h-0 flex flex-col gap-1">${mobileRowsHtml}</div>
</div>
<div class="flex-1 min-h-0 flex flex-col pt-1 border-t grid-hairline overflow-hidden">
<div ontouchstart="onBoundaryTouchStart(event)" ontouchend="onBoundaryTouchEnd(event, '${activeDay}')" class="shrink-0 select-none pb-1">
<div onclick="selectDate('${activeDay}')" title="上にスワイプまたはタップして全体表示" class="flex justify-center pb-1 cursor-pointer">
<span class="w-10 h-1 rounded-full bg-[#B4ACA0]"></span>
</div>
<div class="flex items-center justify-between gap-2">
<button type="button" onclick="selectDate('${activeDay}')" class="flex items-center gap-1.5 min-w-0 text-left">
<span class="text-sm font-bold text-[#181512] truncate">${activeDay.replace(/-/g, '.')}</span>
<span class="text-[11px] font-medium text-[#47413B] shrink-0">${getDayName(activeDay).split('・')[1] || ''}</span>
</button>
<div class="flex items-center gap-1.5 shrink-0">
<div class="inline-flex items-center pill-track p-0.5 rounded-full gap-0.5">
${[
{ id: 'all', label: '全' },
{ id: 'class', label: '学' },
{ id: 'deadline', label: '塾' },
{ id: 'parttime', label: '私' }
].map(f => `
<button type="button" onclick="setCategoryFilter('${f.id}')"
class="px-2 h-6 rounded-full text-[10px] font-semibold transition-all ${
state.categoryFilter === f.id ? 'pill-thumb text-[#181512]' : 'text-[#47413B]'
}">${f.label}</button>
`).join('')}
</div>
<button type="button" onclick="selectDate('${activeDay}')" title="日別・Daily Noteを開く"
class="px-2.5 h-7 rounded-full pill-thumb text-[11px] font-semibold text-[#181512] flex items-center gap-1 shadow-sm">
${ICONS.subject}
<span>ノート</span>
</button>
</div>
</div>
</div>
<div data-scroll-key="mobile-day" class="flex-1 min-h-0 overflow-y-auto space-y-2 pb-20 pr-0.5 ${dayPreviewAnim}">
${activeItems.length > 0
? renderGroupedScheduleListHtml(activeItems, activeDay)
: `<div class="py-4 text-center text-xs text-[#59524A]">この日の予定はありません</div>`
}
</div>
</div>
</div>
`;
}
} else {
const rowsHtml = weeks.map((w, rIdx) => {
const isLastRow = rIdx === weeks.length - 1;
const canShowMiniCals = isLastRow && !w.days[5].dateStr && !w.days[6].dateStr;
const dayCellsHtml = w.days.map((cell, cIdx) => {
if (canShowMiniCals && cIdx === 5) {
return `
<div class="col-span-2 p-2.5 rounded-2xl soft-card-3d grid grid-cols-2 gap-3 items-center">
${buildMiniMonthHtml(state.currentYear, state.currentMonth - 1)}
${buildMiniMonthHtml(state.currentYear, state.currentMonth + 1)}
</div>
`;
}
if (canShowMiniCals && cIdx === 6) return '';
if (!cell.dateStr) return `<div class="rounded-2xl day-tile-slot"></div>`;
const dayItems = state.items
.filter(it => it.date === cell.dateStr && filterFn(it))
.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const monthDisplayItems = buildOrderedDayDisplayItems(dayItems, cell.dateStr, false);
const hasNote = Boolean(state.notes[cell.dateStr] && state.notes[cell.dateStr].trim());
const isToday = cell.dateStr === TODAY_STR;
const numColor = cIdx === 5 ? 'text-[#2B5B84]' : cIdx === 6 ? 'text-[#B83B2E]' : 'text-[#231F1C]';
const formatChipTimeRange = (item) => item.startTime ? (item.endTime ? `${item.startTime}-${item.endTime}` : item.startTime) : '';
const renderEventChip = (it) => {
const st = CATEGORY_STYLES[it.category] || CATEGORY_STYLES.personal;
const transitCls = (it.isTransit || /登校|下校|移動/.test(it.title)) ? 'opacity-55' : '';
const timeRangeStr = formatChipTimeRange(it);
if (it.isSchoolGroup) {
const isExpanded = (state.expandedSchoolDays && cell.dateStr in state.expandedSchoolDays)
? Boolean(state.expandedSchoolDays[cell.dateStr])
: !isPortrait;
return `
<div onclick="event.stopPropagation(); toggleSchoolDayExpand('${cell.dateStr}')" class="px-1.5 py-[1px] rounded-full text-[11px] leading-tight truncate flex items-center justify-between gap-1 shrink-0 shadow-xs border border-white/60 ${st.bg} ${st.text} cursor-pointer">
<div class="flex items-center gap-1 min-w-0">
<span class="w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}"></span>
${timeRangeStr ? `<span class="font-semibold opacity-80 shrink-0">${timeRangeStr}</span>` : ''}
<span class="truncate font-semibold">${escapeHtml(it.title)}</span>
</div>
<span class="text-[9px] font-bold shrink-0">${isExpanded ? '▲' : '▼'}</span>
</div>
${isExpanded && Array.isArray(it.schoolSubItems) ? `
<div class="pl-2 space-y-0.5 border-l-2 border-[#C94035]/40 ml-1.5 my-0.5 anim-expand-in">
${it.schoolSubItems.map(sub => {
const subTransit = (sub.isTransit || /登校|下校|移動/.test(sub.title)) ? 'opacity-55' : '';
const subTimeRange = formatChipTimeRange(sub);
return `
<div onclick="event.stopPropagation(); openItemDetail('${sub.id}')" class="px-1.5 py-[1px] rounded text-[10px] leading-tight truncate flex items-center gap-1 bg-[#F9E4E2]/70 text-[#8C2D25] ${subTransit}">
${subTimeRange ? `<span class="font-semibold opacity-80 shrink-0">${subTimeRange}</span>` : ''}
<span class="truncate">${escapeHtml(cleanCourseTitle(sub.title))}</span>
</div>
`;
}).join('')}
</div>
` : ''}
`;
}
return `
<div class="px-1.5 py-[1px] rounded-full text-[11px] leading-tight truncate flex items-center gap-1 shrink-0 shadow-xs border border-white/60 ${st.bg} ${st.text} ${transitCls}">
<span class="w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}"></span>
${timeRangeStr ? `<span class="font-semibold opacity-80 shrink-0">${timeRangeStr}</span>` : ''}
<span class="truncate">${escapeHtml(it.title)}</span>
</div>
`;
};
return `
<div onclick="selectDate('${cell.dateStr}')"
class="relative flex flex-col p-2 rounded-2xl day-tile cursor-pointer overflow-hidden min-h-0 group ${isToday ? 'today-cell-frame' : ''}">
<div class="flex items-center justify-between shrink-0">
<span class="text-base md:text-lg leading-none tracking-tight ${numColor} ${isToday ? 'font-bold' : 'font-semibold'}">
${cell.dayNumber}
</span>
<div class="flex items-center gap-1">
${dayItems.length > 0 ? `<span class="text-[9px] font-medium text-[#59524A]">${dayItems.length}</span>` : ''}
${hasNote ? `<span class="w-2 h-2 rounded-full bg-[#6D5E4C] shadow-sm" title="ノート記入あり"></span>` : ''}
</div>
</div>
<div class="mt-1 space-y-0.5 flex-1 min-h-0 overflow-y-auto hide-scrollbar flex flex-col">
${monthDisplayItems.map(renderEventChip).join('')}
</div>
</div>
`;
}).join('');
return `<div class="grid grid-cols-7 gap-2 flex-1 min-h-0">${dayCellsHtml}</div>`;
}).join('');
sheetBodyHtml = `
<div class="flex-1 flex flex-col overflow-hidden px-5 pb-5 pt-2 gap-2">
<div class="grid grid-cols-7 gap-2 px-0.5 py-2 rounded-2xl bg-[#EFEAE1]/70 border border-white/60 shadow-inner">
${WEEKDAY_HEADERS.map(h => `
<div class="text-center text-xs font-semibold tracking-wide ${h.color}">
<span>${h.en}</span><span class="mx-0.5 opacity-60">・</span><span>${h.ja}</span>
</div>
`).join('')}
</div>
<div class="flex-1 flex flex-col gap-2 overflow-hidden">
${rowsHtml}
</div>
</div>
`;
}
} else {
const target = state.selectedDate;
const dayItems = state.items
.filter(it => it.date === target)
.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const scheduleCardsHtml = dayItems.length > 0
? renderGroupedScheduleListHtml(dayItems, target)
: `<div class="h-full flex flex-col items-center justify-center text-center py-16 text-[#59524A]"><p class="text-sm font-medium">この日の予定はまだ登録されていません</p></div>`;

const mobileDailySwitchHtml = isPortrait ? `
<div class="inline-flex items-center pill-track p-0.5 rounded-full gap-0.5 shrink-0">
<button type="button" onclick="setMobileDailyTab('schedule')" title="予定一覧"
class="px-2.5 h-7 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
state.mobileDailyTab === 'schedule' ? 'pill-thumb text-[#231F1C]' : 'text-[#47413B]'
}">
${ICONS.event}
<span>予定</span>
</button>
<button type="button" onclick="setMobileDailyTab('note')" title="Daily Note"
class="px-2.5 h-7 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
state.mobileDailyTab === 'note' ? 'pill-thumb text-[#231F1C]' : 'text-[#47413B]'
}">
${ICONS.subject}
<span>ノート</span>
</button>
</div>
` : '';

const schedulePaneHtml = `
<section class="${isPortrait ? 'p-3.5 rounded-[24px] flex-1' : 'p-5 rounded-[28px]'} flex flex-col overflow-hidden soft-card-3d">
<div class="flex items-center justify-between pb-2.5 mb-2.5 border-b grid-hairline gap-2">
<div class="flex items-center gap-1.5 min-w-0">
<button type="button" onclick="moveDay(-1)" title="前日"
class="w-8 h-8 sm:w-9 sm:h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition shrink-0">
${ICONS.chevron_left}
</button>
<div class="px-1 min-w-0">
<div class="${isPortrait ? 'text-base' : 'text-xl'} font-bold tracking-tight text-[#231F1C] truncate">${target.replace(/-/g, '.')}</div>
<div class="text-[11px] sm:text-xs font-medium text-[#47413B] truncate">${getDayName(target)}</div>
</div>
<button type="button" onclick="moveDay(1)" title="翌日"
class="w-8 h-8 sm:w-9 sm:h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition shrink-0">
${ICONS.chevron_right}
</button>
</div>
${mobileDailySwitchHtml}
</div>
<div data-scroll-key="daily-schedule" class="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-20">
${scheduleCardsHtml}
</div>
</section>
`;

const notePaneHtml = `
<section class="${isPortrait ? 'p-3.5 rounded-[24px] flex-1' : 'p-5 rounded-[28px]'} flex flex-col overflow-hidden soft-card-3d">
<div class="flex items-center justify-between pb-2.5 mb-2.5 border-b grid-hairline gap-2">
<div class="min-w-0">
<div class="text-sm sm:text-base font-bold text-[#231F1C] truncate">${isPortrait ? target.replace(/-/g, '.') + ' ノート' : 'Daily Note'}</div>
<div class="text-[11px] sm:text-xs text-[#47413B] truncate">自由記述メモ・講義ノート</div>
</div>
<div class="flex items-center gap-1.5 shrink-0">
${mobileDailySwitchHtml}
<button type="button" onclick="togglePaperStyle()" title="罫線 / ドット方眼 切替"
class="w-8 h-8 sm:w-9 sm:h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center text-[#2B2622] transition">
${state.paperStyle === 'ruled' ? ICONS.grid_4x4 : ICONS.subject}
</button>
<button type="button" onclick="aiExtractFromNote()" title="メモから予定を抽出"
class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-[#F2E6CE] to-[#E2D3B5] shadow-md hover:scale-105 text-[#231F1C] flex items-center justify-center transition ${state.aiLoading ? 'animate-pulse' : ''}">
${ICONS.auto_awesome}
</button>
</div>
</div>
<div class="flex-1 flex flex-col">
<textarea id="daily-note-input" oninput="updateNote(this.value)"
placeholder="その日のメモやアイデア、講義の記録を自由に書き留めてください"
class="w-full flex-1 resize-none bg-transparent focus:outline-none text-sm text-[#231F1C] placeholder-[#665E55] ${
state.paperStyle === 'ruled' ? 'paper-ruled' : 'paper-dots'
}">${state.notes[target] || ''}</textarea>
</div>
</section>
`;
if (isPortrait) {
sheetBodyHtml = `
<div ontouchstart="onDailyTouchStart(event)" ontouchend="onDailyTouchEnd(event)" class="flex-1 flex flex-col px-3 pb-3 pt-1 overflow-hidden ${sheetAnimClass}">
${state.mobileDailyTab === 'schedule' ? schedulePaneHtml : notePaneHtml}
</div>
`;
} else {
sheetBodyHtml = `
<div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-5 pt-2 overflow-hidden">
${schedulePaneHtml}
${notePaneHtml}
</div>
`;
}
}
return sheetBodyHtml;
}

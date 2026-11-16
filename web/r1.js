function renderCalendarBody(isPortrait) {
let sheetBodyHtml = "";
if (!state.selectedDate) {
const weeks = getCalendarWeeks(state.currentYear, state.currentMonth);
const rowsHtml = weeks.map((w, rIdx) => {
const isLastRow = rIdx === weeks.length - 1;
const canShowMiniCals = !isPortrait && isLastRow && !w.days[5].dateStr && !w.days[6].dateStr;
const dayCellsHtml = w.days.map((cell, cIdx) => {
if (canShowMiniCals && cIdx === 5) {
return `
<div class="col-span-2 p-2.5 rounded-2xl soft-card-3d grid grid-cols-2 gap-3 items-center">
${buildMiniMonthHtml(state.currentYear, state.currentMonth - 1)}
${buildMiniMonthHtml(state.currentYear, state.currentMonth + 1)}
</div>
`;
}
if (canShowMiniCals && cIdx === 6) {
return '';
}
if (!cell.dateStr) {
return `<div class="${isPortrait ? 'rounded-xl' : 'rounded-2xl'} day-tile-slot"></div>`;
}
const dayItems = state.items
.filter(it => it.date === cell.dateStr)
.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const classItems = dayItems.filter(it => it.category === 'class');
const otherItems = dayItems.filter(it => it.category !== 'class');
const allDayOthers = otherItems.filter(it => !it.startTime);
const timedOthers = otherItems.filter(it => Boolean(it.startTime));
const monthDisplayItems = [...allDayOthers, ...timedOthers];
if (classItems.length > 0) {
monthDisplayItems.push({
id: 'school-group-' + cell.dateStr,
title: classItems.length === 1 ? classItems[0].title : `学校（${classItems.length}件）`,
startTime: '',
category: 'class',
hasPrepAlert: classItems.some(it => it.hasPrepAlert || (it.memo && /小テスト|提出|締切|※要予習/.test(it.memo)))
});
}
const hasNote = Boolean(state.notes[cell.dateStr] && state.notes[cell.dateStr].trim());
const isToday = cell.dateStr === TODAY_STR;
const numColor = cIdx === 5
? 'text-[#2B5B84]'
: cIdx === 6
? 'text-[#B83B2E]'
: 'text-[#231F1C]';
const renderEventChip = (it) => {
const st = CATEGORY_STYLES[it.category] || CATEGORY_STYLES.personal;
const transitCls = (it.isTransit || /登校|下校|移動/.test(it.title)) ? 'opacity-55' : '';
if (isPortrait) {
return `
<div class="px-1 py-[1px] rounded-md text-[10px] leading-tight truncate flex items-center gap-0.5 shrink-0 ${st.bg} ${st.text} ${transitCls}">
<span class="w-1 h-1 rounded-full shrink-0 ${st.dot}"></span>
<span class="truncate">${it.title}</span>
</div>
`;
}
return `
<div class="px-1.5 py-[1px] rounded-full text-[11px] leading-tight truncate flex items-center gap-1 shrink-0 shadow-xs border border-white/60 ${st.bg} ${st.text} ${transitCls}">
<span class="w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}"></span>
${it.startTime ? `<span class="font-semibold opacity-80">${it.startTime}</span>` : ''}
<span class="truncate">${it.title}</span>
</div>
`;
};
return `
<div onclick="selectDate('${cell.dateStr}')"
class="relative flex flex-col ${isPortrait ? 'p-1.5 rounded-xl' : 'p-2 rounded-2xl'} day-tile cursor-pointer overflow-hidden min-h-0 group ${
isToday ? 'today-cell-frame' : ''
}">
<div class="flex items-center justify-between shrink-0">
<span class="${isPortrait ? 'text-sm' : 'text-base md:text-lg'} leading-none tracking-tight ${numColor} ${
isToday ? 'font-bold' : 'font-semibold'
}">
${cell.dayNumber}
</span>
<div class="flex items-center gap-1">
${monthDisplayItems.length > 0 ? `<span class="text-[9px] font-medium text-[#8C847A] hidden sm:inline">${dayItems.length}</span>` : ''}
${hasNote ? `<span class="${isPortrait ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-[#6D5E4C] shadow-sm" title="ノート記入あり"></span>` : ''}
</div>
</div>
<div class="${isPortrait ? 'mt-1 space-y-0.5' : 'mt-1 space-y-0.5'} flex-1 min-h-0 overflow-y-auto hide-scrollbar flex flex-col">
${monthDisplayItems.map(renderEventChip).join('')}
</div>
</div>
`;
}).join('');
return `
<div class="grid grid-cols-7 ${isPortrait ? 'gap-1' : 'gap-2'} flex-1 min-h-0">
${dayCellsHtml}
</div>
`;
}).join('');
sheetBodyHtml = `
<div class="flex-1 flex flex-col overflow-hidden ${isPortrait ? 'px-3 pb-3 pt-1 gap-1' : 'px-5 pb-5 pt-2 gap-2'}">
<div class="grid grid-cols-7 ${isPortrait ? 'gap-1 py-1.5 rounded-xl' : 'gap-2 px-0.5 py-2 rounded-2xl'} bg-[#EFEAE1]/70 border border-white/60 shadow-inner">
${WEEKDAY_HEADERS.map(h => `
<div class="text-center text-xs font-semibold tracking-wide ${h.color}">
${isPortrait ? `<span>${h.ja}</span>` : `<span>${h.en}</span><span class="mx-0.5 opacity-60">・</span><span>${h.ja}</span>`}
</div>
`).join('')}
</div>
<div class="flex-1 flex flex-col ${isPortrait ? 'gap-1' : 'gap-2'} overflow-hidden">
${rowsHtml}
</div>
</div>
`;
} else {
const target = state.selectedDate;
const dayItems = state.items
.filter(it => it.date === target)
.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
const scheduleCardsHtml = dayItems.length > 0 ? dayItems.map(it => {
const st = CATEGORY_STYLES[it.category];
return `
<div class="group relative rounded-[22px] p-4 transition-all soft-card-3d hover:-translate-y-0.5 flex items-start gap-4">
<div class="w-16 shrink-0 pt-0.5 text-right">
<div class="text-sm font-bold text-[#231F1C]">${it.startTime || '--:--'}</div>
${it.endTime ? `<div class="text-xs text-[#6E665E] mt-0.5">${it.endTime}</div>` : ''}
</div>
<div class="w-1.5 self-stretch rounded-full ${st.dot}"></div>
<div class="flex-1 min-w-0">
<div class="flex items-center justify-between gap-2">
<div class="flex items-center gap-1.5">
<span class="inline-block px-3 py-0.5 rounded-full text-xs font-semibold shadow-sm ${st.bg} ${st.text}">
${st.label}
</span>
${(it.hasPrepAlert || (it.memo && /小テスト|提出|締切|※要予習/.test(it.memo))) ? `
<span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F9E4E2] text-[#8C2D25]">要予習・提出</span>
` : ''}
</div>
<button type="button" onclick="deleteItem('${it.id}')" title="削除"
class="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center text-[#6E665E] transition">
${ICONS.delete}
</button>
</div>
<div class="text-base font-bold text-[#231F1C] mt-1.5 leading-snug">${it.title}</div>
${it.memo ? `
<p class="mt-2 text-xs text-[#4A443E] leading-relaxed bg-[#F4EFE7] px-3.5 py-2.5 rounded-2xl border border-[#E5DFD5]">
${it.memo}
</p>
` : ''}
</div>
</div>
`;
}).join('') : `
<div class="h-full flex flex-col items-center justify-center text-center py-16 text-[#8C847A]">
<p class="text-sm font-medium">この日の予定はまだ登録されていません</p>
</div>
`;
const schedulePaneHtml = `
<section class="${isPortrait ? 'p-4 rounded-[24px] flex-1' : 'p-5 rounded-[28px]'} flex flex-col overflow-hidden soft-card-3d">
<div class="flex items-center justify-between pb-3 mb-3 border-b grid-hairline">
<div class="flex items-center gap-2">
<button type="button" onclick="moveDay(-1)" title="前日"
class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">
${ICONS.chevron_left}
</button>
<div class="px-2">
<div class="${isPortrait ? 'text-lg' : 'text-xl'} font-bold tracking-tight text-[#231F1C]">${target.replace(/-/g, '.')}</div>
<div class="text-xs font-medium text-[#6E665E]">${getDayName(target)}</div>
</div>
<button type="button" onclick="moveDay(1)" title="翌日"
class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition">
${ICONS.chevron_right}
</button>
</div>
</div>
<div class="flex-1 overflow-y-auto space-y-3 pr-1 pb-16">
${scheduleCardsHtml}
</div>
</section>
`;
const notePaneHtml = `
<section class="${isPortrait ? 'p-4 rounded-[24px] flex-1' : 'p-5 rounded-[28px]'} flex flex-col overflow-hidden soft-card-3d">
<div class="flex items-center justify-between pb-3 mb-3 border-b grid-hairline">
<div>
<div class="text-base font-bold text-[#231F1C]">Daily Note</div>
<div class="text-xs text-[#6E665E]">自由記述メモ・講義ノート</div>
</div>
<div class="flex items-center gap-2">
<button type="button" onclick="togglePaperStyle()" title="罫線 / ドット方眼 切替"
class="w-9 h-9 rounded-full pill-thumb hover:scale-105 flex items-center justify-center text-[#4A443E] transition">
${state.paperStyle === 'ruled' ? ICONS.grid_4x4 : ICONS.subject}
</button>
<button type="button" onclick="aiExtractFromNote()" title="メモから予定を抽出"
class="w-9 h-9 rounded-full bg-gradient-to-b from-[#F2E6CE] to-[#E2D3B5] shadow-md hover:scale-105 text-[#231F1C] flex items-center justify-center transition ${state.aiLoading ? 'animate-pulse' : ''}">
${ICONS.auto_awesome}
</button>
</div>
</div>
<div class="flex-1 flex flex-col">
<textarea id="daily-note-input" oninput="updateNote(this.value)"
placeholder="その日のメモやアイデア、講義の記録を自由に書き留めてください"
class="w-full flex-1 resize-none bg-transparent focus:outline-none text-sm text-[#231F1C] placeholder-[#968E83] ${
state.paperStyle === 'ruled' ? 'paper-ruled' : 'paper-dots'
}">${state.notes[target] || ''}</textarea>
</div>
</section>
`;
if (isPortrait) {
sheetBodyHtml = `
<div class="flex-1 flex flex-col gap-2.5 px-3 pb-3 pt-1 overflow-hidden">
<div class="flex justify-center shrink-0">
<div class="inline-flex items-center pill-track p-1 rounded-full gap-1">
<button type="button" onclick="setMobileDailyTab('schedule')" title="予定一覧"
class="w-12 h-8 rounded-full flex items-center justify-center transition-all ${
state.mobileDailyTab === 'schedule' ? 'pill-thumb text-[#231F1C]' : 'text-[#6E665E]'
}">
${ICONS.event}
</button>
<button type="button" onclick="setMobileDailyTab('note')" title="Daily Note"
class="w-12 h-8 rounded-full flex items-center justify-center transition-all ${
state.mobileDailyTab === 'note' ? 'pill-thumb text-[#231F1C]' : 'text-[#6E665E]'
}">
${ICONS.subject}
</button>
</div>
</div>
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
function renderUniversityBody(isPortrait) {
let sheetBodyHtml = "";
const deadlineItems = state.items
.filter(it => it.category === 'deadline' && (state.showCompletedDeadlines || !state.completedItemIds.includes(it.id)))
.sort((a, b) => a.date.localeCompare(b.date));
const periodsHtml = UNIVERSITY_PERIODS.map(pObj => {
const slotsHtml = [0, 1, 2, 3, 4].map(dayIdx => {
const course = state.courses.find(c => c.dayOfWeek === dayIdx && c.period === pObj.period);
return `
<div onclick="openCourseModal(${dayIdx}, ${pObj.period})"
class="${isPortrait ? 'p-1.5 rounded-xl' : 'p-2.5 rounded-2xl'} flex flex-col justify-between transition-all cursor-pointer ${
course
? 'bg-gradient-to-b from-[#EFF5FB] to-[#DFECFA] border border-[#C6DAEE] shadow-sm hover:-translate-y-0.5 hover:shadow-md'
: 'day-tile-slot hover:bg-[#EFEAE1]/70 border border-transparent hover:border-[#D6D0C6]'
}">
${course ? `
<div>
<div class="${isPortrait ? 'text-[10px]' : 'text-xs'} font-bold text-[#224363] leading-tight line-clamp-2">${course.name}</div>
${!isPortrait ? `<div class="text-xs text-[#4A6A8A] mt-0.5 truncate" title="${course.room || ''}">${course.room || ''}</div>` : ''}
</div>
<div class="mt-1 flex items-center gap-1 ${isPortrait ? 'text-[10px]' : 'text-xs'} font-semibold">
<span class="${isPortrait ? 'px-1.5' : 'px-2'} py-0.5 rounded-full bg-white/90 text-[#244E32] shadow-sm">${isPortrait ? course.attended : '出 ' + course.attended}</span>
<span class="${isPortrait ? 'px-1.5' : 'px-2'} py-0.5 rounded-full bg-white/90 shadow-sm ${course.absent > 0 ? 'text-[#B83B2E] font-bold' : 'text-[#6E665E]'}">${isPortrait ? course.absent : '欠 ' + course.absent}</span>
</div>
` : '<div class="h-full flex items-center justify-center text-xs text-[#ABA398]">+</div>'}
</div>
`;
}).join('');
return `
<div class="grid ${isPortrait ? 'grid-cols-[40px_repeat(5,minmax(0,1fr))] gap-1 min-h-[64px]' : 'grid-cols-[72px_repeat(5,minmax(0,1fr))] gap-2 min-h-[78px]'} flex-1">
<div class="${isPortrait ? 'p-1 rounded-xl' : 'p-2 rounded-2xl'} bg-[#EFEAE1]/80 border border-white/60 shadow-inner flex flex-col items-center justify-center text-center">
<span class="${isPortrait ? 'text-xs' : 'text-sm'} font-bold text-[#231F1C]">${pObj.period}${isPortrait ? '' : '限'}</span>
<span class="${isPortrait ? 'text-[9px]' : 'text-xs'} text-[#6E665E]">${pObj.start}</span>
</div>
${slotsHtml}
</div>
`;
}).join('');
const timetablePaneHtml = `
<section class="${isPortrait ? 'p-3.5 rounded-[24px] flex-1' : 'lg:col-span-2 p-5 rounded-[28px]'} flex flex-col overflow-hidden soft-card-3d">
<div class="flex items-center justify-between pb-2.5 mb-2.5 border-b grid-hairline">
<h2 class="${isPortrait ? 'text-sm' : 'text-base'} font-bold text-[#231F1C]">履修時間割・出欠管理</h2>
<span class="text-xs font-semibold text-[#5C554D] bg-[#EFECE6] px-3 py-1 rounded-full shadow-inner">
${state.courses.reduce((a, c) => a + c.credits, 0)} 単位
</span>
</div>
<div class="grid ${isPortrait ? 'grid-cols-[40px_repeat(5,minmax(0,1fr))] gap-1' : 'grid-cols-[72px_repeat(5,minmax(0,1fr))] gap-2'} mb-2 py-1.5 rounded-2xl bg-[#EFEAE1]/70 text-xs font-semibold text-[#3D3833] text-center shadow-inner">
<div>${isPortrait ? '' : 'Period'}</div>
${WEEKDAY_HEADERS.slice(0, 5).map(h => `<div>${isPortrait ? h.ja : `${h.en}・${h.ja}`}</div>`).join('')}
</div>
<div class="flex-1 flex flex-col ${isPortrait ? 'gap-1 overflow-y-auto pb-16' : 'gap-2'}">${periodsHtml}</div>
</section>
`;
const deadlinesPaneHtml = `
<section class="${isPortrait ? 'p-4 rounded-[24px] flex-1' : 'p-5 rounded-[28px]'} flex flex-col gap-4 overflow-y-auto soft-card-3d pb-16">
<div class="flex-1 flex flex-col">
<div class="flex items-center justify-between pb-3 mb-3 border-b grid-hairline">
<h3 class="text-base font-bold text-[#231F1C]">課題・レポート締切</h3>
<button type="button" onclick="toggleShowCompletedDeadlines()"
title="${state.showCompletedDeadlines ? '完了したタスクを非表示にする' : '完了したタスクを表示する'}"
class="w-8 h-8 rounded-full pill-thumb hover:scale-105 flex items-center justify-center transition ${state.showCompletedDeadlines ? 'text-[#231F1C]' : 'text-[#8C847A]'}">
${state.showCompletedDeadlines ? ICONS.visibility : ICONS.visibility_off}
</button>
</div>
<div class="space-y-2.5 flex-1 overflow-y-auto pr-1">
${deadlineItems.length > 0 ? deadlineItems.map(dl => {
const isDone = state.completedItemIds.includes(dl.id);
const diff = daysUntil(TODAY_STR, dl.date);
const badge = diff < 0 ? '期限超過' : diff === 0 ? '今日' : `${diff}d`;
return `
<div class="p-3.5 rounded-2xl bg-[#F4EFE7] border border-[#E5DFD5] shadow-sm flex items-start justify-between gap-2.5 ${isDone ? 'opacity-50' : ''}">
<div class="flex items-start gap-3">
<button type="button" onclick="toggleDeadlineDone('${dl.id}')" title="完了切替"
class="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
isDone ? 'bg-[#5C554D] border-[#5C554D] text-white' : 'border-[#5C554D] bg-white'
}">
${isDone ? ICONS.check : ''}
</button>
<div>
<div class="text-xs font-bold text-[#231F1C] ${isDone ? 'line-through' : ''}">${dl.title}</div>
<div class="text-xs text-[#6E665E] mt-0.5">${dl.date} ${dl.endTime || dl.startTime || ''}</div>
</div>
</div>
<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F9E7E5] text-[#7A271F] shadow-sm shrink-0">${badge}</span>
</div>
`;
}).join('') : '<div class="text-xs text-[#8C847A] py-6 text-center">課題・締切は登録されていません（右下の＋ボタンから追加できます）</div>'}
</div>
</div>
<div class="p-4 rounded-2xl bg-[#F4EFE7] border border-[#E5DFD5] shadow-sm">
<div class="flex items-center justify-between">
<h3 class="text-sm font-bold text-[#231F1C]">空きコマ学習プラン提案</h3>
<button type="button" onclick="generateUniAiPlan()" title="空きコマ活用プランを生成"
class="w-9 h-9 rounded-full bg-gradient-to-b from-[#F2E6CE] to-[#E2D3B5] shadow-md hover:scale-105 text-[#231F1C] flex items-center justify-center transition ${state.aiLoading ? 'animate-pulse' : ''}">
${ICONS.auto_awesome}
</button>
</div>
<p class="mt-2.5 text-xs leading-relaxed text-[#4A443E] bg-white/90 p-3.5 rounded-2xl border border-[#E5DFD5]">
${state.uniAiAdvice || '右上のボタンを押すと、時間割の空きコマと課題リストを照合して学習計画を提案します。'}
</p>
</div>
</section>
`;
if (isPortrait) {
sheetBodyHtml = `
<div class="flex-1 flex flex-col gap-2.5 px-3 pb-3 pt-1 overflow-hidden">
<div class="flex justify-center shrink-0">
<div class="inline-flex items-center pill-track p-1 rounded-full gap-1">
<button type="button" onclick="setMobileUniTab('timetable')" title="時間割"
class="w-12 h-8 rounded-full flex items-center justify-center transition-all ${
state.mobileUniTab === 'timetable' ? 'pill-thumb text-[#231F1C]' : 'text-[#6E665E]'
}">
${ICONS.grid_4x4}
</button>
<button type="button" onclick="setMobileUniTab('deadlines')" title="課題・AI"
class="w-12 h-8 rounded-full flex items-center justify-center transition-all ${
state.mobileUniTab === 'deadlines' ? 'pill-thumb text-[#231F1C]' : 'text-[#6E665E]'
}">
${ICONS.assignment_late}
</button>
</div>
</div>
${state.mobileUniTab === 'timetable' ? timetablePaneHtml : deadlinesPaneHtml}
</div>
`;
} else {
sheetBodyHtml = `
<div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-5 pt-2 overflow-y-auto lg:overflow-hidden">
${timetablePaneHtml}
${deadlinesPaneHtml}
</div>
`;
}
return sheetBodyHtml;
}
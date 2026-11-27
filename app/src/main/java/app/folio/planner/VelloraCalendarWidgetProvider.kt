package app.folio.planner

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.widget.RemoteViews
import org.json.JSONObject
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale

class VelloraWidgetBridge(private val context: Context) {
    @JavascriptInterface
    fun syncWidgetData(json: String) {
        val prefs = context.getSharedPreferences(VelloraCalendarWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(VelloraCalendarWidgetProvider.KEY_DATA_JSON, json).apply()
        VelloraCalendarWidgetProvider.updateAllWidgets(context)
    }
}

class VelloraCalendarWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (widgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId)
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        updateWidget(context, appWidgetManager, appWidgetId)
    }

    private data class WidgetItem(
        val date: String,
        val title: String,
        val startTime: String,
        val category: String
    )

    companion object {
        const val PREFS_NAME = "vellora_widget_prefs"
        const val KEY_DATA_JSON = "widget_data_json"

        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, VelloraCalendarWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            for (id in ids) {
                updateWidget(context, manager, id)
            }
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_vellora_calendar)
            val options = manager.getAppWidgetOptions(widgetId)
            val minW = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 340).coerceAtLeast(240)
            val minH = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 290).coerceAtLeast(200)
            val density = context.resources.displayMetrics.density.coerceIn(1.5f, 3.0f)
            val bmpW = (minW * density).toInt().coerceIn(720, 1280)
            val bmpH = (minH * density).toInt().coerceIn(600, 1120)

            val bitmap = renderCalendarBitmap(context, bmpW, bmpH)
            views.setImageViewBitmap(R.id.widget_canvas_image, bitmap)

            val openIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
            manager.updateAppWidget(widgetId, views)
        }

        private fun renderCalendarBitmap(context: Context, width: Int, height: Int): Bitmap {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val rawJson = prefs.getString(KEY_DATA_JSON, null)

            var isDark = false
            val itemsByDate = mutableMapOf<String, MutableList<WidgetItem>>()
            if (!rawJson.isNullOrBlank()) {
                try {
                    val root = JSONObject(rawJson)
                    isDark = root.optString("theme", "light") == "dark"
                    val arr = root.optJSONArray("items")
                    if (arr != null) {
                        for (i in 0 until arr.length()) {
                            val o = arr.optJSONObject(i) ?: continue
                            val date = o.optString("date", "")
                            val title = o.optString("title", "")
                            if (date.isBlank() || title.isBlank()) continue
                            val item = WidgetItem(
                                date = date,
                                title = title,
                                startTime = o.optString("startTime", ""),
                                category = o.optString("category", "personal")
                            )
                            itemsByDate.getOrPut(date) { mutableListOf() }.add(item)
                        }
                    }
                } catch (_: Exception) {
                }
            }

            itemsByDate.values.forEach { list ->
                list.sortBy { if (it.startTime.isBlank()) "99:99" else it.startTime }
            }

            val today = LocalDate.now()
            val todayStr = today.format(DateTimeFormatter.ISO_LOCAL_DATE)
            val ym = YearMonth.of(today.year, today.monthValue)
            val firstDay = ym.atDay(1)
            val startOffset = (firstDay.dayOfWeek.value - 1) // Mon=0 .. Sun=6
            val daysInMonth = ym.lengthOfMonth()
            val totalCells = startOffset + daysInMonth
            val rows = if (totalCells > 35) 6 else 5

            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            val scale = width / 1000f

            // Colors matching Vellora Light / Dark themes
            val bgColor = if (isDark) Color.parseColor("#1A1A1D") else Color.parseColor("#FAF8F4")
            val borderColor = if (isDark) Color.parseColor("#2E2E33") else Color.parseColor("#E3DDD2")
            val tileBg = if (isDark) Color.parseColor("#232327") else Color.parseColor("#FFFFFF")
            val tileEmptyBg = if (isDark) Color.parseColor("#161619") else Color.parseColor("#F1ECE4")
            val todayBg = if (isDark) Color.parseColor("#342E24") else Color.parseColor("#EFE7D6")
            val todayBorder = if (isDark) Color.parseColor("#C7B08A") else Color.parseColor("#9C8B72")
            val textPrimary = if (isDark) Color.parseColor("#F4F2ED") else Color.parseColor("#1D1D1F")
            val textSecondary = if (isDark) Color.parseColor("#A6A096") else Color.parseColor("#5C554D")
            val satColor = if (isDark) Color.parseColor("#7EB3E0") else Color.parseColor("#2B5B84")
            val sunColor = if (isDark) Color.parseColor("#E57A6E") else Color.parseColor("#B83B2E")
            val footerBg = if (isDark) Color.parseColor("#222226") else Color.parseColor("#F3EFE8")

            val pad = 28f * scale
            val corner = 44f * scale

            // Card background
            val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = bgColor; style = Paint.Style.FILL }
            val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = borderColor
                style = Paint.Style.STROKE
                strokeWidth = 2.5f * scale
            }
            val cardRect = RectF(2f * scale, 2f * scale, width - 2f * scale, height - 2f * scale)
            canvas.drawRoundRect(cardRect, corner, corner, bgPaint)
            canvas.drawRoundRect(cardRect, corner, corner, borderPaint)

            // Header
            val monthNames = arrayOf(
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            )
            val headerY = pad + 48f * scale
            val monthNumPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = textPrimary
                textSize = 54f * scale
                typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            }
            val monthStr = today.monthValue.toString()
            canvas.drawText(monthStr, pad + 4f * scale, headerY, monthNumPaint)
            val monthNumW = monthNumPaint.measureText(monthStr)

            val monthEnPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = textSecondary
                textSize = 24f * scale
                typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            }
            canvas.drawText(
                "${monthNames[today.monthValue - 1]} ${today.year}",
                pad + monthNumW + 18f * scale,
                headerY - 12f * scale,
                monthEnPaint
            )

            val brandPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = textSecondary
                textSize = 26f * scale
                typeface = Typeface.create(Typeface.SERIF, Typeface.BOLD)
                textAlign = Paint.Align.RIGHT
                letterSpacing = 0.08f
            }
            canvas.drawText("Vellora", width - pad - 4f * scale, headerY - 10f * scale, brandPaint)

            // Weekday row
            val weekTop = headerY + 24f * scale
            val weekLabels = arrayOf("月", "火", "水", "木", "金", "土", "日")
            val gridW = width - pad * 2f
            val cellGap = 8f * scale
            val cellW = (gridW - cellGap * 6f) / 7f

            val weekPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                textSize = 20f * scale
                typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
                textAlign = Paint.Align.CENTER
            }
            for (c in 0 until 7) {
                weekPaint.color = when (c) {
                    5 -> satColor
                    6 -> sunColor
                    else -> textSecondary
                }
                val cx = pad + c * (cellW + cellGap) + cellW / 2f
                canvas.drawText(weekLabels[c], cx, weekTop + 18f * scale, weekPaint)
            }

            // Layout split: Calendar grid (~72%) + Today strip (~28%)
            val footerH = (height * 0.21f).coerceIn(135f * scale, 195f * scale)
            val gridTop = weekTop + 32f * scale
            val gridBottom = height - pad - footerH - 14f * scale
            val gridH = (gridBottom - gridTop).coerceAtLeast(240f * scale)
            val cellH = (gridH - cellGap * (rows - 1)) / rows

            val tilePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
            val tileStroke = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeWidth = 2f * scale }
            val dayNumPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                textSize = 22f * scale
                typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            }
            val chipBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
            val chipTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                textSize = 15.5f * scale
                typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
            }

            for (r in 0 until rows) {
                for (c in 0 until 7) {
                    val idx = r * 7 + c
                    val dayNum = idx - startOffset + 1
                    val left = pad + c * (cellW + cellGap)
                    val top = gridTop + r * (cellH + cellGap)
                    val rect = RectF(left, top, left + cellW, top + cellH)
                    val cellRadius = 14f * scale

                    if (dayNum < 1 || dayNum > daysInMonth) {
                        tilePaint.color = tileEmptyBg
                        canvas.drawRoundRect(rect, cellRadius, cellRadius, tilePaint)
                        continue
                    }

                    val dateStr = String.format(Locale.US, "%04d-%02d-%02d", today.year, today.monthValue, dayNum)
                    val isToday = dateStr == todayStr

                    tilePaint.color = if (isToday) todayBg else tileBg
                    canvas.drawRoundRect(rect, cellRadius, cellRadius, tilePaint)
                    tileStroke.color = if (isToday) todayBorder else borderColor
                    canvas.drawRoundRect(rect, cellRadius, cellRadius, tileStroke)

                    dayNumPaint.color = when (c) {
                        5 -> satColor
                        6 -> sunColor
                        else -> textPrimary
                    }
                    canvas.drawText(dayNum.toString(), left + 8f * scale, top + 24f * scale, dayNumPaint)

                    val dayItems = itemsByDate[dateStr].orEmpty()
                    val maxChips = if (cellH >= 90f * scale) 2 else 1
                    val chipH = 21f * scale
                    var chipY = top + 31f * scale
                    for (k in 0 until minOf(dayItems.size, maxChips)) {
                        if (chipY + chipH > top + cellH - 4f * scale) break
                        val it = dayItems[k]
                        val (cBg, cTxt) = categoryColors(it.category, isDark)
                        chipBgPaint.color = cBg
                        val chipRect = RectF(left + 5f * scale, chipY, left + cellW - 5f * scale, chipY + chipH)
                        canvas.drawRoundRect(chipRect, 6f * scale, 6f * scale, chipBgPaint)

                        chipTextPaint.color = cTxt
                        val label = ellipsize(it.title, chipTextPaint, chipRect.width() - 8f * scale)
                        canvas.drawText(label, chipRect.left + 4f * scale, chipY + 15.5f * scale, chipTextPaint)
                        chipY += chipH + 3.5f * scale
                    }
                }
            }

            // Bottom Today Summary Strip
            val footerTop = gridBottom + 14f * scale
            val footerRect = RectF(pad, footerTop, width - pad, height - pad)
            tilePaint.color = footerBg
            canvas.drawRoundRect(footerRect, 22f * scale, 22f * scale, tilePaint)
            tileStroke.color = borderColor
            canvas.drawRoundRect(footerRect, 22f * scale, 22f * scale, tileStroke)

            val todayTitlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = textPrimary
                textSize = 21f * scale
                typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            }
            val dowJa = weekLabels[(today.dayOfWeek.value - 1)]
            canvas.drawText(
                "今日 ${today.monthValue}/${today.dayOfMonth}（$dowJa）の予定",
                footerRect.left + 18f * scale,
                footerRect.top + 32f * scale,
                todayTitlePaint
            )

            val todayItems = itemsByDate[todayStr].orEmpty()
            val rowTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = textPrimary
                textSize = 20f * scale
                typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
            }
            val timeTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = textSecondary
                textSize = 19f * scale
                typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
            }
            val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }

            if (todayItems.isEmpty()) {
                val emptyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = textSecondary
                    textSize = 20f * scale
                }
                val msg = if (rawJson.isNullOrBlank()) "アプリを開くと予定が同期されます" else "今日の予定はありません"
                canvas.drawText(msg, footerRect.left + 18f * scale, footerRect.top + 74f * scale, emptyPaint)
            } else {
                val maxRows = ((footerRect.height() - 46f * scale) / (30f * scale)).toInt().coerceIn(1, 3)
                var rowY = footerRect.top + 66f * scale
                for (i in 0 until minOf(todayItems.size, maxRows)) {
                    val it = todayItems[i]
                    dotPaint.color = categoryDotColor(it.category)
                    canvas.drawCircle(footerRect.left + 24f * scale, rowY - 6f * scale, 5.5f * scale, dotPaint)

                    val timeStr = if (it.startTime.isBlank()) "終日" else it.startTime
                    canvas.drawText(timeStr, footerRect.left + 38f * scale, rowY, timeTextPaint)

                    val titleX = footerRect.left + 112f * scale
                    val maxTitleW = footerRect.right - titleX - 18f * scale
                    canvas.drawText(ellipsize(it.title, rowTextPaint, maxTitleW), titleX, rowY, rowTextPaint)
                    rowY += 30f * scale
                }
            }

            return bitmap
        }

        private fun categoryColors(category: String, isDark: Boolean): Pair<Int, Int> {
            return if (isDark) {
                when (category) {
                    "class" -> Pair(Color.parseColor("#3E2322"), Color.parseColor("#F0988E"))
                    "deadline" -> Pair(Color.parseColor("#213244"), Color.parseColor("#94C2EC"))
                    "parttime" -> Pair(Color.parseColor("#1F3627"), Color.parseColor("#84CE9C"))
                    else -> Pair(Color.parseColor("#312F2C"), Color.parseColor("#D4CFC6"))
                }
            } else {
                when (category) {
                    "class" -> Pair(Color.parseColor("#F9E4E2"), Color.parseColor("#8C2D25"))
                    "deadline" -> Pair(Color.parseColor("#E5EDF5"), Color.parseColor("#224363"))
                    "parttime" -> Pair(Color.parseColor("#E5EFE8"), Color.parseColor("#244E32"))
                    else -> Pair(Color.parseColor("#F0EDE8"), Color.parseColor("#4A443E"))
                }
            }
        }

        private fun categoryDotColor(category: String): Int {
            return when (category) {
                "class" -> Color.parseColor("#C94035")
                "deadline" -> Color.parseColor("#2B5B84")
                "parttime" -> Color.parseColor("#366B47")
                else -> Color.parseColor("#7A736A")
            }
        }

        private fun ellipsize(text: String, paint: Paint, maxWidth: Float): String {
            if (maxWidth <= 0f || paint.measureText(text) <= maxWidth) return text
            val ellipsis = "…"
            val eW = paint.measureText(ellipsis)
            var end = text.length
            while (end > 0 && paint.measureText(text, 0, end) + eW > maxWidth) {
                end--
            }
            return if (end <= 0) ellipsis else text.substring(0, end) + ellipsis
        }
    }
}

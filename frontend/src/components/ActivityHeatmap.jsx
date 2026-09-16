import { useEffect, useState } from 'react';
import { fetchActivity } from '../api.js';

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TOTAL_WEEKS = 53;

function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function levelForCount(count) {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function buildWeeks(countsByDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const start = new Date(end);
  start.setDate(start.getDate() - (TOTAL_WEEKS * 7 - 1));

  const weeks = [];
  const cursor = new Date(start);
  for (let w = 0; w < TOTAL_WEEKS; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const iso = formatLocalDate(cursor);
      const isFuture = cursor > today;
      days.push({
        date: iso,
        month: cursor.getMonth(),
        count: isFuture ? null : countsByDate[iso] || 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
}

function buildMonthLabels(weeks) {
  let lastMonth = null;
  return weeks.map((week) => {
    const monthOfWeek = week[0].month;
    if (monthOfWeek !== lastMonth) {
      lastMonth = monthOfWeek;
      return MONTH_NAMES[monthOfWeek];
    }
    return '';
  });
}

export default function ActivityHeatmap({ profileId }) {
  const [countsByDate, setCountsByDate] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    fetchActivity()
      .then((rows) => {
        const map = {};
        rows.forEach((r) => {
          map[r.day] = r.count;
        });
        setCountsByDate(map);
      })
      .finally(() => setLoading(false));
  }, [profileId]);

  const weeks = buildWeeks(countsByDate);
  const monthLabels = buildMonthLabels(weeks);
  const totalApplied = Object.values(countsByDate).reduce((sum, n) => sum + n, 0);

  return (
    <div className="heatmap-wrapper">
      <p className="modal-subtext">
        {loading ? 'Loading…' : `${totalApplied} application${totalApplied === 1 ? '' : 's'} applied for in the last year.`}
      </p>
      {!loading && (
        <div className="heatmap-scroll">
          <div className="heatmap-body">
            <div className="heatmap-day-labels">
              {DAY_LABELS.map((label, i) => (
                <span key={i} className="heatmap-day-label">
                  {label}
                </span>
              ))}
            </div>
            <div>
              <div className="heatmap-months">
                {monthLabels.map((label, i) => (
                  <span key={i} className="heatmap-month-label">
                    {label}
                  </span>
                ))}
              </div>
              <div className="heatmap-grid">
                {weeks.map((week, wi) => (
                  <div className="heatmap-week" key={wi}>
                    {week.map((day, di) => (
                      <div
                        key={di}
                        className={
                          day.count === null
                            ? 'heatmap-cell heatmap-cell-future'
                            : `heatmap-cell heatmap-level-${levelForCount(day.count)}`
                        }
                        title={day.count === null ? undefined : `${day.count} application${day.count === 1 ? '' : 's'} on ${day.date}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="heatmap-legend">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <div key={lvl} className={`heatmap-cell heatmap-level-${lvl}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
}

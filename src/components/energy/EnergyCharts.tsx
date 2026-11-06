import clsx from 'clsx'
import { addDays, format } from 'date-fns'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DAY_TYPE_LABELS } from '../../lib/calendar'
import { fromISODate } from '../../lib/dates'
import { PERIOD_COLORS } from '../../lib/energyAnalysis'
import { formatNumber } from '../../lib/format'
import type { AcademicPeriod, DayType } from '../../types'

const AXIS = { fontSize: 12, fill: '#5f80b8' }

export interface DailyPoint {
  t: number
  date: string
  kWh: number
  expected: number
  flagged: boolean
  dayType: DayType
}

/** Legend chips for the period colours. */
export function PeriodLegend() {
  const types: DayType[] = ['teaching', 'exams', 'ramadan', 'break', 'summer', 'holiday']
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-600">
      {types.map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: PERIOD_COLORS[t] }} />
          {DAY_TYPE_LABELS[t]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-red-600" />
        Flagged waste
      </span>
    </div>
  )
}

/** Daily kWh with academic periods as coloured background bands. */
export function DailyEnergyChart({ points, periods }: { points: DailyPoint[]; periods: AcademicPeriod[] }) {
  if (!points.length) return null
  const min = points[0].t
  const max = points[points.length - 1].t
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: 4 }}>
          {periods.map((p) => {
            const x1 = Math.max(min, fromISODate(p.start).getTime())
            const x2 = Math.min(max, addDays(fromISODate(p.end), 1).getTime())
            return x2 > x1 ? <ReferenceArea key={p.id} x1={x1} x2={x2} fill={PERIOD_COLORS[p.type]} fillOpacity={0.55} ifOverflow="hidden" /> : null
          })}
          <CartesianGrid stroke="#e3eaf5" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={[min, max]} tickFormatter={(t: number) => format(t, 'd MMM')} tick={AXIS} />
          <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tick={AXIS} width={44} />
          <Tooltip
            labelFormatter={(t, payload) => {
              const p = payload?.[0]?.payload as DailyPoint | undefined
              return `${format(Number(t), 'EEE d MMM yyyy')}${p ? ` · ${DAY_TYPE_LABELS[p.dayType]}` : ''}`
            }}
            formatter={(v, name) => [`${formatNumber(Number(v))} kWh`, name === 'expected' ? 'Expected' : 'Actual']}
          />
          <Area
            type="monotone"
            dataKey="kWh"
            stroke="#10213f"
            fill="#10213f"
            fillOpacity={0.08}
            strokeWidth={1.5}
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; payload?: DailyPoint; index?: number }) =>
              props.payload?.flagged ? (
                <circle key={props.index} cx={props.cx} cy={props.cy} r={3.5} fill="#dc2626" stroke="#fff" strokeWidth={1} />
              ) : (
                <g key={props.index} />
              )
            }
          />
          <Line type="monotone" dataKey="expected" stroke="#d97706" strokeDasharray="4 3" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Average kWh per weekday for two periods side by side. */
export function PeriodCompareChart({ data, labelA, labelB }: { data: Array<{ day: string; a: number; b: number }>; labelA: string; labelB: string }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid stroke="#e3eaf5" vertical={false} />
          <XAxis dataKey="day" tick={AXIS} />
          <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tick={AXIS} width={44} />
          <Tooltip formatter={(v, name) => [`${formatNumber(Number(v))} kWh/day`, name === 'a' ? labelA : labelB]} />
          <Legend formatter={(v) => (v === 'a' ? labelA : labelB)} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="a" fill="#2a4a82" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="b" fill="#f59e0b" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** 24 hourly bars for one day; night hours highlighted. */
export function HourlyChart({ hours }: { hours: number[] }) {
  const data = hours.map((kWh, hour) => ({ hour: String(hour).padStart(2, '0'), kWh, night: hour < 6 || hour >= 20 }))
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="#e3eaf5" vertical={false} />
          <XAxis dataKey="hour" tick={{ ...AXIS, fontSize: 10 }} interval={1} />
          <YAxis tick={{ ...AXIS, fontSize: 10 }} width={40} />
          <Tooltip formatter={(v) => [`${formatNumber(Number(v))} kWh`, 'Energy']} labelFormatter={(h) => `${h}:00`} />
          <Bar dataKey="kWh" isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.hour} fill={d.night ? '#f59e0b' : '#2a4a82'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export interface HeatmapRow {
  date: string
  dayType: DayType
  hours: number[]
  flagged: boolean
}

/** Hour × day heatmap (one row per day). Darker = more energy. */
export function Heatmap({ rows }: { rows: HeatmapRow[] }) {
  const max = Math.max(1, ...rows.flatMap((r) => r.hours))
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[9rem_repeat(24,minmax(0,1fr))] gap-px text-[10px] text-navy-500">
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center">
              {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
            </span>
          ))}
          {rows.map((row) => (
            <div key={row.date} className="contents">
              <span className={clsx('flex items-center gap-1.5 pr-2 text-xs', row.flagged ? 'font-semibold text-red-700' : 'text-navy-700')}>
                {format(fromISODate(row.date), 'EEE d MMM')}
                <span className="rounded px-1 text-[10px]" style={{ background: PERIOD_COLORS[row.dayType] }}>
                  {DAY_TYPE_LABELS[row.dayType]}
                </span>
              </span>
              {row.hours.map((kWh, h) => {
                const level = kWh / max
                return (
                  <span
                    key={h}
                    title={`${format(fromISODate(row.date), 'EEE d MMM')} ${String(h).padStart(2, '0')}:00 — ${formatNumber(kWh)} kWh`}
                    className="h-7 rounded-[3px]"
                    style={{ background: `rgba(16, 33, 63, ${0.06 + level * 0.9})` }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-navy-500">
          Low
          <span className="h-2 w-32 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(16,33,63,0.06), rgba(16,33,63,0.96))' }} />
          High · <span className="font-semibold text-red-700">red date</span> = flagged as waste
        </div>
      </div>
    </div>
  )
}

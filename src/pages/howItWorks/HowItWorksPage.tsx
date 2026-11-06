import {
  Activity,
  ArrowDown,
  ArrowRight,
  Building,
  Cable,
  ChartColumn,
  ClipboardCheck,
  Cloud,
  Cpu,
  Droplet,
  FileText,
  Flame,
  Fuel,
  Globe,
  Mail,
  MessageSquareWarning,
  RadioTower,
  Snowflake,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Fragment } from 'react'
import { Link } from 'react-router'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'

interface Step {
  icon: LucideIcon
  title: string
  detail: string
  points: string[]
}

const CHAIN: Step[] = [
  {
    icon: Zap,
    title: 'Selec energy meters',
    detail: 'On each sub-main distribution board (SMDB)',
    points: ['kWh, kW, kVA, power factor', 'Voltage and current per phase', 'RS-485 / Modbus output'],
  },
  {
    icon: Cpu,
    title: 'ESP32-S3 IoT node',
    detail: 'Small gateway in the electrical room',
    points: ['Reads the meters every few seconds', 'Also reads CT clamps on motors', 'Buffers data if the link drops'],
  },
  {
    icon: RadioTower,
    title: 'SIM7080G cellular',
    detail: 'LTE-M / NB-IoT modem',
    points: ['Sends data over the cellular network', 'Kept separate from the campus IT network', 'No new cabling to a server room'],
  },
  {
    icon: Cloud,
    title: 'FacilityIQ cloud dashboard',
    detail: 'What the FM team uses',
    points: ['Live monitoring and alerts', 'Logbook, PPM and work orders', 'Analytics and monthly reports'],
  },
]

const MODULES: Array<{ icon: LucideIcon; title: string; to: string; text: string }> = [
  { icon: Zap, title: 'SMDB Live Monitoring', to: '/smdb', text: 'Live load, voltage and current per board, with alerts for overload, imbalance, voltage and trips.' },
  { icon: Activity, title: 'Predictive Maintenance', to: '/predictive', text: 'CT clamps on chillers, AHUs and pumps reveal developing faults from the motor current signature.' },
  { icon: ClipboardCheck, title: 'Digital Logbook & PPM', to: '/ppm', text: 'QR-tagged assets, digital checklists on a phone, PPM calendar and full maintenance history.' },
  { icon: MessageSquareWarning, title: 'Complaints & Work Orders', to: '/complaints', text: 'Room QR code → complaint → assigned technician → closed, with response and resolution times.' },
  { icon: ChartColumn, title: 'Energy Analytics', to: '/energy', text: 'Energy compared with the academic calendar to find use when buildings are empty.' },
  { icon: FileText, title: 'Monthly Report', to: '/report', text: 'One-click PDF of PPM, complaints, energy and indicative Scope 2 CO₂ for management.' },
]

const ADD_ONS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: Snowflake, title: 'Lab & cold-storage alarms', text: 'Temperature sensors for fridges, freezers and lab rooms, with alerts before samples are at risk.' },
  { icon: Droplet, title: 'Water & leak monitoring', text: 'Water meters and leak sensors in plant rooms, washrooms and under risers.' },
  { icon: Fuel, title: 'Generator monitoring', text: 'Run hours, fuel level, battery voltage and test-run records for standby generators.' },
  { icon: Flame, title: 'Panel hot-spot sensors', text: 'Wireless temperature sensors on busbars and terminals to catch loose connections early.' },
]

const PILOT = [
  ['Choose', 'Select one or two buildings and a few critical motors with the FM team.'],
  ['Install', 'Fit meters on the chosen SMDBs and CT clamps on the motors; connect the IoT node.'],
  ['Run', 'Use FacilityIQ alongside the current way of working: QR complaints, digital PPM, alerts.'],
  ['Measure', 'Compare response times, PPM completion and energy use. Results are measured during the pilot.'],
] as const

/** Sales/explanation page: the hardware chain, what each module does, add-ons and a pilot outline. */
export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="How it works"
        description="From the electrical panel to the dashboard — the FacilityIQ platform behind this demo."
      />

      <Card title="Data flow" subtitle="One IoT node per electrical room collects meter and motor data and sends it to the cloud">
        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-stretch">
          {CHAIN.map((step, i) => {
            const Icon = step.icon
            return (
              <Fragment key={step.title}>
                <div className="flex-1 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-teal-300">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-navy-900">{step.title}</p>
                      <p className="text-xs text-navy-500">{step.detail}</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-navy-700">
                    {step.points.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < CHAIN.length - 1 && (
                  <div className="flex items-center justify-center text-teal-600" aria-hidden>
                    <ArrowRight className="hidden size-6 lg:block" />
                    <ArrowDown className="size-6 lg:hidden" />
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
          <Cable className="mt-0.5 size-5 shrink-0 text-teal-700" aria-hidden />
          <p className="text-sm text-navy-800">
            <strong>CT clamps for predictive maintenance:</strong> split-core current transformers clip around the motor supply cables of chillers,
            AHUs and pumps — no rewiring and no shutdown needed. The same IoT node reads them and FacilityIQ analyses the current signature.
          </p>
        </div>
      </Card>

      <h2 className="mt-8 mb-3 text-lg font-semibold text-navy-900">What the FM team gets</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map(({ icon: Icon, title, to, text }) => (
          <Link key={title} to={to} className="group rounded-xl border border-navy-100 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md">
            <Icon className="size-6 text-teal-600" aria-hidden />
            <p className="mt-2 font-semibold text-navy-900 group-hover:text-teal-700">{title}</p>
            <p className="mt-1 text-sm text-navy-600">{text}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold text-navy-900">Available add-ons</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ADD_ONS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-dashed border-navy-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <Icon className="size-6 text-navy-600" aria-hidden />
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-600/20">Add-on</span>
            </div>
            <p className="mt-2 font-semibold text-navy-900">{title}</p>
            <p className="mt-1 text-sm text-navy-600">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card title="Suggested pilot" className="xl:col-span-2">
          <ol className="grid gap-4 sm:grid-cols-2">
            {PILOT.map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">{i + 1}</span>
                <span>
                  <span className="block font-semibold text-navy-900">{title}</span>
                  <span className="text-sm text-navy-600">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-navy-500">
            All figures in this demo are sample data. Energy savings and other benefits are not promised — they are to be measured during the pilot.
          </p>
        </Card>

        <Card title="About Kuroshio AI">
          <div className="space-y-3 text-sm text-navy-700">
            <p>Deep tech startup building IoT and AI tools for facilities, energy and industry.</p>
            <p className="flex items-start gap-2">
              <Building className="mt-0.5 size-4 shrink-0 text-navy-500" aria-hidden />
              <span>
                <strong>UAE:</strong> Kuroshio AI Ltd, RAKEZ, Ras Al Khaimah
                <br />
                <strong>India:</strong> Kuroshio AI Private Limited, STPI Trivandrum
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Globe className="size-4 shrink-0 text-navy-500" aria-hidden />
              <a href="https://www.kuroshioai.com" target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                www.kuroshioai.com
              </a>
              ·
              <a href="https://www.kuroshioai.ae" target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                www.kuroshioai.ae
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-navy-500" aria-hidden />
              <a href="mailto:info@kuroshioai.com" className="text-teal-700 hover:underline">
                info@kuroshioai.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}

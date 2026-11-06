import { Hammer } from 'lucide-react'

/** Temporary panel for modules not built yet. Each one is replaced in its own build step. */
export function ComingSoon({ step, features }: { step: number; features: string[] }) {
  return (
    <div className="rounded-xl border border-dashed border-navy-200 bg-white p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
        <Hammer className="size-4" aria-hidden />
        Built in step {step}
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-navy-600">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  )
}

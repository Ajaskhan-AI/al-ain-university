import { ImagePlus, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

/**
 * Photo picker with preview. In the demo the photo is preview-only: only the
 * file name is saved (photos would quickly fill up localStorage).
 * On a phone, capture="environment" offers the camera directly.
 */
export function PhotoInput({ value, onChange }: { value: File | null; onChange: (file: File | null) => void }) {
  const id = useId()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Create a temporary URL for the preview and release it when no longer needed.
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  if (value && previewUrl) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-navy-200 bg-navy-50 p-2">
        <img src={previewUrl} alt="Selected photo preview" className="size-16 rounded-md object-cover" />
        <span className="min-w-0 flex-1 truncate text-sm text-navy-700">{value.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove photo"
          className="rounded-md p-1.5 text-navy-500 hover:bg-white"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-navy-200 px-4 py-4 text-sm font-medium text-navy-600 hover:border-teal-400 hover:bg-teal-50/40"
    >
      <ImagePlus className="size-5" aria-hidden />
      Add a photo
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  )
}

'use client'
import { useActionState, useState, useRef } from 'react'
import { updateSchoolProfile } from '@/app/actions/settings'

type Props = {
  currentName: string
  currentAddress: string | null
  currentLogo: string | null
}

const FIELD =
  'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'

// ── Image compressor ──
// Fits the image within maxDim, then compresses toward targetBytes:
// JPEG (quality stepped down) for opaque images, PNG (dimensions stepped down)
// for images with transparency so logos keep their see-through background.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('That file is not a valid image.'))
    img.src = src
  })
}

function fit(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h }
  return w >= h
    ? { width: max, height: Math.round((h * max) / w) }
    : { width: Math.round((w * max) / h), height: max }
}

// Approximate decoded byte size of a data URI from its base64 length.
function dataUrlBytes(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.floor((b64.length * 3) / 4)
}

async function compressImage(
  file: File,
  { maxDim = 512, targetBytes = 200 * 1024, minDim = 128 } = {}
): Promise<{ dataUrl: string; bytes: number }> {
  const reader = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(new Error('Could not read the file.'))
    r.onload = () => resolve(r.result as string)
    r.readAsDataURL(file)
  })
  const img = await loadImage(reader)

  let { width, height } = fit(img.naturalWidth, img.naturalHeight, maxDim)

  const draw = (w: number, h: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported.')
    ctx.drawImage(img, 0, 0, w, h)
    return { canvas, ctx }
  }

  let { canvas, ctx } = draw(width, height)

  // Detect transparency (any pixel with alpha < 255)
  let transparent = false
  const px = ctx.getImageData(0, 0, width, height).data
  for (let i = 3; i < px.length; i += 4) {
    if (px[i] < 255) { transparent = true; break }
  }

  let out: string
  if (transparent) {
    // PNG: quality is not adjustable, so shrink dimensions until under target
    out = canvas.toDataURL('image/png')
    while (dataUrlBytes(out) > targetBytes && width > minDim) {
      width = Math.round(width * 0.85)
      height = Math.round(height * 0.85)
      ;({ canvas } = draw(width, height))
      out = canvas.toDataURL('image/png')
    }
  } else {
    // JPEG: step quality down first, then dimensions if still too big
    let quality = 0.85
    out = canvas.toDataURL('image/jpeg', quality)
    while (dataUrlBytes(out) > targetBytes && quality > 0.4) {
      quality -= 0.1
      out = canvas.toDataURL('image/jpeg', quality)
    }
    while (dataUrlBytes(out) > targetBytes && width > minDim) {
      width = Math.round(width * 0.85)
      height = Math.round(height * 0.85)
      ;({ canvas } = draw(width, height))
      out = canvas.toDataURL('image/jpeg', 0.7)
    }
  }

  return { dataUrl: out, bytes: dataUrlBytes(out) }
}

export default function SchoolProfileForm({ currentName, currentAddress, currentLogo }: Props) {
  const [state, action, pending] = useActionState(updateSchoolProfile, undefined)
  const [logo, setLogo] = useState<string>(currentLogo ?? '')
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoInfo, setLogoInfo] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(null)
    setLogoInfo(null)
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file (PNG, JPG, etc.).')
      return
    }
    setCompressing(true)
    try {
      const { dataUrl, bytes } = await compressImage(file)
      setLogo(dataUrl)
      const origKb = Math.round(file.size / 1024)
      const newKb = Math.max(1, Math.round(bytes / 1024))
      setLogoInfo(`Compressed ${origKb} KB → ${newKb} KB`)
    } catch (err: any) {
      setLogoError(err.message ?? 'Could not process the image.')
    } finally {
      setCompressing(false)
    }
  }

  function removeLogo() {
    setLogo('')
    setLogoError(null)
    setLogoInfo(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <form action={action} className="space-y-4">
      {/* The logo (data URI or empty) travels in this hidden field */}
      <input type="hidden" name="logo" value={logo} />

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">School Name</label>
        <input name="name" type="text" required defaultValue={currentName} placeholder="e.g. Delhi Public School" className={FIELD} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">School Address</label>
        <input name="address" type="text" defaultValue={currentAddress ?? ''} placeholder="e.g. Sector 14, Rohini, New Delhi — 110085" className={FIELD} />
        <p className="text-xs text-slate-400 mt-1">Appears on the printed paper header below the school name.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">School Logo</label>
        <div className="flex items-center gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="School logo" className="h-16 w-16 object-contain rounded-xl border border-slate-200 bg-white shrink-0" />
          ) : (
            <div className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className={`inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 text-slate-700 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${compressing ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}>
                {compressing ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
                {compressing ? 'Compressing…' : logo ? 'Change logo' : 'Upload logo'}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={compressing} />
              </label>
              {logo && !compressing && (
                <button type="button" onClick={removeLogo} className="text-sm font-medium text-slate-500 hover:text-red-600 px-2 py-2 transition-colors">
                  Remove
                </button>
              )}
            </div>
            {logoInfo ? (
              <p className="text-xs text-emerald-600 font-medium">{logoInfo}</p>
            ) : (
              <p className="text-xs text-slate-400">PNG or JPG — auto-compressed. Prints at the top-left of every paper.</p>
            )}
          </div>
        </div>
        {logoError && <p className="text-red-600 text-sm mt-2">{logoError}</p>}
      </div>

      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      {state?.success && <p className="text-emerald-600 text-sm">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all shadow-sm shadow-indigo-600/20"
      >
        {pending ? 'Saving…' : 'Save Profile'}
      </button>
    </form>
  )
}

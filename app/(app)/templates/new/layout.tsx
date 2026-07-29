// page.tsx is a client component, and Server Action timeout config can only be set from a
// server component — this layout exists solely to raise the platform's function timeout so
// photo OCR (up to 45s internally) isn't killed by a shorter default before it can respond.
export const maxDuration = 60

export default function TemplatesNewLayout({ children }: { children: React.ReactNode }) {
  return children
}

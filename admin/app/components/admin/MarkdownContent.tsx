import { useEffect, useId, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="text-sm leading-relaxed text-foreground space-y-3 [&_p]:m-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_strong]:font-bold [&_em]:italic [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_hr]:my-3 [&_hr]:border-border">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className ?? '')
            const lang = match?.[1]
            const code = String(children ?? '').replace(/\n$/, '')
            const isBlock = (className ?? '').includes('language-') || code.includes('\n')

            if (!isBlock) {
              return (
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
                  {children}
                </code>
              )
            }

            if (lang === 'mermaid') {
              return <MermaidBlock code={code} />
            }

            return (
              <pre className="rounded-lg border-2 border-border bg-muted/60 p-3 overflow-x-auto">
                <code className="font-mono text-xs leading-relaxed text-foreground">
                  {children}
                </code>
              </pre>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function MermaidBlock({ code }: { code: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setSvg(null)
    ;(async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
        })
        const renderId = `mermaid-${id}`
        const { svg: out } = await mermaid.render(renderId, code)
        if (!cancelled) setSvg(out)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không vẽ được biểu đồ')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code, id])

  if (error) {
    return (
      <div className="rounded-lg border-2 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3 space-y-2">
        <p className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
          Mermaid lỗi
        </p>
        <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
        <pre className="rounded bg-rose-100/50 dark:bg-rose-900/30 p-2 overflow-x-auto">
          <code className="font-mono text-[11px] text-rose-900 dark:text-rose-200">{code}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-border bg-card p-3 overflow-x-auto">
      {svg ? (
        <div
          ref={ref}
          className="mermaid-rendered flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <p className="text-xs text-muted-foreground italic">Đang vẽ biểu đồ…</p>
      )}
    </div>
  )
}

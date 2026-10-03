import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * RN-S18: Markdown sem HTML cru (react-markdown ignora HTML por padrão) e links
 * perigosos (javascript:, data:) removidos pela transformação de URL padrão.
 */
export function Markdown({ children, compact }: { children: string; compact?: boolean }) {
  return (
    <div className={`md ${compact ? "md-compact" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target={href?.startsWith("/") || href?.startsWith("#") ? undefined : "_blank"} rel="noreferrer noopener">{children}</a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

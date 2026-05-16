"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, Minus,
} from "lucide-react";

// ─── Allowed formatting only — no colors, no fonts, no images ───
// Bold, Italic, H2, H3, BulletList, OrderedList, Blockquote, HorizontalRule

interface RichEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

function ToolbarBtn({
  onClick, active, title, children,
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={[
        "grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] transition",
        active
          ? "bg-[var(--color-pitch-500)] text-white"
          : "text-[var(--color-muted-strong)] hover:bg-[var(--color-pitch-50)] hover:text-[var(--color-pitch-700)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// Convert plain text to HTML paragraphs (for legacy descriptions)
function htmlOrText(raw: string): string {
  if (!raw.trim()) return "";
  if (/^\s*</.test(raw)) return raw; // already HTML

  // Convert plain text to structured HTML for Tiptap.
  // Handles legacy descriptions that used "* item" inline bullets and no newlines.
  const blocks: string[] = [];

  // Split into chunks by double newline (paragraphs) or single newline.
  const paragraphs = raw.split(/\n\n+/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect inline bullet pattern: "intro text * item1 * item2 * item3"
    // or lines that start with "* " or "- "
    const lines = trimmed.split(/\n/);
    const allBullets = lines.every(l => /^[*\-•]\s/.test(l.trim()));

    if (allBullets && lines.length > 1) {
      // All lines are bullets → <ul>
      const items = lines.map(l => `<li>${l.replace(/^[*\-•]\s+/, "").trim()}</li>`).join("");
      blocks.push(`<ul>${items}</ul>`);
    } else if (trimmed.includes(" * ")) {
      // Inline "text * item * item" pattern — split into paragraph + list
      const parts = trimmed.split(/\s+\*\s+/);
      const intro = parts[0].trim();
      const items = parts.slice(1);
      if (intro) blocks.push(`<p>${intro}</p>`);
      if (items.length) blocks.push(`<ul>${items.map(i => `<li>${i.trim()}</li>`).join("")}</ul>`);
    } else {
      // Regular paragraph — preserve single newlines as <br>
      blocks.push(`<p>${trimmed.replace(/\n/g, "<br>")}</p>`);
    }
  }

  return blocks.join("") || `<p>${raw}</p>`;
}

export function RichEditor({ name, defaultValue, placeholder, className }: RichEditorProps) {
  // Only mount Tiptap on the client to avoid SSR hydration issues
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // SSR / first paint: render a plain textarea as fallback.
    // The form can still be submitted with the original value.
    return (
      <div className={["overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)]", className].join(" ")}>
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          rows={7}
          className="w-full resize-y px-4 py-3 text-sm text-[var(--color-foreground)] outline-none"
        />
      </div>
    );
  }

  return <TiptapEditor name={name} defaultValue={defaultValue} placeholder={placeholder} className={className} />;
}

// Separate inner component so Tiptap only initializes after mount
function TiptapEditor({ name, defaultValue, placeholder, className }: RichEditorProps) {
  const initialContent = defaultValue ? htmlOrText(defaultValue) : "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        strike: false,
        bold: {},
        italic: {},
        bulletList: {},
        orderedList: {},
        blockquote: {},
        heading: { levels: [2, 3] },
        horizontalRule: {},
        hardBreak: {},
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: initialContent,
    immediatelyRender: true, // safe — we're already client-side
    editorProps: {
      attributes: {
        class: "min-h-[160px] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none leading-relaxed focus:outline-none",
      },
    },
  });

  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  // While editor initializes, render hidden input with original value so form submission still works
  if (!editor) {
    return (
      <div className={["overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)]", className].join(" ")}>
        <input type="hidden" name={name} value={defaultValue ?? ""} />
        <div className="min-h-[160px] animate-pulse bg-[var(--color-bg-muted)]" />
      </div>
    );
  }

  const html = editor.getHTML();
  const value = html === "<p></p>" ? "" : html;

  return (
    <div className={["overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] transition focus-within:border-[var(--color-pitch-500)] focus-within:ring-2 focus-within:ring-[var(--color-pitch-500)]/20", className].join(" ")}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] px-2 py-1.5">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="mx-1 h-5 w-px bg-[var(--color-border-strong)]" />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="mx-1 h-5 w-px bg-[var(--color-border-strong)]" />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          <Quote className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Divider">
          <Minus className="h-3.5 w-3.5" />
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Hidden input for form submission — always present */}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

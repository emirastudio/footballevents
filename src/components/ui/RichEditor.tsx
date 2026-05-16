"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
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

export function RichEditor({ name, defaultValue, placeholder, className }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable unsupported nodes
        code: false,
        codeBlock: false,
        // Allow only safe marks
        bold: {},
        italic: {},
        strike: false,
        bulletList: {},
        orderedList: {},
        blockquote: {},
        heading: { levels: [2, 3] },
        horizontalRule: {},
        hardBreak: {},
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
    ],
    content: defaultValue ? htmlOrText(defaultValue) : "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-[160px] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none leading-relaxed focus:outline-none",
      },
    },
  });

  // Keep hidden input in sync
  const html = editor?.getHTML() ?? "";

  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={["overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] transition focus-within:border-[var(--color-pitch-500)] focus-within:ring-2 focus-within:ring-[var(--color-pitch-500)]/20", className].join(" ")}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-bg-muted)] px-2 py-1.5">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (⌘B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (⌘I)">
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

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={html === "<p></p>" ? "" : html} />
    </div>
  );
}

// ─── Detect if content is HTML or plain text and wrap accordingly ───
function htmlOrText(raw: string): string {
  if (!raw.trim()) return "";
  // Already HTML if starts with a tag
  if (/^\s*</.test(raw)) return raw;
  // Convert plain text: double newlines → paragraphs, single → <br>
  return raw
    .split(/\n\n+/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-sm font-semibold transition-colors ${
        active ? "bg-admin-primary text-white" : "text-masaar-black/70 hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * WYSIWYG editor for blog_posts.content when content_format = "html".
 * Uploads images through the shared media bucket (uploadImage prop) so
 * inserted images live at real, permanent URLs like everywhere else in
 * the admin, rather than embedding base64 data.
 */
export function RichTextEditor({
  content,
  onChange,
  uploadImage,
}: {
  content: string;
  onChange: (html: string) => void;
  uploadImage: (file: File) => Promise<string | null>;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "blog-richtext min-h-[320px] px-3 py-3 text-sm text-masaar-black focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // Only re-sync when the external content identity changes (e.g. switching posts), not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const url = await uploadImage(file);
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  function handleSetLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function handleAddVideo() {
    if (!editor) return;
    const url = window.prompt("YouTube video URL");
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  }

  return (
    <div className="overflow-hidden rounded-md border border-black/15">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-black/10 bg-admin-surface/60 px-2 py-1.5">
        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">U</span>
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-black/10" />
        <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-black/10" />
        <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •≡
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1.≡
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          "
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-black/10" />
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={handleSetLink}>
          🔗
        </ToolbarButton>
        <label
          title="Image"
          className="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded px-1.5 text-sm text-masaar-black/70 hover:bg-black/5"
        >
          🖼
          <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        </label>
        <ToolbarButton label="Video" onClick={handleAddVideo}>
          ▶
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-black/10" />
        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          ↺
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          ↻
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

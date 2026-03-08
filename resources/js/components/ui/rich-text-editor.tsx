import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Heading2, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

function ToolbarButton({
    onClick,
    isActive,
    children,
    title,
}: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={cn(
                'inline-flex items-center justify-center rounded p-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
                isActive && 'bg-accent text-accent-foreground',
            )}
        >
            {children}
        </button>
    );
}

function Toolbar({ editor }: { editor: Editor }) {
    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1.5">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
                <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
                <Italic className="h-4 w-4" />
            </ToolbarButton>
            <div className="mx-1 h-5 w-px bg-border" />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Heading"
            >
                <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
            >
                <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Ordered List"
            >
                <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="Blockquote"
            >
                <Quote className="h-4 w-4" />
            </ToolbarButton>
            <div className="mx-1 h-5 w-px bg-border" />
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
                <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
                <Redo className="h-4 w-4" />
            </ToolbarButton>
        </div>
    );
}

export default function RichTextEditor({ content, onChange, placeholder = 'Write something...', className }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Sync external content changes (e.g. when switching tabs)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className={cn('rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring', className)}>
            <Toolbar editor={editor} />
            <EditorContent
                editor={editor}
                className="prose prose-sm dark:prose-invert max-w-none px-3 py-2 min-h-[120px] focus:outline-none [&_.tiptap]:outline-none [&_.tiptap.ProseMirror]:min-h-[100px] [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:h-0"
            />
        </div>
    );
}

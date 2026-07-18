"use client";

import { useMemo } from "react";
import JoditEditor from "jodit-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
}: Props) {
  const config = useMemo(
    () => ({
      readonly: false,
      height: 500,
      placeholder: "Write your content here...",

      toolbarAdaptive: false,

      controls: {
        format: {
            list: {
            p: "Paragraph",
            h1: "Heading 1",
            h2: "Heading 2",
            h3: "Heading 3",
            h4: "Heading 4",
            h5: "Heading 5",
            h6: "Heading 6",
            blockquote: "Blockquote",
            pre: "Code",
            },
        },
      },
        
      buttons: [
        "source",
        "|",
        "format",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "ul",
        "ol",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "image",
        "table",
        "link",
        "|",
        "align",
        "undo",
        "redo",
        "|",
        "hr",
        "eraser",
        "copyformat",
        "|",
        "fullsize",
        "print",
        "preview"
      ],
    }),
    []
  );

  return (
    <JoditEditor
      value={value}
      config={config}
      onBlur={onChange}
    />
  );
}
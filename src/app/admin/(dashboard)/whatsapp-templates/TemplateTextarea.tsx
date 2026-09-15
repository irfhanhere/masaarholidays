"use client";

import { useState } from "react";
import { inputClass } from "@/components/admin/ui";

/** Plain <textarea name=...> so it still submits via the surrounding server-action <form> — this only adds a live character count on top. */
export function TemplateTextarea({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div>
      <textarea
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        className={inputClass}
      />
      <p className="mt-1 text-right text-xs text-masaar-black/40">{value.length} characters</p>
    </div>
  );
}

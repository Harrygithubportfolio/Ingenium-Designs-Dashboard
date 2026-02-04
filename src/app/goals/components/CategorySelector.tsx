"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Category } from "../utils/goalTypes";

export default function CategorySelector({
  categoryId,
  setCategoryId,
}: {
  categoryId: string | null;
  setCategoryId: (id: string | null) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("categories").select("*");
      if (data) setCategories(data);
    };
    load();
  }, []);

  return (
    <div>
      <label className="text-sm text-gray-300">Category</label>
      <select
        title="Goal category"
        className="w-full mt-1 p-2 rounded bg-[#111118] border border-[#2a2a33] text-white"
        value={categoryId || ""}
        onChange={(e) =>
          setCategoryId(e.target.value === "" ? null : e.target.value)
        }
      >
        <option value="">No category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
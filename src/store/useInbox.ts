import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { InboxItem, InboxItemInput, InboxRouteTarget } from '@/lib/inbox/types';

interface InboxState {
  items: InboxItem[];
  unprocessedCount: number;
  loading: boolean;

  fetchItems: (unprocessedOnly?: boolean) => Promise<void>;
  addItem: (input: InboxItemInput) => Promise<void>;
  processItem: (id: string, routedTo: InboxRouteTarget, routedId?: string) => Promise<void>;
  archiveItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInbox = create<InboxState>((set, get) => ({
  items: [],
  unprocessedCount: 0,
  loading: false,

  fetchItems: async (unprocessedOnly = false) => {
    set({ loading: true });
    const supabase = createClient();
    let query = supabase
      .from('inbox_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (unprocessedOnly) {
      query = query.eq('is_processed', false);
    }

    const { data, error } = await query;
    if (error) {
      console.error('fetchItems error:', error);
    } else if (data) {
      set({ items: data });
      set({ unprocessedCount: data.filter((i: InboxItem) => !i.is_processed).length });
    }
    set({ loading: false });
  },

  addItem: async (input) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('inbox_items').insert({
      content: input.content,
      item_type: input.item_type || 'thought',
      user_id: user.id,
    });
    if (error) {
      console.error('addItem error:', error);
      return;
    }
    await get().fetchItems();
  },

  processItem: async (id, routedTo, routedId) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('inbox_items')
      .update({
        is_processed: true,
        processed_at: new Date().toISOString(),
        routed_to: routedTo,
        routed_id: routedId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) {
      console.error('processItem error:', error);
      return;
    }
    await get().fetchItems();
  },

  archiveItem: async (id) => {
    await get().processItem(id, 'archived');
  },

  deleteItem: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from('inbox_items').delete().eq('id', id);
    if (error) {
      console.error('deleteItem error:', error);
      return;
    }
    await get().fetchItems();
  },
}));

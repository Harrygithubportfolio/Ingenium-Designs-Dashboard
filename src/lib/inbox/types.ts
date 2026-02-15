export type InboxItemType = 'thought' | 'task' | 'link' | 'idea';
export type InboxRouteTarget = 'goal' | 'calendar' | 'archived' | 'habit' | 'finance';

export interface InboxItem {
  id: string;
  user_id: string;
  content: string;
  item_type: InboxItemType;
  is_processed: boolean;
  processed_at: string | null;
  routed_to: InboxRouteTarget | null;
  routed_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InboxItemInput {
  content: string;
  item_type?: InboxItemType;
}

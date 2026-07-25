-- Wishlist detail features (notes, event context, item updates)

alter table shortlist_items add column if not exists note text;
alter table shortlists add column if not exists event_date date;
alter table shortlists add column if not exists guest_count integer;

drop policy if exists "Planners can update their shortlist items" on shortlist_items;
create policy "Planners can update their shortlist items"
  on shortlist_items for update
  using (
    auth.uid() = (select planner_id from shortlists where id = shortlist_id)
  )
  with check (
    auth.uid() = (select planner_id from shortlists where id = shortlist_id)
  );

-- =====================================================================
-- KIỂM DUYỆT BÀI ĐĂNG (chạy SAU file cai-dat.sql, chạy một lần; chạy lại cũng không sao)
-- - Bài mới (chủ đề và câu trả lời) ở trạng thái "chờ duyệt" (approved = false).
-- - Bài chờ duyệt chỉ tác giả và quản trị viên nhìn thấy.
-- - Quản trị viên bấm "Duyệt" thì bài mới hiện cho mọi người; "Từ chối" = xóa bài.
-- - Bài do quản trị viên đăng được duyệt luôn.
-- =====================================================================

alter table public.topics  add column if not exists approved boolean not null default false;
alter table public.replies add column if not exists approved boolean not null default false;
create index if not exists topics_pending_idx  on public.topics  (created_at) where not approved;
create index if not exists replies_pending_idx on public.replies (created_at) where not approved;

-- Bài đăng trước khi có kiểm duyệt: coi như đã duyệt (chỉ chạy lần đầu, khi chưa có bài nào được duyệt)
do $$ begin
  if not exists (select 1 from public.topics where approved) and not exists (select 1 from public.replies where approved) then
    update public.topics set approved = true; update public.replies set approved = true;
  end if;
end $$;

-- Khi đăng: ai cũng vào hàng chờ, trừ quản trị viên
create or replace function public.before_post() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Bạn cần đăng nhập để đăng bài.'; end if;
  if exists (select 1 from public.topics  where author_id = auth.uid() and created_at > now() - interval '20 seconds')
  or exists (select 1 from public.replies where author_id = auth.uid() and created_at > now() - interval '20 seconds') then
    raise exception 'Bạn đăng hơi nhanh, hãy đợi 20 giây rồi thử lại.';
  end if;
  new.author_id := auth.uid();
  new.created_at := now();
  new.approved := public.is_admin();
  if tg_table_name = 'topics' then new.reply_count := 0; new.last_reply_at := now(); end if;
  return new;
end $$;

-- Số trả lời và "trả lời mới nhất" chỉ tính câu trả lời ĐÃ DUYỆT
create or replace function public.after_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.approved then
    update public.topics set reply_count = reply_count + 1, last_reply_at = new.created_at where id = new.topic_id;
  elsif tg_op = 'UPDATE' and new.approved and not old.approved then
    update public.topics set reply_count = reply_count + 1, last_reply_at = greatest(last_reply_at, now()) where id = new.topic_id;
  elsif tg_op = 'DELETE' and old.approved then
    update public.topics set reply_count = greatest(reply_count - 1, 0) where id = old.topic_id;
  end if;
  return null;
end $$;
drop trigger if exists replies_after_change on public.replies;
create trigger replies_after_change after insert or delete or update of approved on public.replies
  for each row execute function public.after_reply();

-- Chủ đề vừa được duyệt thì đưa lên đầu danh sách
create or replace function public.on_topic_approved() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.approved and not old.approved then new.last_reply_at := now(); end if;
  return new;
end $$;
drop trigger if exists topics_on_approve on public.topics;
create trigger topics_on_approve before update of approved on public.topics
  for each row execute function public.on_topic_approved();

-- Quyền đọc: bài đã duyệt cho mọi người; bài chờ duyệt cho tác giả và quản trị viên
drop policy if exists "doc chu de" on public.topics;
create policy "doc chu de" on public.topics for select using (approved or author_id = auth.uid() or public.is_admin());
drop policy if exists "doc tra loi" on public.replies;
create policy "doc tra loi" on public.replies for select using (approved or author_id = auth.uid() or public.is_admin());

-- Quyền duyệt: chỉ quản trị viên, và chỉ được đổi đúng cột approved
drop policy if exists "duyet chu de" on public.topics;
create policy "duyet chu de" on public.topics for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "duyet tra loi" on public.replies;
create policy "duyet tra loi" on public.replies for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke update on public.topics, public.replies from anon, authenticated;
grant update (approved) on public.topics, public.replies to authenticated;

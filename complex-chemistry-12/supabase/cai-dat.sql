-- =====================================================================
-- COMPLEX CHEMISTRY 12 – CƠ SỞ DỮ LIỆU CHO ĐĂNG NHẬP + DIỄN ĐÀN (Supabase)
-- Cách dùng: Supabase → dự án của bạn → SQL Editor → New query →
--            dán TOÀN BỘ file này → bấm Run. Chỉ cần chạy một lần.
--
-- Bảo mật: web dùng "publishable/anon key" (công khai). Mọi quyền được
-- khóa bằng Row Level Security (RLS) bên dưới:
--   - Ai cũng ĐỌC được chủ đề, trả lời và tên hiển thị.
--   - Chỉ người đã đăng nhập mới ĐĂNG bài, và chỉ đăng dưới tên chính mình.
--   - Chỉ tác giả hoặc quản trị viên mới XÓA được bài.
--   - Không ai sửa được bài (tránh sửa nội dung sau khi người khác đã trả lời).
--   - Mỗi người phải chờ 20 giây giữa hai lần đăng (chống spam).
-- =====================================================================

-- ---------- 1. Hồ sơ người dùng (tên hiển thị, quyền quản trị) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tự tạo hồ sơ khi có người đăng ký (tên lấy từ ô "Tên hiển thị" của web)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n text := left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 40);
begin
  if char_length(n) < 2 then n := 'Thành viên'; end if;
  insert into public.profiles (id, display_name) values (new.id, n);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------- 2. Chủ đề và trả lời ----------
create table if not exists public.topics (
  id bigint generated always as identity primary key,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category text not null default 'hoi-dap' check (category in ('hoi-dap', 'bai-tap', 'gop-y', 'khac')),
  title text not null check (char_length(trim(title)) between 5 and 150),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  reply_count integer not null default 0,
  created_at timestamptz not null default now(),
  last_reply_at timestamptz not null default now()
);
create index if not exists topics_last_reply_idx on public.topics (last_reply_at desc);

create table if not exists public.replies (
  id bigint generated always as identity primary key,
  topic_id bigint not null references public.topics (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists replies_topic_idx on public.replies (topic_id, created_at);

-- Trước khi lưu bài: ép đúng tác giả + thời gian, và chặn đăng liên tục
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
  if tg_table_name = 'topics' then new.reply_count := 0; new.last_reply_at := now(); end if;
  return new;
end $$;
drop trigger if exists topics_before_insert on public.topics;
create trigger topics_before_insert before insert on public.topics for each row execute function public.before_post();
drop trigger if exists replies_before_insert on public.replies;
create trigger replies_before_insert before insert on public.replies for each row execute function public.before_post();

-- Cập nhật số trả lời và thời điểm trả lời mới nhất của chủ đề
create or replace function public.after_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.topics set reply_count = reply_count + 1, last_reply_at = new.created_at where id = new.topic_id;
  else
    update public.topics set reply_count = greatest(reply_count - 1, 0) where id = old.topic_id;
  end if;
  return null;
end $$;
drop trigger if exists replies_after_change on public.replies;
create trigger replies_after_change after insert or delete on public.replies for each row execute function public.after_reply();

-- ---------- 3. Quyền (Row Level Security) ----------
alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.replies enable row level security;

drop policy if exists "doc ho so" on public.profiles;
create policy "doc ho so" on public.profiles for select using (true);
drop policy if exists "sua ten minh" on public.profiles;
create policy "sua ten minh" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- chỉ được sửa cột tên hiển thị, không tự phong mình làm quản trị viên
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

drop policy if exists "doc chu de" on public.topics;
create policy "doc chu de" on public.topics for select using (true);
drop policy if exists "dang chu de" on public.topics;
create policy "dang chu de" on public.topics for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "xoa chu de" on public.topics;
create policy "xoa chu de" on public.topics for delete to authenticated using (author_id = auth.uid() or public.is_admin());

drop policy if exists "doc tra loi" on public.replies;
create policy "doc tra loi" on public.replies for select using (true);
drop policy if exists "dang tra loi" on public.replies;
create policy "dang tra loi" on public.replies for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "xoa tra loi" on public.replies;
create policy "xoa tra loi" on public.replies for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- ---------- 4. Phong quản trị viên (chạy riêng SAU KHI bạn đã đăng ký tài khoản trên web) ----------
-- Bỏ hai dấu -- ở đầu dòng dưới, thay email của bạn rồi Run:
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = 'email-cua-ban@gmail.com');

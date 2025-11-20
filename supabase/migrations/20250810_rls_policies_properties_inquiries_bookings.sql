-- RLS policies for core app tables. Adjust column names if your schema differs.

-- Properties
alter table if exists public.properties enable row level security;

do $$
begin
	if exists (
		select 1 from information_schema.columns 
		where table_schema='public' and table_name='properties' and column_name='owner_id'
	) then
		begin
			create policy insert_own_properties on public.properties for insert to authenticated with check (owner_id = auth.uid());
		exception when duplicate_object then null; end;

		begin
			create policy select_properties on public.properties for select using (true);
		exception when duplicate_object then null; end;

		begin
			create policy update_own_properties on public.properties for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
		exception when duplicate_object then null; end;

		begin
			create policy delete_own_properties on public.properties for delete to authenticated using (owner_id = auth.uid());
		exception when duplicate_object then null; end;
	end if;
end $$;

-- Inquiries
alter table if exists public.inquiries enable row level security;

do $$
begin
	if exists (
		select 1 from information_schema.columns 
		where table_schema='public' and table_name='inquiries' and column_name='user_id'
	) then
		begin
			create policy insert_own_inquiries on public.inquiries for insert to authenticated with check (user_id = auth.uid());
		exception when duplicate_object then null; end;

		begin
			create policy select_own_inquiries on public.inquiries for select to authenticated using (user_id = auth.uid());
		exception when duplicate_object then null; end;
	end if;
end $$;

-- Bookings
alter table if exists public.bookings enable row level security;

do $$
begin
	if exists (
		select 1 from information_schema.columns 
		where table_schema='public' and table_name='bookings' and column_name='user_id'
	) then
		begin
			create policy insert_own_bookings on public.bookings for insert to authenticated with check (user_id = auth.uid());
		exception when duplicate_object then null; end;

		begin
			create policy select_own_bookings on public.bookings for select to authenticated using (user_id = auth.uid());
		exception when duplicate_object then null; end;
	end if;
end $$;

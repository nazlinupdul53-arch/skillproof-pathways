drop policy if exists "comp read" on public.competencies;
create policy "comp read signed in" on public.competencies for select to authenticated using (auth.uid() is not null);
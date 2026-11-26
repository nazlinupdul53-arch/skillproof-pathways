
create type public.app_role as enum ('admin','user');
create type public.qual_status as enum ('submitted','under_review','info_requested','review_complete','referred','withdrawn');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  country_of_origin text default '',
  current_country text default '',
  profession text default '',
  phone text default '',
  bio text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.qualifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  institution text not null,
  country text not null,
  field text not null default '',
  level text not null default 'Bachelor',
  year_completed int,
  target_country text not null default 'Australia',
  target_occupation text not null default '',
  notes text default '',
  status qual_status not null default 'submitted',
  reviewer_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.qualifications to authenticated;
grant all on public.qualifications to service_role;
alter table public.qualifications enable row level security;
create policy "quals read" on public.qualifications for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "quals insert" on public.qualifications for insert to authenticated with check (user_id = auth.uid());
create policy "quals update" on public.qualifications for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "quals delete" on public.qualifications for delete to authenticated using (user_id = auth.uid());

create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  qualification_id uuid not null references public.qualifications(id) on delete cascade,
  status qual_status not null,
  note text default '',
  changed_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.status_history to authenticated;
grant all on public.status_history to service_role;
alter table public.status_history enable row level security;
create policy "history read" on public.status_history for select to authenticated using (
  exists (select 1 from public.qualifications q where q.id = qualification_id and (q.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create or replace function public.qual_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'submitted'; new.reviewer_notes := '';
    return new;
  end if;
  if not public.has_role(auth.uid(),'admin') then
    if new.reviewer_notes is distinct from old.reviewer_notes then raise exception 'Only reviewers can edit reviewer notes'; end if;
    if new.status is distinct from old.status and not (new.status = 'withdrawn') and not (old.status = 'info_requested' and new.status = 'submitted') then
      raise exception 'Only reviewers can change this status';
    end if;
  end if;
  new.updated_at := now();
  return new;
end; $$;
create trigger qual_guard_trg before insert or update on public.qualifications for each row execute function public.qual_guard();

create or replace function public.qual_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.status_history (qualification_id, status, note, changed_by) values (new.id, new.status, 'Submission received', auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.status_history (qualification_id, status, note, changed_by) values (new.id, new.status, coalesce(new.reviewer_notes,''), auth.uid());
  end if;
  return new;
end; $$;
create trigger qual_history_trg after insert or update on public.qualifications for each row execute function public.qual_history();

create table public.qualification_documents (
  id uuid primary key default gen_random_uuid(),
  qualification_id uuid not null references public.qualifications(id) on delete cascade,
  user_id uuid not null,
  doc_type text not null default 'Certificate',
  file_name text not null,
  file_path text not null,
  file_size int default 0,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.qualification_documents to authenticated;
grant all on public.qualification_documents to service_role;
alter table public.qualification_documents enable row level security;
create policy "docs read" on public.qualification_documents for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "docs insert" on public.qualification_documents for insert to authenticated with check (user_id = auth.uid());
create policy "docs delete" on public.qualification_documents for delete to authenticated using (user_id = auth.uid());

create table public.competencies (
  id uuid primary key default gen_random_uuid(),
  occupation text not null,
  area text not null,
  description text not null,
  sort int not null default 0
);
grant select on public.competencies to authenticated;
grant all on public.competencies to service_role;
alter table public.competencies enable row level security;
create policy "comp read" on public.competencies for select to authenticated using (true);

create table public.skill_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  competency_id uuid not null references public.competencies(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  years_experience numeric not null default 0,
  evidence text default '',
  updated_at timestamptz not null default now(),
  unique (user_id, competency_id)
);
grant select, insert, update, delete on public.skill_assessments to authenticated;
grant all on public.skill_assessments to service_role;
alter table public.skill_assessments enable row level security;
create policy "assess read" on public.skill_assessments for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "assess insert" on public.skill_assessments for insert to authenticated with check (user_id = auth.uid());
create policy "assess update" on public.skill_assessments for update to authenticated using (user_id = auth.uid());
create policy "assess delete" on public.skill_assessments for delete to authenticated using (user_id = auth.uid());

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider text not null,
  occupation text not null,
  course_type text not null,
  competency_area text,
  delivery text not null,
  duration_weeks int not null,
  cost_estimate text not null,
  country text not null,
  description text not null
);
grant select on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy "courses read" on public.courses for select to authenticated using (true);

-- storage policies
create policy "cred owner read" on storage.objects for select to authenticated using (bucket_id = 'credentials' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
create policy "cred owner insert" on storage.objects for insert to authenticated with check (bucket_id = 'credentials' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cred owner delete" on storage.objects for delete to authenticated using (bucket_id = 'credentials' and (storage.foldername(name))[1] = auth.uid()::text);

-- seed competencies
insert into public.competencies (occupation, area, description, sort) values
('Registered Nurse','Clinical assessment','Conduct comprehensive patient assessments and interpret vital signs',1),
('Registered Nurse','Medication management','Safely calculate, administer and document medications',2),
('Registered Nurse','Local regulatory practice','Apply local nursing codes of conduct, consent and documentation standards',3),
('Registered Nurse','Communication & cultural safety','Communicate effectively with patients, families and multidisciplinary teams',4),
('Registered Nurse','Infection control','Apply infection prevention and control procedures',5),
('Civil Engineer','Structural design','Design structures to local building codes and standards',1),
('Civil Engineer','Project management','Plan, schedule and budget engineering projects',2),
('Civil Engineer','Local standards & compliance','Apply local engineering standards, WHS and environmental regulations',3),
('Civil Engineer','CAD & modelling','Use CAD/BIM tools to produce technical drawings',4),
('Civil Engineer','Professional communication','Prepare technical reports and present to stakeholders',5),
('Software Developer','Programming fundamentals','Write maintainable, tested code in a modern language',1),
('Software Developer','System design','Design scalable systems and APIs',2),
('Software Developer','Security & privacy','Apply secure coding and local privacy law requirements',3),
('Software Developer','Agile delivery','Work in agile teams using version control and CI/CD',4),
('Software Developer','Workplace communication','Collaborate and document in a local workplace context',5),
('Accountant','Financial reporting','Prepare financial statements under local accounting standards',1),
('Accountant','Taxation','Apply local tax law for individuals and businesses',2),
('Accountant','Audit & assurance','Plan and perform audit procedures',3),
('Accountant','Accounting software','Use common local accounting and payroll systems',4),
('Accountant','Ethics & professional standards','Apply local professional and ethical standards',5),
('Teacher','Curriculum knowledge','Plan lessons aligned with the local curriculum',1),
('Teacher','Classroom management','Create safe, inclusive learning environments',2),
('Teacher','Assessment & reporting','Design assessments and report on student progress',3),
('Teacher','Child safety & legislation','Apply child protection and local education law',4),
('Teacher','Communication with families','Engage parents and communities effectively',5);

insert into public.courses (title, provider, occupation, course_type, competency_area, delivery, duration_weeks, cost_estimate, country, description) values
('Bridging Program for Internationally Qualified Nurses','Metro Health University','Registered Nurse','Bridging','Local regulatory practice','Blended',12,'AUD 9,500 – 12,000','Australia','Covers local nursing standards, clinical placements and documentation practice for overseas-qualified nurses.'),
('Medication Safety & Pharmacology Refresher','Northbridge Institute of Health','Registered Nurse','Re-certification','Medication management','Online',6,'AUD 850','Australia','Self-paced refresher on dosage calculation and safe administration.'),
('Cultural Safety in Healthcare','First Nations Health Academy','Registered Nurse','Short course','Communication & cultural safety','Online',4,'AUD 320','Australia','Foundations of culturally safe care and communication.'),
('Objective Structured Clinical Examination (OSCE) Prep','ClinPrep Centre','Registered Nurse','Exam preparation','Clinical assessment','In person',3,'AUD 1,400','Australia','Simulated clinical stations with feedback.'),
('Infection Prevention & Control Certificate','Public Health Training College','Registered Nurse','Re-certification','Infection control','Online',2,'AUD 180','Australia','Current IPC practice and hand hygiene audit.'),
('Australian Standards for Structural Engineers','Institute of Engineering Practice','Civil Engineer','Bridging','Local standards & compliance','Blended',10,'AUD 3,200','Australia','Loading codes, concrete and steel standards for overseas engineers.'),
('Construction WHS Induction (White Card)','SafeBuild Training','Civil Engineer','Licence','Local standards & compliance','In person',1,'AUD 90','Australia','Mandatory general construction safety induction.'),
('BIM & Revit for Engineers','Digital Build Academy','Civil Engineer','Short course','CAD & modelling','Online',8,'AUD 1,100','Australia','Hands-on BIM workflow using Revit and Navisworks.'),
('Engineering Project Management','Southern Tech University','Civil Engineer','Short course','Project management','Online',12,'AUD 2,400','Australia','Scheduling, cost control and contracts in local projects.'),
('Technical Writing for Engineers','Professional English Institute','Civil Engineer','Short course','Professional communication','Online',4,'AUD 450','Australia','Report writing and the competency demonstration report.'),
('Secure Coding & Privacy Act Essentials','CyberSkills Hub','Software Developer','Short course','Security & privacy','Online',4,'AUD 600','Australia','OWASP Top 10 and local privacy principles.'),
('Cloud Architecture Bootcamp','TechForward Academy','Software Developer','Re-certification','System design','Blended',8,'AUD 2,900','Australia','Design and deploy scalable cloud systems.'),
('Agile & Scrum Practitioner','Agile Works','Software Developer','Certification','Agile delivery','Online',2,'AUD 750','Australia','Scrum roles, ceremonies and continuous delivery.'),
('Workplace Communication for Tech Professionals','Migrant Careers Network','Software Developer','Short course','Workplace communication','Online',6,'Free (government funded)','Australia','Workplace culture, stand-ups and documentation.'),
('Australian Taxation Law Bridging','National Accounting College','Accountant','Bridging','Taxation','Online',14,'AUD 3,800','Australia','Income tax, GST and FBT for overseas-qualified accountants.'),
('Australian Accounting Standards (AASB) Update','Chartered Learning','Accountant','Re-certification','Financial reporting','Online',6,'AUD 1,200','Australia','Reporting under local standards and IFRS differences.'),
('Xero & MYOB Payroll Certification','Ledger Skills','Accountant','Certification','Accounting software','Online',3,'AUD 280','Australia','Practical certification in local accounting software.'),
('Professional Ethics for Accountants','Chartered Learning','Accountant','Short course','Ethics & professional standards','Online',2,'AUD 220','Australia','Ethical frameworks and professional conduct.'),
('Teaching in Australian Schools Bridging Course','Eastern Education University','Teacher','Bridging','Curriculum knowledge','Blended',16,'AUD 6,000','Australia','Curriculum, pedagogy and supervised classroom practice.'),
('Child Protection Awareness Training','Department-approved Provider','Teacher','Licence','Child safety & legislation','Online',1,'Free','Australia','Mandatory reporting and child-safe standards.'),
('Inclusive Classroom Management','Teach Better Institute','Teacher','Short course','Classroom management','Online',5,'AUD 390','Australia','Behaviour support and inclusive practice.'),
('Assessment & Reporting Practice','Eastern Education University','Teacher','Short course','Assessment & reporting','Online',4,'AUD 450','Australia','Moderation, rubrics and reporting to families.'),
('Occupational English Test (OET) Preparation','Language Pathways','Registered Nurse','Exam preparation','Communication & cultural safety','Online',8,'AUD 600','Australia','Prepare for the English test accepted by health regulators.');

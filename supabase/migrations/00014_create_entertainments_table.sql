-- Create entertainments table for CBT resources and therapeutic content
create table public.entertainments (
  id serial not null,
  title character varying(255) not null,
  type character varying(100) not null,
  description text null,
  cover_img_url text null,
  media_file_url text null,
  category character varying(255) not null,
  mood_states text[] not null default '{}',
  status character varying(50) not null default 'active',
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint entertainments_pkey primary key (id),
  constraint entertainments_type_check check (
    type = any (array['Video'::text, 'Audio'::text])
  ),
  constraint entertainments_status_check check (
    status = any (array['active'::text, 'inactive'::text])
  ),
  constraint entertainments_category_check check (
    category = any (array[
      'Breathing Exercises'::text,
      'Progressive Muscle Relaxation'::text,
      'Guided Mindfulness Meditation'::text,
      'Guided Visualization'::text,
      'Yoga/Stretching for Stress Relief'::text,
      'Grounding Techniques'::text,
      'Calming Music'::text,
      'Binaural Beats'::text,
      'Guided Sleep Meditations'::text,
      'White/Brown Noise'::text,
      'Positive Affirmations Audio'::text
    ])
  )
) TABLESPACE pg_default;

-- Explicitly disable RLS (optional, as it's disabled by default)
alter table public.entertainments disable row level security;

-- Create updated_at trigger for entertainments
create trigger handle_entertainments_updated_at
  before update on public.entertainments
  for each row
  execute procedure public.handle_updated_at();
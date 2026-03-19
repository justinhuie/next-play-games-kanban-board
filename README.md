# Kanban Board

A fully-featured Kanban-style task board built with React, TypeScript, and Supabase. Inspired by tools like Asana and Linear.

## Live Demo

[https://next-play-games-kanban-board.vercel.app](https://next-play-games-kanban-board.vercel.app)

## Features

- Drag-and-drop tasks between columns (To Do, In Progress, In Review, Done)
- Drag-and-drop reordering within columns
- Guest accounts via Supabase anonymous auth (no sign-up required)
- Row Level Security — each user only sees their own tasks
- Create tasks with title, description, priority, and due date
- Due date indicators with urgency color coding
- Team members & assignee avatars on task cards
- Custom labels / tags per task
- Task comments with timestamps
- Activity log tracking status changes
- Search and filter by priority, assignee, and label
- Board summary stats (total, done, overdue)
- Confetti animation on task completion
- Mobile-friendly with horizontal swipe between columns

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite
- **Backend:** Supabase (PostgreSQL + Auth)
- **Drag and Drop:** @dnd-kit/core, @dnd-kit/sortable
- **Hosting:** Vercel

## Local Setup

### Prerequisites

- Node.js 18+
- A Supabase project with the schema below applied

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/justinhuie/next-play-games-kanban-board.git
   cd next-play-games-kanban-board
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Create a `.env.local` file in the root directory:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Supabase Setup

### Enable Anonymous Sign-ins

In your Supabase dashboard go to **Authentication → Sign In / Up** and enable **Allow anonymous sign-ins**.

### Database Schema

Run the following SQL in the Supabase SQL editor:

```sql
-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'normal',
  due_date date,
  position integer not null default 0,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Team members
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  user_id uuid references auth.users not null,
  created_at timestamptz default now()
);

-- Task assignees
create table task_assignees (
  task_id uuid references tasks on delete cascade,
  member_id uuid references team_members on delete cascade,
  primary key (task_id, member_id)
);

-- Labels
create table labels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  user_id uuid references auth.users not null
);

-- Task labels
create table task_labels (
  task_id uuid references tasks on delete cascade,
  label_id uuid references labels on delete cascade,
  primary key (task_id, label_id)
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks on delete cascade,
  user_id uuid references auth.users not null,
  content text not null,
  created_at timestamptz default now()
);

-- Activity log
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks on delete cascade,
  user_id uuid references auth.users not null,
  action text not null,
  old_value text,
  new_value text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table tasks enable row level security;
alter table team_members enable row level security;
alter table task_assignees enable row level security;
alter table labels enable row level security;
alter table task_labels enable row level security;
alter table comments enable row level security;
alter table activity_log enable row level security;

-- RLS Policies
create policy "Users own their tasks" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own their comments" on comments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own their activity" on activity_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own their labels" on labels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their task labels" on task_labels
  for all using (
    exists (select 1 from tasks where tasks.id = task_labels.task_id and tasks.user_id = auth.uid())
  );

create policy "Users own their team members" on team_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their task assignees" on task_assignees
  for all using (
    exists (select 1 from tasks where tasks.id = task_assignees.task_id and tasks.user_id = auth.uid())
  );
```

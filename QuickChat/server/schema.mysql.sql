-- Optional manual MySQL schema.
-- Preferred: use Prisma migration (`npm run prisma:migrate`).

create table if not exists users (
  id char(36) primary key,
  display_name varchar(191) not null,
  email varchar(191) not null unique,
  avatar_key varchar(191) null,
  bio text null,
  password_hash varchar(191) null,
  created_at datetime(3) not null default current_timestamp(3)
);

create table if not exists conversations (
  id char(36) primary key,
  user_a char(36) not null,
  user_b char(36) not null,
  created_at datetime(3) not null default current_timestamp(3),
  unique key conversations_user_a_user_b_key (user_a, user_b),
  constraint conversations_user_a_fkey foreign key (user_a) references users(id) on delete cascade,
  constraint conversations_user_b_fkey foreign key (user_b) references users(id) on delete cascade
);

create table if not exists messages (
  id char(36) primary key,
  conversation_id char(36) not null,
  sender_id char(36) not null,
  text text null,
  image_url text null,
  created_at datetime(3) not null default current_timestamp(3),
  constraint messages_conversation_id_fkey foreign key (conversation_id) references conversations(id) on delete cascade,
  constraint messages_sender_id_fkey foreign key (sender_id) references users(id) on delete cascade
);

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const rawUrl = 'postgresql://neondb_owner:npg_IcvsedoJ4fY6@ep-muddy-hill-b5ainoe0-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const cleanUrl = rawUrl.replace(/([&?])channel_binding=require(&|$)/, '$1').replace(/\?$/, '').replace(/&$/, '');
const sql = neon(cleanUrl);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function migrateAndSeed() {
  console.log('--- 1. Executing DDL Schema ---');

  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;

  // 1. users
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(64) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL DEFAULT '',
      job_title VARCHAR(150),
      bio TEXT,
      phone VARCHAR(50),
      age INTEGER,
      avatar_url TEXT,
      avatar_color VARCHAR(32) DEFAULT 'blue',
      account_type VARCHAR(32) NOT NULL DEFAULT 'MEMBER',
      access_level VARCHAR(32) NOT NULL DEFAULT 'USER',
      can_chat BOOLEAN NOT NULL DEFAULT TRUE,
      is_immutable_admin BOOLEAN NOT NULL DEFAULT FALSE,
      is_online BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ users table created/verified');

  // 2. conversations
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pinned_message_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_conversation_pair UNIQUE (user_one_id, user_two_id),
      CONSTRAINT chk_ordered_pair CHECK (user_one_id < user_two_id)
    );
  `;
  console.log('✓ conversations table created/verified');

  // 3. messages
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL DEFAULT '',
      text_color VARCHAR(16) NOT NULL DEFAULT '#111827',
      font_size VARCHAR(8) NOT NULL DEFAULT 'M',
      sticker_id VARCHAR(128),
      is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
      ON messages(conversation_id, created_at ASC);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_created_at
      ON messages(created_at ASC);
  `;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_conversations_pinned_message'
      ) THEN
        ALTER TABLE conversations
        ADD CONSTRAINT fk_conversations_pinned_message
        FOREIGN KEY (pinned_message_id) REFERENCES messages(id)
        ON DELETE SET NULL;
      END IF;
    END $$;
  `;
  console.log('✓ messages table created/verified with rolling 90-day retention index and pinned FK');

  // 4. message_reactions
  await sql`
    CREATE TABLE IF NOT EXISTS message_reactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji VARCHAR(32) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (message_id, user_id, emoji)
    );
  `;
  console.log('✓ message_reactions table created/verified');

  // 5. user_contacts
  await sql`
    CREATE TABLE IF NOT EXISTS user_contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      custom_nickname VARCHAR(100),
      chat_bg_color VARCHAR(16) NOT NULL DEFAULT '#FFFFFF',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (owner_user_id, contact_user_id)
    );
  `;
  console.log('✓ user_contacts table created/verified');

  // 6. schedules
  await sql`
    CREATE TABLE IF NOT EXISTS schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      auto_message TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      is_triggered BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ schedules table created/verified');

  console.log('\n--- 2. Seeding Initial 3 Real Accounts ---');
  // Default password hash for password123
  const defaultHash = hashPassword('password123');

  // Account 1: Hushadmin
  const adminRows = await sql`
    INSERT INTO users (
      username, password_hash, first_name, last_name, job_title, bio,
      phone, age, avatar_color, account_type, access_level, can_chat, is_immutable_admin, is_online
    ) VALUES (
      'Hushadmin',
      ${defaultHash},
      'Hush',
      'Admin',
      'System Administrator',
      'Protected Sole System Administrator. Immutability enforced: cannot be edited or deleted.',
      '+66 2 000 0001',
      35,
      'black',
      'SYSTEM_ADMIN',
      'ADMIN_ONLY',
      false,
      true,
      true
    )
    ON CONFLICT (username) DO UPDATE SET
      account_type = 'SYSTEM_ADMIN',
      access_level = 'ADMIN_ONLY',
      can_chat = false,
      is_immutable_admin = true
    RETURNING id, username, account_type, access_level, can_chat;
  `;
  const adminUser = adminRows[0];
  console.log('✓ Seeded Hushadmin:', adminUser);

  // Account 2: New010
  const newRows = await sql`
    INSERT INTO users (
      username, password_hash, first_name, last_name, job_title, bio,
      phone, age, avatar_color, account_type, access_level, can_chat, is_immutable_admin, is_online
    ) VALUES (
      'New010',
      ${defaultHash},
      'Nithi',
      'B.',
      'Software Engineer & Co-Owner',
      'HusH Core Developer. Full access permissions.',
      '+66 81 234 5678',
      28,
      'blue',
      'MEMBER',
      'FULL_ACCESS',
      true,
      false,
      true
    )
    ON CONFLICT (username) DO UPDATE SET
      account_type = 'MEMBER',
      access_level = 'FULL_ACCESS',
      can_chat = true
    RETURNING id, username, account_type, access_level, can_chat;
  `;
  const newUser = newRows[0];
  console.log('✓ Seeded New010:', newUser);

  // Account 3: Fernrs
  const fernRows = await sql`
    INSERT INTO users (
      username, password_hash, first_name, last_name, job_title, bio,
      phone, age, avatar_color, account_type, access_level, can_chat, is_immutable_admin, is_online
    ) VALUES (
      'Fernrs',
      ${defaultHash},
      'Fern',
      'RS',
      'Product Specialist',
      'HusH Member. Standard user tier.',
      '+66 89 876 5432',
      26,
      'pink',
      'MEMBER',
      'USER',
      true,
      false,
      true
    )
    ON CONFLICT (username) DO UPDATE SET
      account_type = 'MEMBER',
      access_level = 'USER',
      can_chat = true
    RETURNING id, username, account_type, access_level, can_chat;
  `;
  const fernUser = fernRows[0];
  console.log('✓ Seeded Fernrs:', fernUser);

  console.log('\n--- 3. Seeding Mutual Contacts Between New010 and Fernrs ---');
  await sql`
    INSERT INTO user_contacts (owner_user_id, contact_user_id, custom_nickname, chat_bg_color)
    VALUES (${newUser.id}, ${fernUser.id}, 'Fern', '#FFFFFF')
    ON CONFLICT (owner_user_id, contact_user_id) DO NOTHING;
  `;
  await sql`
    INSERT INTO user_contacts (owner_user_id, contact_user_id, custom_nickname, chat_bg_color)
    VALUES (${fernUser.id}, ${newUser.id}, 'New', '#FFFFFF')
    ON CONFLICT (owner_user_id, contact_user_id) DO NOTHING;
  `;
  console.log('✓ Seeded mutual contacts');

  console.log('\n--- 4. Seeding Initial Conversation & Welcome Message ---');
  const u1 = newUser.id < fernUser.id ? newUser.id : fernUser.id;
  const u2 = newUser.id < fernUser.id ? fernUser.id : newUser.id;

  const convRows = await sql`
    INSERT INTO conversations (user_one_id, user_two_id)
    VALUES (${u1}, ${u2})
    ON CONFLICT (user_one_id, user_two_id) DO UPDATE SET updated_at = NOW()
    RETURNING id;
  `;
  const convId = convRows[0].id;
  console.log('✓ Conversation id:', convId);

  // Check if any message exists
  const existingMsgs = await sql`SELECT count(*)::int as count FROM messages WHERE conversation_id = ${convId};`;
  if (existingMsgs[0].count === 0) {
    await sql`
      INSERT INTO messages (conversation_id, sender_id, content, text_color, font_size)
      VALUES (${convId}, ${newUser.id}, 'ยินดีต้อนรับสู่ HusH v2.0 Production (Neon PostgreSQL Serverless) 🚀🔒', '#111827', 'M');
    `;
    console.log('✓ Seeded initial message');
  }

  console.log('\n--- 5. Verification ---');
  const allUsers = await sql`SELECT username, account_type, access_level, can_chat, is_immutable_admin FROM users ORDER BY created_at;`;
  console.log('Users in DB:', allUsers);
  console.log('\n🎉 Migration & Seeding Completed Successfully!');
}

migrateAndSeed().catch(console.error);

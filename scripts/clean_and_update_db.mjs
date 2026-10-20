import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const rawUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_IcvsedoJ4fY6@ep-muddy-hill-b5ainoe0-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const cleanUrl = rawUrl.replace(/([&?])channel_binding=require(&|$)/, '$1').replace(/\?$/, '').replace(/&$/, '');
const sql = neon(cleanUrl);

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function cleanNeonDb() {
  console.log('--- Cleaning Neon PostgreSQL Database ---');

  // 1. Clear any demo messages and demo schedules
  await sql`DELETE FROM messages;`;
  await sql`DELETE FROM message_reactions;`;
  await sql`DELETE FROM schedules;`;
  console.log('✓ Cleared messages, message_reactions, and schedules');

  // 2. Hash the new production passwords
  const hushadminHash = sha256('Admin@002452@');
  const new010Hash = sha256('N!ew@14523@');
  const fernrsHash = sha256('F!ern@02020@');

  console.log('Hushadmin Hash:', hushadminHash);
  console.log('New010 Hash:', new010Hash);
  console.log('Fernrs Hash:', fernrsHash);

  // 3. Upsert Hushadmin
  const adminRows = await sql`
    INSERT INTO users (
      username, password_hash, first_name, last_name, job_title, bio,
      phone, age, avatar_color, account_type, access_level, can_chat, is_immutable_admin, is_online
    ) VALUES (
      'Hushadmin',
      ${hushadminHash},
      'Hush',
      'Administrator',
      'System Administrator',
      'Protected Sole System Administrator.',
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
      password_hash = ${hushadminHash},
      first_name = 'Hush',
      last_name = 'Administrator',
      account_type = 'SYSTEM_ADMIN',
      access_level = 'ADMIN_ONLY',
      can_chat = false,
      is_immutable_admin = true
    RETURNING id, username, first_name, last_name, account_type, access_level, can_chat, is_immutable_admin;
  `;
  const adminUser = adminRows[0];
  console.log('✓ Hushadmin updated:', adminUser);

  // 4. Upsert New010
  const newRows = await sql`
    INSERT INTO users (
      username, password_hash, first_name, last_name, job_title, bio,
      phone, age, avatar_color, account_type, access_level, can_chat, is_immutable_admin, is_online
    ) VALUES (
      'New010',
      ${new010Hash},
      'Nithi',
      '',
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
      password_hash = ${new010Hash},
      first_name = 'Nithi',
      last_name = '',
      account_type = 'MEMBER',
      access_level = 'FULL_ACCESS',
      can_chat = true,
      is_immutable_admin = false
    RETURNING id, username, first_name, last_name, account_type, access_level, can_chat, is_immutable_admin;
  `;
  const newUser = newRows[0];
  console.log('✓ New010 updated:', newUser);

  // 5. Upsert Fernrs
  const fernRows = await sql`
    INSERT INTO users (
      username, password_hash, first_name, last_name, job_title, bio,
      phone, age, avatar_color, account_type, access_level, can_chat, is_immutable_admin, is_online
    ) VALUES (
      'Fernrs',
      ${fernrsHash},
      'Rungfa',
      '',
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
      password_hash = ${fernrsHash},
      first_name = 'Rungfa',
      last_name = '',
      account_type = 'MEMBER',
      access_level = 'USER',
      can_chat = true,
      is_immutable_admin = false
    RETURNING id, username, first_name, last_name, account_type, access_level, can_chat, is_immutable_admin;
  `;
  const fernUser = fernRows[0];
  console.log('✓ Fernrs updated:', fernUser);

  // 6. Delete any other users not in the authorized list
  const validIds = [adminUser.id, newUser.id, fernUser.id];
  const deleteResult = await sql`
    DELETE FROM users
    WHERE id NOT IN (${adminUser.id}::uuid, ${newUser.id}::uuid, ${fernUser.id}::uuid);
  `;
  console.log('✓ Deleted unauthorized/mock users from DB');

  // 7. Ensure mutual contacts between New010 and Fernrs
  await sql`
    INSERT INTO user_contacts (owner_user_id, contact_user_id, custom_nickname, chat_bg_color)
    VALUES (${newUser.id}, ${fernUser.id}, 'Rungfa', '#FFFFFF')
    ON CONFLICT (owner_user_id, contact_user_id) DO UPDATE SET custom_nickname = 'Rungfa';
  `;
  await sql`
    INSERT INTO user_contacts (owner_user_id, contact_user_id, custom_nickname, chat_bg_color)
    VALUES (${fernUser.id}, ${newUser.id}, 'Nithi', '#FFFFFF')
    ON CONFLICT (owner_user_id, contact_user_id) DO UPDATE SET custom_nickname = 'Nithi';
  `;
  console.log('✓ Seeded mutual contacts between New010 and Fernrs');

  // 8. Ensure clean conversation exists between New010 and Fernrs
  const u1 = newUser.id < fernUser.id ? newUser.id : fernUser.id;
  const u2 = newUser.id < fernUser.id ? fernUser.id : newUser.id;

  await sql`
    INSERT INTO conversations (user_one_id, user_two_id)
    VALUES (${u1}, ${u2})
    ON CONFLICT (user_one_id, user_two_id) DO UPDATE SET updated_at = NOW();
  `;
  console.log('✓ Clean conversation initialized between New010 and Fernrs');

  // 9. Verify DB state
  const finalUsers = await sql`SELECT id, username, first_name, last_name, account_type, access_level, can_chat, is_immutable_admin FROM users;`;
  console.log('\nFinal Users in DB:', finalUsers);

  const finalMessages = await sql`SELECT count(*)::int as count FROM messages;`;
  console.log('Final Messages count in DB:', finalMessages[0].count);

  const finalSchedules = await sql`SELECT count(*)::int as count FROM schedules;`;
  console.log('Final Schedules count in DB:', finalSchedules[0].count);

  console.log('\n✅ Neon DB Cleanup & Credentials Update Complete!');
}

cleanNeonDb().catch(console.error);

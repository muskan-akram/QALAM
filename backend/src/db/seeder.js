require('dotenv').config()
const { Pool } = require('pg')
const bcrypt   = require('bcryptjs')
const fs       = require('fs')
const path     = require('path')

async function seed() {
  const pool   = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  console.log('🌱 QALAM Database Seeder\n')

  try {
    // Roles
    await client.query(`INSERT INTO roles (name) VALUES ('admin'),('user') ON CONFLICT (name) DO NOTHING`)
    console.log('✅ Roles ready')

    // Admin
    const adminHash = await bcrypt.hash('Admin@1234', 12)
    await client.query(`
      INSERT INTO users (id,name,email,password_hash,role_id,status)
      VALUES ('00000000-0000-0000-0000-000000000001','System Admin','admin@qalam.io',$1,
              (SELECT id FROM roles WHERE name='admin'),'active')
      ON CONFLICT (email) DO NOTHING`, [adminHash])
    console.log('✅ Admin  →  admin@qalam.io  /  Admin@1234')

    // User
    const userHash = await bcrypt.hash('User@1234', 12)
    await client.query(`
      INSERT INTO users (id,name,email,password_hash,role_id,status)
      VALUES ('00000000-0000-0000-0000-000000000002','Jane Reader','user@qalam.io',$1,
              (SELECT id FROM roles WHERE name='user'),'active')
      ON CONFLICT (email) DO NOTHING`, [userHash])
    console.log('✅ User   →  user@qalam.io   /  User@1234')

    // 100 books SQL
    const booksSqlPath = path.join(__dirname, 'seed.sql')
    if (fs.existsSync(booksSqlPath)) {
      const sql = fs.readFileSync(booksSqlPath, 'utf8')
      await client.query(sql)
      const { rows } = await client.query('SELECT COUNT(*) FROM books')
      console.log(`✅ ${rows[0].count} books seeded`)
    } else {
      console.log('⚠️  seed.sql not found — skipping books')
    }

    console.log('\n🎉 Seeding complete!\n')
    console.log('─────────────────────────────────────')
    console.log('  Admin →  admin@qalam.io  / Admin@1234')
    console.log('  User  →  user@qalam.io   / User@1234')
    console.log('─────────────────────────────────────\n')
  } catch (err) {
    console.error('❌ Seed error:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}
seed()

import postgres from 'postgres';

// Force IPv4 by using localhost
const sql = postgres('postgresql://postgres:Y@seenH@li2025@127.0.0.1:54322/postgres', {
  connect_timeout: 10,
});

try {
  const result = await sql`SELECT version()`;
  console.log('✓ Connected via tunnel');
  console.log('Version:', result[0].version);
  await sql.end();
} catch (err) {
  console.error('✗ Connection failed:', err.message);
  process.exit(1);
}

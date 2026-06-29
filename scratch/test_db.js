const { Client } = require('pg');

async function testConnection(host, port, user, password) {
  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`\n✅✅✅ SUCCESS: ${host}:${port} ✅✅✅\n`);
    await client.end();
    return true;
  } catch (err) {
    process.stdout.write('.');
    return false;
  }
}

async function run() {
  const pw = 'a.1b.2c.3d.4';
  const ref = 'koavoruqectdqcyyphyd';
  
  const regions = [
    'ap-northeast-1', 'ap-northeast-2', 'ap-south-1', 'ap-southeast-1', 'ap-southeast-2',
    'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 
    'sa-east-1', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'
  ];
  
  const promises = [];
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    promises.push(testConnection(host, 6543, `postgres.${ref}`, pw));
    promises.push(testConnection(host, 5432, `postgres.${ref}`, pw));
  }
  
  await Promise.all(promises);
  console.log('\nDone testing all regions.');
}

run();

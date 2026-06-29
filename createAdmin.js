/**
 * createAdmin.js
 * Run once to create the admin user in Supabase.
 * Usage: node createAdmin.js
 */

require('dotenv').config();
const bcrypt   = require('bcryptjs');
const supabase = require('./lib/supabase');

const ADMIN_EMAIL    = 'admin@shopzone.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME     = 'ShopZone Admin';

async function main() {
    try {
        console.log('🔌  Connecting to Supabase...');

        // Check if admin already exists
        const { data: existing } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('email', ADMIN_EMAIL)
            .single();

        if (existing) {
            console.log('⚠️  Admin user already exists:');
            console.log('   Email:', existing.email);
            console.log('   Role: ', existing.role);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        const { data: admin, error } = await supabase
            .from('users')
            .insert({
                name:     ADMIN_NAME,
                email:    ADMIN_EMAIL,
                password: hashedPassword,
                role:     'admin'
            })
            .select()
            .single();

        if (error) throw error;

        console.log('🎉  Admin user created successfully!');
        console.log('─────────────────────────────────');
        console.log('   Name    :', admin.name);
        console.log('   Email   :', admin.email);
        console.log('   Password:', ADMIN_PASSWORD);
        console.log('   Role    :', admin.role);
        console.log('─────────────────────────────────');
        console.log('\n🚀  You can now log in at http://localhost:3000/login');
        process.exit(0);

    } catch (err) {
        console.error('❌  Error:', err.message);
        process.exit(1);
    }
}

main();

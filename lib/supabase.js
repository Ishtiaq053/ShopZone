/**
 * lib/supabase.js
 * Singleton Supabase client — import this everywhere instead of the models.
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;

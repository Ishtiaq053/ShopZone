const { Store } = require('express-session');
const supabase = require('./supabase');

class SupabaseSessionStore extends Store {
    constructor(options = {}) {
        super(options);
        this.tableName = options.tableName || 'session';
    }

    async get(sid, callback) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('sess')
                .eq('sid', sid)
                .single();

            if (error || !data) {
                return callback(null, null);
            }
            return callback(null, data.sess);
        } catch (err) {
            return callback(err);
        }
    }

    async set(sid, session, callback) {
        try {
            // calculate expiry
            let expire;
            if (session.cookie && session.cookie.expires) {
                expire = new Date(session.cookie.expires);
            } else {
                expire = new Date(Date.now() + 86400000); // 1 day default
            }

            const { error } = await supabase
                .from(this.tableName)
                .upsert({
                    sid: sid,
                    sess: session,
                    expire: expire.toISOString()
                }, { onConflict: 'sid' });

            if (error) throw error;
            if (callback) callback(null);
        } catch (err) {
            if (callback) callback(err);
        }
    }

    async destroy(sid, callback) {
        try {
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .eq('sid', sid);

            if (error) throw error;
            if (callback) callback(null);
        } catch (err) {
            if (callback) callback(err);
        }
    }

    async touch(sid, session, callback) {
        try {
            let expire;
            if (session.cookie && session.cookie.expires) {
                expire = new Date(session.cookie.expires);
            } else {
                expire = new Date(Date.now() + 86400000);
            }

            const { error } = await supabase
                .from(this.tableName)
                .update({ expire: expire.toISOString() })
                .eq('sid', sid);

            if (error) throw error;
            if (callback) callback(null);
        } catch (err) {
            if (callback) callback(err);
        }
    }
}

module.exports = SupabaseSessionStore;

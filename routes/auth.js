const express  = require('express');
const bcrypt   = require('bcryptjs');
const supabase = require('../lib/supabase');

const router = express.Router();

// ─── GET /register ────────────────────────────────────────────────────────────
router.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.locals.layout = false;
    res.render('auth/register', { title: 'Register — ShopZone' });
});

// ─── POST /register ───────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            req.flash('error', 'All fields are required.');
            return res.redirect('/register');
        }

        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect('/register');
        }

        if (password.length < 6) {
            req.flash('error', 'Password must be at least 6 characters.');
            return res.redirect('/register');
        }

        // Check for existing user
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (existingUser) {
            req.flash('error', 'An account with that email already exists.');
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const { data: user, error } = await supabase
            .from('users')
            .insert({
                name:     name.trim(),
                email:    email.toLowerCase().trim(),
                password: hashedPassword,
                role:     'customer'
            })
            .select()
            .single();

        if (error) throw error;

        req.flash('success', `Account created successfully, ${user.name}! Please log in to continue.`);
        res.redirect('/login');

    } catch (err) {
        console.error('Register error:', err.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/register');
    }
});

// ─── GET /login ───────────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.locals.layout = false;
    res.render('auth/login', { title: 'Login — ShopZone' });
});

// ─── POST /login ──────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            req.flash('error', 'Email and password are required.');
            return res.redirect('/login');
        }

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (!user) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        req.session.userId   = user.id;
        req.session.userName = user.name;
        req.session.role     = user.role;

        if (user.role === 'admin') {
            req.flash('success', `Admin login successful. Welcome, ${user.name}.`);
            return res.redirect('/admin');
        }
        req.flash('success', `Welcome back, ${user.name}!`);
        res.redirect('/products');

    } catch (err) {
        console.error('Login error:', err.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/login');
    }
});

// ─── GET /logout ──────────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
    req.flash('success', 'You have been logged out successfully.');

    delete req.session.userId;
    delete req.session.userName;
    delete req.session.role;

    req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        res.redirect('/login');
    });
});

module.exports = router;

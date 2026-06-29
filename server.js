require('dotenv').config();
const express     = require('express');
const session     = require('express-session');
const flash       = require('connect-flash');

const supabase = require('./lib/supabase');
const SupabaseSessionStore = require('./lib/SupabaseSessionStore');

const authRoutes   = require('./routes/auth');
const adminRoutes  = require('./routes/admin');
const { isLoggedIn } = require('./middleware/auth');

// ── API v1 Routes (JWT) ──────────────────────────────────────────────────────
const apiAuthRoutes    = require('./routes/api/apiAuth');
const apiProductRoutes = require('./routes/api/apiProducts');
const apiOrderRoutes   = require('./routes/api/apiOrders');
const apiUserRoutes    = require('./routes/api/apiUser');

const app = express();

// ── View Engine & Static Files ───────────────────────────────────────────────
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Session ──────────────────────────────────────────────────────────────────
app.use(session({
    store: new SupabaseSessionStore({ tableName: 'session' }),
    secret:            process.env.SESSION_SECRET || 'shopzone_secret_key_2024',
    resave:            false,
    saveUninitialized: false,
    cookie: { maxAge: 14 * 24 * 60 * 60 * 1000, httpOnly: true }
}));

// ── Flash ────────────────────────────────────────────────────────────────────
app.use(flash());

// ── Global res.locals ────────────────────────────────────────────────────────
app.use((req, res, next) => {
    res.locals.currentUser = req.session.userId ? {
        id:   req.session.userId,
        name: req.session.userName,
        role: req.session.role
    } : null;
    res.locals.success = req.flash('success');
    res.locals.error   = req.flash('error');
    res.locals.info    = req.flash('info');
    res.locals.warning = req.flash('warning');
    res.locals.search  = '';   // default so navbar search input never throws
    next();
});

// ── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
    'Electronics', 'Clothing', 'Books', 'Home & Kitchen',
    'Sports', 'Beauty', 'Toys', 'Automotive'
];
const LIMIT = 12;

// ── Helper: map DB snake_case row → JS camelCase object ──────────────────────
function mapProduct(row) {
    if (!row) return null;
    return {
        id:              row.id,
        _id:             row.id,          // alias so EJS templates still work
        name:            row.name,
        price:           Number(row.price),
        description:     row.description || '',
        category:        row.category,
        stock:           Number(row.stock),
        image:           row.image || '',
        featured:        row.featured,
        rating:          Number(row.rating),
        brand:           row.brand || '',
        isOnSale:        row.is_on_sale,
        discountPercent: Number(row.discount_percent),
        createdAt:       row.created_at,
        updatedAt:       row.updated_at
    };
}

function mapOrder(row) {
    if (!row) return null;
    return {
        id:          row.id,
        _id:         row.id,
        user:        row.user_id,
        user_id:     row.user_id,
        products:    row.products,
        totalAmount: Number(row.total_amount),
        status:      row.status,
        createdAt:   row.created_at,
        // populated user info (joined separately when needed)
        userName:    row.user_name  || null,
        userEmail:   row.user_email || null
    };
}

// ════════════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════════════

// GET / — Homepage
app.get('/', async (req, res) => {
    res.locals.layout = false;
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('featured', true)
            .order('created_at', { ascending: false })
            .limit(8);

        if (error) throw error;
        const featuredProducts = (data || []).map(mapProduct);
        res.render('homepage', { featuredProducts, categories: CATEGORIES });
    } catch (err) {
        console.error('Homepage error:', err.message);
        res.render('homepage', { featuredProducts: [], categories: CATEGORIES });
    }
});

// GET /products — Catalog with search, filter, sort, pagination
app.get('/products', async (req, res) => {
    try {
        const search   = req.query.search   || '';
        const category = req.query.category || '';
        const minPrice = req.query.minPrice || '';
        const maxPrice = req.query.maxPrice || '';
        const sort     = req.query.sort     || '';
        const page     = Math.max(1, parseInt(req.query.page) || 1);

        // Build base query
        let query = supabase.from('products').select('*', { count: 'exact' });

        // Full-text / ilike search across name, category, brand
        if (search.trim()) {
            query = query.or(
                `name.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%,brand.ilike.%${search.trim()}%`
            );
        }

        if (category.trim()) {
            query = query.eq('category', category.trim());
        }

        if (req.query.featured === 'true') {
            query = query.eq('featured', true);
        }

        if (minPrice !== '') query = query.gte('price', Number(minPrice));
        if (maxPrice !== '') query = query.lte('price', Number(maxPrice));

        // Sorting
        if (sort === 'price_asc')   query = query.order('price',      { ascending: true  });
        else if (sort === 'price_desc')  query = query.order('price',      { ascending: false });
        else if (sort === 'rating_desc') query = query.order('rating',     { ascending: false });
        else                             query = query.order('created_at', { ascending: false });

        // Pagination — must be done last
        const { data: countData, count: totalProducts, error: countError } =
            await query.range(0, 0);   // cheap way to get count first

        if (countError) throw countError;

        const totalPages  = Math.ceil((totalProducts || 0) / LIMIT) || 1;
        const currentPage = Math.min(page, totalPages);
        const from        = (currentPage - 1) * LIMIT;
        const to          = from + LIMIT - 1;

        // Re-run with actual range
        let dataQuery = supabase.from('products').select('*');

        if (search.trim()) {
            dataQuery = dataQuery.or(
                `name.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%,brand.ilike.%${search.trim()}%`
            );
        }
        if (category.trim())           dataQuery = dataQuery.eq('category', category.trim());
        if (req.query.featured === 'true') dataQuery = dataQuery.eq('featured', true);
        if (minPrice !== '')           dataQuery = dataQuery.gte('price', Number(minPrice));
        if (maxPrice !== '')           dataQuery = dataQuery.lte('price', Number(maxPrice));

        if (sort === 'price_asc')        dataQuery = dataQuery.order('price',      { ascending: true  });
        else if (sort === 'price_desc')  dataQuery = dataQuery.order('price',      { ascending: false });
        else if (sort === 'rating_desc') dataQuery = dataQuery.order('rating',     { ascending: false });
        else                             dataQuery = dataQuery.order('created_at', { ascending: false });

        dataQuery = dataQuery.range(from, to);

        const { data, error } = await dataQuery;
        if (error) throw error;

        const products = (data || []).map(mapProduct);

        res.locals.layout = false;
        res.render('products', {
            products, currentPage, totalPages, totalProducts: totalProducts || 0,
            search, category, minPrice, maxPrice, sort,
            categories: CATEGORIES
        });
    } catch (err) {
        console.error('Products error:', err.message);
        res.status(500).send('Server error');
    }
});

// GET /products/:id — Product detail (login required)
app.get('/products/:id', isLoggedIn, async (req, res) => {
    try {
        const { data: productData, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !productData) {
            req.flash('warning', 'Product not found.');
            return res.redirect('/products');
        }

        const product = mapProduct(productData);

        const { data: relatedData } = await supabase
            .from('products')
            .select('*')
            .eq('category', product.category)
            .neq('id', product.id)
            .limit(4);

        const related = (relatedData || []).map(mapProduct);

        res.locals.layout = false;
        res.render('products/details', {
            title: `${product.name} — ShopZone`,
            product, related
        });
    } catch (err) {
        req.flash('warning', 'Product not found.');
        res.redirect('/products');
    }
});

// GET /cart — Shopping cart page (login required)
app.get('/cart', isLoggedIn, (req, res) => {
    res.locals.layout = false;
    res.render('cart', { title: 'Shopping Cart — ShopZone' });
});

// POST /checkout — Create order from cart (login required)
app.post('/checkout', isLoggedIn, async (req, res) => {
    try {
        const { cart } = req.body;

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty.' });
        }

        // Build order products array
        const orderProducts = cart.map(item => ({
            productId:   item.id,
            productName: item.name,
            price:       Number(item.price),
            quantity:    Number(item.qty) || 1
        }));

        const subtotal    = orderProducts.reduce((s, i) => s + i.price * i.quantity, 0);
        const shipping    = subtotal >= 5000 ? 0 : 299;
        const totalAmount = subtotal + shipping;

        const { data, error } = await supabase
            .from('orders')
            .insert({
                user_id:      req.session.userId,
                products:     orderProducts,
                total_amount: totalAmount,
                status:       'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({ success: true, orderId: data.id });

    } catch (err) {
        console.error('Checkout error:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to place order. Please try again.' });
    }
});

// GET /order-success — Order confirmation page
app.get('/order-success', isLoggedIn, (req, res) => {
    res.locals.layout = false;
    res.render('order-success', {
        title:   'Order Placed — ShopZone',
        orderId: req.query.id || null
    });
});

// ── Auth Routes (/register /login /logout) ────────────────────────────────────
app.use('/', authRoutes);

// ── Admin Routes (/admin) ─────────────────────────────────────────────────────
app.use('/admin', adminRoutes);

// ── JWT REST API v1 ───────────────────────────────────────────────────────────
app.use('/api/v1/auth',     apiAuthRoutes);
app.use('/api/v1/products', apiProductRoutes);
app.use('/api/v1/orders',   apiOrderRoutes);
app.use('/api/v1/user',     apiUserRoutes);

// ── API 404 ───────────────────────────────────────────────────────────────────
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.locals.layout = false;
    res.status(404).render('404', { title: '404 — ShopZone' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀  ShopZone running at http://localhost:${PORT}`));

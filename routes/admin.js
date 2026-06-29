const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const supabase = require('../lib/supabase');
const { isLoggedIn, isAdmin } = require('../middleware/auth');
const upload   = require('../middleware/upload');

const router = express.Router();

// ── All admin routes require login + admin role ───────────────────────────────
router.use(isLoggedIn, isAdmin);

const CATEGORIES = [
    'Electronics', 'Clothing', 'Books', 'Home & Kitchen',
    'Sports', 'Beauty', 'Toys', 'Automotive'
];

// ── Helper: map DB snake_case row → JS camelCase ─────────────────────────────
function mapProduct(row) {
    if (!row) return null;
    return {
        id:              row.id,
        _id:             row.id,
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
        user:        {
            _id:   row.user_id,
            name:  row.user_name  || 'Unknown',
            email: row.user_email || ''
        },
        products:    row.products,
        totalAmount: Number(row.total_amount),
        status:      row.status,
        createdAt:   row.created_at
    };
}

// ── Helper: server-side validation ───────────────────────────────────────────
function validateProductBody(body) {
    const errors = {};
    if (!body.name || !body.name.trim())
        errors.name = 'Product name is required.';
    if (!body.category || !CATEGORIES.includes(body.category))
        errors.category = 'Please select a valid category.';
    const price = Number(body.price);
    if (body.price === undefined || body.price === '' || isNaN(price) || price < 0)
        errors.price = 'Price must be a non-negative number.';
    const stock = Number(body.stock);
    if (body.stock === undefined || body.stock === '' || isNaN(stock) || stock < 0)
        errors.stock = 'Stock must be a non-negative number.';
    return errors;
}

// ─── GET /admin ─ Dashboard ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        // Run all count/fetch queries in parallel
        const [
            productsRes,
            usersRes,
            inStockRes,
            outOfStockRes,
            featuredCountRes,
            recentProductsRes,
            ordersCountRes,
            recentOrdersRes
        ] = await Promise.all([
            supabase.from('products').select('id', { count: 'exact', head: true }),
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('products').select('id', { count: 'exact', head: true }).gt('stock', 0),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('stock', 0),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('featured', true),
            supabase.from('products').select('*').order('created_at', { ascending: false }).limit(10),
            supabase.from('orders').select('id', { count: 'exact', head: true }),
            // Join users for name/email
            supabase.from('orders')
                .select('*, users(name, email)')
                .order('created_at', { ascending: false })
                .limit(5)
        ]);

        const recentOrders = (recentOrdersRes.data || []).map(row => ({
            ...mapOrder(row),
            user: {
                _id:   row.user_id,
                name:  row.users ? row.users.name  : 'Unknown',
                email: row.users ? row.users.email : ''
            }
        }));

        res.locals.layout = false;
        res.render('admin/dashboard', {
            title: 'Admin Dashboard — ShopZone',
            totalProducts:    productsRes.count    || 0,
            totalUsers:       usersRes.count       || 0,
            inStockProducts:  inStockRes.count     || 0,
            outOfStockProducts: outOfStockRes.count || 0,
            featuredProducts: featuredCountRes.count || 0,
            recentProducts:   (recentProductsRes.data || []).map(mapProduct),
            totalOrders:      ordersCountRes.count  || 0,
            recentOrders,
            activePage: 'dashboard'
        });
    } catch (err) {
        console.error('Admin dashboard error:', err.message);
        req.flash('error', 'Failed to load dashboard data.');
        res.redirect('/products');
    }
});

// ─── GET /admin/products ─ Products Table ─────────────────────────────────────
router.get('/products', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.locals.layout = false;
        res.render('admin/products', {
            title: 'Manage Products — ShopZone',
            products: (data || []).map(mapProduct),
            activePage: 'products'
        });
    } catch (err) {
        console.error('Admin products list error:', err.message);
        req.flash('error', 'Failed to load products list.');
        res.redirect('/admin');
    }
});

// ─── GET /admin/products/add ─ Show Add Form ──────────────────────────────────
router.get('/products/add', (req, res) => {
    res.locals.layout = false;
    res.render('admin/addProduct', {
        title: 'Add Product — ShopZone',
        categories: CATEGORIES,
        errors: {},
        old: {},
        activePage: 'add'
    });
});

// ─── POST /admin/products/add ─ Create Product ────────────────────────────────
router.post('/products/add', upload.single('image'), async (req, res) => {
    const errors = validateProductBody(req.body);

    if (Object.keys(errors).length > 0) {
        if (req.file) fs.unlink(req.file.path, () => {});
        res.locals.layout = false;
        return res.render('admin/addProduct', {
            title: 'Add Product — ShopZone',
            categories: CATEGORIES,
            errors,
            old: req.body,
            activePage: 'add'
        });
    }

    try {
        const imagePath = req.file ? '/uploads/' + req.file.filename : '';

        const { error } = await supabase
            .from('products')
            .insert({
                name:             req.body.name.trim(),
                category:         req.body.category,
                price:            Number(req.body.price),
                stock:            Number(req.body.stock) || 0,
                description:      req.body.description ? req.body.description.trim() : '',
                brand:            req.body.brand ? req.body.brand.trim() : '',
                featured:         req.body.featured === 'true',
                is_on_sale:       req.body.isOnSale === 'true',
                discount_percent: Number(req.body.discountPercent) || 0,
                image:            imagePath
            });

        if (error) throw error;

        req.flash('success', `Product "${req.body.name.trim()}" added successfully!`);
        res.redirect('/admin/products');
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {});
        console.error('Add product error:', err.message);
        req.flash('error', 'Failed to add product. Please try again.');
        res.locals.layout = false;
        res.render('admin/addProduct', {
            title: 'Add Product — ShopZone',
            categories: CATEGORIES,
            errors: {},
            old: req.body,
            activePage: 'add'
        });
    }
});

// ─── GET /admin/products/edit/:id ─ Show Edit Form ───────────────────────────
router.get('/products/edit/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !data) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }

        res.locals.layout = false;
        res.render('admin/editProduct', {
            title: 'Edit Product — ShopZone',
            product: mapProduct(data),
            categories: CATEGORIES,
            errors: {},
            old: {},
            activePage: 'products'
        });
    } catch (err) {
        console.error('Edit form error:', err.message);
        req.flash('error', 'Product not found.');
        res.redirect('/admin/products');
    }
});

// ─── POST /admin/products/edit/:id ─ Update Product ──────────────────────────
router.post('/products/edit/:id', upload.single('image'), async (req, res) => {
    const errors = validateProductBody(req.body);

    if (Object.keys(errors).length > 0) {
        if (req.file) fs.unlink(req.file.path, () => {});
        try {
            const { data } = await supabase
                .from('products')
                .select('*')
                .eq('id', req.params.id)
                .single();

            res.locals.layout = false;
            return res.render('admin/editProduct', {
                title: 'Edit Product — ShopZone',
                product: mapProduct(data),
                categories: CATEGORIES,
                errors,
                old: req.body,
                activePage: 'products'
            });
        } catch (_) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }
    }

    try {
        const { data: existing, error: fetchErr } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchErr || !existing) {
            if (req.file) fs.unlink(req.file.path, () => {});
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }

        // Handle image update
        let imagePath = existing.image;
        if (req.file) {
            if (existing.image && existing.image.startsWith('/uploads/')) {
                const oldPath = path.join(__dirname, '..', 'public', existing.image);
                fs.unlink(oldPath, () => {});
            }
            imagePath = '/uploads/' + req.file.filename;
        }

        const newOnSale = req.body.isOnSale === 'true';
        const newPct    = Number(req.body.discountPercent) || 0;
        const discount  = newOnSale && newPct >= 1 && newPct <= 99 ? newPct : 0;

        const { error: updateErr } = await supabase
            .from('products')
            .update({
                name:             req.body.name.trim(),
                category:         req.body.category,
                price:            Number(req.body.price),
                stock:            Number(req.body.stock) || 0,
                description:      req.body.description ? req.body.description.trim() : '',
                brand:            req.body.brand ? req.body.brand.trim() : '',
                featured:         req.body.featured === 'true',
                image:            imagePath,
                is_on_sale:       newOnSale,
                discount_percent: discount
            })
            .eq('id', req.params.id);

        if (updateErr) throw updateErr;

        req.flash('success', `Product "${req.body.name.trim()}" updated successfully!`);
        res.redirect('/admin/products');
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => {});
        console.error('Update product error:', err.message);
        req.flash('error', 'Failed to update product. Please try again.');
        res.redirect(`/admin/products/edit/${req.params.id}`);
    }
});

// ─── POST /admin/products/delete/:id ─ Delete Product ────────────────────────
router.post('/products/delete/:id', async (req, res) => {
    try {
        const { data: existing, error: fetchErr } = await supabase
            .from('products')
            .select('id, name, image')
            .eq('id', req.params.id)
            .single();

        if (fetchErr || !existing) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }

        if (existing.image && existing.image.startsWith('/uploads/')) {
            const imgPath = path.join(__dirname, '..', 'public', existing.image);
            fs.unlink(imgPath, () => {});
        }

        const { error: deleteErr } = await supabase
            .from('products')
            .delete()
            .eq('id', req.params.id);

        if (deleteErr) throw deleteErr;

        req.flash('success', `Product "${existing.name}" deleted successfully.`);
        res.redirect('/admin/products');
    } catch (err) {
        console.error('Delete product error:', err.message);
        req.flash('error', 'Failed to delete product.');
        res.redirect('/admin/products');
    }
});

// ─── GET /admin/orders ─ All Orders ──────────────────────────────────────────
router.get('/orders', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*, users(name, email)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const orders = (data || []).map(row => ({
            ...mapOrder(row),
            user: {
                _id:   row.user_id,
                name:  row.users ? row.users.name  : 'Unknown',
                email: row.users ? row.users.email : ''
            }
        }));

        res.locals.layout = false;
        res.render('admin/orders', {
            title:      'Orders — ShopZone Admin',
            orders,
            activePage: 'orders'
        });
    } catch (err) {
        console.error('Admin orders error:', err.message);
        req.flash('error', 'Failed to load orders.');
        res.redirect('/admin');
    }
});

// ─── POST /admin/orders/:id/status ─ Update Order Status ─────────────────────
router.post('/orders/:id/status', async (req, res) => {
    const VALID = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    try {
        const { status } = req.body;
        if (!VALID.includes(status)) {
            req.flash('error', 'Invalid status value.');
            return res.redirect('/admin/orders');
        }

        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error || !data) {
            req.flash('error', 'Order not found.');
            return res.redirect('/admin/orders');
        }

        req.flash('success', `Order status updated to "${status}".`);
        res.redirect('/admin/orders');
    } catch (err) {
        console.error('Update order status error:', err.message);
        req.flash('error', 'Failed to update order status.');
        res.redirect('/admin/orders');
    }
});

// ─── POST /admin/products/:id/discount ─ Apply / Remove Discount ─────────────
router.post('/products/:id/discount', async (req, res) => {
    try {
        const { data: existing, error: fetchErr } = await supabase
            .from('products')
            .select('id, name, is_on_sale, discount_percent')
            .eq('id', req.params.id)
            .single();

        if (fetchErr || !existing) {
            req.flash('error', 'Product not found.');
            return res.redirect('/admin/products');
        }

        const action = req.body.action;

        if (action === 'remove') {
            await supabase
                .from('products')
                .update({ is_on_sale: false, discount_percent: 0 })
                .eq('id', req.params.id);

            req.flash('success', `Discount removed from "${existing.name}".`);
        } else {
            const pct = Number(req.body.discountPercent);
            if (isNaN(pct) || pct < 1 || pct > 99) {
                req.flash('error', 'Discount must be between 1% and 99%.');
                return res.redirect('/admin/products');
            }

            await supabase
                .from('products')
                .update({ is_on_sale: true, discount_percent: pct })
                .eq('id', req.params.id);

            req.flash('success', `${pct}% discount applied to "${existing.name}".`);
        }

        res.redirect('/admin/products');
    } catch (err) {
        console.error('Discount update error:', err.message);
        req.flash('error', 'Failed to update discount.');
        res.redirect('/admin/products');
    }
});

module.exports = router;

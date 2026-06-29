// ─── Auth Middleware ───────────────────────────────────────────────────────────

/**
 * isLoggedIn — Redirect guests to /login with a contextual flash message.
 */
function isLoggedIn(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    const isProductDetail = /^\/products\/[^/]+$/.test(req.path);
    const isCart = req.path === '/cart';
    if (isProductDetail || isCart) {
        req.flash('warning', 'Please login to view product details and manage your cart.');
    } else {
        req.flash('warning', 'Please login to continue.');
    }
    res.redirect('/login');
}

/**
 * isAdmin — Allow only users with role === 'admin'.
 * Must be used AFTER isLoggedIn.
 */
function isAdmin(req, res, next) {
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    req.flash('error', 'Access denied. This area is for administrators only.');
    res.redirect('/products');
}

module.exports = { isLoggedIn, isAdmin };

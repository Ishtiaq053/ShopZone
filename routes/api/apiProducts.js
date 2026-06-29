const express  = require('express');
const supabase = require('../../lib/supabase');

const router = express.Router();

// ── Helper: validate UUID format ─────────────────────────────────────────────
function isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ── Helper: map DB snake_case → camelCase ─────────────────────────────────────
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

// GET /api/v1/products  — public, paginated + filtered
router.get('/', async (req, res) => {
    try {
        const search   = (req.query.search   || '').trim();
        const category = (req.query.category || '').trim();
        const minPrice = req.query.minPrice;
        const maxPrice = req.query.maxPrice;
        const sort     = (req.query.sort     || '').trim();
        const featured = req.query.featured;
        const page     = Math.max(1, parseInt(req.query.page)  || 1);
        const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));

        // ── Build count query ────────────────────────────────────────────────
        let cq = supabase.from('products').select('id', { count: 'exact', head: true });

        if (search) {
            cq = cq.or(`name.ilike.%${search}%,category.ilike.%${search}%,brand.ilike.%${search}%`);
        }
        if (category)          cq = cq.eq('category', category);
        if (featured === 'true') cq = cq.eq('featured', true);

        const minNum = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : NaN;
        const maxNum = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : NaN;
        if (!isNaN(minNum)) cq = cq.gte('price', minNum);
        if (!isNaN(maxNum)) cq = cq.lte('price', maxNum);

        const { count: totalProducts, error: cErr } = await cq;
        if (cErr) throw cErr;

        const totalPages  = Math.ceil((totalProducts || 0) / limit) || 1;
        const currentPage = Math.min(page, totalPages);
        const from        = (currentPage - 1) * limit;
        const to          = from + limit - 1;

        // ── Build data query ─────────────────────────────────────────────────
        let dq = supabase.from('products').select('*');

        if (search) {
            dq = dq.or(`name.ilike.%${search}%,category.ilike.%${search}%,brand.ilike.%${search}%`);
        }
        if (category)            dq = dq.eq('category', category);
        if (featured === 'true') dq = dq.eq('featured', true);
        if (!isNaN(minNum))      dq = dq.gte('price', minNum);
        if (!isNaN(maxNum))      dq = dq.lte('price', maxNum);

        switch (sort) {
            case 'price_asc':   dq = dq.order('price',      { ascending: true  }); break;
            case 'price_desc':  dq = dq.order('price',      { ascending: false }); break;
            case 'rating_desc': dq = dq.order('rating',     { ascending: false }); break;
            default:            dq = dq.order('created_at', { ascending: false }); break;
        }

        dq = dq.range(from, to);

        const { data, error } = await dq;
        if (error) throw error;

        const products = (data || []).map(mapProduct);

        return res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage,
                    totalPages,
                    totalProducts: totalProducts || 0,
                    limit,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                },
                filters: {
                    search,
                    category,
                    minPrice: minPrice || null,
                    maxPrice: maxPrice || null,
                    sort
                }
            }
        });

    } catch (err) {
        console.error('[API] GET /products error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

// GET /api/v1/products/featured — public, featured products
router.get('/featured', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('featured', true)
            .order('created_at', { ascending: false })
            .limit(8);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            data: { products: (data || []).map(mapProduct) }
        });
    } catch (err) {
        console.error('[API] GET /products/featured error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

// GET /api/v1/products/:id — public, single product
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!isUUID(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID format.' });
        }

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        return res.status(200).json({ success: true, data: { product: mapProduct(data) } });

    } catch (err) {
        console.error('[API] GET /products/:id error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

module.exports = router;

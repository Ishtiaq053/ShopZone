const express     = require('express');
const supabase    = require('../../lib/supabase');
const verifyToken = require('../../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

// ── Helper: validate UUID format ─────────────────────────────────────────────
function isUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// POST /api/v1/orders — protected, place a new order
router.post('/', async (req, res) => {
    try {
        const { products, notes } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one product.'
            });
        }

        for (let i = 0; i < products.length; i++) {
            const item = products[i];
            if (!item.productId || !item.productName || item.price === undefined) {
                return res.status(400).json({
                    success: false,
                    message: `Item at index ${i} is missing required fields (productId, productName, price).`
                });
            }
            if (!isUUID(item.productId)) {
                return res.status(400).json({
                    success: false,
                    message: `Item at index ${i} has an invalid productId format.`
                });
            }
            if (typeof item.price !== 'number' || item.price < 0) {
                return res.status(400).json({
                    success: false,
                    message: `Item at index ${i} has an invalid price.`
                });
            }
        }

        const totalAmount = products.reduce((sum, item) => {
            const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
            return sum + item.price * qty;
        }, 0);

        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                user_id:      req.user.user_id,
                products,
                total_amount: totalAmount,
                status:       'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully.',
            data: {
                order: {
                    id:          order.id,
                    _id:         order.id,
                    user:        order.user_id,
                    products:    order.products,
                    totalAmount: Number(order.total_amount),
                    status:      order.status,
                    createdAt:   order.created_at
                }
            }
        });

    } catch (err) {
        console.error('[API] POST /orders error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

// GET /api/v1/orders — protected, get user's own orders
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', req.user.user_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const orders = (data || []).map(row => ({
            id:          row.id,
            _id:         row.id,
            user:        row.user_id,
            products:    row.products,
            totalAmount: Number(row.total_amount),
            status:      row.status,
            createdAt:   row.created_at
        }));

        return res.status(200).json({
            success: true,
            data: { orders }
        });
    } catch (err) {
        console.error('[API] GET /orders error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

module.exports = router;

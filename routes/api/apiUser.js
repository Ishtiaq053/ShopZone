const express     = require('express');
const supabase    = require('../../lib/supabase');
const verifyToken = require('../../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

// GET /api/v1/user/profile  — protected
router.get('/profile', async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, created_at')   // exclude password
            .eq('id', req.user.user_id)
            .single();

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id:        user.id,
                    _id:       user.id,
                    name:      user.name,
                    email:     user.email,
                    role:      user.role,
                    createdAt: user.created_at
                }
            }
        });

    } catch (err) {
        console.error('[API] GET /user/profile error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

module.exports = router;

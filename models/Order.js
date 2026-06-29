const mongoose = require('mongoose');

// ─── Order Item Sub-Schema ─────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type:     mongoose.Schema.Types.ObjectId,
            ref:      'Product',
            required: [true, 'Product ID is required']
        },
        productName: {
            type:     String,
            required: [true, 'Product name is required'],
            trim:     true
        },
        price: {
            type:     Number,
            required: [true, 'Price is required'],
            min:      [0, 'Price cannot be negative']
        },
        quantity: {
            type:    Number,
            default: 1,
            min:     [1, 'Quantity must be at least 1']
        }
    },
    { _id: false }
);

// ─── Order Schema ──────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
    {
        user: {
            type:     mongoose.Schema.Types.ObjectId,
            ref:      'User',
            required: [true, 'User reference is required']
        },
        products: {
            type:     [orderItemSchema],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message:   'Order must contain at least one product'
            }
        },
        totalAmount: {
            type:     Number,
            required: [true, 'Total amount is required'],
            min:      [0, 'Total amount cannot be negative']
        },
        status: {
            type:    String,
            enum:    ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },
        notes: {
            type:    String,
            trim:    true,
            default: ''
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

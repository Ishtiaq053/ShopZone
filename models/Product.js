const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type:     String,
            required: [true, 'Product name is required'],
            trim:     true
        },
        price: {
            type:     Number,
            required: [true, 'Price is required'],
            min:      [0, 'Price cannot be negative']
        },
        description: {
            type:    String,
            trim:    true,
            default: ''
        },
        category: {
            type:     String,
            required: [true, 'Category is required'],
            enum: [
                'Electronics',
                'Clothing',
                'Books',
                'Home & Kitchen',
                'Sports',
                'Beauty',
                'Toys',
                'Automotive'
            ]
        },
        stock: {
            type:    Number,
            default: 0,
            min:     [0, 'Stock cannot be negative']
        },
        image: {
            type:    String,
            default: ''
        },
        featured: {
            type:    Boolean,
            default: false
        },
        rating: {
            type:    Number,
            min:     1,
            max:     5,
            default: 3
        },
        brand: {
            type:    String,
            trim:    true,
            default: ''
        },
        isOnSale: {
            type:    Boolean,
            default: false
        },
        discountPercent: {
            type:    Number,
            default: 0,
            min:     0,
            max:     100
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

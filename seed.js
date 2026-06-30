/**
 * seed.js
 * Clears the Supabase products table and inserts 40 fresh products.
 * Usage: node seed.js
 */

require('dotenv').config();
const supabase = require('./lib/supabase');

const products = [
    // ── Electronics (8) ───────────────────────────────────────────────────────
    {
        name: 'Samsung Galaxy S24 Ultra', category: 'Electronics', price: 289999,
        brand: 'Samsung', stock: 15, rating: 4.8, featured: true, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80',
        description: '200MP camera, Snapdragon 8 Gen 3, 5000mAh battery, 6.8" Dynamic AMOLED 2X display.'
    },
    {
        name: 'Apple MacBook Air M3', category: 'Electronics', price: 349999,
        brand: 'Apple', stock: 10, rating: 4.9, featured: true, is_on_sale: true, discount_percent: 10,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        description: '13.6" Liquid Retina display, 8-core CPU, 10-core GPU, up to 18 hours battery life.'
    },
    {
        name: 'Sony WH-1000XM5 Headphones', category: 'Electronics', price: 89999,
        brand: 'Sony', stock: 25, rating: 4.7, featured: true, is_on_sale: true, discount_percent: 15,
        image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
        description: 'Industry-leading noise cancellation, 30-hour battery, multipoint connection.'
    },
    {
        name: 'Dell 27" 4K Monitor', category: 'Electronics', price: 119999,
        brand: 'Dell', stock: 8, rating: 4.6, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
        description: '27-inch IPS 4K UHD panel, 60Hz, USB-C 65W charging, factory calibrated.'
    },
    {
        name: 'Logitech MX Master 3S Mouse', category: 'Electronics', price: 19999,
        brand: 'Logitech', stock: 40, rating: 4.8, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1527814050087-179337c7ff42?auto=format&fit=crop&w=800&q=80',
        description: '8K DPI sensor, near-silent clicks, Bluetooth & USB-C, ergonomic design.'
    },
    {
        name: 'iPad Pro 12.9" M2', category: 'Electronics', price: 269999,
        brand: 'Apple', stock: 12, rating: 4.9, featured: true, is_on_sale: true, discount_percent: 8,
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
        description: 'M2 chip, Liquid Retina XDR display, ProMotion 120Hz, Thunderbolt 4 port.'
    },
    {
        name: 'GoPro Hero 12 Black', category: 'Electronics', price: 59999,
        brand: 'GoPro', stock: 20, rating: 4.5, featured: false, is_on_sale: true, discount_percent: 12,
        image: 'https://images.unsplash.com/photo-1502920514313-52581002a659?auto=format&fit=crop&w=800&q=80',
        description: '5.3K60 video, HDR, HyperSmooth 6.0, waterproof to 10m, auto upload to cloud.'
    },
    {
        name: 'Xiaomi Smart Band 8 Pro', category: 'Electronics', price: 9999,
        brand: 'Xiaomi', stock: 60, rating: 4.4, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
        description: '1.74" AMOLED display, 14-day battery, GPS, SpO2, 150+ workout modes.'
    },

    // ── Clothing (6) ──────────────────────────────────────────────────────────
    {
        name: 'Nike Air Max 270 Sneakers', category: 'Clothing', price: 29999,
        brand: 'Nike', stock: 35, rating: 4.6, featured: true, is_on_sale: true, discount_percent: 20,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        description: 'Largest Air unit ever in the heel, breathable mesh upper, available in multiple colours.'
    },
    {
        name: "Levi's 501 Original Jeans", category: 'Clothing', price: 8999,
        brand: "Levi's", stock: 50, rating: 4.5, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
        description: 'The original straight fit, 100% cotton, button fly, iconic since 1873.'
    },
    {
        name: 'Adidas Ultraboost 23', category: 'Clothing', price: 34999,
        brand: 'Adidas', stock: 28, rating: 4.7, featured: true, is_on_sale: true, discount_percent: 15,
        image: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=80',
        description: 'Boost midsole for energy return, Primeknit+ upper, Linear Energy Push system.'
    },
    {
        name: 'Polo Ralph Lauren Classic Shirt', category: 'Clothing', price: 12999,
        brand: 'Ralph Lauren', stock: 45, rating: 4.4, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
        description: 'Slim fit, 100% cotton pique, embroidered Polo pony, available in 12 colours.'
    },
    {
        name: 'North Face Thermoball Jacket', category: 'Clothing', price: 39999,
        brand: 'The North Face', stock: 18, rating: 4.8, featured: false, is_on_sale: true, discount_percent: 10,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
        description: 'Lightweight packable insulation, PrimaLoft Gold Insulation Eco, water-resistant DWR.'
    },
    {
        name: 'Uniqlo Ultra Light Down Jacket', category: 'Clothing', price: 14999,
        brand: 'Uniqlo', stock: 30, rating: 4.5, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?auto=format&fit=crop&w=800&q=80',
        description: '90% down insulation, packable into its own pocket, wind & water resistant.'
    },

    // ── Books (5) ─────────────────────────────────────────────────────────────
    {
        name: 'Atomic Habits by James Clear', category: 'Books', price: 1999,
        brand: 'Penguin', stock: 100, rating: 4.9, featured: true, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
        description: 'The definitive guide to building good habits and breaking bad ones. #1 NYT Bestseller.'
    },
    {
        name: 'The Psychology of Money', category: 'Books', price: 1799,
        brand: 'Harriman House', stock: 80, rating: 4.8, featured: true, is_on_sale: true, discount_percent: 10,
        image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
        description: 'Morgan Housel on how money works in the real world — 19 timeless stories.'
    },
    {
        name: 'Clean Code by Robert C. Martin', category: 'Books', price: 3499,
        brand: 'Prentice Hall', stock: 55, rating: 4.7, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
        description: 'A Handbook of Agile Software Craftsmanship — essential for every developer.'
    },
    {
        name: 'Ikigai: Japanese Secret to a Long Life', category: 'Books', price: 1599,
        brand: 'Penguin', stock: 70, rating: 4.6, featured: false, is_on_sale: true, discount_percent: 15,
        image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=800&q=80',
        description: 'The Japanese concept of finding purpose and happiness in life. Bestseller.'
    },
    {
        name: 'Zero to One by Peter Thiel', category: 'Books', price: 1899,
        brand: 'Crown Business', stock: 60, rating: 4.7, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
        description: 'Notes on startups and how to build the future. Iconic entrepreneurship book.'
    },

    // ── Home & Kitchen (5) ────────────────────────────────────────────────────
    {
        name: 'Dyson V15 Detect Vacuum', category: 'Home & Kitchen', price: 149999,
        brand: 'Dyson', stock: 10, rating: 4.8, featured: true, is_on_sale: true, discount_percent: 10,
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
        description: 'Laser reveals hidden dust, HEPA filtration, 60-minute runtime, LCD screen.'
    },
    {
        name: 'Instant Pot Duo 7-in-1', category: 'Home & Kitchen', price: 24999,
        brand: 'Instant Pot', stock: 22, rating: 4.7, featured: true, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
        description: 'Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker & warmer.'
    },
    {
        name: 'Nespresso Vertuo Pop Coffee Machine', category: 'Home & Kitchen', price: 34999,
        brand: 'Nespresso', stock: 15, rating: 4.6, featured: false, is_on_sale: true, discount_percent: 20,
        image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=800&q=80',
        description: 'Centrifusion technology, 5 cup sizes, 30-second heat-up, compact design.'
    },
    {
        name: 'KitchenAid Stand Mixer 5-Qt', category: 'Home & Kitchen', price: 89999,
        brand: 'KitchenAid', stock: 8, rating: 4.9, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1594008671609-b7b51b853507?auto=format&fit=crop&w=800&q=80',
        description: '10 speeds, 59-point planetary mixing action, tilt-head design, durable die-cast metal.'
    },
    {
        name: 'AmazonBasics Non-Stick Cookware Set', category: 'Home & Kitchen', price: 12999,
        brand: 'Amazon', stock: 35, rating: 4.3, featured: false, is_on_sale: true, discount_percent: 25,
        image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
        description: '8-piece set: pots, pans, lids. PTFE non-stick coating, dishwasher safe.'
    },

    // ── Sports (5) ────────────────────────────────────────────────────────────
    {
        name: 'Wilson Pro Staff Tennis Racket', category: 'Sports', price: 29999,
        brand: 'Wilson', stock: 14, rating: 4.7, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1622279457486-69d73ce184fc?auto=format&fit=crop&w=800&q=80',
        description: '97 sq in head, 315g, Braided Graphite frame, Federer signature series.'
    },
    {
        name: 'Bowflex SelectTech 552 Dumbbells', category: 'Sports', price: 59999,
        brand: 'Bowflex', stock: 9, rating: 4.8, featured: true, is_on_sale: true, discount_percent: 15,
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
        description: 'Adjusts from 5–52.5 lbs (2.5–24kg), replaces 15 sets of weights, dial system.'
    },
    {
        name: 'Yoga Mat Premium 6mm', category: 'Sports', price: 3999,
        brand: 'Liforme', stock: 50, rating: 4.5, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
        description: 'Natural rubber, alignment system, extra-long 185cm, non-slip grip, carrying strap.'
    },
    {
        name: 'Garmin Forerunner 255 GPS Watch', category: 'Sports', price: 44999,
        brand: 'Garmin', stock: 17, rating: 4.7, featured: true, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1508344928928-7135b67de892?auto=format&fit=crop&w=800&q=80',
        description: 'Advanced running dynamics, HRV status, race predictor, 14-day battery life.'
    },
    {
        name: 'Speedo Endurance Swim Goggles', category: 'Sports', price: 2499,
        brand: 'Speedo', stock: 65, rating: 4.4, featured: false, is_on_sale: true, discount_percent: 10,
        image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80',
        description: 'Anti-fog, UV protection, adjustable nose bridge, 5 interchangeable nose pieces.'
    },

    // ── Beauty (4) ────────────────────────────────────────────────────────────
    {
        name: 'CeraVe Moisturising Cream 250g', category: 'Beauty', price: 2999,
        brand: 'CeraVe', stock: 90, rating: 4.8, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80',
        description: '3 essential ceramides, hyaluronic acid, MVE technology for 24-hour hydration.'
    },
    {
        name: 'Dyson Airwrap Multi-Styler', category: 'Beauty', price: 119999,
        brand: 'Dyson', stock: 7, rating: 4.7, featured: true, is_on_sale: true, discount_percent: 10,
        image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80',
        description: 'Coanda effect, no extreme heat, 6 attachments for curling, waving & smoothing.'
    },
    {
        name: "L'Oreal Revitalift Serum", category: 'Beauty', price: 4499,
        brand: "L'Oreal", stock: 40, rating: 4.5, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
        description: '30% Pure Vitamin C, reduces dark spots, firms skin, visibly radiant in 1 week.'
    },
    {
        name: 'Neutrogena Hydro Boost Gel-Cream', category: 'Beauty', price: 3499,
        brand: 'Neutrogena', stock: 55, rating: 4.6, featured: false, is_on_sale: true, discount_percent: 12,
        image: 'https://images.unsplash.com/photo-1556228720-1c2a466444fd?auto=format&fit=crop&w=800&q=80',
        description: 'Oil-free, non-comedogenic, hyaluronic acid, instantly quenches dry skin.'
    },

    // ── Toys (4) ──────────────────────────────────────────────────────────────
    {
        name: 'LEGO Technic Bugatti Chiron', category: 'Toys', price: 34999,
        brand: 'LEGO', stock: 12, rating: 4.9, featured: true, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=800&q=80',
        description: '3599 pieces, 1:8 scale, working W16 engine, gearbox, aerodynamic details.'
    },
    {
        name: 'Hot Wheels Ultimate Garage', category: 'Toys', price: 12999,
        brand: 'Hot Wheels', stock: 20, rating: 4.6, featured: false, is_on_sale: true, discount_percent: 20,
        image: 'https://images.unsplash.com/photo-1581557991964-125469da3b8a?auto=format&fit=crop&w=800&q=80',
        description: '5 stories, 140+ car capacity, spiral ramp, gas station, elevator, parking spaces.'
    },
    {
        name: 'Barbie Dreamhouse 2023', category: 'Toys', price: 19999,
        brand: 'Barbie', stock: 15, rating: 4.5, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1558066121-82550dc27497?auto=format&fit=crop&w=800&q=80',
        description: '75+ accessories, 3 stories, 8 rooms, working elevator, pool, slide, lights & sounds.'
    },
    {
        name: 'DJI Mini 4 Pro Drone', category: 'Toys', price: 129999,
        brand: 'DJI', stock: 6, rating: 4.8, featured: true, is_on_sale: true, discount_percent: 8,
        image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
        description: '4K/60fps, 20km video transmission, omnidirectional obstacle sensing, 34min flight.'
    },

    // ── Automotive (3) ────────────────────────────────────────────────────────
    {
        name: 'Michelin Pilot Sport 4S Tyre 225/45R17', category: 'Automotive', price: 34999,
        brand: 'Michelin', stock: 20, rating: 4.8, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
        description: 'Ultra-high performance summer tyre, dual compound, exceptional wet & dry grip.'
    },
    {
        name: 'Garmin DashCam 67W', category: 'Automotive', price: 24999,
        brand: 'Garmin', stock: 25, rating: 4.6, featured: true, is_on_sale: true, discount_percent: 15,
        image: 'https://images.unsplash.com/photo-1511316695145-4992006ffddb?auto=format&fit=crop&w=800&q=80',
        description: '1440p resolution, 180° wide-angle lens, voice control, Incident Detection.'
    },
    {
        name: 'Anker 67W USB-C Car Charger', category: 'Automotive', price: 4999,
        brand: 'Anker', stock: 80, rating: 4.7, featured: false, is_on_sale: false, discount_percent: 0,
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
        description: 'GaN technology, 67W total output, 2 USB-C + 1 USB-A, PowerIQ 3.0, compact.'
    }
];

(async () => {
    try {
        console.log('🗑️   Clearing existing products from Supabase...');
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

        if (deleteError) throw deleteError;
        console.log('✅  Products table cleared.');

        console.log(`🌱  Inserting ${products.length} products...`);
        const { data, error: insertError } = await supabase
            .from('products')
            .insert(products)
            .select();

        if (insertError) throw insertError;
        console.log(`✅  Seeded ${data.length} products successfully!`);
        process.exit(0);
    } catch (err) {
        console.error('❌  Seed error:', err.message);
        process.exit(1);
    }
})();

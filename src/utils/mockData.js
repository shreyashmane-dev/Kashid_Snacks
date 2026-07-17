// Curated Mock Data for Kashid Snacks

export const CATEGORIES = [
  { id: 'namkeen', name: 'Premium Namkeen', image: 'https://images.unsplash.com/photo-1589476993333-f55b84301219?w=300&q=80', count: 12 },
  { id: 'sweets', name: 'Festive Sweets', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', count: 8 },
  { id: 'healthy', name: 'Healthy & Baked', image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=300&q=80', count: 15 },
  { id: 'chips', name: 'Spicy Chips & Crisps', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80', count: 10 }
];

export const PRODUCTS = [
  {
    id: 'saffron-bhujia',
    name: 'Royal Saffron Bhujia',
    category: 'namkeen',
    description: 'Crisp, golden sev infused with pure Kashmiri saffron strands, refined spices, and nutty hints. Crafted in small batches to preserve its iconic aroma.',
    price: 180,
    weight: '250g',
    stock: 45,
    rating: 4.8,
    reviewsCount: 128,
    images: [
      'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589476993333-f55b84301219?w=800&auto=format&fit=crop&q=80'
    ],
    variants: [
      { weight: '150g', price: 110, stock: 20 },
      { weight: '250g', price: 180, stock: 45 },
      { weight: '500g', price: 340, stock: 15 }
    ],
    reviews: [
      { id: 1, user: 'Priya K.', rating: 5, comment: 'Absolutely amazing! The hint of saffron makes it so unique and royal. Perfectly crisp.', date: '2026-07-10' },
      { id: 2, user: 'Rahul S.', rating: 4, comment: 'Very tasty, not too oily. Will definitely order again.', date: '2026-07-12' }
    ]
  },
  {
    id: 'turmeric-chivda',
    name: 'Turmeric Diet Chivda',
    category: 'healthy',
    description: 'A light, oil-free mix of puffed rice, roasted peanuts, curry leaves, and a generous dusting of anti-inflammatory turmeric. Perfect for guilt-free evening tea time.',
    price: 120,
    weight: '200g',
    stock: 9, // Low stock for alerts
    rating: 4.6,
    reviewsCount: 94,
    images: [
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541795795328-f073b763494e?w=800&auto=format&fit=crop&q=80'
    ],
    variants: [
      { weight: '200g', price: 120, stock: 9 },
      { weight: '400g', price: 220, stock: 12 }
    ],
    reviews: [
      { id: 1, user: 'Amit M.', rating: 5, comment: 'Super light and crunchy. Best diet snack out there.', date: '2026-07-08' }
    ]
  },
  {
    id: 'maroon-makhana',
    name: 'Spicy Maroon Roasted Makhana',
    category: 'healthy',
    description: 'Crispy popped lotus seeds slow-roasted in pure ghee and spiced with maroon Kashmiri chili, dry mango powder, and Himalayan pink salt.',
    price: 240,
    weight: '100g',
    stock: 60,
    rating: 4.9,
    reviewsCount: 156,
    images: [
      'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&auto=format&fit=crop&q=80'
    ],
    variants: [
      { weight: '100g', price: 240, stock: 60 },
      { weight: '250g', price: 550, stock: 25 }
    ],
    reviews: [
      { id: 1, user: 'Sneha G.', rating: 5, comment: 'Spicy, tangy, and super fresh. Makhanas are massive!', date: '2026-07-14' }
    ]
  },
  {
    id: 'kaju-katli',
    name: 'Royal Kaju Katli (Silver Foil)',
    category: 'sweets',
    description: 'Classic melt-in-your-mouth cashew fudge made with premium Goan cashews, minimal sugar, and decorated with authentic silver leaf.',
    price: 450,
    weight: '400g',
    stock: 32,
    rating: 4.7,
    reviewsCount: 240,
    images: [
      'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505253685821-fed6b4486bd5?w=800&auto=format&fit=crop&q=80'
    ],
    variants: [
      { weight: '400g', price: 450, stock: 32 },
      { weight: '800g', price: 850, stock: 15 }
    ],
    reviews: [
      { id: 1, user: 'Vikram A.', rating: 5, comment: 'Perfect sweetness, extremely fresh. Tastes like home.', date: '2026-07-15' }
    ]
  },
  {
    id: 'crunchy-papad',
    name: 'Royal Crunchy Papad',
    category: 'healthy',
    description: 'Crispy, hand-rolled lentil flatbreads infused with cracked black pepper, aromatic cumin, and asafoetida. Perfect companion for meals or tea-time crunches.',
    price: 120,
    weight: '200g',
    stock: 50,
    rating: 4.8,
    reviewsCount: 128,
    images: [
      '/papad_snack_hero.png'
    ],
    variants: [
      { weight: '100g', price: 65, stock: 25 },
      { weight: '200g', price: 120, stock: 50 }
    ],
    reviews: [
      { id: 1, user: 'Amit S.', rating: 5, comment: 'Super crispy and perfect seasoning. Best papad I have bought online.', date: '2026-07-16' }
    ]
  },
  {
    id: 'peri-chips',
    name: 'Vibrant Peri Peri Crisps',
    category: 'chips',
    description: 'Thin-cut hand-kettled potato chips dusted with a fiery African Bird\'s Eye chili blend, garlic, citrus, and sweet onion.',
    price: 90,
    weight: '150g',
    stock: 80,
    rating: 4.5,
    reviewsCount: 88,
    images: [
      'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&auto=format&fit=crop&q=80'
    ],
    variants: [
      { weight: '150g', price: 90, stock: 80 }
    ],
    reviews: [
      { id: 1, user: 'Rohan P.', rating: 4, comment: 'Quite spicy! Loved the kettle chip crunch.', date: '2026-07-05' }
    ]
  }
];

export const MOCK_ORDERS = [
  {
    id: 'KS-83921',
    userId: 'mock-user-uid',
    customerName: 'Amit Sharma',
    customerEmail: 'user@kashidsnacks.com',
    items: [
      { id: 'saffron-bhujia', name: 'Royal Saffron Bhujia', price: 180, weight: '250g', quantity: 2 },
      { id: 'turmeric-chivda', name: 'Turmeric Diet Chivda', price: 120, weight: '200g', quantity: 1 }
    ],
    subtotal: 480,
    discount: 50,
    total: 430,
    shippingAddress: {
      fullName: 'Amit Sharma',
      addressLine: 'A-404, Shanti Heights, Link Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      phone: '9876543210'
    },
    paymentMethod: 'UPI (Paytm)',
    status: 'Shipped',
    timeline: [
      { status: 'Order Placed', time: '2026-07-15T14:30:00Z', note: 'Order successfully received.' },
      { status: 'Confirmed', time: '2026-07-15T16:00:00Z', note: 'Inventory allocated.' },
      { status: 'Shipped', time: '2026-07-16T11:00:00Z', note: 'Shipped via BlueDart AWB: BD928192' }
    ],
    createdAt: '2026-07-15T14:30:00Z'
  },
  {
    id: 'KS-83918',
    userId: 'mock-user-uid',
    customerName: 'Amit Sharma',
    customerEmail: 'user@kashidsnacks.com',
    items: [
      { id: 'kaju-katli', name: 'Royal Kaju Katli (Silver Foil)', price: 450, weight: '400g', quantity: 1 }
    ],
    subtotal: 450,
    discount: 0,
    total: 450,
    shippingAddress: {
      fullName: 'Amit Sharma',
      addressLine: 'A-404, Shanti Heights, Link Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      phone: '9876543210'
    },
    paymentMethod: 'Credit Card',
    status: 'Delivered',
    timeline: [
      { status: 'Order Placed', time: '2026-07-10T10:15:00Z', note: 'Order placed.' },
      { status: 'Confirmed', time: '2026-07-10T11:30:00Z', note: 'Confirmed.' },
      { status: 'Shipped', time: '2026-07-11T09:00:00Z', note: 'Shipped.' },
      { status: 'Delivered', time: '2026-07-13T16:45:00Z', note: 'Delivered to customer directly.' }
    ],
    createdAt: '2026-07-10T10:15:00Z'
  }
];

export const MOCK_REVIEWS = [
  { id: 1, productName: 'Royal Saffron Bhujia', user: 'Priya K.', rating: 5, comment: 'Absolutely amazing! The hint of saffron makes it so unique and royal. Perfectly crisp.', date: '2026-07-10', status: 'Approved' },
  { id: 2, productName: 'Turmeric Diet Chivda', user: 'Amit M.', rating: 5, comment: 'Super light and crunchy. Best diet snack out there.', date: '2026-07-08', status: 'Approved' },
  { id: 3, productName: 'Royal Kaju Katli', user: 'Shanti L.', rating: 2, comment: 'A bit too sweet for my taste.', date: '2026-07-14', status: 'Pending' }
];

export const MOCK_COUPONS_LIST = [
  { code: 'KASHID10', type: 'Percentage', value: 10, minAmount: 100, active: true },
  { code: 'FESTIVE20', type: 'Percentage', value: 20, minAmount: 500, active: true },
  { code: 'SNACK50', type: 'Fixed Amount', value: 50, minAmount: 200, active: true }
];

// ========================================
// Global State Management
// ========================================

const appState = {
    products: [],
    filteredProducts: [],
    cart: [],
    testimonials: [],
    currentCategory: 'all',
    currentSort: 'featured',
    displayCount: 9,
    testimonialIndex: 0
};

// ========================================
// API Configuration
// ========================================

const API_ENDPOINTS = {
    // Using TheCocktailDB API as cake substitute (free API with rich data)
    cakes: 'https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=Dessert',
    cakeDetails: 'https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=',
    
    // Using RandomUser API for testimonials
    users: 'https://randomuser.me/api/?results=6',
    
    // Using Quotable API for testimonial quotes
    quotes: 'https://api.quotable.io/quotes/random?limit=6'
};

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        // Show loading overlay
        showLoading();
        
        // Initialize event listeners
        setupEventListeners();
        
        // Load data from APIs
        await Promise.all([
            loadProducts(),
            loadTestimonials()
        ]);
        
        // Hide loading overlay
        hideLoading();
        
        // Initialize animations
        initScrollAnimations();
        
    } catch (error) {
        console.error('Initialization error:', error);
        hideLoading();
        showToast('Failed to load data. Please refresh the page.');
    }
}

// ========================================
// Event Listeners Setup
// ========================================

function setupEventListeners() {
    // Navigation
    setupNavigationListeners();
    
    // Filters
    setupFilterListeners();
    
    // Cart
    setupCartListeners();
    
    // Search
    setupSearchListeners();
    
    // Forms
    setupFormListeners();
    
    // Scroll events
    setupScrollListeners();
    
    // Mobile menu
    setupMobileMenu();
}

function setupNavigationListeners() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Smooth scroll
            document.querySelector(target).scrollIntoView({
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            document.getElementById('navMenu').classList.remove('active');
        });
    });
}

function setupFilterListeners() {
    // Category filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            appState.currentCategory = btn.dataset.category;
            filterProducts();
        });
    });
    
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', () => {
        appState.currentSort = sortSelect.value;
        sortProducts();
    });
    
    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.addEventListener('click', () => {
        appState.displayCount += 6;
        renderProducts();
    });
}

function setupCartListeners() {
    const cartBtn = document.getElementById('cartBtn');
    const cartClose = document.getElementById('cartClose');
    const cartSidebar = document.getElementById('cartSidebar');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('active');
    });
    
    cartClose.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
    });
    
    checkoutBtn.addEventListener('click', () => {
        if (appState.cart.length === 0) {
            showToast('Your cart is empty!');
            return;
        }
        showToast('Redirecting to checkout...');
        setTimeout(() => {
            alert('Checkout functionality would be implemented here!');
        }, 1000);
    });
}

function setupSearchListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const searchModal = document.getElementById('searchModal');
    const searchModalClose = document.getElementById('searchModalClose');
    const searchInput = document.getElementById('searchInput');
    
    searchBtn.addEventListener('click', () => {
        searchModal.classList.add('active');
        searchInput.focus();
    });
    
    searchModalClose.addEventListener('click', () => {
        searchModal.classList.remove('active');
    });
    
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            searchModal.classList.remove('active');
        }
    });
    
    searchInput.addEventListener('input', debounce((e) => {
        performSearch(e.target.value);
    }, 300));
}

function setupFormListeners() {
    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail').value;
        showToast(`Thanks for subscribing! Confirmation sent to ${email}`);
        newsletterForm.reset();
    });
    
    // Contact form
    const contactForm = document.getElementById('contactForm');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Message sent successfully! We\'ll get back to you soon.');
        contactForm.reset();
    });
    
    // Custom order button
    const customOrderBtn = document.getElementById('customOrderBtn');
    customOrderBtn.addEventListener('click', () => {
        showToast('Custom order form would open here!');
    });
}

function setupScrollListeners() {
    const header = document.getElementById('header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add shadow when scrolled
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// ========================================
// API Data Loading
// ========================================

async function loadProducts() {
    try {
        // Fetch cocktails data (using as cake substitute)
        const response = await fetch(API_ENDPOINTS.cakes);
        const data = await response.json();
        
        // Transform cocktail data to cake data
        const cocktails = data.drinks.slice(0, 20); // Limit to 20 items
        
        // Fetch detailed information for each item
        const detailedProducts = await Promise.all(
            cocktails.map(async (cocktail) => {
                const detailResponse = await fetch(API_ENDPOINTS.cakeDetails + cocktail.idDrink);
                const detailData = await detailResponse.json();
                const detail = detailData.drinks[0];
                
                return transformToCakeData(detail, cocktails.indexOf(cocktail));
            })
        );
        
        appState.products = detailedProducts;
        appState.filteredProducts = [...detailedProducts];
        
        renderProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to mock data if API fails
        appState.products = generateMockProducts();
        appState.filteredProducts = [...appState.products];
        renderProducts();
    }
}

function transformToCakeData(cocktail, index) {
    const categories = ['wedding', 'birthday', 'chocolate', 'fruit', 'custom'];
    const category = categories[index % categories.length];
    
    // Generate cake name from cocktail name
    const cakeName = cocktail.strDrink
        .replace(/Cocktail/gi, 'Cake')
        .replace(/Drink/gi, 'Delight')
        .replace(/Shot/gi, 'Slice');
    
    // Extract ingredients for description
    const ingredients = [];
    for (let i = 1; i <= 6; i++) {
        if (cocktail[`strIngredient${i}`]) {
            ingredients.push(cocktail[`strIngredient${i}`]);
        }
    }
    
    const description = `Delicious ${cakeName.toLowerCase()} featuring ${ingredients.slice(0, 3).join(', ')}. Perfect for any celebration!`;
    
    return {
        id: cocktail.idDrink,
        name: cakeName,
        category: category,
        price: (Math.random() * 50 + 30).toFixed(2),
        originalPrice: (Math.random() * 30 + 60).toFixed(2),
        image: cocktail.strDrinkThumb,
        description: description.substring(0, 100) + '...',
        rating: (Math.random() * 1.5 + 3.5).toFixed(1),
        reviews: Math.floor(Math.random() * 200 + 20),
        badge: index % 3 === 0 ? 'New' : (index % 3 === 1 ? 'Sale' : null),
        ingredients: ingredients,
        servings: Math.floor(Math.random() * 4 + 6),
        preparationTime: Math.floor(Math.random() * 30 + 30)
    };
}

function generateMockProducts() {
    const mockProducts = [
        {
            id: '1',
            name: 'Classic Chocolate Dream',
            category: 'chocolate',
            price: '45.99',
            originalPrice: '65.99',
            image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
            description: 'Rich chocolate layers with premium cocoa and silky ganache',
            rating: '4.8',
            reviews: 156,
            badge: 'New',
            ingredients: ['Chocolate', 'Cream', 'Sugar', 'Eggs', 'Butter'],
            servings: 8,
            preparationTime: 45
        },
        {
            id: '2',
            name: 'Strawberry Romance',
            category: 'fruit',
            price: '52.99',
            originalPrice: '72.99',
            image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800',
            description: 'Fresh strawberries with vanilla cream in elegant layers',
            rating: '4.9',
            reviews: 203,
            badge: 'Sale',
            ingredients: ['Strawberries', 'Vanilla', 'Cream', 'Sugar'],
            servings: 10,
            preparationTime: 60
        },
        {
            id: '3',
            name: 'Royal Wedding Cake',
            category: 'wedding',
            price: '299.99',
            originalPrice: '399.99',
            image: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800',
            description: 'Three-tier masterpiece perfect for your special day',
            rating: '5.0',
            reviews: 87,
            badge: null,
            ingredients: ['Vanilla', 'Fondant', 'Buttercream', 'Edible Flowers'],
            servings: 50,
            preparationTime: 180
        }
    ];
    
    return mockProducts;
}

async function loadTestimonials() {
    try {
        // Fetch user data for avatars and names
        const usersResponse = await fetch(API_ENDPOINTS.users);
        const usersData = await usersResponse.json();
        
        // Fetch quotes for testimonial text
        const quotesResponse = await fetch(API_ENDPOINTS.quotes);
        const quotesData = await quotesResponse.json();
        
        // Combine data
        appState.testimonials = usersData.results.map((user, index) => ({
            name: `${user.name.first} ${user.name.last}`,
            avatar: user.picture.large,
            role: ['Happy Customer', 'Wedding Client', 'Birthday Client', 'Corporate Client', 'Regular Customer', 'Event Planner'][index],
            rating: (Math.random() * 0.5 + 4.5).toFixed(1),
            text: quotesData[index]?.content || "Absolutely amazing cakes! The quality and taste exceeded all expectations. Will definitely order again!",
            date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString()
        }));
        
        renderTestimonials();
        startTestimonialSlider();
        
    } catch (error) {
        console.error('Error loading testimonials:', error);
        // Fallback to mock testimonials
        appState.testimonials = generateMockTestimonials();
        renderTestimonials();
        startTestimonialSlider();
    }
}

function generateMockTestimonials() {
    return [
        {
            name: 'Sarah Johnson',
            avatar: 'https://i.pravatar.cc/150?img=1',
            role: 'Wedding Client',
            rating: '5.0',
            text: 'The wedding cake was absolutely stunning! Our guests couldn\'t stop raving about it. Perfect in every way!',
            date: '2024-01-15'
        },
        {
            name: 'Michael Chen',
            avatar: 'https://i.pravatar.cc/150?img=2',
            role: 'Birthday Client',
            rating: '4.9',
            text: 'Ordered a custom birthday cake and it exceeded all expectations. The attention to detail was incredible!',
            date: '2024-01-20'
        },
        {
            name: 'Emily Rodriguez',
            avatar: 'https://i.pravatar.cc/150?img=3',
            role: 'Happy Customer',
            rating: '5.0',
            text: 'Best cakes in town! Fresh ingredients, beautiful presentation, and heavenly taste. Highly recommended!',
            date: '2024-01-25'
        }
    ];
}

// ========================================
// Rendering Functions
// ========================================

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const displayProducts = appState.filteredProducts.slice(0, appState.displayCount);
    
    productsGrid.innerHTML = displayProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image-wrapper">
                <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
                ${product.badge ? `<span class="product-badge ${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
                <div class="product-actions">
                    <button class="action-btn quick-view-btn" data-id="${product.id}" title="Quick View">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="action-btn add-to-cart-quick" data-id="${product.id}" title="Add to Cart">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-rating">
                    <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</span>
                    <span class="rating-count">(${product.reviews})</span>
                </div>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div>
                        <span class="product-price">$${product.price}</span>
                        ${product.originalPrice ? `<span class="price-original">$${product.originalPrice}</span>` : ''}
                    </div>
                    <button class="add-to-cart-btn" data-id="${product.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to product cards
    attachProductEventListeners();
    
    // Hide load more button if all products are displayed
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (appState.displayCount >= appState.filteredProducts.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

function attachProductEventListeners() {
    // Quick view buttons
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.id;
            showProductModal(productId);
        });
    });
    
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn, .add-to-cart-quick').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.id;
            addToCart(productId);
        });
    });
    
    // Product card click (open modal)
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const productId = card.dataset.id;
            showProductModal(productId);
        });
    });
}

function renderTestimonials() {
    const testimonialsSlider = document.getElementById('testimonialsSlider');
    const sliderDots = document.getElementById('sliderDots');
    
    testimonialsSlider.innerHTML = appState.testimonials.map(testimonial => `
        <div class="testimonial-card">
            <div class="testimonial-header">
                <img src="${testimonial.avatar}" alt="${testimonial.name}" class="testimonial-avatar">
                <div class="testimonial-author">
                    <h4>${testimonial.name}</h4>
                    <p>${testimonial.role}</p>
                </div>
            </div>
            <div class="testimonial-rating">
                ${'★'.repeat(Math.floor(testimonial.rating))}${'☆'.repeat(5 - Math.floor(testimonial.rating))}
            </div>
            <p class="testimonial-text">"${testimonial.text}"</p>
        </div>
    `).join('');
    
    sliderDots.innerHTML = appState.testimonials.map((_, index) => `
        <span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
    `).join('');
    
    // Add event listeners to dots
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            scrollToTestimonial(index);
        });
    });
}

function startTestimonialSlider() {
    const slider = document.getElementById('testimonialsSlider');
    const dots = document.querySelectorAll('.dot');
    
    setInterval(() => {
        appState.testimonialIndex = (appState.testimonialIndex + 1) % appState.testimonials.length;
        scrollToTestimonial(appState.testimonialIndex);
    }, 5000);
}

function scrollToTestimonial(index) {
    const slider = document.getElementById('testimonialsSlider');
    const cards = slider.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.dot');
    
    if (cards[index]) {
        cards[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
        
        appState.testimonialIndex = index;
    }
}

// ========================================
// Product Filtering and Sorting
// ========================================

function filterProducts() {
    if (appState.currentCategory === 'all') {
        appState.filteredProducts = [...appState.products];
    } else {
        appState.filteredProducts = appState.products.filter(
            product => product.category === appState.currentCategory
        );
    }
    
    sortProducts();
    appState.displayCount = 9;
    renderProducts();
}

function sortProducts() {
    switch (appState.currentSort) {
        case 'price-low':
            appState.filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            break;
        case 'price-high':
            appState.filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            break;
        case 'rating':
            appState.filteredProducts.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
            break;
        case 'newest':
            appState.filteredProducts.reverse();
            break;
        default:
            // Featured - original order
            break;
    }
    
    renderProducts();
}

function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    
    if (!query.trim()) {
        searchResults.innerHTML = '';
        return;
    }
    
    const results = appState.products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
    );
    
    if (results.length === 0) {
        searchResults.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No cakes found</p>';
        return;
    }
    
    searchResults.innerHTML = results.map(product => `
        <div class="search-result-item" data-id="${product.id}">
            <img src="${product.image}" alt="${product.name}" class="search-result-image">
            <div>
                <h4>${product.name}</h4>
                <p style="color: var(--text-muted); font-size: 0.9rem;">${product.category}</p>
                <p style="color: var(--primary-color); font-weight: 600;">$${product.price}</p>
            </div>
        </div>
    `).join('');
    
    // Add click listeners
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const productId = item.dataset.id;
            document.getElementById('searchModal').classList.remove('active');
            showProductModal(productId);
        });
    });
}

// ========================================
// Cart Management
// ========================================

function addToCart(productId) {
    const product = appState.products.find(p => p.id === productId);
    
    if (!product) return;
    
    const existingItem = appState.cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        appState.cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    showToast(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
    appState.cart = appState.cart.filter(item => item.id !== productId);
    updateCart();
    showToast('Item removed from cart');
}

function updateCartQuantity(productId, change) {
    const item = appState.cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCart();
        }
    }
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const totalAmount = document.getElementById('totalAmount');
    
    // Update cart count
    const totalItems = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (appState.cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        totalAmount.textContent = '$0.00';
        return;
    }
    
    // Render cart items
    cartItems.innerHTML = appState.cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');
    
    // Calculate total
    const total = appState.cart.reduce((sum, item) => 
        sum + (parseFloat(item.price) * item.quantity), 0
    );
    totalAmount.textContent = `$${total.toFixed(2)}`;
}

// ========================================
// Product Modal
// ========================================

function showProductModal(productId) {
    const product = appState.products.find(p => p.id === productId);
    
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const modalContent = document.getElementById('productModalContent');
    
    modalContent.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
            <div>
                <img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: var(--radius-lg);">
            </div>
            <div>
                <span style="color: var(--text-muted); text-transform: uppercase; font-size: 0.85rem;">${product.category}</span>
                <h2 style="font-family: var(--font-display); font-size: 2rem; margin: 0.5rem 0;">${product.name}</h2>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="color: var(--accent-color);">
                        ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                    </div>
                    <span style="color: var(--text-muted);">${product.rating} (${product.reviews} reviews)</span>
                </div>
                <p style="color: var(--text-light); line-height: 1.7; margin-bottom: 1.5rem;">${product.description}</p>
                
                <div style="background: var(--bg-light); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Details</h3>
                    <div style="display: grid; gap: 0.8rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Servings:</span>
                            <span style="font-weight: 600;">${product.servings} people</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Prep Time:</span>
                            <span style="font-weight: 600;">${product.preparationTime} mins</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Ingredients:</span>
                            <span style="font-weight: 600;">${product.ingredients.length}+ items</span>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    <span style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">$${product.price}</span>
                    ${product.originalPrice ? `<span style="text-decoration: line-through; color: var(--text-muted);">$${product.originalPrice}</span>` : ''}
                </div>
                
                <button class="btn btn-primary" style="width: 100%;" onclick="addToCart('${product.id}'); document.getElementById('productModal').classList.remove('active');">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    Add to Cart
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Close modal on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    };
    
    document.getElementById('productModalClose').onclick = () => {
        modal.classList.remove('active');
    };
}

// ========================================
// Utility Functions
// ========================================

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    setTimeout(() => {
        loadingOverlay.classList.add('hidden');
    }, 500);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.product-card, .feature-item, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ========================================
// Make functions globally available
// ========================================

window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;
window.showProductModal = showProductModal;

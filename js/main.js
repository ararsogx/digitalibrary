// Main JS - Shared Logic

// Wait for Firebase to load
document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker: Registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker: Registration failed:', error);
                });
        });
    }

    // Night Mode Toggle
    initNightMode();

    // Check Auth State
    auth.onAuthStateChanged(user => {
        const authButtons = document.getElementById('auth-buttons');
        const userProfile = document.getElementById('user-profile');
        const userEmail = document.getElementById('user-email');
        const adminLink = document.getElementById('admin-link');
        const myBooksLink = document.getElementById('my-books-link');
        const cartCount = document.getElementById('cart-count');

        if (user) {
            // User is signed in
            if (authButtons) authButtons.style.display = 'none';
            if (myBooksLink) myBooksLink.style.display = 'block';
            updateCartCount();
            if (userProfile) {
                userProfile.style.display = 'flex';
                userProfile.style.alignItems = 'center';
                userProfile.style.gap = '15px';
            }
            if (userEmail) userEmail.textContent = user.email;

            // Check if user is admin (Simple check for now)
            checkIfAdmin(user);
        } else {
            // User is signed out
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
        }
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active-mobile');
            // Add CSS for active-mobile in style.css later if needed
        });
    }

    // Logout Functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            }).catch(error => {
                console.error('Logout error:', error);
            });
        });
    }

    // Load Featured Book if on index.html
    if (document.getElementById('featured-book-hero')) {
        loadSingleFeaturedBook();
    }
});

// Load Single Featured Book for Landing Page
function loadSingleFeaturedBook() {
    const heroContainer = document.getElementById('featured-book-hero');
    
    // Fetch only the first premium book to sell
    db.collection('books').where('type', '==', 'premium').limit(1).get().then(snapshot => {
        heroContainer.innerHTML = '';
        if (snapshot.empty) {
            heroContainer.innerHTML = '<p class="text-center">Book currently unavailable.</p>';
            return;
        }

        const doc = snapshot.docs[0];
        const book = doc.data();
        const bookId = doc.id;

        heroContainer.innerHTML = `
            <div class="hero-content" data-aos="fade-right">
                <span class="category">Exclusive Premium Release</span>
                <h1 style="font-size: clamp(2.5rem, 5vw, 4rem);">${book.title}</h1>
                <p style="font-size: 1.2rem; line-height: 1.6; margin-bottom: 40px; opacity: 0.9;">${book.description || 'Get exclusive access to this premium digital content. Available for instant reading after purchase.'}</p>
                <div class="hero-btns" style="display: flex; gap: 20px;">
                    <a href="book-details.html?id=${bookId}" class="btn btn-primary btn-lg">
                        <i class="fas fa-shopping-bag"></i> Get It Now - ${book.price} Birr
                    </a>
                    <a href="#features" class="btn btn-outline btn-lg">View Details</a>
                </div>
            </div>
            <div class="hero-image" data-aos="fade-left" style="perspective: 1000px;">
                <img src="${book.coverUrl || 'https://images.unsplash.com/photo-1481627564523-44752a74a06f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}" 
                     alt="${book.title}" 
                     style="transform: rotateY(-15deg) rotateX(5deg); border-radius: 20px; box-shadow: -20px 20px 50px rgba(0,0,0,0.2);">
            </div>
        `;
    }).catch(error => {
        console.error("Error loading featured book:", error);
        heroContainer.innerHTML = '<p class="text-center">Error loading book details.</p>';
    });
}

// Night Mode Initialization
function initNightMode() {
    const body = document.body;
    const nightModeToggle = document.createElement('div');
    nightModeToggle.className = 'night-mode-toggle';
    nightModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    nightModeToggle.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--primary-color);
        color: white;
        width: 56px;
        height: 56px;
        border-radius: 18px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 1000;
        box-shadow: var(--shadow-lg);
        font-size: 1.2rem;
    `;
    document.body.appendChild(nightModeToggle);

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateToggleIcon(savedTheme, nightModeToggle);

    nightModeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleIcon(newTheme, nightModeToggle);
    });
}

function updateToggleIcon(theme, toggle) {
    toggle.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// Cart functionality
function updateCartCount() {
    const user = auth.currentUser;
    if (user) {
        db.collection('users').doc(user.uid).collection('cart').get().then(snapshot => {
            const count = snapshot.size;
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = count;
                cartCountElement.style.display = count > 0 ? 'inline-block' : 'none';
            }
        });
    }
}

function addToCart(book, bookId) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please login to add books to cart.');
        window.location.href = 'auth.html';
        return;
    }

    db.collection('users').doc(user.uid).collection('cart').doc(bookId).set({
        title: book.title,
        price: book.price || 0,
        coverUrl: book.coverUrl || '',
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('Book added to cart!');
        updateCartCount();
    }).catch(error => {
        console.error("Error adding to cart:", error);
    });
}

// Admin check logic
function checkIfAdmin(user) {
    const adminLink = document.getElementById('admin-link');
    // For demo purposes, we can hardcode an admin email or check a custom claim/Firestore field
    // Here we'll check if the user is in an 'admins' collection or has a specific email
    db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists && doc.data().isAdmin) {
            if (adminLink) adminLink.style.display = 'block';
        }
    }).catch(error => {
        console.error("Error checking admin status:", error);
    });
}

// Load Featured Books
function loadFeaturedBooks() {
    const featuredList = document.getElementById('featured-list');
    
    db.collection('books').limit(4).get().then(snapshot => {
        featuredList.innerHTML = '';
        if (snapshot.empty) {
            featuredList.innerHTML = '<p class="text-center">No books available yet.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const book = doc.data();
            const bookId = doc.id;
            const bookCard = createBookCard(book, bookId);
            featuredList.appendChild(bookCard);
        });
    }).catch(error => {
        console.error("Error loading featured books:", error);
        featuredList.innerHTML = '<p class="text-center">Error loading books.</p>';
    });
}

// Helper function to create book card
function createBookCard(book, id) {
    const div = document.createElement('div');
    div.className = 'book-card';
    div.setAttribute('data-aos', 'fade-up');
    
    div.innerHTML = `
        <img src="${book.coverUrl || 'https://via.placeholder.com/220x300?text=No+Cover'}" alt="${book.title}" class="book-img">
        <div class="book-info">
            <h3>${book.title}</h3>
            <p class="book-author">${book.author}</p>
            <div class="book-actions" style="display: flex; gap: 5px; flex-wrap: wrap;">
                <a href="book-details.html?id=${id}" class="btn btn-outline btn-sm">Details</a>
                ${book.type === 'premium' ? `<button onclick="addToCart(${JSON.stringify(book).replace(/"/g, '&quot;')}, '${id}')" class="btn btn-primary btn-sm"><i class="fas fa-cart-plus"></i></button>` : ''}
            </div>
        </div>
    `;
    return div;
}

// Export for other scripts if needed
window.createBookCard = createBookCard;
window.addToCart = addToCart;

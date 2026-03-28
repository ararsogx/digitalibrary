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
            heroContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Book currently unavailable.</p>';
            return;
        }

        const doc = snapshot.docs[0];
        const book = doc.data();
        const bookId = doc.id;

        heroContainer.innerHTML = `
            <div class="hero-content" data-aos="fade-right">
                <span class="category" style="margin-bottom: 24px; display: inline-block; background: rgba(124, 58, 237, 0.1); color: var(--primary);">Exclusive Release</span>
                <h1 style="margin-bottom: 32px; font-size: clamp(3rem, 7vw, 5.5rem); line-height: 0.9;">${book.title}</h1>
                <p style="margin-bottom: 48px; font-size: 1.25rem; opacity: 0.8; max-width: 500px;">${book.description || 'Experience the digital masterpiece. Instant access to the premium edition.'}</p>
                <div class="hero-btns" style="display: flex; gap: 20px;">
                    <a href="book-details.html?id=${bookId}" class="btn btn-primary btn-lg">
                        Buy Now &mdash; ${book.price} ETB
                    </a>
                    <a href="#features" class="btn btn-outline btn-lg">Details</a>
                </div>
            </div>
            <div class="hero-image" data-aos="fade-left">
                <div style="position: relative;">
                    <div style="position: absolute; inset: -20px; background: var(--primary); filter: blur(60px); opacity: 0.15; z-index: -1;"></div>
                    <img src="${book.coverUrl || 'https://images.unsplash.com/photo-1481627564523-44752a74a06f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}" 
                         alt="${book.title}" 
                         style="width: 100%; border-radius: 40px; transform: perspective(1000px) rotateY(-5deg);">
                </div>
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
    div.className = 'feature-card';
    div.style.cssText = `
        padding: 30px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    `;
    div.setAttribute('data-aos', 'fade-up');
    
    const isPremium = book.type === 'premium';
    
    div.innerHTML = `
        <div style="position: relative; border-radius: 20px; overflow: hidden; height: 350px;">
            <img src="${book.coverUrl || 'https://via.placeholder.com/220x300?text=No+Cover'}" alt="${book.title}" 
                 style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; bottom: 20px; left: 20px;">
                <span class="category" style="background: var(--primary); color: white;">
                    ${isPremium ? `${book.price} ETB` : 'FREE'}
                </span>
            </div>
        </div>
        <div style="flex-grow: 1;">
            <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 8px;">${book.title}</h3>
            <p style="color: var(--text-dim); font-size: 0.95rem;">${book.author}</p>
        </div>
        <div style="display: flex; gap: 15px;">
            <a href="book-details.html?id=${id}" class="btn btn-primary btn-sm" style="flex-grow: 1;">Access</a>
            ${isPremium ? `
            <button onclick="addToCart(${JSON.stringify(book).replace(/"/g, '&quot;')}, '${id}')" 
                    class="btn btn-outline btn-sm" style="width: 50px; padding: 0;">
                <i class="fas fa-plus"></i>
            </button>` : ''}
        </div>
    `;
    return div;
}

// Export for other scripts if needed
window.createBookCard = createBookCard;
window.addToCart = addToCart;

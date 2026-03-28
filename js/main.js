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

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Check Auth State
    auth.onAuthStateChanged(user => {
        const authButtons = document.getElementById('auth-buttons');
        const userProfile = document.getElementById('user-profile');
        const userEmail = document.getElementById('user-email');
        const adminLink = document.getElementById('admin-link');
        const myBooksLink = document.getElementById('my-books-link');

        if (user) {
            // User is signed in
            if (authButtons) authButtons.style.display = 'none';
            if (myBooksLink) myBooksLink.style.display = 'block';
            if (userProfile) {
                userProfile.style.display = 'flex';
                userProfile.style.alignItems = 'center';
                userProfile.style.gap = '15px';
            }
            if (userEmail) userEmail.textContent = user.email;

            // Check if user is admin
            checkIfAdmin(user);
        } else {
            // User is signed out
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
            if (myBooksLink) myBooksLink.style.display = 'none';
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
    db.collection('books').where('type', '==', 'premium').limit(1).get().then(async snapshot => {
        heroContainer.innerHTML = '';
        if (snapshot.empty) {
            heroContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Asset currently unavailable.</p>';
            return;
        }

        const doc = snapshot.docs[0];
        const book = doc.data();
        const bookId = doc.id;

        // Check if user already owns it
        let ownsBook = false;
        const user = auth.currentUser;
        if (user) {
            const purchaseDoc = await db.collection('users').doc(user.uid).collection('purchasedBooks').doc(bookId).get();
            ownsBook = purchaseDoc.exists;
        }

        heroContainer.innerHTML = `
            <div class="hero-content" data-aos="fade-right">
                <span class="category">Premium Edition</span>
                <h1>${book.title}</h1>
                <p>${book.description || 'Experience the digital masterpiece. Instant access to the premium edition.'}</p>
                <div class="hero-btns">
                    ${ownsBook ? 
                        `<a href="my-books.html" class="btn btn-primary btn-lg">Read Edition Now</a>` :
                        `<a href="book-details.html?id=${bookId}" class="btn btn-primary btn-lg">Get It Now &mdash; ${book.price} ETB</a>`
                    }
                    <a href="#features" class="btn btn-outline btn-lg">Learn More</a>
                </div>
            </div>
            <div class="hero-image" data-aos="fade-left">
                <div class="image-glow-wrapper">
                    <img src="${book.coverUrl || 'https://images.unsplash.com/photo-1481627564523-44752a74a06f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}" alt="${book.title}">
                </div>
            </div>
        `;
    }).catch(error => {
        console.error("Error loading featured book:", error);
        heroContainer.innerHTML = '<p class="text-center">Error loading asset details.</p>';
    });
}

// Night Mode Initialization
function initNightMode() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const nightModeToggle = document.querySelector('.night-mode-toggle');
    if (nightModeToggle) {
        updateToggleIcon(savedTheme, nightModeToggle);
        nightModeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleIcon(newTheme, nightModeToggle);
        });
    }
}

function updateToggleIcon(theme, toggle) {
    toggle.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
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
    div.className = 'glass-card book-card-v2';
    div.setAttribute('data-aos', 'fade-up');
    
    const isPremium = book.type === 'premium';
    
    div.innerHTML = `
        <div class="card-image">
            <img src="${book.coverUrl || 'https://via.placeholder.com/220x300?text=No+Cover'}" alt="${book.title}">
            <div class="card-badge">
                <span class="category">${isPremium ? `${book.price} ETB` : 'FREE'}</span>
            </div>
        </div>
        <div class="card-content">
            <h3>${book.title}</h3>
            <p>${book.author}</p>
            <div class="card-footer">
                <a href="book-details.html?id=${id}" class="btn btn-primary btn-sm">Access</a>
            </div>
        </div>
    `;
    return div;
}

// Export for other scripts if needed
window.createBookCard = createBookCard;

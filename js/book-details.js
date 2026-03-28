// Book Details Logic - Fetching Single Book and Viewing

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    const bookDetailContainer = document.getElementById('book-detail-container');

    if (!bookId) {
        bookDetailContainer.innerHTML = '<p class="text-center">Book not found. <a href="index.html">Back to Home</a></p>';
        return;
    }

    // Fetch book details from Firestore
    db.collection('books').doc(bookId).get().then(async doc => {
        if (!doc.exists) {
            bookDetailContainer.innerHTML = '<p class="text-center">Book not found.</p>';
            return;
        }

        const book = doc.data();
        const isPremium = book.type === 'premium';
        const price = book.price || 0;
        let hasAccess = !isPremium; // Free books have access by default

        // Check if user has purchased the book
        const user = auth.currentUser;
        if (user && isPremium) {
            const purchaseDoc = await db.collection('users').doc(user.uid).collection('purchasedBooks').doc(bookId).get();
            if (purchaseDoc.exists) {
                hasAccess = true;
            }
        }

        bookDetailContainer.innerHTML = `
            <div class="book-detail-grid">
                <div class="detail-img" data-aos="fade-right">
                    <div class="image-glow-wrapper">
                        <img src="${book.coverUrl || 'https://via.placeholder.com/400x600?text=No+Cover'}" alt="${book.title}">
                    </div>
                </div>
                <div class="detail-info" data-aos="fade-left">
                    <span class="category">Premium Experience</span>
                    <h1>${book.title}</h1>
                    <p class="author">${book.author}</p>
                    
                    <div class="price-tag">
                        <span class="price-label">Valuation</span>
                        <span class="price-value">${isPremium ? `${price} ETB` : 'FREE'}</span>
                    </div>

                    <div class="description">
                        <p>${book.description || 'Access the complete premium digital edition. Your purchase includes lifetime access and future updates.'}</p>
                    </div>

                    <div class="detail-actions">
                        ${hasAccess ? 
                            (book.fileUrl ? 
                                `<a href="${book.fileUrl}" target="_blank" class="btn btn-primary btn-lg">
                                    Unlock Edition
                                </a>` : 
                                `<p class="text-muted">Digital asset pending.</p>`) :
                            `<button id="buy-btn" class="btn btn-primary btn-lg">
                                Get Lifetime Access
                            </button>`
                        }
                        <a href="index.html" class="btn btn-outline btn-lg">
                            <i class="fas fa-chevron-left"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;

        // Add event listener for the buy button
        const buyBtn = document.getElementById('buy-btn');
        if (buyBtn) {
            buyBtn.addEventListener('click', () => {
                handleTelebirrPayment(book, bookId);
            });
        }
    }).catch(error => {
        console.error("Error fetching book details:", error);
        bookDetailContainer.innerHTML = '<p class="text-center">Error loading book details.</p>';
    });
});

// Telebirr Payment Redirect
function handleTelebirrPayment(book, bookId) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please login to purchase books.');
        window.location.href = 'auth.html';
        return;
    }

    // Redirect to the new payment information and instruction page
    window.location.href = `payment.html?bookId=${bookId}&amount=${book.price}&isCart=false`;
}

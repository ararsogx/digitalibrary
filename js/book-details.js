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
            <div class="book-detail-grid glass p-5" style="border-radius: 32px; align-items: center;">
                <div class="detail-img" data-aos="fade-right">
                    <img src="${book.coverUrl || 'https://via.placeholder.com/400x600?text=No+Cover'}" alt="${book.title}" style="box-shadow: -20px 20px 50px rgba(0,0,0,0.2);">
                </div>
                <div class="detail-info" data-aos="fade-left">
                    <span class="category">${book.category || 'Premium Content'}</span>
                    <h1 style="font-weight: 800; line-height: 1.1;">${book.title}</h1>
                    <p class="author" style="font-size: 1.2rem; font-weight: 600; color: var(--primary-color); margin-bottom: 24px;">by ${book.author}</p>
                    
                    <div style="margin-bottom: 30px; display: flex; gap: 10px; align-items: center;">
                        <span class="category" style="background: ${isPremium ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${isPremium ? 'var(--accent-color)' : 'var(--success)'}; margin-bottom: 0;">
                            ${isPremium ? `${price} Birr` : 'Free Access'}
                        </span>
                        ${hasAccess && isPremium ? '<span class="category" style="background: rgba(16, 185, 129, 0.1); color: var(--success); margin-bottom: 0;"><i class="fas fa-check-circle"></i> Purchased</span>' : ''}
                    </div>

                    <div class="description" style="margin-bottom: 40px; color: var(--gray); font-size: 1.1rem; line-height: 1.7;">
                        <p>${book.description || 'Get exclusive access to this premium digital content. Available for instant reading or download after payment verification.'}</p>
                    </div>

                    <div class="detail-actions" style="display: flex; gap: 20px;">
                        ${hasAccess ? 
                            (book.fileUrl ? 
                                `<a href="${book.fileUrl}" target="_blank" class="btn btn-primary btn-lg" style="border-radius: 15px;">
                                    <i class="fas fa-book-reader"></i> Read / Download Now
                                </a>` : 
                                `<p class="text-muted">No digital file available for this book.</p>`) :
                            `<button id="buy-btn" class="btn btn-primary btn-lg" style="border-radius: 15px;">
                                <i class="fas fa-shopping-bag"></i> Unlock for ${price} Birr
                            </button>`
                        }
                        <a href="index.html" class="btn btn-outline btn-lg" style="border-radius: 15px; border: none;">
                            <i class="fas fa-arrow-left"></i> Back to Home
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

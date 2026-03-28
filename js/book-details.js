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
            <div class="book-detail-grid" style="align-items: center;">
                <div class="detail-img" data-aos="fade-right">
                    <div style="position: relative;">
                        <div style="position: absolute; inset: -30px; background: var(--primary); filter: blur(80px); opacity: 0.1; z-index: -1;"></div>
                        <img src="${book.coverUrl || 'https://via.placeholder.com/400x600?text=No+Cover'}" 
                             alt="${book.title}" 
                             style="width: 100%; border-radius: 40px; transform: perspective(1000px) rotateY(-8deg);">
                    </div>
                </div>
                <div class="detail-info" data-aos="fade-left">
                    <span class="category" style="margin-bottom: 24px; display: inline-block; background: rgba(124, 58, 237, 0.1); color: var(--primary);">Premium Experience</span>
                    <h1 style="margin-bottom: 16px; font-size: clamp(3rem, 6vw, 5rem); line-height: 0.95;">${book.title}</h1>
                    <p class="author" style="font-size: 1.5rem; font-weight: 500; color: var(--text-dim); margin-bottom: 40px;">${book.author}</p>
                    
                    <div style="margin-bottom: 48px; display: flex; gap: 20px; align-items: center;">
                        <div style="padding: 15px 30px; background: var(--surface); border-radius: 20px; border: 1px solid var(--glass-border);">
                            <span style="display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-dim); margin-bottom: 4px;">Price</span>
                            <span style="font-size: 1.8rem; font-weight: 800; color: var(--text);">${isPremium ? `${price} ETB` : 'FREE'}</span>
                        </div>
                        ${hasAccess && isPremium ? '<div style="color: var(--secondary); font-weight: 700;"><i class="fas fa-circle-check"></i> Ownership Confirmed</div>' : ''}
                    </div>

                    <div class="description" style="margin-bottom: 60px; color: var(--text-dim); font-size: 1.25rem; line-height: 1.7; max-width: 600px;">
                        <p>${book.description || 'Access the complete premium digital edition. Your purchase includes lifetime access and future updates.'}</p>
                    </div>

                    <div class="detail-actions" style="display: flex; gap: 25px; align-items: center;">
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

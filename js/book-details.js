// Book Details Logic - Fetching Single Book and Viewing

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    const bookDetailContainer = document.getElementById('book-detail-container');

    if (!bookId) {
        bookDetailContainer.innerHTML = '<p class="text-center">Book not found. <a href="catalog.html">Back to Catalog</a></p>';
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
                <div class="detail-img">
                    <img src="${book.coverUrl || 'https://via.placeholder.com/400x600?text=No+Cover'}" alt="${book.title}">
                </div>
                <div class="detail-info">
                    <h1>${book.title}</h1>
                    <p class="author">by ${book.author}</p>
                    <div style="margin-bottom: 15px;">
                        <span class="category">${book.category || 'Uncategorized'}</span>
                        <span class="category" style="background-color: ${isPremium ? '#ffeaa7' : '#55efc4'}">
                            ${isPremium ? `Premium: ${price} Birr` : 'Free'}
                        </span>
                        ${hasAccess && isPremium ? '<span class="category" style="background-color: #55efc4; margin-left: 5px;">Purchased</span>' : ''}
                    </div>
                    <div class="description">
                        <p>${book.description || 'No description available.'}</p>
                    </div>
                    <div class="detail-actions">
                        ${hasAccess ? 
                            (book.fileUrl ? 
                                `<a href="${book.fileUrl}" target="_blank" class="btn btn-primary btn-lg">Read / Download</a>` : 
                                `<p class="text-muted">No digital file available for this book.</p>`) :
                            `<button id="buy-btn" class="btn btn-primary btn-lg">
                                <i class="fas fa-shopping-cart"></i> Buy with Telebirr
                            </button>`
                        }
                        <a href="catalog.html" class="btn btn-outline btn-lg">Back to Catalog</a>
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

// My Books Logic - Display purchased books

document.addEventListener('DOMContentLoaded', () => {
    const myBooksList = document.getElementById('my-books-list');

    auth.onAuthStateChanged(user => {
        if (user) {
            fetchMyBooks(user.uid);
        } else {
            window.location.href = 'auth.html';
        }
    });

    async function fetchMyBooks(userId) {
        try {
            // Get purchased book IDs
            const purchaseSnapshot = await db.collection('users').doc(userId).collection('purchasedBooks').get();
            
            if (purchaseSnapshot.empty) {
                myBooksList.innerHTML = `
                    <div class="text-center" style="grid-column: 1/-1;">
                        <p>You haven't purchased any books yet.</p>
                        <a href="catalog.html" class="btn btn-primary mt-3">Browse Catalog</a>
                    </div>
                `;
                return;
            }

            myBooksList.innerHTML = '';
            
            // For each purchase, fetch the book details
            for (const doc of purchaseSnapshot.docs) {
                const bookId = doc.id;
                const bookDoc = await db.collection('books').doc(bookId).get();
                
                if (bookDoc.exists) {
                    const book = bookDoc.data();
                    const bookCard = createBookCard(book, bookId);
                    myBooksList.appendChild(bookCard);
                }
            }
        } catch (error) {
            console.error("Error fetching my books:", error);
            myBooksList.innerHTML = '<p class="text-center">Error loading your books.</p>';
        }
    }
});

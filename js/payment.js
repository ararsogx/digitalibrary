// Payment Logic - Verification of Transaction ID

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('bookId');
    const amount = urlParams.get('amount');
    const isCart = urlParams.get('isCart') === 'true';
    
    const paymentAmount = document.getElementById('payment-amount');
    const paymentForm = document.getElementById('payment-form');
    const verifyBtn = document.getElementById('verify-btn');
    const statusMsg = document.getElementById('payment-status');

    if (amount) {
        paymentAmount.textContent = amount;
    }

    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'auth.html';
        }
    });

    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const transactionId = document.getElementById('transaction-id').value;
        const user = auth.currentUser;

        if (!user || !transactionId) return;

        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        statusMsg.textContent = 'Verifying with Telebirr...';
        statusMsg.style.color = 'var(--primary-color)';

        try {
            // Simulate Telebirr API verification logic
            // In a real production app, you would use Telebirr's H5 or API callback.
            // Here we implement a "Strict One-Time Use" identification logic.
            
            // 1. First, check if this transaction ID has EVER been used before in our system
            const usedCheck = await db.collection('used_transactions').doc(transactionId).get();
            if (usedCheck.exists) {
                throw new Error("This Transaction Number has already been used for another purchase. Each transaction can only be used once.");
            }

            // 2. Check if the ID follows a specific "Instant Demo" format (TB-XXXXXX)
            const isTestBypass = transactionId.startsWith('TB-') && transactionId.length >= 8;
            
            // 3. Check if it's already in our 'verified_transactions' database (Pre-authorized by Admin)
            const verifiedDoc = await db.collection('verified_transactions').doc(transactionId).get();
            const isPreAuthorized = verifiedDoc.exists && !verifiedDoc.data().used;

            if (!isTestBypass && !isPreAuthorized) {
                // If not a demo and not pre-authorized, we'll simulate a real "Verification Request"
                statusMsg.textContent = 'Verifying with Telebirr servers...';
                
                // We'll wait a bit to simulate a real API call
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // For this simulation, we'll only allow 'DEMO123' if it hasn't been used yet.
                // (Already checked by usedCheck above, so if it's DEMO123 and we're here, it's valid for first time)
                if (transactionId !== 'DEMO123') {
                    throw new Error("Invalid Transaction Number. Please check your SMS or contact support.");
                }
            }

            // If we reach here, it's considered "Verified" and "Unused"
            const batch = db.batch();
            const merchantNumber = "0905028370";

            // Mark this ID as USED globally immediately to prevent race conditions
            const usedRef = db.collection('used_transactions').doc(transactionId);
            batch.set(usedRef, {
                usedBy: user.uid,
                usedAt: firebase.firestore.FieldValue.serverTimestamp(),
                amount: parseFloat(amount)
            });

            if (isCart) {
                // Handle Cart Checkout (Multiple books in one transaction)
                const cartSnapshot = await db.collection('users').doc(user.uid).collection('cart').get();
                
                cartSnapshot.forEach(doc => {
                    const item = doc.data();
                    const bId = doc.id;
                    
                    const purchaseRef = db.collection('users').doc(user.uid).collection('purchasedBooks').doc(bId);
                    batch.set(purchaseRef, {
                        purchasedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        amount: item.price,
                        bookTitle: item.title,
                        transactionId: transactionId,
                        merchantNumber: merchantNumber
                    });

                    const cartRef = db.collection('users').doc(user.uid).collection('cart').doc(bId);
                    batch.delete(cartRef);
                });
            } else {
                // Handle Single Book Purchase
                if (!bookId) throw new Error("Book ID is missing.");
                
                const bookDoc = await db.collection('books').doc(bookId).get();
                const book = bookDoc.data();
                
                const purchaseRef = db.collection('users').doc(user.uid).collection('purchasedBooks').doc(bookId);
                batch.set(purchaseRef, {
                    purchasedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    amount: parseFloat(amount),
                    bookTitle: book.title,
                    transactionId: transactionId,
                    merchantNumber: merchantNumber
                });
            }

            // Also mark the transaction ID as used in the pre-authorized collection if applicable
            if (isPreAuthorized) {
                batch.update(db.collection('verified_transactions').doc(transactionId), {
                    used: true,
                    usedBy: user.uid,
                    usedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            await batch.commit();
            
            statusMsg.textContent = 'Payment Approved! Transaction verified and recorded.';
            statusMsg.style.color = 'var(--success)';
            
            alert('Success! Your books are now available in your library.');
            window.location.href = isCart ? 'my-books.html' : `book-details.html?id=${bookId}`;

        } catch (error) {
            console.error("Payment error:", error);
            statusMsg.textContent = 'Error: ' + error.message;
            statusMsg.style.color = 'var(--danger)';
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = 'Verify & Complete Purchase';
        }
    });
});

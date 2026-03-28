// Cart Logic - Displaying and Checking out items

document.addEventListener('DOMContentLoaded', () => {
    const cartTableBody = document.getElementById('cart-table-body');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartItemsDiv = document.getElementById('cart-items');
    const emptyCartDiv = document.getElementById('empty-cart');

    auth.onAuthStateChanged(user => {
        if (user) {
            loadCartItems(user.uid);
        } else {
            window.location.href = 'auth.html';
        }
    });

    async function loadCartItems(userId) {
        try {
            const snapshot = await db.collection('users').doc(userId).collection('cart').get();
            let total = 0;
            
            if (snapshot.empty) {
                cartItemsDiv.style.display = 'none';
                emptyCartDiv.style.display = 'block';
                return;
            }

            cartItemsDiv.style.display = 'block';
            emptyCartDiv.style.display = 'none';
            cartTableBody.innerHTML = '';

            snapshot.forEach(doc => {
                const item = doc.data();
                const id = doc.id;
                total += item.price;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <img src="${item.coverUrl || 'https://via.placeholder.com/50'}" style="width: 50px; border-radius: 4px;">
                            <span>${item.title}</span>
                        </div>
                    </td>
                    <td>${item.price} Birr</td>
                    <td><button class="btn btn-sm btn-danger remove-item" data-id="${id}">Remove</button></td>
                `;
                cartTableBody.appendChild(tr);
            });

            cartTotal.textContent = total;

            // Remove Item Logic
            document.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const bookId = e.target.getAttribute('data-id');
                    removeFromCart(userId, bookId);
                });
            });

            // Checkout Logic
            checkoutBtn.onclick = () => {
                handleCartCheckout(userId, snapshot.docs, total);
            };

        } catch (error) {
            console.error("Error loading cart:", error);
        }
    }

    function removeFromCart(userId, bookId) {
        db.collection('users').doc(userId).collection('cart').doc(bookId).delete().then(() => {
            loadCartItems(userId);
            if (window.updateCartCount) window.updateCartCount();
        });
    }

    async function handleCartCheckout(userId, cartDocs, total) {
        // Redirect to the new payment information and instruction page
        window.location.href = `payment.html?amount=${total}&isCart=true`;
    }
});

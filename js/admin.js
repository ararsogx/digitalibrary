// Admin Dashboard Logic - Adding and Deleting Books

document.addEventListener('DOMContentLoaded', () => {
    const adminAuthCheck = document.getElementById('admin-auth-check');
    const adminDenied = document.getElementById('admin-denied');
    const addBookForm = document.getElementById('add-book-form');
    const adminBooksList = document.getElementById('admin-books-list');
    const uploadStatus = document.getElementById('upload-status');
    const addBtn = document.getElementById('add-btn');
    const seedBtn = document.getElementById('seed-btn');

    const bookType = document.getElementById('book-type');
    const priceGroup = document.getElementById('price-group');

    // Transaction Verification Logic
    const verifyIdForm = document.getElementById('verify-id-form');
    const verifiedIdsList = document.getElementById('verified-ids-list');

    if (verifyIdForm) {
        verifyIdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const transactionId = document.getElementById('new-transaction-id').value.trim();
            if (!transactionId) return;

            try {
                await db.collection('verified_transactions').doc(transactionId).set({
                    addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    used: false
                });
                alert('Transaction ID authorized!');
                document.getElementById('new-transaction-id').value = '';
                fetchVerifiedIds();
            } catch (error) {
                console.error("Error adding transaction ID:", error);
                alert("Error: " + error.message);
            }
        });
    }

    async function fetchVerifiedIds() {
        if (!verifiedIdsList) return;
        
        try {
            const snapshot = await db.collection('verified_transactions').orderBy('addedAt', 'desc').limit(10).get();
            verifiedIdsList.innerHTML = '';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const li = document.createElement('li');
                li.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    background: var(--surface);
                    border-radius: 16px;
                    margin-bottom: 12px;
                    border: 1px solid var(--glass-border);
                `;
                
                const status = data.used ? 
                    `<span style="color: var(--danger); font-weight: 700; font-size: 0.8rem;">REDEEMED BY ${data.usedBy.substring(0,8)}...</span>` : 
                    '<span style="color: var(--secondary); font-weight: 700; font-size: 0.8rem;">AVAILABLE</span>';
                
                li.innerHTML = `
                    <strong style="letter-spacing: 1px;">${doc.id}</strong>
                    ${status}
                `;
                verifiedIdsList.appendChild(li);
            });
        } catch (error) {
            console.error("Error fetching verified IDs:", error);
        }
    }

    // Seed Sample Books Logic
    if (seedBtn) {
        seedBtn.addEventListener('click', async () => {
            if (confirm('Add two sample books to your library?')) {
                seedBtn.disabled = true;
                seedBtn.textContent = 'Adding...';
                
                const sampleBooks = [
                    {
                        title: 'The Great Free Guide',
                        author: 'Author One',
                        category: 'Non-Fiction',
                        type: 'free',
                        price: 0,
                        description: 'A comprehensive free guide to starting your digital journey.',
                        coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=60',
                        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    },
                    {
                        title: 'Advanced Tech Insights',
                        author: 'Author Two',
                        category: 'Technology',
                        type: 'premium',
                        price: 200,
                        description: 'Deep dive into advanced technology trends. Requires 200 Birr payment via Telebirr.',
                        coverUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=60',
                        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }
                ];

                try {
                    const batch = db.batch();
                    sampleBooks.forEach(book => {
                        const newDocRef = db.collection('books').doc();
                        batch.set(newDocRef, book);
                    });
                    await batch.commit();
                    alert('Sample books added successfully!');
                    fetchAdminBooks();
                } catch (error) {
                    console.error("Error seeding books:", error);
                    alert("Error: " + error.message);
                } finally {
                    seedBtn.disabled = false;
                    seedBtn.textContent = 'Seed Sample Books';
                }
            }
        });
    }

    // Toggle price input based on book type
    if (bookType) {
        bookType.addEventListener('change', () => {
            if (bookType.value === 'premium') {
                priceGroup.style.display = 'block';
            } else {
                priceGroup.style.display = 'none';
                document.getElementById('book-price').value = 0;
            }
        });
    }

    // Authentication Check
    auth.onAuthStateChanged(user => {
        if (user) {
            // Check if user is admin
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists && doc.data().isAdmin) {
                    adminAuthCheck.style.display = 'block';
                    adminDenied.style.display = 'none';
                    fetchAdminBooks();
                    fetchVerifiedIds(); // Load verified IDs
                } else {
                    adminAuthCheck.style.display = 'none';
                    adminDenied.style.display = 'block';
                }
            }).catch(error => {
                console.error("Error checking admin status:", error);
                adminDenied.style.display = 'block';
            });
        } else {
            // User not logged in, redirect to auth page
            window.location.href = 'auth.html';
        }
    });

    // Fetch Admin Books
    function fetchAdminBooks() {
        adminBooksList.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';
        
        db.collection('books').orderBy('createdAt', 'desc').get().then(snapshot => {
            adminBooksList.innerHTML = '';
            
            if (snapshot.empty) {
                adminBooksList.innerHTML = '<tr><td colspan="4" class="text-center">No books found.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const book = doc.data();
                const bookId = doc.id;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <img src="${book.coverUrl || 'https://via.placeholder.com/40x60?text=No+Cover'}" style="width: 40px; height: 60px; border-radius: 8px; object-fit: cover;">
                            <span style="font-weight: 700;">${book.title}</span>
                        </div>
                    </td>
                    <td style="padding: 20px; font-weight: 500; color: var(--text-dim);">${book.author}</td>
                    <td style="padding: 20px;">
                        <span class="category" style="font-size: 0.7rem; background: ${book.type === 'premium' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${book.type === 'premium' ? 'var(--accent)' : 'var(--secondary)'};">
                            ${book.type}
                        </span>
                    </td>
                    <td style="padding: 20px;">
                        <div class="action-btns">
                            <button onclick="deleteBook('${doc.id}')" class="btn btn-outline btn-sm" style="border-color: var(--danger); color: var(--danger); padding: 8px 12px;"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                adminBooksList.appendChild(tr);
            });

            // Add delete listeners
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    deleteBook(id);
                });
            });
        });
    }

    // Add Book Logic
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('book-title').value;
        const author = document.getElementById('book-author').value;
        const category = document.getElementById('book-category').value;
        const type = document.getElementById('book-type').value;
        const price = document.getElementById('book-price').value || 0;
        const description = document.getElementById('book-description').value;
        const coverFile = document.getElementById('book-cover').files[0];
        const bookFile = document.getElementById('book-file').files[0];

        addBtn.disabled = true;
        uploadStatus.textContent = 'Uploading book...';

        try {
            let coverUrl = '';
            let fileUrl = '';

            // 1. Upload Cover Image if exists
            if (coverFile) {
                const coverRef = storage.ref().child(`covers/${Date.now()}_${coverFile.name}`);
                const coverSnapshot = await coverRef.put(coverFile);
                coverUrl = await coverSnapshot.ref.getDownloadURL();
            }

            // 2. Upload Book File if exists
            if (bookFile) {
                const bookRef = storage.ref().child(`books/${Date.now()}_${bookFile.name}`);
                const bookSnapshot = await bookRef.put(bookFile);
                fileUrl = await bookSnapshot.ref.getDownloadURL();
            }

            // 3. Save to Firestore
            await db.collection('books').add({
                title,
                author,
                category,
                type,
                price: parseFloat(price),
                description,
                coverUrl,
                fileUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            uploadStatus.textContent = 'Book added successfully!';
            addBookForm.reset();
            fetchAdminBooks();
        } catch (error) {
            console.error("Error adding book:", error);
            uploadStatus.textContent = `Error: ${error.message}`;
        } finally {
            addBtn.disabled = false;
        }
    });

    // Delete Book Logic
    function deleteBook(id) {
        if (confirm('Are you sure you want to delete this book?')) {
            db.collection('books').doc(id).delete().then(() => {
                fetchAdminBooks();
            }).catch(error => {
                console.error("Error deleting book:", error);
                alert("Error deleting book: " + error.message);
            });
        }
    }
});

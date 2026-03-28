// Catalog logic - Fetching, Searching, and Filtering Books

document.addEventListener('DOMContentLoaded', () => {
    const catalogList = document.getElementById('catalog-list');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');

    let allBooks = []; // Local cache for easier searching/filtering

    // Initial load
    fetchBooks();

    // Search function
    function fetchBooks() {
        catalogList.innerHTML = '<div class="loader"></div>';
        
        let query = db.collection('books');

        // Apply filters based on values
        const category = categoryFilter.value;
        const sort = sortFilter.value;

        if (category) {
            query = query.where('category', '==', category);
        }

        // Apply sorting (requires Firestore indexes)
        if (sort === 'az') {
            query = query.orderBy('title', 'asc');
        } else if (sort === 'za') {
            query = query.orderBy('title', 'desc');
        } else if (sort === 'oldest') {
            query = query.orderBy('createdAt', 'asc');
        } else {
            // Default newest
            query = query.orderBy('createdAt', 'desc');
        }

        query.get().then(snapshot => {
            allBooks = [];
            catalogList.innerHTML = '';
            
            if (snapshot.empty) {
                catalogList.innerHTML = '<p class="text-center">No books found.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const book = { id: doc.id, ...doc.data() };
                allBooks.push(book);
                const bookCard = createBookCard(book, doc.id);
                catalogList.appendChild(bookCard);
            });
        }).catch(error => {
            console.error("Error fetching books:", error);
            catalogList.innerHTML = `<p class="text-center">Error loading catalog: ${error.message}</p>`;
        });
    }

    // Local Search (Search on typing)
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredBooks = allBooks.filter(book => 
            book.title.toLowerCase().includes(searchTerm) || 
            book.author.toLowerCase().includes(searchTerm)
        );

        catalogList.innerHTML = '';
        if (filteredBooks.length === 0) {
            catalogList.innerHTML = '<p class="text-center">No matching books found.</p>';
            return;
        }

        filteredBooks.forEach(book => {
            const bookCard = createBookCard(book, book.id);
            catalogList.appendChild(bookCard);
        });
    });

    // Handle Filter Changes
    categoryFilter.addEventListener('change', fetchBooks);
    sortFilter.addEventListener('change', fetchBooks);
});

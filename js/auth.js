// Auth logic - Login and Signup

document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Switch between Login and Signup
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    // Check URL hash for direct signup access
    if (window.location.hash === '#signup') {
        signupTab.click();
    }

    // Signup Logic
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const errorMsg = document.getElementById('signup-error');

        auth.createUserWithEmailAndPassword(email, password)
            .then(cred => {
                // Save user profile info in Firestore
                return db.collection('users').doc(cred.user.uid).set({
                    name: name,
                    email: email,
                    isAdmin: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                window.location.href = 'catalog.html';
            })
            .catch(err => {
                errorMsg.textContent = err.message;
                errorMsg.style.display = 'block';
            });
    });

    // Login Logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error');

        auth.signInWithEmailAndPassword(email, password)
            .then(cred => {
                window.location.href = 'catalog.html';
            })
            .catch(err => {
                errorMsg.textContent = err.message;
                errorMsg.style.display = 'block';
            });
    });
});

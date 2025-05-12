// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBcm-2OiIwpaRP7q-gwJT7DdEV0yKhz31s",
  authDomain: "tracking-bd294.firebaseapp.com",
  databaseURL: "https://tracking-bd294-default-rtdb.firebaseio.com",
  projectId: "tracking-bd294",
  storageBucket: "tracking-bd294.appspot.com",
  messagingSenderId: "754982495359",
  appId: "1:754982495359:web:d4ba6ee8b5ac5abb198b4a",
  measurementId: "G-8VTS9EYX52"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const analytics = firebase.analytics();

// Tampilkan modal login saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
  const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  loginModal.show();
});

// DOM Elements
const appContainer = document.getElementById('app-container');
const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const logoutBtn = document.querySelector('.btn-logout');

const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('main');
const pageContents = document.querySelectorAll('.page-content');
const navLinks = document.querySelectorAll('.nav-link');
const pageTitle = document.getElementById('page-title');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
const transactionForm = document.getElementById('transaction-form');
const saveTransactionBtn = document.getElementById('save-transaction');
const addCategoryBtn = document.getElementById('add-category-btn');
const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
const categoryForm = document.getElementById('category-form');
const saveCategoryBtn = document.getElementById('save-category');
const timePeriodBtn = document.getElementById('time-period');
const timePeriodOptions = document.querySelectorAll('.time-period-option');
const dateRangeModal = new bootstrap.Modal(document.getElementById('dateRangeModal'));
const applyDateRangeBtn = document.getElementById('apply-date-range');
const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
const confirmActionBtn = document.getElementById('confirm-action');
const exportAllDataBtn = document.getElementById('export-all-data');
const exportReportBtn = document.getElementById('export-report-btn');
const refreshInsightsBtn = document.getElementById('refresh-insights');
const resetAllDataBtn = document.getElementById('reset-all-data');
const accountSettingsForm = document.getElementById('account-settings-form');
const budgetSettingsForm = document.getElementById('budget-settings-form');

// Chart instances
let spendingChart, categoryChart, comparisonChart, trendChart;

// App State
let state = {
    currentUser: null,
    users: {},
    transactions: [],
    categories: [],
    currentPeriod: 'month',
    currentPage: 'dashboard',
    editingTransaction: null,
    editingCategory: null
};

// Initialize the app
function init() {
    // Coba load dari localStorage dulu
    const savedState = localStorage.getItem('appState');
    if (savedState) {
        state = JSON.parse(savedState);
        if (state.currentUser) {
            loginUser(state.currentUser);
            return;
        }
    }

    // Kalau ga ada di localStorage, cek Firebase
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        checkUserExists(rememberedEmail, (exists) => {
            if (exists) {
                loginUser(rememberedEmail);
            } else {
                localStorage.removeItem('rememberedEmail');
                loginModal.show();
            }
        });
    } else {
        loginModal.show();
    }

    setupEventListeners();
}

// Check if user exists in Firebase
function checkUserExists(email, callback) {
    database.ref('users/' + encodeEmail(email)).once('value')
        .then((snapshot) => {
            callback(snapshot.exists());
        })
        .catch((error) => {
            console.error('Error checking user:', error);
            callback(false); // Default ke false kalau error
        });
}

// Encode email for Firebase key
function encodeEmail(email) {
    return email.replace(/\./g, ',');
}

// Decode email from Firebase key
function decodeEmail(encodedEmail) {
    return encodedEmail.replace(/,/g, '.');
}

// Load user data from Firebase
function loadUserData(email, callback) {
    const encodedEmail = encodeEmail(email);
    
    database.ref('users/' + encodedEmail).once('value')
        .then((snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                // Initialize default categories if none exist
                if (!userData.categories) {
                    userData.categories = getDefaultCategories();
                    database.ref('users/' + encodedEmail + '/categories').set(userData.categories);
                }
                callback(userData);
            } else {
                callback(null);
            }
        })
        .catch((error) => {
            console.error('Error loading user data:', error);
            alert('Gagal memuat data pengguna. Periksa koneksi internet Anda.');
            callback(null);
        });
}

// Get default categories
function getDefaultCategories() {
    return [
        { id: 1, name: 'Gaji', type: 'income', icon: 'money-bill-wave', color: '#28a745' },
        { id: 2, name: 'Freelance', type: 'income', icon: 'laptop-code', color: '#17a2b8' },
        { id: 3, name: 'Makanan', type: 'expense', icon: 'utensils', color: '#dc3545' },
        { id: 4, name: 'Transportasi', type: 'expense', icon: 'bus', color: '#fd7e14' },
        { id: 5, name: 'Hiburan', type: 'expense', icon: 'film', color: '#6f42c1' },
        { id: 6, name: 'Sewa Rumah', type: 'expense', icon: 'home', color: '#343a40' }
    ];
}

// Save user data to Firebase
function saveUserData(email, data) {
    const encodedEmail = encodeEmail(email);
    return database.ref('users/' + encodedEmail).set(data);
}

// Save state to localStorage and sync to Firebase
function saveToLocalStorage() {
    localStorage.setItem('appState', JSON.stringify(state));
    if (state.currentUser) {
        saveUserData(state.currentUser, state.users[state.currentUser]);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login/Register
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    showRegisterBtn.addEventListener('click', () => {
        loginModal.hide();
        registerModal.show();
    });
    showLoginBtn.addEventListener('click', () => {
        registerModal.hide();
        loginModal.show();
    });
    logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('href').substring(1);
            showPage(page);
        });
    });

    // Transactions
    addTransactionBtn.addEventListener('click', () => {
        state.editingTransaction = null;
        transactionForm.reset();
        document.getElementById('transactionModalTitle').textContent = 'Tambah Transaksi Baru';
        document.getElementById('transaction-date').value = formatDate(new Date());
        renderCategoriesDropdown();
        transactionModal.show();
    });

    saveTransactionBtn.addEventListener('click', saveTransaction);

    // Categories
    addCategoryBtn.addEventListener('click', () => {
        state.editingCategory = null;
        categoryForm.reset();
        document.getElementById('categoryModalTitle').textContent = 'Tambah Kategori Baru';
        categoryModal.show();
    });

    saveCategoryBtn.addEventListener('click', saveCategory);

    // Time period
    timePeriodOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const period = option.getAttribute('data-period');
            if (period === 'custom') {
                dateRangeModal.show();
            } else {
                state.currentPeriod = period;
                timePeriodBtn.textContent = option.textContent;
                updateDashboard();
                renderRecentTransactions();
                renderAllTransactions();
            }
        });
    });

    applyDateRangeBtn.addEventListener('click', () => {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        if (startDate && endDate) {
            state.currentPeriod = { start: startDate, end: endDate };
            timePeriodBtn.textContent = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
            updateDashboard();
            renderRecentTransactions();
            renderAllTransactions();
            dateRangeModal.hide();
        }
    });

    // Export data
    exportAllDataBtn.addEventListener('click', exportAllData);
    exportReportBtn.addEventListener('click', exportReport);

    // Reset data
    resetAllDataBtn.addEventListener('click', () => {
        showConfirmation(
            'Hapus Semua Data',
            'Apakah Anda yakin ingin menghapus semua data? Aksi ini tidak dapat dibatalkan.',
            resetAllData
        );
    });

    // Refresh insights
    refreshInsightsBtn.addEventListener('click', generateInsights);

    // Settings forms
    accountSettingsForm.addEventListener('submit', saveAccountSettings);
    budgetSettingsForm.addEventListener('submit', saveBudgetSettings);

    document.getElementById('loginModal').addEventListener('hidden.bs.modal', function () {
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    });
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    // Check if user exists in Firebase
    checkUserExists(email, (exists) => {
        if (!exists) {
            alert('Email tidak terdaftar');
            return;
        }

        // Load user data
        loadUserData(email, (userData) => {
            if (!userData) {
                alert('Terjadi kesalahan saat memuat data pengguna');
                return;
            }

            if (userData.password !== password) {
                alert('Password salah');
                return;
            }

            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            loginUser(email);
        });
    });
}

// Handle register
function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Password dan konfirmasi password tidak cocok');
        return;
    }

    // Check if user already exists
    checkUserExists(email, (exists) => {
        if (exists) {
            alert('Email sudah terdaftar');
            return;
        }

        // Create new user data
        const userData = {
            name,
            email,
            password,
            currency: 'IDR',
            monthlyBudget: 0,
            savingsGoal: 20,
            notificationsEnabled: true,
            transactions: [],
            categories: getDefaultCategories()
        };

        // Save to Firebase
        saveUserData(email, userData)
            .then(() => {
                registerModal.hide();
                loginUser(email);
            })
            .catch((error) => {
                console.error('Error saving user data:', error);
                alert('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
            });
    });
}

// Login user
function loginUser(email) {
    loadUserData(email, (userData) => {
        if (!userData) {
            alert('Terjadi kesalahan saat memuat data pengguna');
            return;
        }

        state.currentUser = email;
        state.users[email] = userData;
        state.transactions = userData.transactions || [];
        state.categories = userData.categories || getDefaultCategories();

        // Update UI
        document.getElementById('sidebar-username').textContent = userData.name;
        const appContainer = document.getElementById('app-container');
        const sidebar = document.getElementById('sidebar');
        if (appContainer) {
            appContainer.classList.remove('d-none');
        } else {
            console.error('app-container not found in DOM!');
        }
        if (sidebar) {
            sidebar.classList.add('active'); // Ini yang bikin sidebar muncul di layar kecil
        } else {
            console.error('sidebar not found in DOM!');
        }

        // Pastikan modal ditutup dan backdrop dihapus dengan log
        console.log('Hiding login modal...');
        loginModal.hide();
        console.log('Modal hidden, removing backdrop...');
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
        console.log('Backdrop removed, resetting body...');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        console.log('Body reset, UI initialized');

        // Initialize UI dan pindah ke dashboard
        renderCategoriesDropdown();
        renderAllCategories();
        updateDashboard();
        renderRecentTransactions();
        renderAllTransactions();
        renderUserSettings();
        showPage('dashboard');
    });
}

// Handle logout
function handleLogout() {
    state.currentUser = null;
    localStorage.removeItem('appState'); // Hapus data di localStorage
    appContainer.classList.add('d-none');
    loginModal.show();
}

// Show specific page content
function showPage(page) {
    state.currentPage = page;
    
    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === page) {
            link.classList.add('active');
        }
    });

    // Hide all page contents
    pageContents.forEach(content => {
        content.classList.add('d-none');
    });

    // Show selected page content
    document.getElementById(`${page}-content`).classList.remove('d-none');
    
    // Update page title
    const pageTitles = {
        'dashboard': 'Beranda',
        'transaksi': 'Transaksi',
        'kategori': 'Kategori',
        'laporan': 'Laporan',
        'analisis': 'Analisis',
        'pengaturan': 'Pengaturan'
    };
    pageTitle.textContent = pageTitles[page];
    
    // Page-specific initializations
    switch (page) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'transaksi':
            renderAllTransactions();
            break;
        case 'kategori':
            renderAllCategories();
            break;
        case 'laporan':
            renderReports();
            break;
        case 'analisis':
            generateInsights();
            break;
        case 'pengaturan':
            renderUserSettings();
            break;
    }
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// Format date for display (e.g., 1 Jan 2023)
function formatDisplayDate(dateStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
}

// Format currency
function formatCurrency(amount) {
    if (state.users[state.currentUser].currency === 'IDR') {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    } else {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: state.users[state.currentUser].currency }).format(amount);
    }
}

// Save transaction
function saveTransaction() {
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value.trim();
    const categoryId = parseInt(document.getElementById('transaction-category').value);
    const date = document.getElementById('transaction-date').value;
    const type = document.querySelector('input[name="transaction-type"]:checked').value;
    
    if (!amount || !description || !categoryId || !date) {
        alert('Harap isi semua field');
        return;
    }

    const transactionData = {
        amount,
        description,
        categoryId,
        date,
        type
    };

    if (state.editingTransaction) {
        // Update existing transaction
        transactionData.id = state.editingTransaction.id;
        const index = state.transactions.findIndex(t => t.id === state.editingTransaction.id);
        state.transactions[index] = transactionData;
    } else {
        // Add new transaction
        transactionData.id = state.transactions.length > 0 
            ? Math.max(...state.transactions.map(t => t.id)) + 1 
            : 1;
        state.transactions.push(transactionData);
    }

    // Save to user data
    state.users[state.currentUser].transactions = state.transactions;
    saveUserData(state.currentUser, state.users[state.currentUser]);
    saveToLocalStorage();
  
    transactionModal.hide();
    updateDashboard();
    renderRecentTransactions();
    renderAllTransactions();
}

// Save category
function saveCategory() {
    const name = document.getElementById('category-name').value.trim();
    const type = document.getElementById('category-type').value;
    const icon = document.getElementById('category-icon').value;
    const color = document.getElementById('category-color').value;
    
    if (!name) {
        alert('Harap masukkan nama kategori');
        return;
    }

    const categoryData = {
        name,
        type,
        icon,
        color
    };

    if (state.editingCategory) {
        // Update existing category
        categoryData.id = state.editingCategory.id;
        const index = state.categories.findIndex(c => c.id === state.editingCategory.id);
        state.categories[index] = categoryData;
    } else {
        // Add new category
        categoryData.id = state.categories.length > 0 
            ? Math.max(...state.categories.map(c => c.id)) + 1 
            : 1;
        state.categories.push(categoryData);
    }

    // Save to user data
    state.users[state.currentUser].categories = state.categories;
    saveUserData(state.currentUser, state.users[state.currentUser]);
    saveToLocalStorage();

    categoryModal.hide();
    renderCategoriesDropdown();
    renderAllCategories();
    updateDashboard();
}

// Render categories dropdown
function renderCategoriesDropdown() {
    const dropdown = document.getElementById('transaction-category');
    dropdown.innerHTML = '';
    
    const incomeCategories = state.categories.filter(c => c.type === 'income');
    const expenseCategories = state.categories.filter(c => c.type === 'expense');
    
    if (incomeCategories.length > 0) {
        const incomeGroup = document.createElement('optgroup');
        incomeGroup.label = 'Pemasukan';
        incomeCategories.forEach(category => {
            incomeGroup.innerHTML += `<option value="${category.id}">${category.name}</option>`;
        });
        dropdown.appendChild(incomeGroup);
    }
    
    if (expenseCategories.length > 0) {
        const expenseGroup = document.createElement('optgroup');
        expenseGroup.label = 'Pengeluaran';
        expenseCategories.forEach(category => {
            expenseGroup.innerHTML += `<option value="${category.id}">${category.name}</option>`;
        });
        dropdown.appendChild(expenseGroup);
    }
}

// Render all categories
function renderAllCategories() {
    const incomeList = document.getElementById('income-categories');
    const expenseList = document.getElementById('expense-categories');
    
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';
    
    state.categories.forEach(category => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="category-icon" style="background-color: ${category.color}">
                    <i class="fas fa-${category.icon}"></i>
                </div>
                <span class="category-name">${category.name}</span>
            </div>
            <div class="category-actions">
                <button class="btn btn-sm btn-outline-primary edit-category" data-id="${category.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-category" data-id="${category.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        if (category.type === 'income') {
            incomeList.appendChild(item);
        } else {
            expenseList.appendChild(item);
        }
    });
    
    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.edit-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const category = state.categories.find(c => c.id === id);
            
            if (category) {
                state.editingCategory = category;
                document.getElementById('categoryModalTitle').textContent = 'Edit Kategori';
                document.getElementById('category-name').value = category.name;
                document.getElementById('category-type').value = category.type;
                document.getElementById('category-icon').value = category.icon;
                document.getElementById('category-color').value = category.color;
                document.getElementById('category-id').value = category.id;
                categoryModal.show();
            }
        });
    });
    
    document.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const category = state.categories.find(c => c.id === id);
            
            if (category) {
                showConfirmation(
                    'Hapus Kategori',
                    `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`,
                    () => {
                        state.categories = state.categories.filter(c => c.id !== id);
                        state.users[state.currentUser].categories = state.categories;
                        saveToLocalStorage();
                        renderAllCategories();
                        renderCategoriesDropdown();
                        updateDashboard();
                    }
                );
            }
        });
    });
}

// Update dashboard with summary and charts
function updateDashboard() {
    const filteredTransactions = filterTransactionsByPeriod();
    const { totalIncome, totalExpense, balance } = calculateTotals(filteredTransactions);
    
    // Update summary cards
    document.getElementById('income-amount').textContent = formatCurrency(totalIncome);
    document.getElementById('expense-amount').textContent = formatCurrency(totalExpense);
    document.getElementById('balance-amount').textContent = formatCurrency(balance);
    
    // Update progress bars
    const incomePercentage = state.users[state.currentUser].monthlyBudget ? Math.min(100, (totalIncome / state.users[state.currentUser].monthlyBudget) * 100) : 0;
    const expensePercentage = state.users[state.currentUser].monthlyBudget ? Math.min(100, (totalExpense / state.users[state.currentUser].monthlyBudget) * 100) : 0;
    const balancePercentage = state.users[state.currentUser].monthlyBudget ? Math.min(100, (balance / state.users[state.currentUser].monthlyBudget) * 100) : 0;
    
    document.getElementById('income-progress').style.width = `${incomePercentage}%`;
    document.getElementById('expense-progress').style.width = `${expensePercentage}%`;
    document.getElementById('balance-progress').style.width = `${balancePercentage}%`;
    
    // Render charts
    renderSpendingChart(filteredTransactions);
    renderCategoryChart(filteredTransactions);
    
    // Generate insights
    if (state.currentPage === 'dashboard' || state.currentPage === 'analisis') {
        generateInsights();
    }
}

// Filter transactions based on current period
function filterTransactionsByPeriod() {
    const now = new Date();
    let startDate, endDate;
    
    switch (state.currentPeriod) {
        case 'today':
            startDate = endDate = formatDate(now);
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            endDate = new Date(now);
            endDate.setDate(now.getDate() + (6 - now.getDay())); // End of week (Saturday)
            startDate = formatDate(startDate);
            endDate = formatDate(endDate);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            startDate = formatDate(startDate);
            endDate = formatDate(endDate);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            startDate = formatDate(startDate);
            endDate = formatDate(endDate);
            break;
        default:
            if (typeof state.currentPeriod === 'object') {
                startDate = state.currentPeriod.start;
                endDate = state.currentPeriod.end;
            } else {
                // Default to current month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                startDate = formatDate(startDate);
                endDate = formatDate(endDate);
            }
    }
    
    return state.transactions.filter(transaction => {
        return transaction.date >= startDate && transaction.date <= endDate;
    });
}

// Calculate totals from transactions
function calculateTotals(transactions) {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
    
    return { totalIncome, totalExpense, balance };
}

// Render spending chart
function renderSpendingChart(transactions) {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    
    // Group transactions by date
    const dates = {};
    transactions.forEach(t => {
        if (!dates[t.date]) {
            dates[t.date] = { income: 0, expense: 0 };
        }
        dates[t.date][t.type] += t.amount;
    });
    
    const sortedDates = Object.keys(dates).sort();
    const incomeData = sortedDates.map(date => dates[date].income);
    const expenseData = sortedDates.map(date => dates[date].expense);
    
    if (spendingChart) {
        spendingChart.destroy();
    }
    
    spendingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedDates.map(date => formatDisplayDate(date)),
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Pengeluaran',
                    data: expenseData,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.raw);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Render category chart
function renderCategoryChart(transactions) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Group expenses by category
    const expensesByCategory = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const category = state.categories.find(c => c.id === t.categoryId);
            const categoryName = category ? category.name : 'Lain-Lain';
            if (!expensesByCategory[categoryName]) {
                expensesByCategory[categoryName] = 0;
            }
            expensesByCategory[categoryName] += t.amount;
        });
    
    const categoryNames = Object.keys(expensesByCategory);
    const categoryAmounts = categoryNames.map(name => expensesByCategory[name]);
    const categoryColors = categoryNames.map(name => {
        const category = state.categories.find(c => c.name === name);
        return category ? category.color : '#6c757d';
    });
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryNames,
            datasets: [{
                data: categoryAmounts,
                backgroundColor: categoryColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.raw;
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Render recent transactions
function renderRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    const filteredTransactions = filterTransactionsByPeriod()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    container.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        container.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada transaksi</td></tr>';
        return;
    }
    
    filteredTransactions.forEach(transaction => {
        const category = state.categories.find(c => c.id === transaction.categoryId);
        const categoryName = category ? category.name : 'Lainnya';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDisplayDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td class="${transaction.type === 'income' ? 'transaction-income' : 'transaction-expense'}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </td>
            <td>${categoryName}</td>
        `;
        
        container.appendChild(row);
    });
}

// Render all transactions with pagination
function renderAllTransactions(page = 1, perPage = 10) {
    const container = document.getElementById('all-transactions');
    const pagination = document.getElementById('transaction-pagination');
    const filteredTransactions = filterTransactionsByPeriod()
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada transaksi</td></tr>';
        pagination.innerHTML = '';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredTransactions.length / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, filteredTransactions.length);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    // Render transactions
    paginatedTransactions.forEach(transaction => {
        const category = state.categories.find(c => c.id === transaction.categoryId);
        const categoryName = category ? category.name : 'Lainnya';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDisplayDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>${categoryName}</td>
            <td class="${transaction.type === 'income' ? 'transaction-income' : 'transaction-expense'}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-transaction" data-id="${transaction.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-transaction" data-id="${transaction.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        container.appendChild(row);
    });
    
    // Render pagination
    pagination.innerHTML = '';
    
    if (totalPages > 1) {
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${page === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous" data-page="${page - 1}">
            <span aria-hidden="true">«</span>
        </a>`;
        pagination.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === page ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            pagination.appendChild(li);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${page === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next" data-page="${page + 1}">
            <span aria-hidden="true">»</span>
        </a>`;
        pagination.appendChild(nextLi);
        
        // Add event listeners to pagination links
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageNum = parseInt(link.getAttribute('data-page'));
                if (!isNaN(pageNum)) {
                    renderAllTransactions(pageNum, perPage);
                }
            });
        });
    }
    
    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.edit-transaction').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const transaction = state.transactions.find(t => t.id === id);
            
            if (transaction) {
                state.editingTransaction = transaction;
                document.getElementById('transactionModalTitle').textContent = 'Edit Transaksi';
                document.getElementById('transaction-amount').value = transaction.amount;
                document.getElementById('transaction-description').value = transaction.description;
                document.getElementById('transaction-category').value = transaction.categoryId;
                document.getElementById('transaction-date').value = transaction.date;
                document.getElementById(`type-${transaction.type}`).checked = true;
                document.getElementById('transaction-id').value = transaction.id;
                transactionModal.show();
            }
        });
    });
    
    document.querySelectorAll('.delete-transaction').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const transaction = state.transactions.find(t => t.id === id);
            
            if (transaction) {
                showConfirmation(
                    'Hapus Transaksi',
                    `Apakah Anda yakin ingin menghapus transaksi: "${transaction.description}"?`,
                    () => {
                        state.transactions = state.transactions.filter(t => t.id !== id);
                        state.users[state.currentUser].transactions = state.transactions;
                        saveToLocalStorage();
                        updateDashboard();
                        renderRecentTransactions();
                        renderAllTransactions(page, perPage);
                    }
                );
            }
        });
    });
}

// Render reports
function renderReports() {
    // Group transactions by month
    const monthlyData = {};
    state.transactions.forEach(t => {
        const date = new Date(t.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { income: 0, expense: 0 };
        }
        monthlyData[monthYear][t.type] += t.amount;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const incomeData = sortedMonths.map(month => monthlyData[month].income);
    const expenseData = sortedMonths.map(month => monthlyData[month].expense);
    
    // Render comparison chart
    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    comparisonChart = new Chart(comparisonCtx, {
        type: 'bar',
        data: {
            labels: sortedMonths.map(month => {
                const [year, m] = month.split('-');
                return new Date(year, m - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
            }),
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Pengeluaran',
                    data: expenseData,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.raw);
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Render category trend chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    if (trendChart) {
        trendChart.destroy();
    }

    // Populate category dropdown
    const categorySelect = document.getElementById('category-trend-select');
    categorySelect.innerHTML = '';
    
    const expenseCategories = state.categories.filter(c => c.type === 'expense');
    expenseCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });

    // Default to first category if available
    if (expenseCategories.length > 0) {
        renderCategoryTrendChart(expenseCategories[0].id);
    }

    // Add event listener for category change
    categorySelect.addEventListener('change', (e) => {
        renderCategoryTrendChart(parseInt(e.target.value));
    });

    // Render detailed report table
    renderDetailedReport();
}

// Render category trend chart
function renderCategoryTrendChart(categoryId) {
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    
    // Group category expenses by month
    const monthlyData = {};
    state.transactions
        .filter(t => t.type === 'expense' && t.categoryId === categoryId)
        .forEach(t => {
            const date = new Date(t.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = 0;
            }
            monthlyData[monthYear] += t.amount;
        });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const amounts = sortedMonths.map(month => monthlyData[month]);
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: sortedMonths.map(month => {
                const [year, m] = month.split('-');
                return new Date(year, m - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
            }),
            datasets: [{
                label: 'Pengeluaran Bulanan',
                data: amounts,
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                borderColor: 'rgba(78, 115, 223, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

// Render detailed report table
function renderDetailedReport() {
    const tableBody = document.getElementById('detailed-report');
    tableBody.innerHTML = '';
    
    // Get current and previous month data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const prevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
    
    // Calculate totals for each category
    const categoryData = {};
    
    state.transactions.forEach(t => {
        if (t.type === 'expense') {
            const date = new Date(t.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const category = state.categories.find(c => c.id === t.categoryId) || { name: 'Lainnya' };
            
            if (!categoryData[category.name]) {
                categoryData[category.name] = {
                    currentMonth: 0,
                    prevMonth: 0
                };
            }
            
            if (monthYear === currentMonthStr) {
                categoryData[category.name].currentMonth += t.amount;
            } else if (monthYear === prevMonthStr) {
                categoryData[category.name].prevMonth += t.amount;
            }
        }
    });
    
    // Calculate totals
    let totalCurrent = 0;
    let totalPrevious = 0;
    
    Object.values(categoryData).forEach(data => {
        totalCurrent += data.currentMonth;
        totalPrevious += data.prevMonth;
    });
    
    // Add rows for each category
    Object.entries(categoryData).forEach(([category, data]) => {
        const change = data.prevMonth ? ((data.currentMonth - data.prevMonth) / data.prevMonth) * 100 : 0;
        const percentage = totalCurrent ? (data.currentMonth / totalCurrent) * 100 : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category}</td>
            <td>${formatCurrency(data.currentMonth)}</td>
            <td>${formatCurrency(data.prevMonth)}</td>
            <td class="${change >= 0 ? 'text-danger' : 'text-success'}">
                ${change.toFixed(1)}% ${change >= 0 ? '↑' : '↓'}
            </td>
            <td>${percentage.toFixed(1)}%</td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add total row
    const totalChange = totalPrevious ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : 0;
    const totalRow = document.createElement('tr');
    totalRow.className = 'table-active';
    totalRow.innerHTML = `
        <td><strong>Total</strong></td>
        <td><strong>${formatCurrency(totalCurrent)}</strong></td>
        <td><strong>${formatCurrency(totalPrevious)}</strong></td>
        <td class="${totalChange >= 0 ? 'text-danger' : 'text-success'}">
            <strong>${totalChange.toFixed(1)}% ${totalChange >= 0 ? '↑' : '↓'}</strong>
        </td>
        <td><strong>100%</strong></td>
    `;
    tableBody.appendChild(totalRow);
}

// Generate AI insights
function generateInsights() {
    const insightsContainer = document.getElementById('ai-insights');
    const healthInsightsContainer = document.getElementById('financial-health-insights');
    const recommendationsContainer = document.getElementById('recommendations-insights');
    
    // Show loading state
    insightsContainer.innerHTML = '';
    healthInsightsContainer.innerHTML = '';
    recommendationsContainer.innerHTML = '';
    
    document.querySelectorAll('.insight-content').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.insight-loading').forEach(el => el.style.display = 'flex');
    
    // Simulate AI processing delay
    setTimeout(() => {
        const filteredTransactions = filterTransactionsByPeriod();
        const { totalIncome, totalExpense, balance } = calculateTotals(filteredTransactions);
        
        // Calculate financial score (0-100)
        const savingsRate = totalIncome ? (balance / totalIncome) * 100 : 0;
        const expenseRatio = totalIncome ? (totalExpense / totalIncome) * 100 : 100;
        
        let score = 70; // Base score
        score += Math.min(20, savingsRate); // Add up to 20 points for savings
        score -= Math.max(0, expenseRatio - 70) / 2; // Subtract for high spending
        
        // Cap score between 0-100
        score = Math.max(0, Math.min(100, Math.round(score)));
        
        // Update score display
        document.getElementById('financial-score').textContent = score;
        
        // Animate score circle
        const scoreCircle = document.querySelector('.score-circle');
        scoreCircle.style.background = `conic-gradient(var(--success-color) ${score}%, #eee ${score}% 100%)`;
        
        // Update score breakdown
        document.getElementById('savings-score').style.width = `${Math.min(100, savingsRate)}%`;
        document.getElementById('spending-score').style.width = `${Math.min(100, 100 - (expenseRatio / 2))}%`;
        document.getElementById('budgeting-score').style.width = `${Math.min(100, score)}%`;
        
        // Generate health insights
        let healthHTML = '';
        
        if (savingsRate >= 20) {
            healthHTML += `
                <div class="insight-item">
                    <div class="insight-title text-success">
                        <i class="fas fa-check-circle me-2"></i> Tingkat Tabungan Bagus
                    </div>
                    <div class="insight-text">
                        Tingkat tabungan Anda ${savingsRate.toFixed(1)}%, di atas rekomendasi 20%. 
                        Pertahankan kebiasaan baik ini!
                    </div>
                </div>
            `;
        } else if (savingsRate >= 10) {
            healthHTML += `
                <div class="insight-item">
                    <div class="insight-title text-warning">
                        <i class="fas fa-exclamation-circle me-2"></i> Tingkat Tabungan Sedang
                    </div>
                    <div class="insight-text">
                        Tingkat tabungan Anda ${savingsRate.toFixed(1)}%, di bawah rekomendasi 20%. 
                        Pertimbangkan untuk meningkatkan tabungan dengan mengurangi pengeluaran atau menambah pendapatan.
                    </div>
                </div>
            `;
        } else {
            healthHTML += `
                <div class="insight-item">
                    <div class="insight-title text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i> Tingkat Tabungan Rendah
                    </div>
                    <div class="insight-text">
                        Tingkat tabungan Anda hanya ${savingsRate.toFixed(1)}%, sangat rendah. 
                        Targetkan menabung minimal 20% dari pendapatan untuk keamanan finansial.
                    </div>
                </div>
            `;
        }
        
        if (expenseRatio <= 70) {
            healthHTML += `
                <div class="insight-item">
                    <div class="insight-title text-success">
                        <i class="fas fa-check-circle me-2"></i> Pengeluaran Sehat
                    </div>
                    <div class="insight-text">
                        Anda menghabiskan ${expenseRatio.toFixed(1)}% dari pendapatan, menyisakan cukup untuk tabungan. 
                        Ini adalah kebiasaan finansial yang baik.
                    </div>
                </div>
            `;
        } else {
            healthHTML += `
                <div class="insight-item">
                    <div class="insight-title text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i> Pengeluaran Tinggi
                    </div>
                    <div class="insight-text">
                        Anda menghabiskan ${expenseRatio.toFixed(1)}% dari pendapatan, menyisakan sedikit untuk tabungan. 
                        Pertimbangkan untuk meninjau pengeluaran Anda.
                    </div>
                </div>
            `;
        }
        
        healthInsightsContainer.innerHTML = healthHTML;
        
        // Generate recommendations
        let recommendationsHTML = '';
        
        // Top spending categories
        const expensesByCategory = {};
        filteredTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const category = state.categories.find(c => c.id === t.categoryId) || { name: 'Lainnya' };
                if (!expensesByCategory[category.name]) {
                    expensesByCategory[category.name] = 0;
                }
                expensesByCategory[category.name] += t.amount;
            });
        
        const topCategories = Object.entries(expensesByCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        if (topCategories.length > 0) {
            recommendationsHTML += `
                <div class="insight-item">
                    <div class="insight-title">
                        <i class="fas fa-chart-pie me-2"></i> Kategori Pengeluaran Terbesar
                    </div>
                    <div class="insight-text">
                        Kategori pengeluaran terbesar Anda:
                        <ul>
                            ${topCategories.map(([name, amount]) => `
                                <li><strong>${name}</strong>: ${formatCurrency(amount)} (${(amount / totalExpense * 100).toFixed(1)}% dari pengeluaran)</li>
                            `).join('')}
                        </ul>
                        Pertimbangkan untuk meninjau kategori ini untuk penghematan.
                    </div>
                </div>
            `;
        }
        
        // Budget comparison
        if (state.users[state.currentUser].monthlyBudget) {
            const budgetUsage = (totalExpense / state.users[state.currentUser].monthlyBudget) * 100;
            
            if (budgetUsage > 100) {
                recommendationsHTML += `
                    <div class="insight-item">
                        <div class="insight-title text-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i> Melebihi Anggaran
                        </div>
                        <div class="insight-text">
                            Anda telah melebihi anggaran bulanan sebesar ${formatCurrency(totalExpense - state.users[state.currentUser].monthlyBudget)} 
                            (${budgetUsage.toFixed(1)}% dari anggaran). Coba kurangi pengeluaran di minggu-minggu mendatang.
                        </div>
                    </div>
                `;
            } else if (budgetUsage > 80) {
                recommendationsHTML += `
                    <div class="insight-item">
                        <div class="insight-title text-warning">
                            <i class="fas fa-exclamation-circle me-2"></i> Mendekati Batas Anggaran
                        </div>
                        <div class="insight-text">
                            Anda telah menggunakan ${budgetUsage.toFixed(1)}% dari anggaran bulanan. 
                            Hati-hati dengan pengeluaran tambahan bulan ini.
                        </div>
                    </div>
                `;
            } else {
                recommendationsHTML += `
                    <div class="insight-item">
                        <div class="insight-title text-success">
                            <i class="fas fa-check-circle me-2"></i> Dalam Anggaran
                        </div>
                        <div class="insight-text">
                            Anda telah menggunakan ${budgetUsage.toFixed(1)}% dari anggaran bulanan. 
                            Kerja bagus dalam mengelola pengeluaran!
                        </div>
                    </div>
                `;
            }
        }
        
        // Savings goal
        if (state.users[state.currentUser].savingsGoal) {
            const currentSavingsRate = (balance / totalIncome) * 100;
            
            if (currentSavingsRate >= state.users[state.currentUser].savingsGoal) {
                recommendationsHTML += `
                    <div class="insight-item">
                        <div class="insight-title text-success">
                            <i class="fas fa-check-circle me-2"></i> Mencapai Target Tabungan
                        </div>
                        <div class="insight-text">
                            Anda menabung ${currentSavingsRate.toFixed(1)}% dari pendapatan, memenuhi target 
                            ${state.users[state.currentUser].savingsGoal}%. Kerja bagus!
                        </div>
                    </div>
                `;
            } else {
                const needed = (state.users[state.currentUser].savingsGoal / 100 * totalIncome) - balance;
                recommendationsHTML += `
                    <div class="insight-item">
                        <div class="insight-title text-warning">
                            <i class="fas fa-exclamation-circle me-2"></i> Di Bawah Target Tabungan
                        </div>
                        <div class="insight-text">
                            Anda menabung ${currentSavingsRate.toFixed(1)}% dari pendapatan, di bawah target 
                            ${state.users[state.currentUser].savingsGoal}%. Anda perlu menabung tambahan 
                            ${formatCurrency(needed)} periode ini untuk mencapai target.
                        </div>
                    </div>
                `;
            }
        }
        
        recommendationsContainer.innerHTML = recommendationsHTML;
        
        // Generate dashboard insights
        let dashboardHTML = '';
        
        if (balance > 0) {
            dashboardHTML += `
                <div class="insight-item">
                    <div class="insight-title text-success">
                        <i class="fas fa-smile me-2"></i> Arus Kas Positif
                    </div>
                    <div class="insight-text">
                        Anda memiliki saldo positif sebesar ${formatCurrency(balance)} periode ini. 
                        Pertimbangkan untuk mengalokasikan sebagian ke tabungan atau investasi.
                    </div>
                </div>
            `;
        } else {
            dashboardHTML += `
                <div class="insight-item">
                    <div class="insight-title text-danger">
                        <i class="fas fa-frown me-2"></i> Arus Kas Negatif
                    </div>
                    <div class="insight-text">
                        Anda memiliki saldo negatif sebesar ${formatCurrency(-balance)} periode ini. 
                        Tinjau pengeluaran Anda untuk menghindari pemborosan.
                    </div>
                </div>
            `;
        }
        
        // Compare to previous period
        const now = new Date();
        let prevPeriodStart, prevPeriodEnd;
        
        switch (state.currentPeriod) {
            case 'today':
                prevPeriodStart = prevPeriodEnd = formatDate(new Date(now.setDate(now.getDate() - 1)));
                break;
            case 'week':
                prevPeriodStart = new Date(now);
                prevPeriodStart.setDate(now.getDate() - 7 - now.getDay());
                prevPeriodEnd = new Date(prevPeriodStart);
                prevPeriodEnd.setDate(prevPeriodStart.getDate() + 6);
                prevPeriodStart = formatDate(prevPeriodStart);
                prevPeriodEnd = formatDate(prevPeriodEnd);
                break;
            case 'month':
                prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                prevPeriodStart = formatDate(prevPeriodStart);
                prevPeriodEnd = formatDate(prevPeriodEnd);
                break;
            case 'year':
                prevPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
                prevPeriodEnd = new Date(now.getFullYear() - 1, 11, 31);
                prevPeriodStart = formatDate(prevPeriodStart);
                prevPeriodEnd = formatDate(prevPeriodEnd);
                break;
            default:
                if (typeof state.currentPeriod === 'object') {
                    const start = new Date(state.currentPeriod.start);
                    const end = new Date(state.currentPeriod.end);
                    const diff = end - start;
                    
                    prevPeriodStart = new Date(start.getTime() - diff - 86400000);
                    prevPeriodEnd = new Date(start.getTime() - 86400000);
                    prevPeriodStart = formatDate(prevPeriodStart);
                    prevPeriodEnd = formatDate(prevPeriodEnd);
                }
        }
        
        if (prevPeriodStart && prevPeriodEnd) {
            const prevTransactions = state.transactions.filter(t => t.date >= prevPeriodStart && t.date <= prevPeriodEnd);
            const { totalIncome: prevIncome, totalExpense: prevExpense, balance: prevBalance } = calculateTotals(prevTransactions);
            
            const incomeChange = prevIncome ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
            const expenseChange = prevExpense ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;
            const balanceChange = prevBalance ? ((balance - prevBalance) / prevBalance) * 100 : 0;
            
            dashboardHTML += `
                <div class="insight-item">
                    <div class="insight-title">
                        <i class="fas fa-chart-line me-2"></i> Perbandingan Periode
                    </div>
                    <div class="insight-text">
                        <ul>
                            <li>Pendapatan: ${incomeChange >= 0 ? '↑' : '↓'} ${Math.abs(incomeChange).toFixed(1)}% 
                                (${formatCurrency(totalIncome)} vs ${formatCurrency(prevIncome)})</li>
                            <li>Pengeluaran: ${expenseChange >= 0 ? '↑' : '↓'} ${Math.abs(expenseChange).toFixed(1)}% 
                                (${formatCurrency(totalExpense)} vs ${formatCurrency(prevExpense)})</li>
                            <li>Saldo: ${balanceChange >= 0 ? '↑' : '↓'} ${Math.abs(balanceChange).toFixed(1)}% 
                                (${formatCurrency(balance)} vs ${formatCurrency(prevBalance)})</li>
                        </ul>
                    </div>
                </div>
            `;
        }
        
        insightsContainer.innerHTML = dashboardHTML;
        
        // Show content with fade-in animation
        document.querySelectorAll('.insight-loading').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.insight-content').forEach(el => el.classList.add('show'));
    }, 1500); // Simulate AI processing time
}

// Render user settings
function renderUserSettings() {
    const user = state.users[state.currentUser];
    document.getElementById('user-name').value = user.name;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-currency').value = user.currency;
    document.getElementById('monthly-budget').value = user.monthlyBudget;
    document.getElementById('savings-goal').value = user.savingsGoal;
    document.getElementById('notifications-enabled').checked = user.notificationsEnabled;
}

// Save account settings
function saveAccountSettings(e) {
    e.preventDefault();
    const name = document.getElementById('user-name').value;
    const email = document.getElementById('user-email').value;
    
    if (email !== state.currentUser) {
        if (state.users[email]) {
            alert('Email sudah digunakan oleh akun lain');
            return;
        }
        
        // Update user key in state
        state.users[email] = state.users[state.currentUser];
        delete state.users[state.currentUser];
        state.currentUser = email;
    }
    
    state.users[state.currentUser].name = name;
    state.users[state.currentUser].email = email;
    
    // Update UI
    document.getElementById('sidebar-username').textContent = name;
    
    saveToLocalStorage();
    alert('Pengaturan akun berhasil disimpan');
}

// Save budget settings
function saveBudgetSettings(e) {
    e.preventDefault();
    const monthlyBudget = parseFloat(document.getElementById('monthly-budget').value) || 0;
    const savingsGoal = parseInt(document.getElementById('savings-goal').value) || 0;
    const notificationsEnabled = document.getElementById('notifications-enabled').checked;
    
    state.users[state.currentUser].monthlyBudget = monthlyBudget;
    state.users[state.currentUser].savingsGoal = savingsGoal;
    state.users[state.currentUser].notificationsEnabled = notificationsEnabled;
    
    saveToLocalStorage();
    updateDashboard();
    alert('Pengaturan anggaran berhasil disimpan');
}

// Show confirmation dialog
function showConfirmation(title, message, callback) {
    document.getElementById('confirmationModalTitle').textContent = title;
    document.getElementById('confirmationModalBody').textContent = message;
    
    confirmActionBtn.onclick = function() {
        callback();
        confirmationModal.hide();
    };
    
    confirmationModal.show();
}

// Export all data to Excel
function exportAllData() {
    // Prepare worksheets
    const transactionsWS = XLSX.utils.json_to_sheet(state.transactions.map(t => {
        const category = state.categories.find(c => c.id === t.categoryId);
        return {
            Tanggal: t.date,
            Jenis: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            Kategori: category ? category.name : 'Lainnya',
            Keterangan: t.description,
            Jumlah: t.amount,
            'Jumlah (Format)': formatCurrency(t.amount)
        };
    }));
    
    const categoriesWS = XLSX.utils.json_to_sheet(state.categories.map(c => ({
        Nama: c.name,
        Jenis: c.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        Ikon: c.icon,
        Warna: c.color
    })));
    
    const userWS = XLSX.utils.json_to_sheet([{
        Nama: state.users[state.currentUser].name,
        Email: state.users[state.currentUser].email,
        'Mata Uang': state.users[state.currentUser].currency,
        'Anggaran Bulanan': state.users[state.currentUser].monthlyBudget,
        'Target Tabungan (%)': state.users[state.currentUser].savingsGoal,
        'Notifikasi Aktif': state.users[state.currentUser].notificationsEnabled ? 'Ya' : 'Tidak'
    }]);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, transactionsWS, "Transaksi");
    XLSX.utils.book_append_sheet(wb, categoriesWS, "Kategori");
    XLSX.utils.book_append_sheet(wb, userWS, "Pengaturan");
    
    // Export to file
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    XLSX.writeFile(wb, `BudgetGenius_SemuaData_${dateStr}.xlsx`);
}

// Export report to Excel
function exportReport() {
    // Get current and previous month data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const prevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
    
    // Calculate category data for report
    const categoryData = {};
    
    state.transactions.forEach(t => {
        if (t.type === 'expense') {
            const date = new Date(t.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const category = state.categories.find(c => c.id === t.categoryId) || { name: 'Lainnya' };
            
            if (!categoryData[category.name]) {
                categoryData[category.name] = {
                    currentMonth: 0,
                    prevMonth: 0
                };
            }
            
            if (monthYear === currentMonthStr) {
                categoryData[category.name].currentMonth += t.amount;
            } else if (monthYear === prevMonthStr) {
                categoryData[category.name].prevMonth += t.amount;
            }
        }
    });
    
    // Prepare worksheet data
    const reportData = Object.entries(categoryData).map(([category, data]) => {
        const change = data.prevMonth ? ((data.currentMonth - data.prevMonth) / data.prevMonth) * 100 : 0;
        const percentage = data.currentMonth ? (data.currentMonth / Object.values(categoryData).reduce((sum, d) => sum + d.currentMonth, 0)) * 100 : 0;
        
        return {
            Kategori: category,
            'Bulan Ini': data.currentMonth,
            'Bulan Lalu': data.prevMonth,
            Perubahan: `${change.toFixed(1)}% ${change >= 0 ? '↑' : '↓'}`,
            'Persentase': `${percentage.toFixed(1)}%`
        };
    });
    
    // Calculate totals
    const totalCurrent = Object.values(categoryData).reduce((sum, d) => sum + d.currentMonth, 0);
    const totalPrevious = Object.values(categoryData).reduce((sum, d) => sum + d.prevMonth, 0);
    const totalChange = totalPrevious ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : 0;
    
    // Add total row
    reportData.push({
        Kategori: 'TOTAL',
        'Bulan Ini': totalCurrent,
        'Bulan Lalu': totalPrevious,
        Perubahan: `${totalChange.toFixed(1)}% ${totalChange >= 0 ? '↑' : '↓'}`,
        'Persentase': '100%'
    });
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(reportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    
    // Export to file
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    XLSX.writeFile(wb, `BudgetGenius_Laporan_${dateStr}.xlsx`);
}

// Reset all data
function resetAllData() {
    // Reset user-specific data
    state.users[state.currentUser].transactions = [];
    state.users[state.currentUser].categories = JSON.parse(JSON.stringify(state.categories)); // Reset to default categories
    state.users[state.currentUser].monthlyBudget = 0;
    state.users[state.currentUser].savingsGoal = 20;
    
    // Update state
    state.transactions = [];
    state.categories = state.users[state.currentUser].categories;
    
    // Save to localStorage and Firebase
    saveToLocalStorage();
    
    // Update UI
    updateDashboard();
    renderRecentTransactions();
    renderAllCategories();
    renderAllTransactions();
    renderUserSettings();
    
    alert('Semua data telah direset ke kondisi awal');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

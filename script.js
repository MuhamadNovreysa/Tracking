// DOM Elements
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
const refreshInsightsBtn = document.getElementById('refresh-insights');

// Chart instances
let spendingChart, categoryChart, comparisonChart, trendChart;

// App State
let state = {
    transactions: [],
    categories: [],
    user: {
        name: 'John Doe',
        email: 'john@example.com',
        currency: 'USD',
        monthlyBudget: 3000,
        savingsGoal: 20,
        notificationsEnabled: true
    },
    currentPeriod: 'month',
    currentPage: 'dashboard',
    editingTransaction: null,
    editingCategory: null
};

// Initialize the app
function init() {
    loadSampleData();
    setupEventListeners();
    renderCategoriesDropdown();
    renderAllCategories();
    updateDashboard();
    renderRecentTransactions();
    renderAllTransactions();
    renderUserSettings();
}

// Load sample data for demonstration
function loadSampleData() {
    // Sample categories
    state.categories = [
        { id: 1, name: 'Salary', type: 'income', icon: 'money-bill-wave', color: '#28a745' },
        { id: 2, name: 'Freelance', type: 'income', icon: 'laptop-code', color: '#17a2b8' },
        { id: 3, name: 'Food', type: 'expense', icon: 'utensils', color: '#dc3545' },
        { id: 4, name: 'Transport', type: 'expense', icon: 'bus', color: '#fd7e14' },
        { id: 5, name: 'Entertainment', type: 'expense', icon: 'film', color: '#6f42c1' },
        { id: 6, name: 'Rent', type: 'expense', icon: 'home', color: '#343a40' }
    ];

    // Sample transactions
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    state.transactions = [
        { id: 1, amount: 2500, description: 'Monthly Salary', categoryId: 1, date: formatDate(today), type: 'income' },
        { id: 2, amount: 500, description: 'Freelance Project', categoryId: 2, date: formatDate(today), type: 'income' },
        { id: 3, amount: 75, description: 'Grocery Shopping', categoryId: 3, date: formatDate(today), type: 'expense' },
        { id: 4, amount: 30, description: 'Taxi Rides', categoryId: 4, date: formatDate(today), type: 'expense' },
        { id: 5, amount: 1200, description: 'Apartment Rent', categoryId: 6, date: formatDate(today), type: 'expense' },
        { id: 6, amount: 45, description: 'Movie Tickets', categoryId: 5, date: formatDate(today), type: 'expense' },
        { id: 7, amount: 2500, description: 'Last Month Salary', categoryId: 1, date: formatDate(lastMonth), type: 'income' },
        { id: 8, amount: 80, description: 'Dinner Out', categoryId: 3, date: formatDate(lastMonth), type: 'expense' },
        { id: 9, amount: 1200, description: 'Last Month Rent', categoryId: 6, date: formatDate(lastMonth), type: 'expense' }
    ];
}

// Set up event listeners
function setupEventListeners() {
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
        document.getElementById('transactionModalTitle').textContent = 'Add New Transaction';
        document.getElementById('transaction-date').value = formatDate(new Date());
        transactionModal.show();
    });

    saveTransactionBtn.addEventListener('click', saveTransaction);

    // Categories
    addCategoryBtn.addEventListener('click', () => {
        state.editingCategory = null;
        categoryForm.reset();
        document.getElementById('categoryModalTitle').textContent = 'Add New Category';
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

    // Refresh insights
    refreshInsightsBtn.addEventListener('click', generateInsights);
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
    pageTitle.textContent = document.querySelector(`.nav-link[href="#${page}"]`).textContent.trim();
    
    // Page-specific initializations
    switch (page) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'transactions':
            renderAllTransactions();
            break;
        case 'categories':
            renderAllCategories();
            break;
        case 'reports':
            renderReports();
            break;
        case 'insights':
            generateInsights();
            break;
        case 'settings':
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

// Format date for display (e.g., Jan 1, 2023)
function formatDisplayDate(dateStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: state.user.currency }).format(amount);
}

// Save transaction
function saveTransaction() {
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value.trim();
    const categoryId = parseInt(document.getElementById('transaction-category').value);
    const date = document.getElementById('transaction-date').value;
    const type = document.querySelector('input[name="transaction-type"]:checked').value;
    
    if (!amount || !description || !categoryId || !date) {
        alert('Please fill in all fields');
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
        alert('Please enter a category name');
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
        incomeGroup.label = 'Income';
        incomeCategories.forEach(category => {
            incomeGroup.innerHTML += `<option value="${category.id}">${category.name}</option>`;
        });
        dropdown.appendChild(incomeGroup);
    }
    
    if (expenseCategories.length > 0) {
        const expenseGroup = document.createElement('optgroup');
        expenseGroup.label = 'Expenses';
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
                document.getElementById('categoryModalTitle').textContent = 'Edit Category';
                document.getElementById('category-name').value = category.name;
                document.getElementById('category-type').value = category.type;
                document.getElementById('category-icon').value = category.icon;
                document.getElementById('category-color').value = category.color;
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
                    'Delete Category',
                    `Are you sure you want to delete the "${category.name}" category?`,
                    () => {
                        state.categories = state.categories.filter(c => c.id !== id);
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
    const incomePercentage = state.user.monthlyBudget ? Math.min(100, (totalIncome / state.user.monthlyBudget) * 100) : 0;
    const expensePercentage = state.user.monthlyBudget ? Math.min(100, (totalExpense / state.user.monthlyBudget) * 100) : 0;
    const balancePercentage = state.user.monthlyBudget ? Math.min(100, (balance / state.user.monthlyBudget) * 100) : 0;
    
    document.getElementById('income-progress').style.width = `${incomePercentage}%`;
    document.getElementById('expense-progress').style.width = `${expensePercentage}%`;
    document.getElementById('balance-progress').style.width = `${balancePercentage}%`;
    
    // Render charts
    renderSpendingChart(filteredTransactions);
    renderCategoryChart(filteredTransactions);
    
    // Generate insights
    generateInsights();
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
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
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
            const categoryName = category ? category.name : 'Uncategorized';
            
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
        container.innerHTML = '<tr><td colspan="4" class="text-center">No transactions found</td></tr>';
        return;
    }
    
    filteredTransactions.forEach(transaction => {
        const category = state.categories.find(c => c.id === transaction.categoryId);
        const categoryName = category ? category.name : 'Uncategorized';
        
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
        container.innerHTML = '<tr><td colspan="5" class="text-center">No transactions found</td></tr>';
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
        const categoryName = category ? category.name : 'Uncategorized';
        
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
            <span aria-hidden="true">&laquo;</span>
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
            <span aria-hidden="true">&raquo;</span>
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
                document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
                document.getElementById('transaction-amount').value = transaction.amount;
                document.getElementById('transaction-description').value = transaction.description;
                document.getElementById('transaction-category').value = transaction.categoryId;
                document.getElementById('transaction-date').value = transaction.date;
                document.getElementById(`type-${transaction.type}`).checked = true;
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
                    'Delete Transaction',
                    `Are you sure you want to delete this transaction: "${transaction.description}"?`,
                    () => {
                        state.transactions = state.transactions.filter(t => t.id !== id);
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
                return new Date(year, m - 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
            }),
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
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
                return new Date(year, m - 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
            }),
            datasets: [{
                label: 'Monthly Spending',
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
            const category = state.categories.find(c => c.id === t.categoryId) || { name: 'Uncategorized' };
            
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
                        <i class="fas fa-check-circle me-2"></i> Excellent Savings Rate
                    </div>
                    <div class="insight-text">
                        Your savings rate is ${savingsRate.toFixed(1)}%, which is above the recommended 20%. 
                        Keep up the good work!
                    </div>
                </div>
            `;
        } else if (savingsRate >= 10) {
            healthHTML += `
                <div class="insight-item">
                    <div class="insight-title text-warning">
                        <i class="fas fa-exclamation-circle me-2"></i> Moderate Savings Rate
                    </div>
                    <div class="insight-text">
                        Your savings rate is ${savingsRate.toFixed(1)}%, which is below the recommended 20%. 
                        Consider increasing your savings by reducing expenses or increasing income.
                    </div>
                </div>
            `;
        } else {
            healthHTML += `
                <div class="insight-item">
                    <div class="insight-title text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i> Low Savings Rate
                    </div>
                    <div class="insight-text">
                        Your savings rate is only ${savingsRate.toFixed(1)}%, which is very low. 
                        You should aim to save at least 20% of your income for financial security.
                    </div>
                </div>
            `;
        }
        
        if (expenseRatio <= 70) {
            healthHTML += `
                <div class="insight-item">
                    <div class="insight-title text-success">
                        <i class="fas fa-check-circle me-2"></i> Healthy Spending
                    </div>
                    <div class="insight-text">
                        You're spending ${expenseRatio.toFixed(1)}% of your income, which leaves a good amount for savings. 
                        This is a sustainable financial habit.
                    </div>
                </div>
            `;
        } else {
            healthHTML += `
                <div class="insight-item">
                    <div class="insight-title text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i> High Spending
                    </div>
                    <div class="insight-text">
                        You're spending ${expenseRatio.toFixed(1)}% of your income, which doesn't leave much for savings. 
                        Consider reviewing your expenses to find areas to cut back.
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
                const category = state.categories.find(c => c.id === t.categoryId) || { name: 'Uncategorized' };
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
                        <i class="fas fa-chart-pie me-2"></i> Top Spending Categories
                    </div>
                    <div class="insight-text">
                        Your top spending categories are:
                        <ul>
                            ${topCategories.map(([name, amount]) => `
                                <li><strong>${name}</strong>: ${formatCurrency(amount)} (${(amount / totalExpense * 100).toFixed(1)}% of expenses)</li>
                            `).join('')}
                        </ul>
                        Consider reviewing these areas for potential savings.
                    </div>
                </div>
            `;
        }
        
        // Budget comparison
        if (state.user.monthlyBudget) {
            const budgetUsage = (totalExpense / state.user.monthlyBudget) * 100;
            
            if (budgetUsage > 100) {
                recommendationsHTML += `
                    <div class="insight-item">
                        <div class="insight-title text-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i> Over Budget
                        </div>
                        <div class="insight-text">
                            You've exceeded your monthly budget by ${formatCurrency(totalExpense - state.user.monthlyBudget)} 
                            (${budgetUsage.toFixed(1)}% of budget). Try to reduce spending in the coming weeks.
                        </div>
                    </div>
                `;
            } else if (budgetUsage > 80) {
                recommendationsHTML += `
                    <div class="insight-item">
                        <div class="insight-title text-warning">
                            <i class="fas fa-exclamation-circle me-2"></i> Approaching Budget Limit
                        </div>
                        <div class="insight-text">
                            You've used ${budgetUsage.toFixed(1)}% of your monthly budget. 
                            Be cautious with additional spending this month.
                        </div>
                    </div>
                `;
            } else {
                recommendationsHTML += `
                    <div class="insight-item">
                        <div class="insight-title text-success">
                            <i class="fas fa-check-circle me-2"></i> Within Budget
                        </div>
                        <div class="insight-text">
                            You've used ${budgetUsage.toFixed(1)}% of your monthly budget. 
                            Good job staying within your spending limits!
                        </div>
                    </div>
                `;
            }
        }
        
        // Savings goal
        if (state.user.savingsGoal) {
            const currentSavingsRate = (balance / totalIncome) * 100;
            
            if (currentSavingsRate >= state.user.savingsGoal) {
                recommendationsHTML += `
                    <div class="insight-item">
                        <div class="insight-title text-success">
                            <i class="fas fa-check-circle me-2"></i> Meeting Savings Goal
                        </div>
                        <div class="insight-text">
                            You're saving ${currentSavingsRate.toFixed(1)}% of your income, which meets your 
                            ${state.user.savingsGoal}% savings goal. Excellent work!
                        </div>
                    </div>
                `;
            } else {
                const needed = (state.user.savingsGoal / 100 * totalIncome) - balance;
                recommendationsHTML += `
                    <div class="insight-item">
                        <div class="insight-title text-warning">
                            <i class="fas fa-exclamation-circle me-2"></i> Below Savings Goal
                        </div>
                        <div class="insight-text">
                            You're saving ${currentSavingsRate.toFixed(1)}% of your income, which is below your 
                            ${state.user.savingsGoal}% goal. You need to save an additional 
                            ${formatCurrency(needed)} this period to meet your target.
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
                        <i class="fas fa-smile me-2"></i> Positive Cash Flow
                    </div>
                    <div class="insight-text">
                        You have a positive balance of ${formatCurrency(balance)} this period. 
                        Consider allocating some of this to savings or investments.
                    </div>
                </div>
            `;
        } else {
            dashboardHTML += `
                <div class="insight-item">
                    <div class="insight-title text-danger">
                        <i class="fas fa-frown me-2"></i> Negative Cash Flow
                    </div>
                    <div class="insight-text">
                        You have a negative balance of ${formatCurrency(-balance)} this period. 
                        Review your expenses to avoid overspending.
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
                        <i class="fas fa-chart-line me-2"></i> Period Comparison
                    </div>
                    <div class="insight-text">
                        <ul>
                            <li>Income: ${incomeChange >= 0 ? '↑' : '↓'} ${Math.abs(incomeChange).toFixed(1)}% 
                                (${formatCurrency(totalIncome)} vs ${formatCurrency(prevIncome)})</li>
                            <li>Expenses: ${expenseChange >= 0 ? '↑' : '↓'} ${Math.abs(expenseChange).toFixed(1)}% 
                                (${formatCurrency(totalExpense)} vs ${formatCurrency(prevExpense)})</li>
                            <li>Balance: ${balanceChange >= 0 ? '↑' : '↓'} ${Math.abs(balanceChange).toFixed(1)}% 
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
    document.getElementById('user-name').value = state.user.name;
    document.getElementById('user-email').value = state.user.email;
    document.getElementById('user-currency').value = state.user.currency;
    document.getElementById('monthly-budget').value = state.user.monthlyBudget;
    document.getElementById('savings-goal').value = state.user.savingsGoal;
    document.getElementById('notifications-enabled').checked = state.user.notificationsEnabled;
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
            Date: t.date,
            Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
            Category: category ? category.name : 'Uncategorized',
            Description: t.description,
            Amount: t.amount,
            'Amount (Formatted)': formatCurrency(t.amount)
        };
    }));
    
    const categoriesWS = XLSX.utils.json_to_sheet(state.categories.map(c => ({
        Name: c.name,
        Type: c.type.charAt(0).toUpperCase() + c.type.slice(1),
        Icon: c.icon,
        Color: c.color
    })));
    
    const userWS = XLSX.utils.json_to_sheet([{
        Name: state.user.name,
        Email: state.user.email,
        Currency: state.user.currency,
        'Monthly Budget': state.user.monthlyBudget,
        'Savings Goal (%)': state.user.savingsGoal,
        'Notifications Enabled': state.user.notificationsEnabled ? 'Yes' : 'No'
    }]);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, transactionsWS, "Transactions");
    XLSX.utils.book_append_sheet(wb, categoriesWS, "Categories");
    XLSX.utils.book_append_sheet(wb, userWS, "User Settings");
    
    // Export to file
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    XLSX.writeFile(wb, `BudgetGenius_Export_${dateStr}.xlsx`);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);


                  

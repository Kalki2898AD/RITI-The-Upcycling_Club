let token = localStorage.getItem('adminToken');
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];

// Client-side logger
const logger = {
    info: (message) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(message);
        }
    },
    warn: (message) => {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(message);
        }
    },
    error: (message, error) => {
        if (process.env.NODE_ENV !== 'production') {
            console.error(message, error);
        }
    }
};

// Check authentication status
function checkAuth() {
    if (token) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        loadRegistrations();
    } else {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('dashboard-section').classList.add('hidden');
    }
}

// Handle login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (data.token) {
            token = data.token;
            localStorage.setItem('adminToken', token);
            checkAuth();
        } else {
            alert('Invalid credentials');
        }
    } catch (error) {
        logger.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

// Handle logout
document.getElementById('logout-btn').addEventListener('click', () => {
    token = null;
    localStorage.removeItem('adminToken');
    checkAuth();
});

// Load registrations data
async function loadRegistrations() {
    try {
        const response = await fetch('/api/registrations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            token = null;
            localStorage.removeItem('adminToken');
            checkAuth();
            return;
        }

        const data = await response.json();
        filteredData = data.registrations;
        updateTable();
        updatePagination();
    } catch (error) {
        logger.error('Error loading registrations:', error);
    }
}

// Update table with filtered and paginated data
function updateTable() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    const tbody = document.getElementById('registrations-table');
    tbody.innerHTML = '';

    pageData.forEach(registration => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${registration.name}</td>
            <td>${registration.rollNumber}</td>
            <td>${registration.class}</td>
            <td>${registration.year}</td>
            <td>₹${registration.amount}</td>
            <td>${new Date(registration.date).toLocaleDateString()}</td>
            <td>
                <span class="px-2 py-1 rounded ${
                    registration.paymentVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }">
                    ${registration.paymentVerified ? 'Verified' : 'Pending'}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('showing-count').textContent = Math.min(filteredData.length, endIndex);
    document.getElementById('total-count').textContent = filteredData.length;
}

// Handle pagination
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
        updatePagination();
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    const maxPage = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        updateTable();
        updatePagination();
    }
});

function updatePagination() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= Math.ceil(filteredData.length / itemsPerPage);
}

// Handle filters
document.getElementById('search-input').addEventListener('input', filterData);
document.getElementById('year-filter').addEventListener('change', filterData);
document.getElementById('amount-filter').addEventListener('change', filterData);

function filterData() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const yearFilter = document.getElementById('year-filter').value;
    const amountFilter = document.getElementById('amount-filter').value;

    filteredData = filteredData.filter(registration => {
        const matchesSearch = 
            registration.name.toLowerCase().includes(searchTerm) ||
            registration.rollNumber.toLowerCase().includes(searchTerm);
        
        const matchesYear = !yearFilter || registration.year.toString() === yearFilter;
        const matchesAmount = !amountFilter || registration.amount.toString() === amountFilter;

        return matchesSearch && matchesYear && matchesAmount;
    });

    currentPage = 1;
    updateTable();
    updatePagination();
}

// Initialize dashboard
checkAuth();

// QR Code Scanner
let html5QrcodeScanner;

document.addEventListener('DOMContentLoaded', () => {
    initializeScanner();
});

function initializeScanner() {
    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { 
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        }
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
}

function onScanSuccess(registrationId) {
    // Stop scanner after successful scan
    html5QrcodeScanner.clear();

    // Fetch participant details
    fetch(`/api/participant/${registrationId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayParticipantDetails(data.participant);
            } else {
                alert('Error: ' + data.message);
                restartScanner();
            }
        })
        .catch(error => {
            logger.error('Error:', error);
            alert('Failed to fetch participant details');
            restartScanner();
        });
}

function onScanError(error) {
    // Handle scan error if needed
    logger.warn(`QR Code scan error: ${error}`);
}

function displayParticipantDetails(participant) {
    // Show participant details section and hide scanner
    document.getElementById('scanner-section').classList.add('hidden');
    document.getElementById('participant-details').classList.remove('hidden');

    // Update details
    document.getElementById('participant-games').textContent = `${participant.games} Games`;
    document.getElementById('participant-amount').textContent = `₹${participant.amount}`;
    document.getElementById('participant-payment').textContent = participant.paymentMethod;
    document.getElementById('participant-status').textContent = participant.paymentStatus;
    document.getElementById('participant-date').textContent = new Date(participant.registrationDate).toLocaleString();
}

// Handle "Verify Another" button click
document.getElementById('verify-another').addEventListener('click', () => {
    document.getElementById('participant-details').classList.add('hidden');
    document.getElementById('scanner-section').classList.remove('hidden');
    initializeScanner();
});

function restartScanner() {
    document.getElementById('scanner-section').classList.remove('hidden');
    initializeScanner();
}

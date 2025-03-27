// Global variables to store selected options
let selectedAmount = null;
let selectedGames = null;
let selectedPaymentMethod = null;
let paymentScreenshot = null;
let transactionId = null;

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

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    let selectedGames = null;
    let selectedPaymentMethod = null;
    let selectedAmount = null;

    // Add input validation for UTR field
    document.getElementById('transaction-id-input').addEventListener('input', function(e) {
        // Remove any non-digit characters
        this.value = this.value.replace(/\D/g, '');
        
        // Enforce max length of 12
        if (this.value.length > 12) {
            this.value = this.value.slice(0, 12);
        }
    });

    // Branch options based on year
    const branchOptions = {
        '1': ['CSM', 'CSE'],
        '2': ['CSM', 'CSE', 'IT', 'DS'],
        '3': ['CSM', 'CSE', 'IT', 'DS'],
        '4': ['CSM', 'CSE', 'IT', 'DS']
    };

    // Handle year selection to update branch options
    document.getElementById('year').addEventListener('change', function() {
        const branchSelect = document.getElementById('branch');
        const selectedYear = this.value;
        
        // Clear existing options
        branchSelect.innerHTML = '<option value="">Select Branch</option>';
        
        // Add new options based on year
        if (selectedYear && branchOptions[selectedYear]) {
            branchOptions[selectedYear].forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                branchSelect.appendChild(option);
            });
        }
    });

    // Function to toggle game selection visibility based on package
    const toggleGameSelection = () => {
        const gameSelectionContainer = document.getElementById('game-selection-container');
        const gameSelection = document.getElementById('game-selection');
        
        if (selectedGames === '1') {
            gameSelectionContainer.classList.remove('hidden');
            gameSelection.required = true;
        } else {
            gameSelectionContainer.classList.add('hidden');
            gameSelection.required = false;
            gameSelection.value = '';
        }
    };

    // Game package selection
    document.querySelectorAll('.select-package').forEach(button => {
        button.addEventListener('click', function() {
            selectedGames = this.dataset.games;
            selectedAmount = this.dataset.amount;
            
            document.getElementById('selected-package').value = selectedGames === '2' ? '2 Games Package' : 'Single Game';
            document.getElementById('amount-display').value = selectedAmount;
            
            document.getElementById('game-options').classList.add('hidden');
            document.getElementById('payment-section').classList.remove('hidden');
            
            toggleGameSelection();
        });
    });

    // Back button functionality
    document.getElementById('back-to-packages').addEventListener('click', function() {
        document.getElementById('payment-section').classList.add('hidden');
        document.getElementById('registration-form').classList.add('hidden');
        document.getElementById('game-options').classList.remove('hidden');
        
        // Reset payment selections
        selectedPaymentMethod = null;
        document.getElementById('payment-method-display').value = '';
        document.getElementById('qr-display').classList.add('hidden');
        
        // Reset payment button colors
        document.querySelectorAll('.payment-method').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'bg-purple-600', 'bg-gray-600');
        });
    });

    // Handle payment method selection
    const handlePaymentMethod = async (method) => {
        if (!selectedGames || !selectedAmount) {
            alert('Please select a package first');
            return;
        }

        selectedPaymentMethod = method;
        document.getElementById('payment-method-display').value = method.toUpperCase();

        // Reset payment button colors
        document.querySelectorAll('.payment-method').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'bg-purple-600', 'bg-gray-600');
        });

        // Set selected button color
        const button = document.querySelector(`[data-method="${method}"]`);
        if (button) {
            button.classList.add(method === 'gpay' ? 'bg-blue-600' : method === 'phonepe' ? 'bg-purple-600' : 'bg-gray-600');
        }

        if (method !== 'cash') {
            try {
                const response = await fetch('/qr-code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: selectedAmount,
                        paymentMethod: method
                    })
                });

                const result = await response.json();
                if (result.success) {
                    document.getElementById('payment-qr').src = result.qrCode;
                    document.getElementById('qr-display').classList.remove('hidden');
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                alert('Failed to generate QR code. Please try again.');
                console.error('QR code generation error:', error);
            }
        } else {
            document.getElementById('qr-display').classList.add('hidden');
        }

        document.getElementById('registration-form').classList.remove('hidden');
    };

    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(button => {
        button.addEventListener('click', async function() {
            await handlePaymentMethod(this.dataset.method);
        });
    });

    // Payment complete button
    document.getElementById('payment-done').onclick = function() {
        const transactionInput = document.getElementById('transaction-id-input');
        const registrationForm = document.getElementById('registration-form');
        
        if (selectedPaymentMethod === 'cash') {
            registrationForm.classList.remove('hidden');
            return;
        }
        
        if (!transactionInput || !transactionInput.value.trim()) {
            alert('Please enter the UTR number');
            return;
        }
        
        if (!/^\d{12}$/.test(transactionInput.value.trim())) {
            alert('UTR must be exactly 12 digits');
            return;
        }

        registrationForm.classList.remove('hidden');
    };

    // Form submission
    document.getElementById('user-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData();
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const mobile = document.getElementById('mobile').value.trim();
        const year = document.getElementById('year').value;
        const branch = document.getElementById('branch').value;
        const section = document.getElementById('section').value.trim();
        const gameSelection = document.getElementById('game-selection').value;

        // Validate all required fields
        if (!name || !mobile || !year || !branch || !section || !selectedGames || !selectedPaymentMethod || !selectedAmount) {
            alert('Please fill in all required fields');
            return;
        }

        // Validate game selection for single game package
        if (selectedGames === '1' && !gameSelection) {
            alert('Please select a game');
            return;
        }

        // Validate mobile number
        if (!/^\d{10}$/.test(mobile)) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        // Add form fields
        formData.append('name', name);
        formData.append('mobile', mobile);
        formData.append('year', year);
        formData.append('branch', branch);
        formData.append('section', section);
        
        // Handle game selection
        if (selectedGames === '1') {
            formData.append('selectedPackage', gameSelection);
        } else {
            formData.append('selectedPackage', '2 Games Package');
        }
        
        formData.append('paymentMethod', selectedPaymentMethod === 'gpay' ? 'GPAY' : selectedPaymentMethod === 'phonepe' ? 'PHONEPE' : 'CASH');
        formData.append('amount', selectedAmount);

        // Add transaction ID for non-cash payments
        if (selectedPaymentMethod !== 'cash') {
            const transactionId = document.getElementById('transaction-id-input').value.trim();
            if (!transactionId || !/^\d{12}$/.test(transactionId)) {
                alert('Please enter a valid 12-digit UTR number');
                return;
            }
            formData.append('transactionId', transactionId);
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                // Display participant details
                document.getElementById('participant-name').textContent = `Name: ${result.participantData.name}`;
                document.getElementById('participant-id').textContent = `ID: ${result.participantData.id}`;
                document.getElementById('participant-package').textContent = `Package: ${result.participantData.package}`;

                // Display QR code
                const qrContainer = document.getElementById('participant-qr');
                qrContainer.innerHTML = `<img src="${result.qrCode}" alt="Participant QR Code" class="max-w-full h-auto">`;

                // Set up download button
                const downloadButton = document.getElementById('download-qr');
                downloadButton.onclick = () => {
                    const link = document.createElement('a');
                    link.download = `RITI-${result.participantData.id}.png`;
                    link.href = result.qrCode;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                };

                // Reset form
                this.reset();
                selectedGames = null;
                selectedPaymentMethod = null;
                selectedAmount = null;
                
                // Reset form displays
                document.getElementById('selected-package').value = '';
                document.getElementById('payment-method-display').value = '';
                document.getElementById('amount-display').value = '';
                
                // Hide sections
                document.getElementById('payment-section').classList.add('hidden');
                document.getElementById('registration-form').classList.add('hidden');
                document.getElementById('game-options').classList.remove('hidden');
                document.getElementById('qr-display').classList.add('hidden');
                
                // Reset payment buttons
                document.querySelectorAll('.payment-method').forEach(btn => {
                    btn.classList.remove('bg-blue-600', 'bg-purple-600', 'bg-gray-600');
                });

                // Show success modal
                document.getElementById('success-modal').classList.remove('hidden');
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            alert(error.message || 'Registration failed. Please try again.');
            console.error('Registration error:', error);
        }
    });
});

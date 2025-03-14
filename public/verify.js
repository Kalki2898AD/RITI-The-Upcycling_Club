let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", { fps: 10, qrbox: { width: 250, height: 250 } }
);

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

function onScanSuccess(decodedText, decodedResult) {
    try {
        const participantData = JSON.parse(decodedText);
        fetchAndDisplayParticipantDetails(participantData.id);
    } catch (error) {
        logger.error('QR code parsing error:', error);
        alert('Invalid QR code format');
    }
}

function onScanError(error) {
    logger.error('QR Code scan error:', error);
}

async function fetchAndDisplayParticipantDetails(participantId) {
    try {
        const response = await fetch(`/api/participant/${participantId}`);
        const data = await response.json();
        
        if (data.success) {
            // Stop scanner after successful scan
            html5QrcodeScanner.clear();
            
            // Display participant details
            document.getElementById('participant-name').textContent = data.participant.name;
            document.getElementById('participant-roll').textContent = data.participant.rollNumber;
            document.getElementById('participant-branch').textContent = data.participant.branch;
            document.getElementById('participant-year').textContent = `${data.participant.year} Year`;
            document.getElementById('participant-games').textContent = `${data.participant.games} Games`;
            document.getElementById('participant-payment').textContent = data.participant.paymentMethod === 'cash' ? 
                'Cash Payment' : `${data.participant.paymentMethod} - ₹${data.participant.amount}`;

            // Show details section
            document.getElementById('scanner-section').classList.add('hidden');
            document.getElementById('participant-details').classList.remove('hidden');
        } else {
            logger.warn('Participant not found');
            alert('Participant not found');
        }
    } catch (error) {
        logger.error('Error fetching participant details:', error);
        alert('Error fetching participant details. Please try again.');
    }
}

// Initialize scanner
html5QrcodeScanner.render(onScanSuccess, onScanError);

// Handle verify another button
document.getElementById('verify-another').addEventListener('click', () => {
    // Hide details and show scanner
    document.getElementById('participant-details').classList.add('hidden');
    document.getElementById('scanner-section').classList.remove('hidden');
    
    // Reinitialize scanner
    html5QrcodeScanner.render(onScanSuccess, onScanError);
});

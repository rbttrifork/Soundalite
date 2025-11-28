// Game state
let currentScreen = 'title';
let clientId = null;
let inviteUrl = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load client ID and invite URL from API
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        
        if (data.error) {
            console.error('Config error:', data.error);
            alert('Failed to load bot configuration: ' + data.error);
            return;
        }
        
        clientId = data.clientId;
        inviteUrl = data.inviteUrl;
        
        if (!inviteUrl) {
            console.error('Invite URL not provided by server');
            alert('Failed to generate invite URL. Please check the server configuration.');
        }
    } catch (error) {
        console.error('Failed to load config:', error);
        alert('Failed to load bot configuration. Please check the server setup.');
    }

    // Setup event listeners
    setupEventListeners();
    
    // Setup keyboard navigation
    setupKeyboardNavigation();
    
    // Add sound effects (optional - can be added later)
    // setupSoundEffects();
});

function setupEventListeners() {
    // Main invite button on title screen
    const inviteButtonMain = document.getElementById('inviteButtonMain');
    if (inviteButtonMain) {
        inviteButtonMain.addEventListener('click', () => {
            if (inviteUrl) {
                window.open(inviteUrl, '_blank');
                // Add visual feedback
                inviteButtonMain.style.background = 'linear-gradient(135deg, #06a77d 0%, #118ab2 100%)';
                setTimeout(() => {
                    inviteButtonMain.style.background = 'linear-gradient(135deg, #118ab2 0%, #6a4c93 100%)';
                }, 500);
            } else {
                alert('Invite URL not available. Please check the server configuration.');
            }
        });
    }

    // Invite button on invite screen (if user navigates there)
    const inviteButton = document.getElementById('inviteButton');
    if (inviteButton) {
        inviteButton.addEventListener('click', () => {
            if (inviteUrl) {
                window.open(inviteUrl, '_blank');
                // Add visual feedback
                inviteButton.style.background = 'linear-gradient(135deg, #06a77d 0%, #118ab2 100%)';
                setTimeout(() => {
                    inviteButton.style.background = 'linear-gradient(135deg, #118ab2 0%, #6a4c93 100%)';
                }, 500);
            } else {
                alert('Invite URL not available. Please check the server configuration.');
            }
        });
    }

    // Back buttons (go back to title screen)
    const backButtons = ['backButton', 'backFromFeatures', 'backFromAbout'];
    backButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                showScreen('title');
            });
        }
    });
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (currentScreen === 'title') {
            if (e.key === 'Enter' || e.key === ' ') {
                // Trigger invite button click
                const inviteButtonMain = document.getElementById('inviteButtonMain');
                if (inviteButtonMain && inviteUrl) {
                    inviteButtonMain.click();
                }
            }
        } else if (currentScreen === 'invite' || currentScreen === 'features' || currentScreen === 'about') {
            if (e.key === 'Escape' || e.key === 'Backspace') {
                showScreen('title');
            }
        }
    });
}

function showScreen(screenName) {
    // Hide all screens
    const screens = ['titleScreen', 'inviteScreen', 'featuresScreen', 'aboutScreen'];
    screens.forEach(screen => {
        const element = document.getElementById(screen);
        if (element) {
            element.classList.add('hidden');
        }
    });

    // Show selected screen
    let screenId = '';
    switch (screenName) {
        case 'title':
            screenId = 'titleScreen';
            currentScreen = 'title';
            break;
        case 'invite':
            screenId = 'inviteScreen';
            currentScreen = 'invite';
            break;
        case 'features':
            screenId = 'featuresScreen';
            currentScreen = 'features';
            break;
        case 'about':
            screenId = 'aboutScreen';
            currentScreen = 'about';
            break;
    }

    if (screenId) {
        const element = document.getElementById(screenId);
        if (element) {
            element.classList.remove('hidden');
        }
    }
}

// Add some retro effects
function addRetroEffects() {
    // Add pixelated cursor effect
    document.body.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\'%3E%3Crect width=\'16\' height=\'16\' fill=\'%23fff\'/%3E%3Crect x=\'2\' y=\'2\' width=\'12\' height=\'12\' fill=\'%23000\'/%3E%3C/svg%3E"), auto';
}

// Initialize retro effects
addRetroEffects();


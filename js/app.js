// DOM Elements
const onboardingOverlay = document.getElementById('onboardingOverlay');
const startTrackingBtn = document.getElementById('startTracking');
const mainApp = document.querySelector('.main-app');
const progressRing = document.querySelector('.progress-ring__circle-fill');
const progressAmount = document.getElementById('progressAmount');
const goalAmount = document.getElementById('goalAmount');
const remainingAmount = document.getElementById('remainingAmount');
const percentageComplete = document.getElementById('percentageComplete');
const streakCount = document.getElementById('streakCount');
const intakeList = document.getElementById('intakeList');
const hydrationTip = document.getElementById('hydrationTip');
const quickAddButtons = document.querySelectorAll('.add-btn');
const navButtons = document.querySelectorAll('.nav-btn');
const settingsBtn = document.getElementById('settingsBtn');
const greeting = document.getElementById('greeting');

// State
let state = {
    userName: '',
    dailyGoal: 2000, // Default goal in ml
    currentIntake: 0,
    intakeHistory: [],
    streak: 0,
    lastUpdated: null
};

// Hydration Tips
const hydrationTips = [
    "Drinking water helps maintain the balance of body fluids.",
    "Water helps energize muscles and keeps them from getting tired.",
    "Drinking water can help control calories and support weight management.",
    "Water helps your kidneys remove waste from your blood.",
    "Even mild dehydration can drain your energy and make you tired.",
    "Drinking water can improve your skin's appearance.",
    "Water helps maintain normal bowel function and prevent constipation.",
    "Staying hydrated helps maintain proper brain function.",
    "Drinking water before meals can help reduce appetite.",
    "Water helps regulate body temperature."
];

// Initialize the app
function initApp() {
    loadState();
    setupEventListeners();
    updateUI();
    showRandomTip();
    checkForNewDay();
}

// Load state from localStorage
function loadState() {
    const savedState = localStorage.getItem('hydrateMeState');
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            state = { ...state, ...parsedState };
            
            // If it's a new day, reset current intake but keep the history
            if (!isSameDay(new Date(parsedState.lastUpdated), new Date())) {
                state.currentIntake = 0;
                state.lastUpdated = new Date().toISOString();
                saveState();
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    } else {
        // Show onboarding for new users
        showOnboarding();
    }
}

// Save state to localStorage
function saveState() {
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem('hydrateMeState', JSON.stringify(state));
}

// Check if it's a new day
function isSameDay(date1, date2) {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

// Check for new day and update streak
function checkForNewDay() {
    if (!state.lastUpdated) return;
    
    const lastUpdated = new Date(state.lastUpdated);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If last update was yesterday and goal was met, increment streak
    if (isSameDay(lastUpdated, yesterday) && state.currentIntake >= state.dailyGoal) {
        state.streak++;
        saveState();
    } 
    // If last update was before yesterday, reset streak
    else if (!isSameDay(lastUpdated, today) && !isSameDay(lastUpdated, yesterday)) {
        state.streak = 0;
        saveState();
    }
}

// Show onboarding screen
function showOnboarding() {
    onboardingOverlay.style.display = 'flex';
    mainApp.style.display = 'none';
}

// Hide onboarding and initialize app
function completeOnboarding() {
    const userName = document.getElementById('userName').value.trim() || 'Hydration Hero';
    const dailyGoal = parseInt(document.getElementById('dailyGoal').value) || 2000;
    
    state.userName = userName;
    state.dailyGoal = dailyGoal;
    state.currentIntake = 0;
    state.lastUpdated = new Date().toISOString();
    
    saveState();
    updateUI();
    onboardingOverlay.style.display = 'none';
    mainApp.style.display = 'block';
    
    // Show welcome message
    showNotification(`Welcome, ${userName}! Let's stay hydrated!`);
}

// Update the UI based on current state
function updateUI() {
    // Update progress ring
    const circumference = 565.48; // 2 * π * r (r = 90)
    const progress = Math.min(state.currentIntake / state.dailyGoal, 1);
    const offset = circumference - (progress * circumference);
    
    progressRing.style.strokeDashoffset = offset;
    
    // Update text displays
    progressAmount.textContent = state.currentIntake;
    goalAmount.textContent = state.dailyGoal;
    remainingAmount.textContent = Math.max(0, state.dailyGoal - state.currentIntake);
    percentageComplete.textContent = Math.round(progress * 100);
    streakCount.textContent = state.streak;
    
    // Update greeting
    greeting.textContent = getTimeBasedGreeting();
    
    // Update intake history list
    updateIntakeList();
    
    // Update progress ring color based on progress
    updateProgressRingColor(progress);
}

// Update progress ring color based on progress
function updateProgressRingColor(progress) {
    if (progress >= 1) {
        progressRing.style.stroke = '#50c878'; // Green when goal is met
    } else if (progress >= 0.75) {
        progressRing.style.stroke = '#4a90e2'; // Blue when close to goal
    } else if (progress >= 0.5) {
        progressRing.style.stroke = '#50c1e9'; // Light blue
    } else if (progress >= 0.25) {
        progressRing.style.stroke = '#6c5ce7'; // Purple
    } else {
        progressRing.style.stroke = '#ff7675'; // Red when low
    }
}

// Get time-based greeting
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${state.userName || 'there'}!`;
    if (hour < 18) return `Good afternoon, ${state.userName || 'there'}!`;
    return `Good evening, ${state.userName || 'there'}!`;
}

// Update the intake history list
function updateIntakeList() {
    if (!state.intakeHistory || state.intakeHistory.length === 0) {
        intakeList.innerHTML = '<div class="empty-state">No water logged yet today. Stay hydrated!</div>';
        return;
    }
    
    // Filter today's intakes
    const today = new Date().toDateString();
    const todayIntakes = state.intakeHistory.filter(entry => {
        return new Date(entry.timestamp).toDateString() === today;
    });
    
    if (todayIntakes.length === 0) {
        intakeList.innerHTML = '<div class="empty-state">No water logged yet today. Stay hydrated!</div>';
        return;
    }
    
    // Sort by most recent first
    todayIntakes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Generate list items
    intakeList.innerHTML = todayIntakes.map(entry => {
        const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="intake-item">
                <span class="intake-amount">+${entry.amount} ml</span>
                <span class="intake-time">${time}</span>
            </div>
        `;
    }).join('');
}

// Add water intake
function addWater(amount) {
    // Add to current intake
    state.currentIntake += amount;
    
    // Add to history
    state.intakeHistory.push({
        amount,
        timestamp: new Date().toISOString()
    });
    
    // Check if goal is reached
    if (state.currentIntake >= state.dailyGoal && state.currentIntake - amount < state.dailyGoal) {
        showAchievement('Daily Goal Achieved!', 'You\'ve reached your daily water intake goal!');
        
        // Check for streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (state.lastUpdated && isSameDay(new Date(state.lastUpdated), yesterday)) {
            state.streak++;
            showAchievement('Streak!', `You're on a ${state.streak}-day streak!`);
        } else if (!state.lastUpdated || !isSameDay(new Date(state.lastUpdated), new Date())) {
            state.streak = 1;
            showAchievement('First Day!', 'Great start to your hydration journey!');
        }
    }
    
    // Save and update UI
    saveState();
    updateUI();
    
    // Show success animation
    showWaterDropAnimation(amount);
}

// Show water drop animation
function showWaterDropAnimation(amount) {
    const drop = document.createElement('div');
    drop.className = 'water-drop';
    drop.textContent = `+${amount}ml`;
    
    // Random position near the progress ring
    const ring = document.querySelector('.progress-ring');
    const ringRect = ring.getBoundingClientRect();
    const x = ringRect.left + (ringRect.width / 2) + (Math.random() * 60 - 30);
    const y = ringRect.top + (ringRect.height / 2) + (Math.random() * 60 - 30);
    
    drop.style.left = `${x}px`;
    drop.style.top = `${y}px`;
    
    document.body.appendChild(drop);
    
    // Animate
    setTimeout(() => {
        drop.style.transform = 'translateY(-100px) scale(1.5)';
        drop.style.opacity = '0';
    }, 10);
    
    // Remove after animation
    setTimeout(() => {
        drop.remove();
    }, 1000);
}

// Show a random hydration tip
function showRandomTip() {
    const randomIndex = Math.floor(Math.random() * hydrationTips.length);
    hydrationTip.textContent = hydrationTips[randomIndex];
}

// Show achievement notification
function showAchievement(title, message) {
    // In a real app, you might want to use a proper notification library
    console.log(`Achievement: ${title} - ${message}`);
    showNotification(`🏆 ${title}: ${message}`);
    
    // Show confetti effect
    showConfetti();
}

// Show notification
function showNotification(message) {
    // In a real app, you might want to use a proper notification system
    console.log(`Notification: ${message}`);
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide after delay
    setTimeout(() => {
        notification.classList.remove('show');
        
        // Remove after animation
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Show confetti effect
function showConfetti() {
    const confettiCount = 100;
    const container = document.createElement('div');
    container.className = 'confetti-container';
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.animationDuration = `${1 + Math.random() * 2}s`;
        confetti.style.backgroundColor = getRandomColor();
        container.appendChild(confetti);
    }
    
    document.body.appendChild(container);
    
    // Remove after animation
    setTimeout(() => {
        container.remove();
    }, 3000);
}

// Get a random color for confetti
function getRandomColor() {
    const colors = ['#4a90e2', '#50c1e9', '#6c5ce7', '#a55eea', '#fd79a8', '#ff7675', '#fdcb6e', '#00b894'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Set up event listeners
function setupEventListeners() {
    // Start tracking button
    if (startTrackingBtn) {
        startTrackingBtn.addEventListener('click', completeOnboarding);
    }
    
    // Quick add buttons
    quickAddButtons.forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseInt(button.dataset.amount);
            addWater(amount);
        });
    });
    
    // Navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Handle view change (in a real app, you'd switch views here)
            const view = button.dataset.view;
            console.log(`Switching to ${view} view`);
        });
    });
    
    // Settings button
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // In a real app, you'd show a settings modal here
            showNotification('Settings will be available soon!');
        });
    }
    
    // Handle Enter key in input fields
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && onboardingOverlay.style.display === 'flex') {
            completeOnboarding();
        }
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Add some CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes dropIn {
        0% { transform: translateY(-20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes floatUp {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-100px); opacity: 0; }
    }
    
    @keyframes confettiFall {
        0% { transform: translateY(-100vh) rotate(0deg); }
        100% { transform: translateY(100vh) rotate(360deg); }
    }
    
    .water-drop {
        position: fixed;
        color: #4a90e2;
        font-weight: bold;
        font-size: 1rem;
        pointer-events: none;
        z-index: 1000;
        animation: floatUp 1s ease-out forwards;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        z-index: 2000;
        transition: transform 0.3s ease, opacity 0.3s ease;
        opacity: 0;
    }
    
    .notification.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
    
    .confetti-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1500;
        overflow: hidden;
    }
    
    .confetti {
        position: absolute;
        width: 10px;
        height: 10px;
        background: #4a90e2;
        opacity: 0.8;
        animation: confettiFall 3s linear forwards;
    }
`;
document.head.appendChild(style);

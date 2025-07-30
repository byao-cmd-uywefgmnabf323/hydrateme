// HydrateMe Rebuilt JavaScript
(function () {
  // ====== DOM Elements ======
  const onboarding = document.getElementById('onboarding');
  const onboardingForm = document.getElementById('onboardingForm');
  const greeting = document.getElementById('greeting');
  const streakIcon = document.getElementById('streakIcon');
  const streakText = document.getElementById('streakText');
  const motivation = document.getElementById('motivation');
  const progressBar = document.querySelector('.progress-bar');
  const progressLabel = document.getElementById('currentIntake');
  const goalLabel = document.getElementById('goalIntake');
  const glassesContainer = document.getElementById('glasses');
  const quickAdd = document.querySelectorAll('.quick-add button');
  const remaining = document.getElementById('remaining');
  const achievement = document.getElementById('achievement');
  const tipText = document.getElementById('tipText');
  const weekChartCanvas = document.getElementById('weekChart');
  const confettiDiv = document.getElementById('confetti');
  const badgeModal = document.getElementById('badgeModal');
  const badgeIcon = document.getElementById('badgeIcon');
  const badgeText = document.getElementById('badgeText');
  const closeBadge = document.getElementById('closeBadge');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const root = document.documentElement;

  // ====== Hydration Tips & Motivations ======
  const hydrationTips = [
    "Dehydration can lower brain performance by 10%.",
    "Drinking water helps your skin stay healthy and radiant.",
    "Water supports digestion and metabolism.",
    "Staying hydrated boosts your energy naturally.",
    "Hydration helps regulate body temperature.",
    "Water cushions joints and protects organs.",
    "Even mild dehydration can make you feel tired.",
    "Drinking water before meals can help control appetite.",
    "Hydration is key to focus and productivity.",
    "Water makes up 60% of your body weight!"
  ];
  const motivations = [
    "Keep going! Every sip counts.",
    "You're building a healthy habit.",
    "Hydration is self-care.",
    "Small steps, big results!",
    "Your body thanks you!",
    "Stay refreshed, stay awesome.",
    "You're a hydration hero!"
  ];
  // ====== Achievements ======
  const BADGES = [
    { name: "Hydration Newbie", icon: "🥤", condition: s => s.totalDays === 1 },
    { name: "7-Day Streak", icon: "🔥", condition: s => s.streak >= 7 },
    { name: "Weekend Warrior", icon: "🏅", condition: s => s.weekends >= 2 },
    { name: "Goal Crusher", icon: "💪", condition: s => s.maxIntake >= 3000 },
    { name: "Hydration Master", icon: "💧", condition: s => s.streak >= 21 },
  ];

  // ====== State ======
  let state = {
    name: '',
    age: '',
    weight: '',
    activity: 'sedentary',
    climate: 'temperate',
    goal: 2000,
    intake: 0,
    glasses: [], // array of {amount, time}
    streak: 0,
    lastDate: '',
    history: [], // array of {date, intake}
    totalDays: 0,
    weekends: 0,
    maxIntake: 0,
    unlockedBadges: [],
  };

  // ====== Persistence ======
  function saveState() {
    localStorage.setItem('hydrateMe', JSON.stringify(state));
  }
  function loadState() {
    const data = localStorage.getItem('hydrateMe');
    if (data) {
      Object.assign(state, JSON.parse(data));
    }
  }

  // ====== Onboarding & Recommendations ======
  function recommendGoal(age, weight, activity, climate) {
    let base = weight * 30; // 30ml per kg
    if (activity === 'moderate') base += 300;
    if (activity === 'active') base += 600;
    if (climate === 'hot') base += 400;
    if (climate === 'cold') base -= 200;
    return Math.round(Math.max(1200, base));
  }
  function showOnboarding() {
    onboarding.style.display = 'flex';
  }
  function hideOnboarding() {
    onboarding.style.display = 'none';
  }
  onboardingForm.onsubmit = function (e) {
    e.preventDefault();
    const name = onboardingForm.name.value.trim() || 'Hydration Hero';
    const age = parseInt(onboardingForm.age.value) || 25;
    const weight = parseInt(onboardingForm.weight.value) || 60;
    const activity = onboardingForm.activity.value;
    const climate = onboardingForm.climate.value;
    const goal = recommendGoal(age, weight, activity, climate);
    Object.assign(state, {
      name, age, weight, activity, climate,
      goal, intake: 0, glasses: [], streak: state.streak || 0, lastDate: todayStr(),
    });
    if (!state.history) state.history = [];
    saveState();
    hideOnboarding();
    renderAll();
    showNotification(`Welcome, ${name}! Your recommended goal is ${goal} ml/day.`);
  };

  // ====== Utilities ======
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }
  function isWeekend(dateStr) {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
  }
  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ====== Hydration Tracking ======
  function addIntake(amount) {
    if (state.lastDate !== todayStr()) {
      // New day: archive yesterday
      if (state.intake > 0) {
        state.history.push({ date: state.lastDate, intake: state.intake });
        if (isWeekend(state.lastDate)) state.weekends = (state.weekends || 0) + 1;
        state.totalDays = (state.totalDays || 0) + 1;
        state.maxIntake = Math.max(state.maxIntake || 0, state.intake);
      }
      state.intake = 0;
      state.glasses = [];
      state.lastDate = todayStr();
      // Streak logic
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      const yHist = state.history.find(h => h.date === yStr);
      if (yHist && yHist.intake >= state.goal) {
        state.streak = (state.streak || 0) + 1;
      } else {
        state.streak = 1;
      }
    }
    state.intake += amount;
    state.glasses.push({ amount, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    state.maxIntake = Math.max(state.maxIntake || 0, state.intake);
    saveState();
    renderAll();
    showConfetti();
    checkAchievements();
  }

  // ====== Rendering ======
  function renderAll() {
    // Greeting
    greeting.textContent = `Hello, ${state.name || 'friend'}!`;
    streakText.textContent = `${state.streak || 0}-day streak`;
    streakIcon.textContent = state.streak >= 7 ? '🏆' : '🔥';
    motivation.textContent = randomFrom(motivations);
    // Progress Ring
    goalLabel.textContent = state.goal;
    progressLabel.textContent = state.intake;
    const percent = Math.min(1, state.intake / state.goal);
    progressBar.style.strokeDashoffset = 439.82 * (1 - percent);
    // Glasses
    renderGlasses();
    // Remaining
    remaining.textContent = Math.max(0, state.goal - state.intake);
    // Achievement
    achievement.textContent = state.unlockedBadges && state.unlockedBadges.length > 0 ?
      state.unlockedBadges[state.unlockedBadges.length - 1].name : '—';
    // Tip
    tipText.textContent = randomFrom(hydrationTips);
    // Chart
    renderChart();
  }
  function renderGlasses() {
    // 8 glasses per goal
    const glassSize = Math.round(state.goal / 8);
    glassesContainer.innerHTML = '';
    let filled = Math.floor(state.intake / glassSize);
    for (let i = 0; i < 8; i++) {
      const div = document.createElement('div');
      div.className = 'glass' + (i < filled ? ' filled' : '');
      div.innerHTML = `<span class="glass-amount">${glassSize}ml</span>`;
      div.title = `Add ${glassSize}ml`;
      div.onclick = () => { addIntake(glassSize); };
      glassesContainer.appendChild(div);
    }
  }
  function renderChart() {
    if (!weekChartCanvas) return;
    const ctx = weekChartCanvas.getContext('2d');
    let labels = [];
    let data = [];
    let today = new Date();
    for (let i = 6; i >= 0; i--) {
      let d = new Date(today);
      d.setDate(d.getDate() - i);
      let dStr = d.toISOString().slice(0, 10);
      labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
      let h = state.history.find(h => h.date === dStr);
      data.push(h ? h.intake : (dStr === state.lastDate ? state.intake : 0));
    }
    if (window._weekChart) window._weekChart.destroy();
    window._weekChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'ml',
          data,
          backgroundColor: data.map(v => v >= state.goal ? '#50c878' : '#4a90e2'),
          borderRadius: 6,
          barPercentage: 0.7,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { display: false, suggestedMax: state.goal * 1.2 },
          x: { grid: { display: false } }
        },
        responsive: false,
        animation: false,
      }
    });
  }

  // ====== Achievements ======
  function checkAchievements() {
    for (const badge of BADGES) {
      if (!state.unlockedBadges) state.unlockedBadges = [];
      if (state.unlockedBadges.find(b => b.name === badge.name)) continue;
      if (badge.condition(state)) {
        state.unlockedBadges.push({ name: badge.name, icon: badge.icon, date: todayStr() });
        saveState();
        showBadge(badge);
      }
    }
  }
  function showBadge(badge) {
    badgeIcon.textContent = badge.icon;
    badgeText.textContent = `Unlocked: ${badge.name}! 🎉`;
    badgeModal.classList.add('active');
  }
  closeBadge.onclick = () => badgeModal.classList.remove('active');

  // ====== Confetti ======
  function showConfetti() {
    confettiDiv.innerHTML = '';
    for (let i = 0; i < 32; i++) {
      const conf = document.createElement('div');
      conf.style.position = 'absolute';
      conf.style.left = (Math.random() * 100) + 'vw';
      conf.style.top = '-20px';
      conf.style.width = '12px';
      conf.style.height = '12px';
      conf.style.background = randomFrom(['#4a90e2', '#50c878', '#6c5ce7', '#fdcb6e', '#00b894', '#ff7675']);
      conf.style.opacity = 0.7;
      conf.style.borderRadius = '50%';
      conf.style.transform = `rotate(${Math.random() * 360}deg)`;
      conf.style.transition = 'top 1.2s cubic-bezier(.4,0,.2,1), opacity 0.9s';
      confettiDiv.appendChild(conf);
      setTimeout(() => {
        conf.style.top = '90vh';
        conf.style.opacity = 0;
      }, 10);
      setTimeout(() => conf.remove(), 1400);
    }
  }

  // ====== Notifications ======
  function showNotification(msg) {
    const n = document.createElement('div');
    n.textContent = msg;
    n.style.position = 'fixed';
    n.style.top = '24px';
    n.style.left = '50%';
    n.style.transform = 'translateX(-50%)';
    n.style.background = 'rgba(34,43,69,0.97)';
    n.style.color = '#fff';
    n.style.padding = '14px 28px';
    n.style.borderRadius = '32px';
    n.style.fontSize = '1rem';
    n.style.zIndex = 4000;
    n.style.opacity = 0;
    n.style.transition = 'opacity 0.3s';
    document.body.appendChild(n);
    setTimeout(() => n.style.opacity = 1, 50);
    setTimeout(() => n.style.opacity = 0, 2000);
    setTimeout(() => n.remove(), 2400);
  }

  // ====== Quick Add Buttons ======
  quickAdd.forEach(btn => {
    btn.onclick = () => addIntake(parseInt(btn.dataset.amount));
  });

  // ====== Dark Mode Toggle ======
  darkModeToggle.onclick = () => {
    if (root.getAttribute('data-theme') === 'dark') {
      root.removeAttribute('data-theme');
      localStorage.setItem('hydrateMe-theme', 'light');
    } else {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('hydrateMe-theme', 'dark');
    }
  };
  // On load, set theme
  (function () {
    const theme = localStorage.getItem('hydrateMe-theme');
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else if (theme === 'light') root.removeAttribute('data-theme');
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');
  })();

  // ====== App Startup ======
  function startup() {
    loadState();
    if (!state.name || !state.goal) {
      showOnboarding();
    } else {
      hideOnboarding();
      renderAll();
    }
  }
  window.addEventListener('DOMContentLoaded', startup);
})();


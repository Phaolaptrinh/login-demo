const storageKeys = {
  users: 'authflow.users',
  session: 'authflow.session',
  theme: 'authflow.theme',
};

const defaultUser = {
  name: 'Demo User',
  email: 'demo@authflow.dev',
  password: 'Demo@123',
};

function getUsers() {
  const saved = JSON.parse(localStorage.getItem(storageKeys.users) || 'null');
  if (Array.isArray(saved) && saved.length) return saved;
  localStorage.setItem(storageKeys.users, JSON.stringify([defaultUser]));
  return [defaultUser];
}

function saveUsers(users) {
  localStorage.setItem(storageKeys.users, JSON.stringify(users));
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(storageKeys.theme, theme);
}

function initTheme() {
  const saved = localStorage.getItem(storageKeys.theme);
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (systemDark ? 'dark' : 'light'));
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setError(fieldId, message) {
  const el = document.querySelector(`[data-for="${fieldId}"]`);
  if (el) el.textContent = message || '';
}

function switchTab(target) {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === target);
    btn.setAttribute('aria-selected', String(btn.dataset.tab === target));
  });
  document.querySelectorAll('.form').forEach((form) => {
    form.classList.toggle('active', form.id === `${target}Form`);
  });
}

function renderSession() {
  const session = JSON.parse(localStorage.getItem(storageKeys.session) || 'null');
  const profile = document.getElementById('profilePanel');
  if (!profile) return;

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (session?.email) {
    profile.hidden = false;
    loginForm.hidden = true;
    signupForm.hidden = true;
    document.querySelector('.tab-row')?.setAttribute('hidden', '');
    document.getElementById('welcomeText').textContent = `Hello ${session.name} (${session.email})`;
  } else {
    profile.hidden = true;
    loginForm.hidden = false;
    signupForm.hidden = false;
  }
}

function initAuthPage() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (!loginForm || !signupForm) return;

  if (location.hash === '#signup') switchTab('signup');

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.togglePassword);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = signupForm.name.value.trim();
    const email = signupForm.email.value.trim().toLowerCase();
    const password = signupForm.password.value;
    let valid = true;

    setError('signupName', '');
    setError('signupEmail', '');
    setError('signupPassword', '');

    if (name.length < 2) {
      setError('signupName', 'Name must be at least 2 characters.');
      valid = false;
    }
    if (!validateEmail(email)) {
      setError('signupEmail', 'Please enter a valid email.');
      valid = false;
    }
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError('signupPassword', 'Min 8 chars, include 1 uppercase and 1 number.');
      valid = false;
    }

    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      setError('signupEmail', 'Email already exists. Use another one.');
      valid = false;
    }

    if (!valid) return;

    users.push({ name, email, password });
    saveUsers(users);
    localStorage.setItem(storageKeys.session, JSON.stringify({ name, email }));
    signupForm.reset();
    renderSession();
  });

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.password.value;
    setError('loginEmail', '');
    setError('loginPassword', '');

    if (!validateEmail(email)) {
      setError('loginEmail', 'Invalid email format.');
      return;
    }

    const found = getUsers().find((u) => u.email === email && u.password === password);
    if (!found) {
      setError('loginPassword', 'Incorrect email or password.');
      return;
    }

    const session = { name: found.name, email: found.email };
    localStorage.setItem(storageKeys.session, JSON.stringify(session));

    if (document.getElementById('rememberMe').checked) {
      localStorage.setItem('authflow.rememberedEmail', email);
    } else {
      localStorage.removeItem('authflow.rememberedEmail');
    }

    loginForm.reset();
    renderSession();
  });

  const remembered = localStorage.getItem('authflow.rememberedEmail');
  if (remembered) {
    loginForm.email.value = remembered;
    document.getElementById('rememberMe').checked = true;
  }

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem(storageKeys.session);
    renderSession();
  });

  renderSession();
}

initTheme();
initAuthPage();

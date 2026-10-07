async function requestJSON(url, options = {}) {
  const response = await fetch(url, options);
  let data;

  try {
    data = await response.json();
  } catch (error) {
    data = { error: `Server returned ${response.status} without valid JSON.` };
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}.`);
  }

  return data;
}

function showError(message) {
  const errorBox = document.getElementById('errorBox');
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function clearError() {
  const errorBox = document.getElementById('errorBox');
  errorBox.textContent = '';
  errorBox.classList.add('hidden');
}

async function runSafely(action) {
  clearError();
  try {
    await action();
  } catch (error) {
    showError(`${error.message} Check app.py and README.md, then implement the missing Flask route.`);
  }
}

async function loadUser() {
  const data = await requestJSON('/api/me');
  const name = data.username || 'Guest';

  document.getElementById('userStatus').innerHTML = `
    <strong>Current learner:</strong> ${name}<br />
    <strong>Session visits:</strong> ${data.visits}<br />
    <strong>Focus mode cookie:</strong> ${data.focus_mode}
  `;

  document.getElementById('focusMode').value = data.focus_mode;
}

async function login() {
  const username = document.getElementById('username').value;

  await requestJSON('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  document.getElementById('username').value = '';
  await loadUser();
}

async function logout() {
  await requestJSON('/api/logout', { method: 'POST' });
  await loadUser();
}

async function saveFocusMode() {
  const mode = document.getElementById('focusMode').value;

  await requestJSON('/api/focus-mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });

  await loadUser();
}

async function loadStudySessions() {
  const sessions = await requestJSON('/api/study-sessions');
  const container = document.getElementById('sessions');

  container.innerHTML = sessions.map(item => `
    <div class="item">
      <div>
        <strong class="${item.completed ? 'complete' : ''}">${item.topic}</strong><br />
        <small>${item.minutes} minutes | ${item.completed ? 'Completed' : 'Pending'}</small>
      </div>
      <div>
        <button data-complete-id="${item.id}">Complete</button>
        <button class="danger" data-delete-id="${item.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

async function createStudySession() {
  const topic = document.getElementById('topic').value;
  const minutes = document.getElementById('minutes').value;

  await requestJSON('/api/study-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, minutes })
  });

  document.getElementById('topic').value = '';
  await loadStudySessions();
}

async function completeStudySession(id) {
  await requestJSON(`/api/study-sessions/${id}`, {
    method: 'PATCH'
  });

  await loadStudySessions();
}

async function deleteStudySession(id) {
  await requestJSON(`/api/study-sessions/${id}`, {
    method: 'DELETE'
  });

  await loadStudySessions();
}

// The client side is complete. Students should not need to edit this file.
document.getElementById('loginButton').addEventListener('click', () => runSafely(login));
document.getElementById('logoutButton').addEventListener('click', () => runSafely(logout));
document.getElementById('saveFocusModeButton').addEventListener('click', () => runSafely(saveFocusMode));
document.getElementById('addSprintButton').addEventListener('click', () => runSafely(createStudySession));

document.getElementById('sessions').addEventListener('click', event => {
  const completeId = event.target.dataset.completeId;
  const deleteId = event.target.dataset.deleteId;

  if (completeId) {
    runSafely(() => completeStudySession(Number(completeId)));
  }

  if (deleteId) {
    runSafely(() => deleteStudySession(Number(deleteId)));
  }
});

// GET /api/study-sessions is already provided, so this should work immediately.
runSafely(loadStudySessions);

// GET /api/me is deliberately NOT implemented yet.
// Once students build it, they can uncomment the line below or simply refresh
// after changing it to: runSafely(loadUser);
// runSafely(loadUser);

import { AUTH_KEY, WRITER_KEY, type Writer } from '../lib/family-auth';
import { apiLogin, clearApiToken, hasApiToken } from '../lib/api';
import { loginPath } from '../lib/paths';

export function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'ok' && hasApiToken();
}

export function getWriter(): Writer | '' {
  const value = sessionStorage.getItem(WRITER_KEY);
  return value === 'sherman' || value === 'roy' ? value : '';
}

export function setLoggedIn(on: boolean) {
  if (on) sessionStorage.setItem(AUTH_KEY, 'ok');
  else {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(WRITER_KEY);
    clearApiToken();
  }
}

export function setWriter(writer: Writer) {
  sessionStorage.setItem(WRITER_KEY, writer);
}

/** Validates against the live API and stores a session token for Save. */
export async function checkPassword(email: string, password: string) {
  try {
    await apiLogin(email.trim().toLowerCase(), password);
    return true;
  } catch {
    return false;
  }
}

export function applyFamilyUI() {
  const loggedIn = isLoggedIn();
  const writer = getWriter();
  document.body.classList.toggle('is-family', loggedIn);
  document.body.classList.toggle('writer-sherman', writer === 'sherman');
  document.body.classList.toggle('writer-roy', writer === 'roy');

  document.querySelectorAll<HTMLElement>('[data-when="logged-out"]').forEach((el) => {
    el.hidden = loggedIn;
  });
  document.querySelectorAll<HTMLElement>('[data-when="logged-in"]').forEach((el) => {
    el.hidden = !loggedIn;
  });
  document.querySelectorAll<HTMLElement>('[data-when="needs-writer"]').forEach((el) => {
    el.hidden = !(loggedIn && writer);
  });
}

export function bindFamilyHeader() {
  applyFamilyUI();
  document.querySelector('[data-logout]')?.addEventListener('click', () => {
    setLoggedIn(false);
    applyFamilyUI();
    window.location.href = loginPath();
  });
  document.querySelector('[data-switch]')?.addEventListener('click', () => {
    sessionStorage.removeItem(WRITER_KEY);
    window.location.href = loginPath();
  });
}

export { loginPath };

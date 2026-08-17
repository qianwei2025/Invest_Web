import {
  AUTH_EMAIL,
  AUTH_KEY,
  AUTH_PASSWORD_SHA256,
  WRITER_KEY,
  type Writer,
} from '../lib/family-auth';
import { apiLogin, clearApiToken, hasApiToken } from '../lib/api';
import { loginPath } from '../lib/paths';

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

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

export async function localPasswordOk(email: string, password: string) {
  const hash = await sha256(password);
  return email.trim().toLowerCase() === AUTH_EMAIL && hash === AUTH_PASSWORD_SHA256;
}

/**
 * Validates password locally, then gets a save-service token.
 * Returns null on success, or an error message string.
 */
export async function familyLogin(email: string, password: string): Promise<string | null> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password;
  const localOk = await localPasswordOk(cleanEmail, cleanPassword);
  if (!localOk) {
    return 'That email or password did not match.';
  }
  try {
    await apiLogin(cleanEmail, cleanPassword);
    return null;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    return `Password is correct, but the save service did not respond (${detail}). Try again in a minute.`;
  }
}

/** @deprecated prefer familyLogin */
export async function checkPassword(email: string, password: string) {
  return (await familyLogin(email, password)) === null;
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

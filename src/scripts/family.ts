import {
  AUTH_EMAIL,
  AUTH_KEY,
  AUTH_PASSWORD_SHA256,
  WRITER_KEY,
  type Writer,
} from '../lib/family-auth';
import { loginPath } from '../lib/paths';

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'ok';
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
  }
}

export function setWriter(writer: Writer) {
  sessionStorage.setItem(WRITER_KEY, writer);
}

export async function checkPassword(email: string, password: string) {
  const hash = await sha256(password);
  return email.trim().toLowerCase() === AUTH_EMAIL && hash === AUTH_PASSWORD_SHA256;
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

import {
  getDemoUsers,
  loginAsRole,
  loginWithCredentials,
  registerAccount,
} from '../services/auth.service.ts';
import { DEPARTMENT_ROLES, type AuthSession, type DepartmentRole } from '../types/auth.types.ts';
import { escapeHtml, qs } from '../utils/dom.util.ts';

export function renderAuthView(
  container: HTMLElement,
  onAuthenticated: (session: AuthSession) => void,
): void {
  const demoUsers = getDemoUsers();
  let mode: 'login' | 'register' = 'login';
  let errorMsg = '';

  const draw = (): void => {
    const roleButtonsHtml = DEPARTMENT_ROLES.map((role) => {
      const user = demoUsers.find((u) => u.role === role);
      return `
        <button type="button" class="role-pill-btn" data-demo-role="${escapeHtml(role)}">
          ${escapeHtml(role)}${user ? ` (${escapeHtml(user.name.split(' ')[0])})` : ''}
        </button>
      `;
    }).join('');

    const roleOptionsHtml = DEPARTMENT_ROLES.map(
      (role) => `<option value="${escapeHtml(role)}">${escapeHtml(role)}</option>`,
    ).join('');

    container.innerHTML = `
      <main class="auth-shell">
        <section class="auth-container">
          <aside class="auth-context-card">
            <div>
              <div class="auth-brand-mark">
                <span class="auth-brand-dot"></span>
                <span>PT Boma Bisma Indra (BBI)</span>
              </div>
              <h1 class="auth-hero-title">Sistem Informasi Manufaktur MTO Terintegrasi</h1>
              <p class="auth-hero-sub">
                Ruang kerja digital terpusat yang menggantikan aliran dokumen kertas sekuensial menjadi
                kolaborasi paralel lintas fungsi: Proposal, Engineering, Procurement, Operations, QA/QC, dan Cost Control.
              </p>
              <div class="auth-subsystem-list">
                <div class="auth-subsystem-chip">1. Material &amp; Services</div>
                <div class="auth-subsystem-chip">2. Operations &amp; Work Center</div>
                <div class="auth-subsystem-chip">3. Quality (QA / QC)</div>
                <div class="auth-subsystem-chip">4. Cost &amp; Variance</div>
              </div>
            </div>
            <p class="navbar-subtitle" style="color: var(--color-on-aubergine-mute);">
              Prototipe Hybrid Client-Server &bull; Database Terpusat (LocalStorage)
            </p>
          </aside>

          <div class="auth-card">
            <div class="auth-tabs">
              <button type="button" class="auth-tab-btn ${mode === 'login' ? 'active' : ''}" data-tab="login">
                Masuk
              </button>
              <button type="button" class="auth-tab-btn ${mode === 'register' ? 'active' : ''}" data-tab="register">
                Daftar Akun
              </button>
            </div>

            ${errorMsg ? `<div class="error-banner">${escapeHtml(errorMsg)}</div>` : ''}

            ${
              mode === 'login'
                ? `
              <form id="login-form" class="auth-form">
                <div class="field-group">
                  <label class="field-label" for="login-email">Email Perusahaan</label>
                  <input id="login-email" class="text-input" type="email" required placeholder="contoh: taufiq.qa@ptbbi.co.id" />
                </div>
                <div class="field-group">
                  <label class="field-label" for="login-password">Kata Sandi</label>
                  <input id="login-password" class="text-input" type="password" required placeholder="Password demo: bbi2026" />
                </div>
                <button type="submit" class="btn-pill btn-primary-pill">Masuk ke Workspace</button>
              </form>
            `
                : `
              <form id="register-form" class="auth-form">
                <div class="field-group">
                  <label class="field-label" for="reg-name">Nama Lengkap</label>
                  <input id="reg-name" class="text-input" type="text" required placeholder="contoh: Andi Pratama" />
                </div>
                <div class="field-group">
                  <label class="field-label" for="reg-email">Email Perusahaan</label>
                  <input id="reg-email" class="text-input" type="email" required placeholder="andi@ptbbi.co.id" />
                </div>
                <div class="field-group">
                  <label class="field-label" for="reg-role">Role Departemen</label>
                  <select id="reg-role" class="select-input">${roleOptionsHtml}</select>
                </div>
                <div class="field-group">
                  <label class="field-label" for="reg-location">Lokasi Kerja</label>
                  <select id="reg-location" class="select-input">
                    <option value="Surabaya Plant">Surabaya Plant</option>
                    <option value="HQ Corporate">HQ Corporate</option>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label" for="reg-password">Kata Sandi</label>
                  <input id="reg-password" class="text-input" type="password" required minlength="4" placeholder="Minimal 4 karakter" />
                </div>
                <button type="submit" class="btn-pill btn-primary-pill">Buat Akun &amp; Masuk</button>
              </form>
            `
            }

            <div class="auth-demo-section">
              <span class="auth-demo-label">Akses Cepat Demo per Role (1-Klik)</span>
              <div class="auth-role-grid">${roleButtonsHtml}</div>
            </div>
          </div>
        </section>
      </main>
    `;

    container.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.tab === 'register' ? 'register' : 'login';
        errorMsg = '';
        draw();
      });
    });

    container.querySelectorAll<HTMLButtonElement>('[data-demo-role]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const role = btn.dataset.demoRole as DepartmentRole;
        const session = loginAsRole(role);
        if (session) onAuthenticated(session);
      });
    });

    const loginForm = container.querySelector<HTMLFormElement>('#login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = qs<HTMLInputElement>(loginForm, '#login-email').value;
        const password = qs<HTMLInputElement>(loginForm, '#login-password').value;
        const result = loginWithCredentials(email, password);
        if (result.ok) {
          onAuthenticated(result.session);
        } else {
          errorMsg = result.error;
          draw();
        }
      });
    }

    const regForm = container.querySelector<HTMLFormElement>('#register-form');
    if (regForm) {
      regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const result = registerAccount({
          name: qs<HTMLInputElement>(regForm, '#reg-name').value,
          email: qs<HTMLInputElement>(regForm, '#reg-email').value,
          role: qs<HTMLSelectElement>(regForm, '#reg-role').value as DepartmentRole,
          location: qs<HTMLSelectElement>(regForm, '#reg-location').value as
            | 'Surabaya Plant'
            | 'HQ Corporate',
          password: qs<HTMLInputElement>(regForm, '#reg-password').value,
        });
        if (result.ok) {
          onAuthenticated(result.session);
        } else {
          errorMsg = result.error;
          draw();
        }
      });
    }
  };

  draw();
}

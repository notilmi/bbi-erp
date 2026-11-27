import type { AuthSession } from '../types/auth.types.ts';
import { escapeHtml, qs } from '../utils/dom.util.ts';

export function renderNavbar(
  container: HTMLElement,
  session: AuthSession,
  callbacks: {
    onResetDemo: () => void;
    onLogout: () => void;
  },
): void {
  container.innerHTML = `
    <header class="top-navbar">
      <div class="navbar-brand">
        <div class="navbar-logo">BBI</div>
        <div>
          <div class="navbar-title">PT BBI &mdash; MTO Command Center</div>
          <div class="navbar-subtitle">Integrated Manufacturing Information System (${escapeHtml(session.location)})</div>
        </div>
      </div>
      <div class="navbar-actions">
        <span class="user-chip">${escapeHtml(session.name)} &bull; ${escapeHtml(session.role)}</span>
        <button type="button" id="btn-reset-db" class="btn-pill btn-secondary-pill btn-compact">
          Reset Demo DB
        </button>
        <button type="button" id="btn-logout" class="btn-pill btn-outline-aubergine btn-compact">
          Sign Out
        </button>
      </div>
    </header>
  `;

  qs<HTMLButtonElement>(container, '#btn-reset-db').addEventListener('click', callbacks.onResetDemo);
  qs<HTMLButtonElement>(container, '#btn-logout').addEventListener('click', callbacks.onLogout);
}

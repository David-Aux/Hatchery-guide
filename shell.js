// ============================================
//  HATCHERY GUIDE — Shared Shell Template
// ============================================

function renderShell({ page, title }) {
  return `
    <div class="app-shell">
      <!-- Sidebar -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">
            <div class="logo-icon">🐣</div>
            <div class="logo-text">
              Hatchery Guide
              <span>Incubation Intelligence</span>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <span class="nav-section-label">Overview</span>
          <a href="dashboard.html" class="nav-item" data-page="dashboard">
            <span class="nav-icon">📊</span> Dashboard
          </a>

          <span class="nav-section-label">Batches</span>
          <a href="new-batch.html" class="nav-item" data-page="new-batch">
            <span class="nav-icon">➕</span> New Batch
          </a>
          <a href="batches.html" class="nav-item" data-page="batches">
            <span class="nav-icon">🥚</span> All Batches
          </a>
          <a href="candling.html" class="nav-item" data-page="candling">
            <span class="nav-icon">🕯️</span> Candling Entry
          </a>
          <a href="hatch-results.html" class="nav-item" data-page="hatch-results">
            <span class="nav-icon">🐥</span> Hatch Results
          </a>

          <span class="nav-section-label">Intelligence</span>
          <a href="analytics.html" class="nav-item" data-page="analytics">
            <span class="nav-icon">🧬</span> Analytics
          </a>
          <a href="incubation-guide.html" class="nav-item" data-page="incubation-guide">
            <span class="nav-icon">🌡️</span> Incubation Guide
          </a>

          <span class="nav-section-label">Setup</span>
          <a href="settings.html" class="nav-item" data-page="settings">
            <span class="nav-icon">⚙️</span> Settings
          </a>
          <a href="about.html" class="nav-item" data-page="about">
            <span class="nav-icon">ℹ️</span> About & Contact
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-chip" id="user-chip">
            <div class="user-avatar" id="user-avatar">?</div>
            <div class="user-info">
              <div class="user-name" id="user-name">Loading…</div>
              <div class="user-role">Hatchery Manager</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Mobile overlay -->
      <div class="mobile-overlay" id="mobile-overlay"></div>

      <!-- Main -->
      <div class="main-content">
        <header class="topbar">
          <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
          <span class="topbar-title">${title}</span>
          <div class="topbar-actions">
            <a href="new-batch.html" class="btn btn-primary btn-sm">
              + New Batch
            </a>
            <button class="btn btn-ghost btn-sm" onclick="signOut()">Sign Out</button>
          </div>
        </header>

        <div class="page-body" id="page-body">
          <!-- page content injected here -->
        </div>
      </div>
    </div>

    <div id="toast-container"></div>
  `;
}

async function initShell({ page, title }) {
  document.body.innerHTML = renderShell({ page, title });
  activateNavItem(page);
  initMobileMenu();

  const user = await requireAuth();
  if (!user) return null;

  // Load profile
  const { data: profile } = await db
    .from('profiles')
    .select('full_name, hatchery_name')
    .eq('id', user.id)
    .single();

  const name = profile?.full_name || user.email?.split('@')[0] || 'User';
  document.getElementById('user-name').textContent = profile?.hatchery_name || name;
  document.getElementById('user-avatar').textContent = getInitials(name);

  return { user, profile };
}

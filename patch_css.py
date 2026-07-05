css_append = """
/* ─── Global Navigation ─── */
.global-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 1.5rem;
}

.nav-btn {
  background: transparent;
  color: var(--text-light);
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: rgba(108, 99, 255, 0.05);
  color: var(--primary);
}

.nav-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 15px rgba(108, 99, 255, 0.3);
}

/* ─── Library Grid & Cards ─── */
.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.lib-card {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
}

.lib-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
  z-index: 0;
  pointer-events: none;
}

.lib-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  border-color: rgba(108, 99, 255, 0.3);
}

.lib-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  z-index: 1;
}

.lib-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
  z-index: 1;
  word-break: keep-all;
}

.lib-date {
  font-size: 0.8rem;
  color: var(--text-light);
  z-index: 1;
}

.lib-count {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: var(--bg-color);
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary);
  border: 1px solid var(--border-light);
  z-index: 1;
}
"""

with open('style.css', 'a', encoding='utf-8') as f:
    f.write(css_append)

print("done")

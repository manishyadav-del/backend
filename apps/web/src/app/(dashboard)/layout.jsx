import Link from 'next/link';

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo">Global Backend</div>
        <nav>
  <ul className="space-y-3">
    <li>
      <Link href="/projects">📁 Projects</Link>
    </li>

    <li>
      <Link href="/users">👥 Users</Link>
    </li>

    <li>
      <Link href="/settings">⚙️ Settings</Link>
    </li>
  </ul>
</nav>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <div className="user-info">Admin User</div>
        </header>
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}

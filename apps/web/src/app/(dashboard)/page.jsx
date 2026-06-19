import { redirect } from 'next/navigation';

export default function DashboardRoot() {
  // This is a server component fallback.
  // The middleware will handle the actual role-based redirect.
  // Client-side role detection in layout.jsx will also redirect as needed.
  redirect('/dashboard');
}

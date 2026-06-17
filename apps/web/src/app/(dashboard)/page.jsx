import { redirect } from 'next/navigation';

export default function DashboardRoot() {
  // Redirect root to projects list
  redirect('/projects');
}

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Global Backend
          </h1>

          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Login
            </Link>

            <Link
              href="/projects"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Manage All Your Websites
          <br />
          From One Dashboard
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          Control pages, SEO, global settings, analytics,
          and content across multiple Next.js projects
          from a centralized backend.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/projects"
            className="px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Open Dashboard
          </Link>

          <Link
            href="/login"
            className="px-8 py-4 border rounded-lg hover:bg-gray-100"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">
              Project Management
            </h3>
            <p className="text-gray-600">
              Create and manage multiple websites from one place.
            </p>
          </div>

          <div className="border rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">
              SEO Control
            </h3>
            <p className="text-gray-600">
              Update meta titles, descriptions and schema.
            </p>
          </div>

          <div className="border rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">
              Auto Sync
            </h3>
            <p className="text-gray-600">
              Sync routes and pages automatically using the SDK.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-gray-500">
        © 2026 Global Backend. All rights reserved.
      </footer>
    </main>
  );
}
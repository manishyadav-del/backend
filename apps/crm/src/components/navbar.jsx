import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold">
          Global Backend
        </Link>

        {/* Menu */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#">Products</Link>
          <Link href="#">Solutions</Link>
          <Link href="#">Pricing</Link>
          <Link href="#">Resources</Link>
          <Link href="#">Contact</Link>
        </nav>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2 border border-blue-600 text-blue-600 rounded-full"
          >
            Log In
          </Link>

          <Link
            href="/projects"
            className="px-6 py-3 bg-blue-600 text-white rounded-full"
          >
            Start Building
          </Link>
        </div>
      </div>
    </header>
  );
}
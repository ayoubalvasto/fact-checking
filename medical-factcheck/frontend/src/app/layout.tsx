import type { Metadata } from 'next'
import Link from 'next/link'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Medical Fact-Check Platform',
  description: 'Verify medical claims with AI-powered fact-checking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              🏥 MedFactCheck
            </Link>
            <div className="space-x-4">
              <Link href="/verify" className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium">
                Verify
              </Link>
              <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400">© 2024 Medical Fact-Check Platform v1.0</p>
            <p className="text-gray-400 mt-2 text-sm">For educational and research purposes</p>
          </div>
        </footer>
      </body>
    </html>
  )
}

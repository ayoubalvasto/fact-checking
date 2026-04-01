import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Medical Fact-Check Platform',
  description: 'Verify medical claims with AI-powered fact-checking',
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">🏥 MedFactCheck</h1>
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

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-4">
          Fact-Check Medical Claims
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Verify medical information with AI-powered analysis. Support for Arabic, Darija, and more.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/verify"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors"
          >
            Start Verifying →
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-lg transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard icon="🔍" title="AI-Powered Verification" description="Advanced NLP and LLM-based fact-checking" />
            <FeatureCard icon="🌐" title="Moroccan Darija Support" description="Native Arabic & Latin script translations" />
            <FeatureCard icon="📊" title="Analytics Dashboard" description="Real-time metrics and misinformation trends" />
            <FeatureCard icon="🎬" title="Video Analysis" description="Extract and verify claims from videos" />
            <FeatureCard icon="🔗" title="Medical Sources" description="Powered by trusted medical databases" />
            <FeatureCard icon="⚡" title="Fast Processing" description="Sub-second verification times" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 Medical Fact-Check Platform v1.0</p>
          <p className="text-grain-400 mt-2 text-sm">For educational and research purposes</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h4 className="text-xl font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">♻</div>
          <span className="font-bold text-xl text-gray-900">EcoRecycle</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/track" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Track Waste</Link>
          <Link to="/login" className="btn-secondary text-sm py-1.5 px-4">Login</Link>
          <Link to="/register" className="btn-primary text-sm py-1.5 px-4">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-primary-50 text-primary-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          🌍 Responsible E-Waste Disposal Platform
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Recycle Electronics.<br />
          <span className="text-primary-600">Earn Rewards. Save Earth.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          EcoRecycle connects individuals and companies with certified recycling facilities.
          Submit your e-waste, track it in real-time, and get compensated for every kilogram recycled.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary py-3 px-8 text-base">Start Recycling →</Link>
          <Link to="/track" className="btn-secondary py-3 px-8 text-base">Track Your Waste</Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary-600 py-14">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '50,000+', label: 'kg Recycled' },
            { value: '1,200+', label: 'Active Users' },
            { value: '80+', label: 'Certified Facilities' },
            { value: '₹25L+', label: 'Compensation Paid' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-white">{s.value}</div>
              <div className="text-primary-200 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
        <p className="text-center text-gray-500 mb-14">Simple, transparent, and rewarding</p>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: '01', icon: '📦', title: 'Submit Request', desc: 'Select your e-waste type, choose drop-off or bulk pickup, and pick a nearby certified facility.' },
            { step: '02', icon: '📍', title: 'Drop-off or Pickup', desc: 'Individuals drop off at the facility. Companies get a scheduled pickup at their location.' },
            { step: '03', icon: '🔖', title: 'Get Tracking ID', desc: 'Once collected, the facility generates a unique Tracking ID and sends it to you.' },
            { step: '04', icon: '💰', title: 'Get Compensated', desc: 'After verification and recycling, receive compensation based on material type and weight.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">{item.icon}</div>
              <div className="text-xs font-bold text-primary-600 mb-2">STEP {item.step}</div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">For Everyone</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '👤', title: 'Individual Users', points: ['Drop off small e-waste', 'GPS-based facility finder', 'Real-time tracking', 'Earn per kg recycled'] },
              { icon: '🏢', title: 'Companies', points: ['Bulk pickup scheduling', 'GST-compliant disposal', 'Volume-based rewards', 'Disposal certificates'] },
              { icon: '🏭', title: 'Recycling Facilities', points: ['Manage all requests', 'Generate tracking IDs', 'Update waste lifecycle', 'View user history'] },
            ].map((f) => (
              <div key={f.title} className="card">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-4">{f.title}</h3>
                <ul className="space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-primary-500">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Track CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Already Submitted Waste?</h2>
        <p className="text-gray-500 mb-8">Enter your Tracking ID to see the real-time status of your e-waste.</p>
        <Link to="/track" className="btn-primary py-3 px-8 text-base inline-block">Track Your E-Waste →</Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} EcoRecycle. Making e-waste disposal easy, rewarding, and eco-friendly.
      </footer>
    </div>
  );
}

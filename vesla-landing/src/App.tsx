import { useState, useEffect } from 'react';
import { 
  Car, DollarSign, Shield, Users, Building2, Truck, TrendingUp, 
  ShoppingCart, Menu, X, Check, Star, ArrowRight, Mail, Phone, MapPin, Wrench,
  Zap, Globe, Package, Play, Clock, ChevronRight, Sparkles, CheckCircle, Home,
  BarChart3
} from 'lucide-react';

const ERP_URL = 'https://demo.vesla.ae';

// Animated counter hook
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration]);
  
  return count;
};

// Stat Card
const StatCard = ({ value, suffix = '', label, icon }: { value: number; suffix?: string; label: string; icon: React.ReactNode }) => {
  const count = useCounter(value);
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        {icon}
        <span className="text-4xl md:text-5xl font-bold text-white">
          {count.toLocaleString()}{suffix}
        </span>
      </div>
      <p className="text-blue-200">{label}</p>
    </div>
  );
};

// Modules with visibility - only show 'ALL' on public landing page
// MRM_ONLY packages (like Speed Sync) are hidden from public view
const modules = [
  { id: 'rent-a-car', name: 'Rent-A-Car', icon: Car, color: 'blue', title: 'From Booking to Return - One Seamless Flow', description: 'Complete rental operations with TARS integration, contract management, and real-time fleet tracking.', tags: ['Bookings', 'Contracts', 'TARS'], features: ['Online Bookings', 'Contract Management', 'Fleet Tracking', 'TARS Integration'], visibility: 'ALL' },
  { id: 'finance', name: 'Finance', icon: DollarSign, color: 'emerald', title: 'Double-Entry Bookkeeping Made Simple', description: 'Full accounting suite with FTA-compliant VAT returns, bank reconciliation, and financial reporting.', tags: ['VAT Returns', 'Tax Calendar', 'Reports'], features: ['Accounts Payable/Receivable', 'Bank Reconciliation', 'VAT Compliance', 'Financial Reports'], visibility: 'ALL' },
  { id: 'admin', name: 'Admin', icon: Shield, color: 'slate', title: 'Your Business, Your Rules', description: 'Complete control with user management, role-based permissions, and comprehensive audit trails.', tags: ['Users', 'Roles', 'Audit'], features: ['User Management', 'Role-Based Permissions', 'Audit Trails', 'System Settings'], visibility: 'ALL' },
  { id: 'hr', name: 'HR & Payroll', icon: Users, color: 'purple', title: 'Your Team Deserves Better HR', description: 'Streamlined HR with employee management, leave tracking, attendance, and WPS-compliant payroll.', tags: ['Payroll', 'Leave', 'WPS'], features: ['Staff Management', 'Attendance Tracking', 'Leave Management', 'WPS Payroll'], visibility: 'ALL' },
  { id: 'properties', name: 'Properties', icon: Home, color: 'amber', title: 'Manage Properties Like a Pro', description: 'Property management with lease tracking, maintenance requests, and tenant portal.', tags: ['Leases', 'Maintenance', 'Tenants'], features: ['Property Listings', 'Tenant Management', 'Lease Tracking', 'Maintenance'], visibility: 'ALL' },
  { id: 'fleet', name: 'Fleet Management', icon: Truck, color: 'rose', title: 'Every Vehicle, Every Detail, Every Day', description: 'Track your entire fleet with maintenance schedules, fuel management, and GPS integration.', tags: ['Tracking', 'Maintenance', 'Fuel'], features: ['Vehicle Lifecycle', 'TARS Integration', 'Maintenance', 'Registration'], visibility: 'ALL' },
  { id: 'vehicle-vendor', name: 'Fleet Partners', icon: Building2, color: 'orange', title: 'Turn Vehicle Owners Into Partners', description: 'Multi-vendor marketplace for vehicle sales, parts, and services.', tags: ['Owner Portal', 'Revenue Share'], features: ['Owner Portal', 'Revenue Sharing', 'Vehicle Calendar', 'Partner Dashboard'], visibility: 'ALL' },
  { id: 'dynamic-pricing', name: 'Dynamic Pricing', icon: BarChart3, color: 'indigo', title: 'Price Smarter, Earn More', description: 'AI-powered pricing optimization based on demand, seasonality, and competition.', tags: ['AI', 'Optimization', 'Revenue'], features: ['Seasonal Pricing', 'Demand Analysis', 'Competitor Tracking', 'Auto-Adjustments'], visibility: 'ALL' },
  { id: 'dealership', name: 'Vehicle Dealership', icon: ShoppingCart, color: 'teal', title: 'Track Every Dirham from Acquisition to Sale', description: 'Complete dealership management with inventory, sales, and customer CRM.', tags: ['Inventory', 'Sales', 'CRM'], features: ['Sales Pipeline', 'Customer CRM', 'Financing', 'Trade-ins'], visibility: 'ALL' },
  { id: 'service-center', name: 'Service Center', icon: Wrench, color: 'cyan', title: 'Workshop Management Made Easy', description: 'Workshop management with work orders, scheduling, and parts inventory.', tags: ['Work Orders', 'Parts', 'Scheduling'], features: ['Work Orders', 'Scheduling', 'Parts Inventory', 'Customer Portal'], visibility: 'ALL' },
].filter(m => m.visibility === 'ALL');

const colorClasses: Record<string, { bg: string; text: string; light: string }> = {
  blue: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', light: 'bg-blue-50 text-blue-700' },
  emerald: { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50 text-emerald-700' },
  slate: { bg: 'from-slate-500 to-slate-600', text: 'text-slate-600', light: 'bg-slate-100 text-slate-700' },
  purple: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600', light: 'bg-purple-50 text-purple-700' },
  amber: { bg: 'from-amber-500 to-amber-600', text: 'text-amber-600', light: 'bg-amber-50 text-amber-700' },
  cyan: { bg: 'from-cyan-500 to-cyan-600', text: 'text-cyan-600', light: 'bg-cyan-50 text-cyan-700' },
  rose: { bg: 'from-rose-500 to-rose-600', text: 'text-rose-600', light: 'bg-rose-50 text-rose-700' },
  yellow: { bg: 'from-yellow-500 to-yellow-600', text: 'text-yellow-600', light: 'bg-yellow-50 text-yellow-700' },
  indigo: { bg: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50 text-indigo-700' },
  teal: { bg: 'from-teal-500 to-teal-600', text: 'text-teal-600', light: 'bg-teal-50 text-teal-700' },
  orange: { bg: 'from-orange-500 to-orange-600', text: 'text-orange-600', light: 'bg-orange-50 text-orange-700' },
};

const integrations = [
  'UAE Pass', 'TARS', 'WPS', 'VAT Filing', 'Banks', 'Insurance', 'RTA', 'Salik'
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Vesla ERP
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#modules" className="text-gray-600 hover:text-gray-900 transition">Modules</a>
              <a href="#integrations" className="text-gray-600 hover:text-gray-900 transition">Integrations</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</a>
              <a 
                href={`${ERP_URL}/login`}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Login
              </a>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-gray-600">Features</a>
              <a href="#modules" className="text-gray-600">Modules</a>
              <a href="#integrations" className="text-gray-600">Integrations</a>
              <a href="#pricing" className="text-gray-600">Pricing</a>
              <a href={`${ERP_URL}/login`} className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-center">
                Login
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                UAE's Most Complete ERP Solution
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Run Your Entire Business with{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Vesla ERP
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                From vehicle rentals to finance, HR to service centers — manage everything 
                in one powerful platform built for UAE businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`${ERP_URL}/login`}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </a>
                <button className="flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-lg font-semibold hover:border-blue-300 transition-all">
                  <Play className="w-5 h-5" />
                  Watch Video
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-gray-200">
                <div className="flex -space-x-2">
                  {['🇦🇪', '🚗', '💼'].map((emoji, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-white flex items-center justify-center text-lg">
                      {emoji}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Built for UAE Businesses</p>
                  <p className="text-sm text-gray-600">VAT, WPS, UAE Pass ready out of the box</p>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-1">
                <div className="bg-gray-900 rounded-3xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">Dashboard Overview</span>
                      <span className="text-green-400 text-sm flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        Live
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ label: 'Revenue', value: 'AED 1.2M' }, { label: 'Bookings', value: '847' }, { label: 'Fleet', value: '156' }].map((stat, i) => (
                        <div key={i} className="bg-slate-700/50 rounded-lg p-3">
                          <p className="text-gray-400 text-xs">{stat.label}</p>
                          <p className="text-white font-bold">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-end p-4">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t mx-0.5"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -left-8 top-1/4 bg-white rounded-xl shadow-xl p-4 animate-bounce hidden lg:block" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Revenue Up</p>
                    <p className="font-bold text-green-600">+32%</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 bottom-1/4 bg-white rounded-xl shadow-xl p-4 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time Saved</p>
                    <p className="font-bold text-blue-600">40 hrs/mo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value={10} suffix="+" label="Integrated Modules" icon={<Package className="w-6 h-6 text-blue-200" />} />
            <StatCard value={50} suffix="+" label="Features Built" icon={<Zap className="w-6 h-6 text-blue-200" />} />
            <StatCard value={99} suffix="%" label="Uptime Target" icon={<Shield className="w-6 h-6 text-blue-200" />} />
            <StatCard value={24} suffix="/7" label="Support Ready" icon={<Globe className="w-6 h-6 text-blue-200" />} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Vesla ERP brings together all your business operations in one unified platform,
              designed specifically for UAE market requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
              <Shield className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">UAE Compliant</h3>
              <p className="text-gray-600">
                Built-in VAT, WPS payroll, UAE Pass integration, and full regulatory compliance.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
              <Zap className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Optimized performance with real-time updates and instant data synchronization.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
              <Globe className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Cloud Native</h3>
              <p className="text-gray-600">
                Access from anywhere, automatic backups, and enterprise-grade security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {modules.length} Powerful Modules, One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each module is designed to work seamlessly together, giving you complete 
              control over every aspect of your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((module) => {
              const colors = colorClasses[module.color];
              const Icon = module.icon;
              return (
                <a 
                  key={module.id}
                  href={`${ERP_URL}/knowledge-base?module=${module.id}`}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group hover:-translate-y-1 border border-gray-100"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{module.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{module.description}</p>
                  <ul className="space-y-2 mb-4">
                    {module.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className={`flex items-center gap-1 text-sm font-medium ${colors.text} group-hover:gap-2 transition-all`}>
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Seamless Integrations
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Connect with all the UAE government services and third-party systems you need.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {integrations.map((integration, i) => (
              <div 
                key={i}
                className="px-6 py-3 bg-white rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <span className="font-medium text-gray-700">{integration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Start free, scale as you grow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: 'Free', desc: 'For small businesses getting started', features: ['Up to 10 vehicles', '2 users', 'Basic reporting', 'Email support'] },
              { name: 'Professional', price: 'AED 499/mo', desc: 'For growing operations', features: ['Up to 100 vehicles', '10 users', 'Advanced analytics', 'Priority support', 'All modules'], popular: true },
              { name: 'Enterprise', price: 'Custom', desc: 'For large fleets', features: ['Unlimited vehicles', 'Unlimited users', 'Custom integrations', 'Dedicated support', 'SLA guarantee'] },
            ].map((plan, i) => (
              <div key={i} className={`rounded-2xl p-8 ${plan.popular ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white ring-4 ring-blue-600/20 scale-105' : 'bg-white border border-gray-200'}`}>
                {plan.popular && <div className="text-blue-200 text-sm font-medium mb-2">Most Popular</div>}
                <h3 className={`text-2xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className={`text-3xl font-bold mt-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.price}</div>
                <p className={`text-sm mt-2 ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>{plan.desc}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${plan.popular ? 'text-white' : 'text-gray-600'}`}>
                      <Check className={`w-4 h-4 ${plan.popular ? 'text-blue-200' : 'text-green-500'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full mt-8 py-3 rounded-lg font-semibold transition ${plan.popular ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'}`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted by Industry Leaders</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Mohammadreza Madani', role: 'CEO, MRM Investments', quote: 'Vesla transformed our operations. TARS integration alone saved us 20 hours per week.' },
              { name: 'Liberty Garcia', role: 'Finance Director', quote: 'The VAT reporting is flawless. FTA compliance has never been easier.' },
              { name: 'Mohammad Rizwan', role: 'Sales & Operations Manager', quote: 'Managing 500+ vehicles across 3 locations is now seamless with Vesla.' },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex gap-1 mb-4">{[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}</div>
                <p className="text-gray-600 mb-6">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get in touch with our team for a personalized demo and see how Vesla can streamline your operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href={`${ERP_URL}/login`} className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl text-lg font-semibold hover:shadow-xl transition-all">
              Start Free Trial
              <ChevronRight className="w-5 h-5" />
            </a>
            <a href="mailto:hello@vesla.ae" className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl text-lg font-semibold hover:bg-white/10 transition-all">
              Contact Sales
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 justify-center text-blue-100">
            <div className="flex items-center justify-center gap-2"><Mail className="w-5 h-5" /> hello@vesla.ae</div>
            <div className="flex items-center justify-center gap-2"><Phone className="w-5 h-5" /> +971 4 XXX XXXX</div>
            <div className="flex items-center justify-center gap-2"><MapPin className="w-5 h-5" /> Dubai, UAE</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Vesla ERP</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2026 MRM Investments. All rights reserved. Made with ❤️ in UAE
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Calendar,
  PieChart,
  Users,
  MapPin,
  Sparkles,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MapPin className="w-6 h-6 text-brand" />,
      title: 'Multi-City Smart Routes',
      description: 'Add stops like Ahmedabad → Udaipur → Jaipur → Jodhpur with arrival/departure dates and automatic transit tracking.',
    },
    {
      icon: <PieChart className="w-6 h-6 text-teal" />,
      title: 'Dynamic Budget Engine',
      description: 'Track transport, stays, food, and activities live with category breakdowns, daily charts, and overbudget alerts.',
    },
    {
      icon: <Calendar className="w-6 h-6 text-accent" />,
      title: 'Conflict-Free Timelines',
      description: 'Interactive day calendars and time-slot conflict detector ensuring seamless scheduling without overlapping plans.',
    },
    {
      icon: <Users className="w-6 h-6 text-brand-600" />,
      title: 'Community & 1-Click Copy',
      description: 'Share your royal Rajasthan or coastal Goa journeys with shareable links and clone public community trips instantly.',
    },
  ];

  const popularDestinations = [
    {
      name: 'Jaipur & Udaipur',
      state: 'Rajasthan',
      image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
      tag: 'Royal Heritage',
    },
    {
      name: 'Varanasi Ghats',
      state: 'Uttar Pradesh',
      image: 'https://images.unsplash.com/photo-1561359313-0639aad49ca6?auto=format&fit=crop&w=800&q=80',
      tag: 'Spiritual Wonder',
    },
    {
      name: 'Goa Coastal Getaway',
      state: 'Goa',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
      tag: 'Beaches & Adventure',
    },
    {
      name: 'Srinagar Dal Lake',
      state: 'Jammu & Kashmir',
      image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80',
      tag: 'Himalayan Paradise',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-teal flex items-center justify-center text-white shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black text-brand tracking-tight">GlobeTrotter</span>
            <span className="block text-[10px] uppercase font-extrabold text-teal tracking-widest -mt-1">
              Personalized Smart Travel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Start Free
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            Empowering Personalized Indian Travel Planning
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink-primary leading-tight">
            Plan your journey. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-teal">
              Your way.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed">
            Build personalized multi-city trips, discover authentic Indian experiences, manage your budget dynamically, and share your travel story with confidence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/register')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto px-8"
            >
              Start Planning
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/explore')}
              className="w-full sm:w-auto px-8"
            >
              Explore Destinations
            </Button>
          </div>
        </div>


      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 bg-surface border-y border-borderLight">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">
              Built for Seamless Multi-City Exploration
            </h2>
            <p className="text-sm text-ink-secondary">
              Everything you need to turn complex travel ideas into structured day-wise plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => (
              <div
                key={idx}
                className="p-6 rounded-card bg-canvas border border-borderLight/80 shadow-subtle hover:border-brand-200 hover:shadow-card transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-borderLight flex items-center justify-center mb-4 shadow-xs">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-ink-primary mb-2">{f.title}</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal">India-First Curation</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-primary">Popular Destinations Ready to Plan</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/explore')}>
            View All 30+ Cities →
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularDestinations.map((dest, i) => (
            <div key={i} className="group relative rounded-card overflow-hidden h-72 border border-borderLight shadow-card cursor-pointer" onClick={() => navigate('/explore')}>
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-primary/80 via-transparent to-black/20" />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-bold text-ink-primary shadow-xs">
                  {dest.tag}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-lg font-bold">{dest.name}</h3>
                <p className="text-xs text-white/80">{dest.state}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-primary text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-300" />
            <span className="font-bold text-white text-sm">GlobeTrotter</span>
            <span>— Personalized Smart Travel Planning Platform</span>
          </div>
          <p>© 2026 GlobeTrotter. All genuine destination photography verified.</p>
        </div>
      </footer>
    </div>
  );
};

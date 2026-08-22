import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Users,
  MapPin,
  Compass,
  Calendar,
  IndianRupee,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Activity, AdminMetrics, City, User } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Tabs } from '../components/common/Tabs';

export const AdminDashboardPage: React.FC = () => {
  const { showToast } = useNotification();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // City Modal
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [cityForm, setCityForm] = useState({
    name: '',
    state: '',
    region: 'North',
    cost_index: 'Moderate',
    popularity: 85,
    description: '',
    image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
    best_suited_interests: 'Culture,Sightseeing',
  });

  // Activity Modal
  const [isActModalOpen, setIsActModalOpen] = useState(false);
  const [actForm, setActForm] = useState({
    city_id: 1,
    name: '',
    category: 'Sightseeing',
    duration_hours: 2.0,
    estimated_cost: 500,
    rating: 4.8,
    popularity_score: 88,
    description: '',
    image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [m, u, c, a] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getCities(),
        api.getActivities(),
      ]);
      setMetrics(m);
      setUsers(u);
      setCities(c);
      setActivities(a);
      if (c.length > 0) {
        setActForm((prev) => ({ ...prev, city_id: c[0].id }));
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load admin data. Admin privileges required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminCreateCity(cityForm);
      showToast('success', `City "${cityForm.name}" created!`);
      setIsCityModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteCity = async (cityId: number) => {
    if (!confirm('Are you sure you want to delete this city?')) return;
    try {
      await api.adminDeleteCity(cityId);
      showToast('success', 'City removed.');
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminCreateActivity(actForm);
      showToast('success', `Activity "${actForm.name}" created!`);
      setIsActModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteActivity = async (actId: number) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await api.adminDeleteActivity(actId);
      showToast('success', 'Activity deleted.');
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Analytics Overview' },
    { id: 'cities', label: `Manage Cities (${cities.length})` },
    { id: 'activities', label: `Manage Activities (${activities.length})` },
    { id: 'users', label: `Users Directory (${users.length})` },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-card border border-borderLight shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-primary">Admin Control Center</h1>
            <p className="text-xs text-ink-secondary">Platform analytics, user adoption, and destination content management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCityModalOpen(true)}
          >
            + Add City
          </Button>
          <Button
            variant="teal"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsActModalOpen(true)}
          >
            + Add Activity
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid (Section 31) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-ink-secondary uppercase">Total Users</span>
          <div className="text-2xl font-extrabold text-brand">{metrics.total_users}</div>
        </Card>
        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-ink-secondary uppercase">Total Trips</span>
          <div className="text-2xl font-extrabold text-teal">{metrics.total_trips}</div>
        </Card>
        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-ink-secondary uppercase">Indian Cities</span>
          <div className="text-2xl font-extrabold text-ink-primary">{metrics.total_cities}</div>
        </Card>
        <Card padding="sm" className="space-y-1">
          <span className="text-[11px] font-bold text-ink-secondary uppercase">Seeded Activities</span>
          <div className="text-2xl font-extrabold text-amber-600">{metrics.total_activities}</div>
        </Card>
        <Card padding="sm" className="space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-ink-secondary uppercase">Avg Trip Budget</span>
          <div className="text-2xl font-extrabold text-emerald-600">₹{Math.round(metrics.average_trip_budget).toLocaleString('en-IN')}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="bg-surface p-4 rounded-card border border-borderLight shadow-xs">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User & Trip Growth Chart */}
          <Card padding="md" className="space-y-4 border border-borderLight">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Monthly Platform Growth (Trips vs Users)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.monthly_trip_growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E4E7EC', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="trips" stroke="#1769AA" strokeWidth={3} name="Trips Created" />
                  <Line type="monotone" dataKey="users" stroke="#0F9D8A" strokeWidth={3} name="Registered Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Popular Cities Bar Chart */}
          <Card padding="md" className="space-y-4 border border-borderLight">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Top Visited Indian Destinations
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.popular_cities}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E4E7EC', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Itinerary Stops Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'cities' && (
        <Card padding="none" className="border border-borderLight overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-borderLight text-ink-secondary font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">City Name</th>
                <th className="p-3">State & Region</th>
                <th className="p-3">Cost Tier</th>
                <th className="p-3">Score</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLight/60 text-ink-primary">
              {cities.map((city) => (
                <tr key={city.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold flex items-center gap-2">
                    <img src={city.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    {city.name}
                  </td>
                  <td className="p-3 text-ink-secondary">{city.state} • {city.region}</td>
                  <td className="p-3"><Badge variant="brand" size="sm">{city.cost_index}</Badge></td>
                  <td className="p-3 font-semibold">{city.popularity}%</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteCity(city.id)}
                      className="p-1 text-ink-muted hover:text-rose-600"
                      title="Delete City"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'activities' && (
        <Card padding="none" className="border border-borderLight overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-borderLight text-ink-secondary font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Activity Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Cost (₹)</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLight/60 text-ink-primary">
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold flex items-center gap-2">
                    <img src={act.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    {act.name}
                  </td>
                  <td className="p-3"><Badge variant="teal" size="sm">{act.category}</Badge></td>
                  <td className="p-3">{act.duration_hours}h</td>
                  <td className="p-3 font-bold">₹{act.estimated_cost}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="p-1 text-ink-muted hover:text-rose-600"
                      title="Delete Activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card padding="none" className="border border-borderLight overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-borderLight text-ink-secondary font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">User Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Role</th>
                <th className="p-3">Travel Style</th>
                <th className="p-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderLight/60 text-ink-primary">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold flex items-center gap-2">
                    <img src={u.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} alt="" className="w-7 h-7 rounded-full object-cover" />
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="p-3 text-ink-secondary">{u.email}</td>
                  <td className="p-3">
                    <Badge variant={u.role === 'admin' ? 'teal' : 'brand'} size="sm">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-3">{u.travel_style}</td>
                  <td className="p-3">{u.city ? `${u.city}, ${u.country}` : u.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ================= ADD CITY MODAL ================= */}
      <Modal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        title="Add New Indian Destination"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCity} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City Name *"
              value={cityForm.name}
              onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
              required
            />
            <Input
              label="State *"
              value={cityForm.state}
              onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Region"
              value={cityForm.region}
              onChange={(e) => setCityForm({ ...cityForm, region: e.target.value })}
              options={[
                { value: 'North', label: 'North' },
                { value: 'West', label: 'West' },
                { value: 'South', label: 'South' },
                { value: 'East', label: 'East' },
                { value: 'Central', label: 'Central' },
              ]}
            />
            <Select
              label="Cost Index"
              value={cityForm.cost_index}
              onChange={(e) => setCityForm({ ...cityForm, cost_index: e.target.value })}
              options={[
                { value: 'Budget', label: 'Budget' },
                { value: 'Moderate', label: 'Moderate' },
                { value: 'Luxury', label: 'Luxury' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">Description *</label>
            <textarea
              rows={3}
              value={cityForm.description}
              onChange={(e) => setCityForm({ ...cityForm, description: e.target.value })}
              className="w-full rounded-lg border border-borderLight p-2.5 text-xs text-ink-primary focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <Input
            label="Image URL (Unsplash)"
            value={cityForm.image_url}
            onChange={(e) => setCityForm({ ...cityForm, image_url: e.target.value })}
            required
          />

          <div className="pt-2 border-t border-borderLight flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setIsCityModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Destination
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= ADD ACTIVITY MODAL ================= */}
      <Modal
        isOpen={isActModalOpen}
        onClose={() => setIsActModalOpen(false)}
        title="Add New City Activity"
        maxWidth="md"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <Select
            label="City *"
            value={actForm.city_id}
            onChange={(e) => setActForm({ ...actForm, city_id: Number(e.target.value) })}
            options={cities.map((c) => ({ value: c.id, label: c.name }))}
          />

          <Input
            label="Activity Name *"
            value={actForm.name}
            onChange={(e) => setActForm({ ...actForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={actForm.category}
              onChange={(e) => setActForm({ ...actForm, category: e.target.value })}
              options={[
                { value: 'Sightseeing', label: 'Sightseeing' },
                { value: 'Food', label: 'Food & Dining' },
                { value: 'Culture', label: 'Culture & Heritage' },
                { value: 'Adventure', label: 'Adventure' },
                { value: 'Photography', label: 'Photography' },
                { value: 'Nature', label: 'Nature' },
              ]}
            />
            <Input
              label="Estimated Cost (₹)"
              type="number"
              value={actForm.estimated_cost}
              onChange={(e) => setActForm({ ...actForm, estimated_cost: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">Description *</label>
            <textarea
              rows={2}
              value={actForm.description}
              onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
              className="w-full rounded-lg border border-borderLight p-2.5 text-xs text-ink-primary focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div className="pt-2 border-t border-borderLight flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setIsActModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="teal" type="submit">
              Save Activity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

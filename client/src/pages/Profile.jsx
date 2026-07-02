import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Profile() {
  const { user, streak, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalRank, setGlobalRank] = useState('Unranked');
  const [globalScore, setGlobalScore] = useState(0);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Fetch attempt history
        const histRes = await api.get('/quiz/history');
        if (histRes.data && histRes.data.history) {
          setHistory(histRes.data.history);
        }

        // Fetch global ranking to extract rank & score
        const scoreRes = await api.get('/score');
        if (scoreRes.data && scoreRes.data.leaderboard) {
          const lb = scoreRes.data.leaderboard;
          const userIdx = lb.findIndex((entry) => entry.userId === user?._id);
          if (userIdx !== -1) {
            setGlobalRank(`#${userIdx + 1}`);
            setGlobalScore(lb[userIdx].score);
          }
        }
      } catch (err) {
        console.error('Failed to load profile data', err);
        showToast('Failed to load profile dashboard.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  // Aggregate attempts by state for Bar Chart
  const stateChartData = useMemo(() => {
    const counts = {};
    history.forEach((attempt) => {
      counts[attempt.state] = (counts[attempt.state] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, attempts]) => ({ name, attempts }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 6); // Limit to top 6 states for design clarity
  }, [history]);

  // Aggregate attempts by category for Pie Chart
  const categoryChartData = useMemo(() => {
    const counts = {};
    history.forEach((attempt) => {
      counts[attempt.category] = (counts[attempt.category] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [history]);

  const handleLogoutClick = async () => {
    await logout();
    showToast('Logged out successfully.', 'success');
    navigate('/login');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
      {/* Upper Dashboard Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="lg:col-span-1 border border-slate-200 dark:border-slate-800 glass relative p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  @{user?.username}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Member since {new Date(user?.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 border-t border-b border-slate-100 dark:border-slate-800/60 py-4 text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rank</p>
                <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                  {globalRank}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Score</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                  {globalScore}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Streak</p>
                <p className="text-lg font-extrabold text-amber-500 mt-0.5 flex items-center justify-center gap-0.5">
                  🔥 {streak}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button
              variant="destructive"
              onClick={handleLogoutClick}
              className="w-full font-semibold"
            >
              🚪 Sign Out
            </Button>
          </div>
        </Card>

        {/* Charts Container */}
        <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 glass p-6 space-y-6">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/60 pb-3">
            📊 Analytics Dashboard
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[250px]">
            {/* Bar Chart: States */}
            <div className="flex flex-col">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
                Attempts by State
              </h4>
              <div className="w-full flex-grow h-48">
                {stateChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stateChartData} margin={{ bottom: 15 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                          border: 'none',
                        }}
                      />
                      <Bar dataKey="attempts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No state history yet
                  </div>
                )}
              </div>
            </div>

            {/* Pie Chart: Categories */}
            <div className="flex flex-col">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
                Topics Breakdown
              </h4>
              <div className="w-full flex-grow h-48">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                          border: 'none',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconSize={8}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No topic history yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Quiz History Table */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quiz History</h3>
        <Card className="shadow-md border border-slate-200 dark:border-slate-800 glass overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length > 0 ? (
                history.map((attempt) => (
                  <TableRow key={attempt._id}>
                    <TableCell className="font-medium text-xs">
                      {formatDate(attempt.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {attempt.state}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="text-[10px]">
                        {attempt.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          attempt.difficulty === 'Easy'
                            ? 'success'
                            : attempt.difficulty === 'Medium'
                            ? 'warning'
                            : 'error'
                        }
                        className="text-[10px]"
                      >
                        {attempt.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          navigate(
                            `/results?state=${encodeURIComponent(
                              attempt.state
                            )}&category=${attempt.category}&difficulty=${attempt.difficulty}`
                          )
                        }
                        className="text-xs bg-brand-600 hover:bg-brand-700 cursor-pointer"
                      >
                        🔍 View Result
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    You haven't completed any quizzes yet. Click home to select a state and start!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}

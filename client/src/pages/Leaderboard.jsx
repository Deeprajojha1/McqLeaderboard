import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../hooks/useSocket';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { STATE_MAPPING } from '../components/map/stateMapping';
import api from '../services/api';

export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { subscribeToLeaderboard, isConnected } = useSocket();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('All States');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [difficultyFilter, setDifficultyFilter] = useState('All Difficulties');

  const stateOptions = [
    { value: 'All States', label: 'Global Ranking' },
    ...Object.keys(STATE_MAPPING).sort().map(name => ({ value: name, label: name }))
  ];

  const categoryOptions = [
    { value: 'All Categories', label: 'All Categories' },
    { value: 'History', label: 'History' },
    { value: 'Geography', label: 'Geography' },
    { value: 'Science', label: 'Science' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Culture', label: 'Culture' }
  ];

  const difficultyOptions = [
    { value: 'All Difficulties', label: 'All Difficulties' },
    { value: 'Easy', label: 'Easy' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Hard', label: 'Hard' }
  ];

  // Fetch leaderboard initially and whenever filters change
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        let url = '/score';
        const params = [];
        if (stateFilter !== 'All States') params.push(`state=${encodeURIComponent(stateFilter)}`);
        if (categoryFilter !== 'All Categories') params.push(`category=${encodeURIComponent(categoryFilter)}`);
        if (difficultyFilter !== 'All Difficulties') params.push(`difficulty=${encodeURIComponent(difficultyFilter)}`);
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }

        const res = await api.get(url);
        if (res.data && res.data.leaderboard) {
          setLeaderboard(res.data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        showToast('Failed to load leaderboard.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [stateFilter, categoryFilter, difficultyFilter]);

  // Subscribe to real-time Socket.IO updates
  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((updatedLeaderboard) => {
      const hasFilters = stateFilter !== 'All States' || categoryFilter !== 'All Categories' || difficultyFilter !== 'All Difficulties';
      if (!hasFilters) {
        setLeaderboard(updatedLeaderboard);
        showToast('Leaderboard updated live!', 'info');
      } else {
        // Trigger a silent refetch to get updated filtered results if score updates arrive
        const fetchFiltered = async () => {
          try {
            let url = `/score?state=${encodeURIComponent(stateFilter)}&category=${categoryFilter}&difficulty=${difficultyFilter}`;
            const res = await api.get(url);
            if (res.data && res.data.leaderboard) {
              setLeaderboard(res.data.leaderboard);
            }
          } catch (err) {
            console.error('Failed to update filtered leaderboard:', err);
          }
        };
        fetchFiltered();
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToLeaderboard, stateFilter, categoryFilter, difficultyFilter]);

  // Client-side filtering of the leaderboard list
  const filteredLeaderboard = leaderboard.filter((entry) => {
    // Search query check
    const name = entry.username || entry.userId || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Find current user's rank
  const currentUserEntryIndex = leaderboard.findIndex(
    (entry) => entry.userId === user?._id
  );
  const currentUserRank = currentUserEntryIndex !== -1 ? currentUserEntryIndex + 1 : null;
  const currentUserScore = currentUserEntryIndex !== -1 ? leaderboard[currentUserEntryIndex].score : null;

  return (
    <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
      {/* Title Header */}
      <section className="text-center space-y-2 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
          Global Leaderboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Real-time rankings of top scorers. See where you stand!
        </p>

        {/* Socket.IO Connection Indicator */}
        <div className="flex items-center justify-center gap-1.5 pt-1 text-xs font-semibold">
          <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
            {isConnected ? 'Connected Live' : 'Offline Mode'}
          </span>
        </div>
      </section>

      {/* User's own Rank Highlight */}
      {isAuthenticated && user && (
        <Card className="bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/20 dark:to-indigo-950/20 border border-brand-100 dark:border-brand-900/60 p-5 shadow-sm animate-fade-in-scale">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-0.5">
                Your Current Status
              </p>
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Logged in as <span className="text-brand-600 dark:text-brand-400">@{user.username}</span>
              </h4>
            </div>
            <div className="flex gap-6 items-center">
              <div className="text-center sm:text-right">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Rank</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                  {currentUserRank ? `#${currentUserRank}` : 'Unranked'}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Score</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                  {currentUserScore !== null ? `${currentUserScore} pts` : '0 pts'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filter and Search Controls */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800 p-5 animate-fade-in-up">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <Input
              id="search"
              label="Search User"
              placeholder="Enter username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-0"
            />
          </div>
          <div>
            <Select
              label="State/Region"
              options={stateOptions}
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="mb-0"
            />
          </div>
          <div>
            <Select
              label="Category"
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mb-0"
            />
          </div>
          <div>
            <Select
              label="Difficulty"
              options={difficultyOptions}
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="mb-0"
            />
          </div>
        </div>
      </Card>

      {/* Leaderboard Table */}
      <Card className="shadow-md border border-slate-200 dark:border-slate-800 glass overflow-hidden animate-fade-in-up">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 text-center">Rank</TableHead>
              <TableHead>Username</TableHead>
              <TableHead className="text-right pr-6">Score</TableHead>
              <TableHead className="w-32 text-center">Badge</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
                  <p className="text-xs text-slate-500 mt-2">Loading ranks...</p>
                </TableCell>
              </TableRow>
            ) : filteredLeaderboard.length > 0 ? (
              filteredLeaderboard.map((entry, idx) => {
                const rank = idx + 1;
                const isCurrentUser = entry.userId === user?._id;
                return (
                  <TableRow
                    key={entry.userId}
                    className={
                      isCurrentUser
                        ? 'bg-brand-50/40 hover:bg-brand-50/60 dark:bg-brand-950/15 dark:hover:bg-brand-950/20 font-semibold'
                        : ''
                    }
                  >
                    <TableCell className="text-center font-bold text-base">
                      {rank === 1 ? (
                        <span className="text-xl">🥇</span>
                      ) : rank === 2 ? (
                        <span className="text-xl">🥈</span>
                      ) : rank === 3 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        `#${rank}`
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {entry.username || `User-${entry.userId.substring(0, 6)}`}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="primary" className="text-[10px] py-0.5">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {entry.score} pts
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.score >= 100 ? (
                        <Badge variant="success">Grandmaster</Badge>
                      ) : entry.score >= 50 ? (
                        <Badge variant="info">Expert</Badge>
                      ) : (
                        <Badge variant="default">Novice</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                  No users match your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

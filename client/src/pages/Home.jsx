import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StateSelector } from '../components/map/StateSelector';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';

export default function Home() {
  const [selectedState, setSelectedState] = useState('');
  const [category, setCategory] = useState('History');
  const [difficulty, setDifficulty] = useState('Medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [popularCategories, setPopularCategories] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const { isAuthenticated, user, streak } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const categories = [
    { value: 'History', label: 'History' },
    { value: 'Geography', label: 'Geography' },
    { value: 'Science', label: 'Science' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Culture', label: 'Culture' }
  ];

  const difficulties = [
    { value: 'Easy', label: 'Easy' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Hard', label: 'Hard' }
  ];

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const catRes = await api.get('/analytics/popular-categories');
        if (catRes.data && catRes.data.categories) {
          setPopularCategories(catRes.data.categories);
        }
      } catch (err) {
        console.error('Failed to fetch popular categories', err);
      }

      if (isAuthenticated && user) {
        try {
          const searchRes = await api.get(`/analytics/recent-searches?userId=${user._id}`);
          if (searchRes.data && searchRes.data.searches) {
            setRecentSearches(searchRes.data.searches);
          }
        } catch (err) {
          console.error('Failed to fetch recent searches', err);
        }
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, user]);

  const handleStartQuiz = async () => {
    if (!selectedState) {
      showToast('Please select a state first by clicking the map or dropdown.', 'warning');
      return;
    }

    if (!isAuthenticated) {
      showToast('Please login first to generate and take the quiz!', 'info');
      navigate('/login');
      return;
    }

    setIsGenerating(true);
    showToast(`Generating ${difficulty} ${category} quiz for ${selectedState}...`, 'info');

    try {
      // Direct sync request to Groq/Gemini via backend
      const res = await api.post('/question/generate', {
        state: selectedState,
        category,
        difficulty,
        async: false // Request sync mode for direct questions return
      });

      if (res.data && res.data.questions) {
        showToast('Quiz generated successfully!', 'success');
        // Store questions in session state or navigate to quiz page
        // The quiz page can fetch the questions from /api/quiz/questions,
        // which will hit the Redis cache populated during this generation!
        navigate(`/quiz?state=${encodeURIComponent(selectedState)}&category=${category}&difficulty=${difficulty}`);
      } else if (res.data && res.data.message === "Question generation queued") {
        // If the backend forced async queueing
        const requestId = res.data.requestId;
        showToast('Question generation queued! Redirecting to queue listener...', 'info');
        navigate(`/quiz?state=${encodeURIComponent(selectedState)}&category=${category}&difficulty=${difficulty}&requestId=${requestId}`);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || 'Failed to generate quiz questions. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRecentClick = (searchStr) => {
    // format: "StateName:Category"
    const [stateName, cat] = searchStr.split(':');
    setSelectedState(stateName);
    if (cat) setCategory(cat);
    showToast(`Loaded selection for ${stateName}: ${cat}`, 'info');
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto animate-fade-in-up">
        {streak > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-900/60 animate-float">
            <span className="text-base">🔥</span>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
              {streak} Day Streak! Keep it going!
            </span>
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent leading-tight py-2">
          Discover India with Real-Time GK Quizzes
        </h1>
        <p className="max-w-2xl text-lg md:text-xl leading-8 text-slate-600 font-normal tracking-wide">
          Pick any state from the map, choose your topic, and challenge yourself.
          Watch your rank rise on our live global leaderboard!
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="secondary" onClick={() => setShowHowItWorks(true)}>
            📖 How it Works
          </Button>
          <Button variant="outline" onClick={() => navigate('/leaderboard')}>
            🏆 View Leaderboard
          </Button>
        </div>
      </section>

      {/* Main Interactive Section */}
      <section className="grid grid-cols-1 gap-8">
        <Card className="shadow-md border border-slate-200 dark:border-slate-800 glass p-6 md:p-8">
          <CardContent className="p-0 space-y-8">
            <StateSelector selectedState={selectedState} onStateChange={setSelectedState} />

            {/* Parameter selection row */}
            {selectedState && (
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                  <Select
                    label="Category"
                    options={categories}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <Select
                    label="Difficulty"
                    options={difficulties}
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-1/3 mb-4">
                  <Button
                    onClick={handleStartQuiz}
                    disabled={isGenerating}
                    className="w-full py-2.5 font-bold shadow-md bg-brand-600 hover:bg-brand-700"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating GK Quiz...
                      </span>
                    ) : (
                      '🚀 Start State Quiz'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Popular and Recent Activities */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Popular Categories */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/50">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
              🔥 Popular Quiz Topics
            </h3>
          </div>
          <CardContent className="p-5">
            {popularCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {popularCategories.map((cat, idx) => (
                  <Badge
                    key={idx}
                    variant={idx === 0 ? 'primary' : 'default'}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm"
                  >
                    {cat.category} ({cat.count} searches)
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No popular categories found. Be the first to start a quiz!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Searches / Activity */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/50">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
              ⏱️ Your Recent Searches
            </h3>
          </div>
          <CardContent className="p-5">
            {!isAuthenticated ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Log in to see your recent quiz categories and state combinations.
              </p>
            ) : recentSearches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentClick(search)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:hover:bg-brand-950/30 dark:hover:text-brand-300 rounded-lg cursor-pointer transition-all border border-transparent hover:border-brand-200 dark:hover:border-brand-900"
                  >
                    🔍 {search.replace(':', ' - ')}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No recent activity. Try clicking on a state and starting a quiz!
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* How it Works Modal / Dialog */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowHowItWorks(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 z-10 animate-scale-in">
            <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-4 flex items-center gap-2">
              💡 How it Works
            </h3>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold shrink-0">1</span>
                <p>Click on any state in the interactive Indian map, or use the dropdown selector.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold shrink-0">2</span>
                <p>Pick a category (like Geography, History, Culture) and set the difficulty level.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold shrink-0">3</span>
                <p>Take the quiz! Each correct answer earns 10 points. Wrong answers earn 0.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold shrink-0">4</span>
                <p>Submit and watch your score get broadcast live to update the global leaderboard rankings!</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowHowItWorks(false)}>Got it!</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';

export default function Results() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const state = searchParams.get('state');
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');

  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRetaking, setIsRetaking] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      try {
        const res = await api.get(
          `/quiz/results/all?state=${encodeURIComponent(
            state
          )}&category=${category}&difficulty=${difficulty}&userId=${user._id}`
        );
        if (res.data) {
          setSummary(res.data.summary);
          setResults(res.data.results);
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to load quiz results.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [state, category, difficulty, user]);

  const handleRetake = async () => {
    setIsRetaking(true);
    showToast('Regenerating new quiz questions...', 'info');
    try {
      const res = await api.post('/question/generate', {
        state,
        category,
        difficulty,
        async: false,
      });
      if (res.data && res.data.questions) {
        showToast('New questions generated! Good luck.', 'success');
        navigate(
          `/quiz?state=${encodeURIComponent(
            state
          )}&category=${category}&difficulty=${difficulty}`
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to regenerate quiz.', 'error');
    } finally {
      setIsRetaking(false);
    }
  };

  const handleShare = () => {
    if (!summary) return;
    const shareText = `🏆 I scored ${summary.totalPoints} points on the ${state} ${category} Quiz (${difficulty} mode)!\nCheck your GK rank on the Live Leaderboard!`;
    navigator.clipboard.writeText(shareText);
    showToast('Copied score summary to clipboard!', 'success');
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-600 dark:text-slate-400">No results found for this quiz.</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
      {/* Parameter Info */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Badge variant="primary" className="text-xs py-1 px-3">
          📍 {state}
        </Badge>
        <Badge variant="default" className="text-xs py-1 px-3">
          📚 {category}
        </Badge>
        <Badge
          variant={
            difficulty === 'Easy'
              ? 'success'
              : difficulty === 'Medium'
              ? 'warning'
              : 'error'
          }
          className="text-xs py-1 px-3"
        >
          ⚡ {difficulty}
        </Badge>
      </div>

      {/* Summary dashboard cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
            Total Points
          </p>
          <p className="text-3xl font-extrabold text-brand-800 dark:text-brand-300">
            {summary.totalPoints}
          </p>
        </Card>
        <Card className="bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">
            Correct Answers
          </p>
          <p className="text-3xl font-extrabold text-green-800 dark:text-green-300">
            {summary.correctCount} / {summary.totalQuestions}
          </p>
        </Card>
        <Card className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
            Incorrect Answers
          </p>
          <p className="text-3xl font-extrabold text-red-800 dark:text-red-300">
            {summary.wrongCount} / {summary.totalQuestions}
          </p>
        </Card>
        <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            Accuracy
          </p>
          <p className="text-3xl font-extrabold text-indigo-800 dark:text-indigo-300">
            {summary.percentage}%
          </p>
        </Card>
      </section>

      {/* Quick Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center border-y border-slate-200 dark:border-slate-800 py-6">
        <Button onClick={() => navigate('/leaderboard')} className="font-semibold shadow-sm bg-brand-600 hover:bg-brand-700">
          🏆 View Live Leaderboard
        </Button>
        <Button variant="secondary" onClick={handleRetake} disabled={isRetaking} className="font-semibold cursor-pointer">
          {isRetaking ? 'Regenerating...' : '🔄 Retake Quiz'}
        </Button>
        <Button variant="outline" onClick={() => navigate('/')} className="font-semibold">
          🗺️ Try Different State
        </Button>
        <Button variant="outline" onClick={handleShare} className="font-semibold">
          📤 Share Results
        </Button>
      </div>

      {/* Detailed answers review list */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Question Review & Explanations
        </h3>
        <div className="space-y-4">
          {results.map((res, idx) => (
            <Card
              key={idx}
              className={`border p-6 shadow-sm overflow-hidden relative ${
                res.isCorrect
                  ? 'border-green-200 dark:border-green-900/50 bg-green-50/10 dark:bg-green-950/5'
                  : 'border-red-200 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/5'
              }`}
            >
              {/* Correct/Wrong flag badge */}
              <div className="absolute top-4 right-4">
                <Badge variant={res.isCorrect ? 'success' : 'error'} className="px-2 py-0.5">
                  {res.isCorrect ? '✓ Correct (+10 pts)' : '✗ Incorrect (+0 pts)'}
                </Badge>
              </div>

              <div className="space-y-4 max-w-[85%]">
                <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                  {idx + 1}. {res.question}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      Your Answer
                    </p>
                    <p
                      className={`font-semibold ${
                        res.isCorrect
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {res.userAnswer || 'No answer selected'}
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      Correct Answer
                    </p>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      {res.correctAnswer}
                    </p>
                  </div>
                </div>

                {res.explanation && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      AI Explanation
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {res.explanation}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

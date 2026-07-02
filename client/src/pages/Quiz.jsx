import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../hooks/useSocket';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import api from '../services/api';

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { subscribeToQuestionReady } = useSocket();

  const state = searchParams.get('state');
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const requestId = searchParams.get('requestId');

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // [{ questionId, selectedAnswer }]
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  // Storage key for auto-save
  const storageKey = user
    ? `quiz_progress:${user._id}:${state}:${category}:${difficulty}`
    : `quiz_progress:guest:${state}:${category}:${difficulty}`;

  // 1. Initialize or restore progress from localStorage
  const initializeAnswersAndProgress = (loadedQuestions) => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const { savedAnswers, savedIndex } = JSON.parse(saved);
        if (
          savedAnswers &&
          Array.isArray(savedAnswers) &&
          savedAnswers.length === loadedQuestions.length
        ) {
          setAnswers(savedAnswers);
          setCurrentIndex(savedIndex || 0);
          showToast('Resumed your quiz progress!', 'success');
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved progress', e);
      }
    }

    // Default initialization
    const initialAnswers = loadedQuestions.map((q) => ({
      questionId: q.id,
      selectedAnswer: null,
    }));
    setAnswers(initialAnswers);
    setCurrentIndex(0);
  };

  // 2. Load questions directly from API
  const fetchQuestionsDirect = async (isActive = true) => {
    setError(null);
    setLoading(true);
    setLoadingProgress(30);
    try {
      const res = await api.get(
        `/quiz/questions?state=${encodeURIComponent(state)}&category=${category}&difficulty=${difficulty}`
      );
      if (res.data && res.data.questions && res.data.questions.length > 0) {
        if (isActive) {
          setLoadingProgress(100);
          setQuestions(res.data.questions);
          initializeAnswersAndProgress(res.data.questions);
        }
      } else {
        throw new Error('No questions found for this quiz combination.');
      }
    } catch (err) {
      console.error(err);
      if (isActive) {
        setError(err.response?.data?.error || err.message || 'Failed to load questions.');
        showToast('Error loading quiz questions.', 'error');
      }
    } finally {
      if (isActive) setLoading(false);
    }
  };

  // 3. Question generation/fetch effect
  useEffect(() => {
    let active = true;

    if (requestId) {
      // Async generation - listen on Socket.IO for the backend worker
      setLoading(true);
      setLoadingProgress(10);
      showToast('Waiting for AI worker to generate state questions...', 'info');

      // Increment progress simulation
      const interval = setInterval(() => {
        setLoadingProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 1000);

      // Simulation timeout of 25 seconds
      const timeoutId = setTimeout(() => {
        if (loading && questions.length === 0) {
          clearInterval(interval);
          if (active) {
            setLoading(false);
            setError('Question generation timed out. Please try again.');
            showToast('AI worker timed out generating questions.', 'error');
          }
        }
      }, 25000);

      const unsubscribe = subscribeToQuestionReady(requestId, (data) => {
        clearInterval(interval);
        clearTimeout(timeoutId);
        showToast('Questions are ready!', 'success');
        fetchQuestionsDirect(active);
      });

      return () => {
        clearInterval(interval);
        clearTimeout(timeoutId);
        active = false;
        if (unsubscribe) unsubscribe();
      };
    } else {
      // Sync questions load
      fetchQuestionsDirect(active);
    }

    return () => {
      active = false;
    };
  }, [state, category, difficulty, requestId]);

  // 3. Auto-save progress whenever answers or index change
  useEffect(() => {
    if (questions.length > 0 && answers.length > 0) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          savedAnswers: answers,
          savedIndex: currentIndex,
        })
      );
    }
  }, [answers, currentIndex, questions, storageKey]);

  // 4. Timer Logic: 30-second countdown per question
  useEffect(() => {
    if (loading || questions.length === 0) return;

    // Reset timer
    setTimeLeft(30);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, loading, questions]);

  const handleTimeOut = () => {
    showToast("Time's up for this question!", 'warning');
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // It was the last question - auto-submit
      handleSubmitQuiz();
    }
  };

  const handleSelectOption = (option) => {
    setAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentIndex ? { ...ans, selectedAnswer: option } : ans
      )
    );
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const unansweredCount = answers.filter((a) => !a.selectedAnswer).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) {
        // Restart timer for active question
        setCurrentIndex(currentIndex);
        return;
      }
    }

    setLoading(true);
    showToast('Submitting answers and calculating score...', 'info');

    try {
      const res = await api.post('/quiz/submit', {
        userId: user._id,
        state,
        category,
        difficulty,
        answers,
      });

      if (res.data) {
        // Clear local progress storage
        localStorage.removeItem(storageKey);
        showToast('Quiz submitted successfully!', 'success');

        // Redirect to results dashboard
        navigate(
          `/results?state=${encodeURIComponent(
            state
          )}&category=${category}&difficulty=${difficulty}`
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to submit quiz. Please try again.', 'error');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className={clsx('flex-1', 'flex', 'flex-col', 'items-center', 'justify-center', 'min-h-[70vh]', 'gap-6', 'px-4', 'text-center')}>
        <div className={clsx('p-6', 'bg-red-50', 'dark:bg-red-950/20', 'border', 'border-red-200', 'dark:border-red-900/40', 'rounded-2xl', 'max-w-md')}>
          <span className="text-3xl">⚠️</span>
          <h3 className={clsx('text-lg', 'font-bold', 'text-slate-800', 'dark:text-slate-100', 'mt-2')}>Failed to Load Quiz</h3>
          <p className={clsx('text-sm', 'mt-1', 'text-slate-600', 'dark:text-slate-400')}>{error}</p>
        </div>
        <div className={clsx('flex', 'gap-4')}>
          <Button onClick={() => fetchQuestionsDirect(true)} className={clsx('font-semibold', 'px-6', 'py-2.5', 'bg-brand-600', 'hover:bg-brand-700')}>
            🔄 Retry Loading
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className={clsx('font-semibold', 'px-6', 'py-2.5')}>
            🗺️ Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (loading && questions.length === 0) {
    return (
      <div className={clsx('flex-1', 'flex', 'flex-col', 'items-center', 'justify-center', 'min-h-[70vh]', 'gap-4')}>
        <div className={clsx('relative', 'w-64', 'h-3', 'bg-slate-100', 'dark:bg-slate-800', 'rounded-full', 'overflow-hidden', 'border', 'border-slate-200', 'dark:border-slate-700')}>
          <div
            className={clsx('h-full', 'bg-brand-600', 'rounded-full', 'transition-all', 'duration-300')}
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className={clsx('text-sm', 'font-semibold', 'text-slate-700', 'dark:text-slate-300', 'animate-pulse')}>
          {requestId ? 'Generating State Quiz questions...' : 'Loading quiz questions...'} ({loadingProgress}%)
        </p>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers[currentIndex]?.selectedAnswer;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className={clsx('flex-1', 'max-w-3xl', 'mx-auto', 'w-full', 'px-4', 'py-8', 'space-y-6')}>
      {/* Header Info */}
      <div className={clsx('flex', 'flex-wrap', 'items-center', 'justify-between', 'gap-4', 'border-b', 'border-slate-200', 'dark:border-slate-800', 'pb-4')}>
        <div className={clsx('flex', 'flex-wrap', 'items-center', 'gap-2')}>
          <Badge variant="primary" className={clsx('text-xs', 'py-1', 'px-3')}>
            📍 {state}
          </Badge>
          <Badge variant="default" className={clsx('text-xs', 'py-1', 'px-3')}>
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
            className={clsx('text-xs', 'py-1', 'px-3')}
          >
            ⚡ {difficulty}
          </Badge>
        </div>
        {/* Timer UI */}
        <div className={clsx('flex', 'items-center', 'gap-2')}>
          <span className={clsx('text-sm', 'font-medium', 'text-slate-500', 'dark:text-slate-400')}>Time Left:</span>
          <span
            className={`text-lg font-bold px-3 py-1 rounded-xl shadow-sm border ${
              timeLeft <= 10
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/60 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200'
            }`}
          >
            ⏱️ {timeLeft}s
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className={clsx('flex', 'items-center', 'justify-between', 'text-xs', 'font-semibold', 'text-slate-500', 'dark:text-slate-400')}>
          <span>Progress</span>
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Question Card */}
      <Card className={clsx('shadow-md', 'border', 'border-slate-200', 'dark:border-slate-800', 'glass')}>
        <CardHeader>
          <CardTitle className={clsx('text-xl', 'font-bold', 'leading-snug')}>
            {currentIndex + 1}. {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                className={`w-full text-left p-4 rounded-xl border font-medium text-sm transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-brand-50 border-brand-500 text-brand-900 dark:bg-brand-950/30 dark:border-brand-500 dark:text-brand-300 shadow-sm ring-1 ring-brand-500'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/40 dark:text-slate-200'
                }`}
              >
                <span>{option}</span>
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isSelected && <span className="text-[10px]">✓</span>}
                </span>
              </button>
            );
          })}
        </CardContent>
        <CardFooter className={clsx('flex', 'justify-between', 'items-center', 'py-4', 'bg-slate-50/50', 'dark:bg-slate-900/50')}>
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={clsx('flex', 'items-center', 'gap-1', 'text-sm', 'font-semibold')}
          >
            ← Previous
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleSubmitQuiz}
              className={clsx('flex', 'items-center', 'gap-1', 'text-sm', 'font-bold', 'bg-green-600', 'hover:bg-green-700', 'text-white', 'shadow-md', 'focus:ring-green-500')}
            >
              Submit Quiz 🚀
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
              className={clsx('flex', 'items-center', 'gap-1', 'text-sm', 'font-semibold')}
            >
              Next →
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

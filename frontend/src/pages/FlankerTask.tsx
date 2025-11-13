import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { flankerApi } from '../services/api';
import type { FlankerResult } from '../types/tasks';
import './FlankerTask.css';

const TOTAL_TRIALS = 100;
const FIXATION_TIME = 1000; // 注視点表示時間（1秒）
const STIMULUS_TIME = 1000; // 刺激表示時間（1秒）
const FEEDBACK_TIME = 500; // フィードバック表示時間

type TaskState = 'ready' | 'fixation' | 'stimulus' | 'feedback' | 'finished';
type TrialType = 'congruent' | 'incongruent';
type Direction = 'left' | 'right';

interface TrialResult {
  stimulus: string;
  type: TrialType;
  correctDirection: Direction;
  userResponse: Direction | null;
  isCorrect: boolean;
  reactionTime: number | null;
}

interface FlankerTaskProps {
  isFlowMode?: boolean;
  onFlowComplete?: (result: Omit<FlankerResult, 'id' | 'completed_at'>) => void;
}

export default function FlankerTask({ isFlowMode = false, onFlowComplete }: FlankerTaskProps) {
  const navigate = useNavigate();
  const [taskState, setTaskState] = useState<TaskState>('ready');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [stimulus, setStimulus] = useState('');
  const [correctDirection, setCorrectDirection] = useState<Direction>('left');
  const [trialType, setTrialType] = useState<TrialType>('congruent');
  const [trialResults, setTrialResults] = useState<TrialResult[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [stimulusStartTime, setStimulusStartTime] = useState(0);
  const [responded, setResponded] = useState(false);

  const stimulusTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const fixationTimeoutRef = useRef<number | null>(null);

  // 刺激パターンを生成
  const generateStimulus = (): { pattern: string; direction: Direction; type: TrialType } => {
    const isCongruent = Math.random() > 0.5;
    const direction: Direction = Math.random() > 0.5 ? 'left' : 'right';

    let pattern: string;
    if (isCongruent) {
      pattern = direction === 'left' ? '<<<<<' : '>>>>>';
    } else {
      pattern = direction === 'left' ? '>><>>' : '<<><<';
    }

    return {
      pattern,
      direction,
      type: isCongruent ? 'congruent' : 'incongruent'
    };
  };

  // 全てのタイマーをクリア
  const clearAllTimers = () => {
    if (stimulusTimeoutRef.current) {
      clearTimeout(stimulusTimeoutRef.current);
      stimulusTimeoutRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    if (fixationTimeoutRef.current) {
      clearTimeout(fixationTimeoutRef.current);
      fixationTimeoutRef.current = null;
    }
  };

  // タスク終了
  const finishTask = useCallback(() => {
    clearAllTimers();
    setTaskState('finished');
  }, []);

  // 試行開始の宣言（後で定義）
  const startTrial = useCallback(() => {
    const { pattern, direction, type } = generateStimulus();
    setStimulus(pattern);
    setCorrectDirection(direction);
    setTrialType(type);
    setTaskState('stimulus');
    setResponded(false);
    setStimulusStartTime(Date.now());

    // 既存の刺激タイマーをクリア
    if (stimulusTimeoutRef.current) {
      clearTimeout(stimulusTimeoutRef.current);
    }

    // 時間切れ処理
    stimulusTimeoutRef.current = window.setTimeout(() => {
      handleResponse(null);
    }, STIMULUS_TIME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 反応処理
  const handleResponse = useCallback((response: Direction | null) => {
    // 刺激表示中でない、または既に反応済みの場合は無視
    setResponded(prev => {
      if (prev) return prev; // 既に反応済み

      // 刺激タイマーをクリア
      if (stimulusTimeoutRef.current) {
        clearTimeout(stimulusTimeoutRef.current);
        stimulusTimeoutRef.current = null;
      }

      return true;
    });

    setTaskState(state => {
      if (state !== 'stimulus') return state; // 刺激表示中でない場合は無視

      // 反応時間と正誤判定
      const currentTime = Date.now();
      const reactionTime = response ? currentTime - stimulusStartTime : null;

      // 結果を記録（クロージャの問題を避けるため、setStateのコールバック形式を使用）
      setTrialResults(prev => {
        const result: TrialResult = {
          stimulus: stimulus,
          type: trialType,
          correctDirection,
          userResponse: response,
          isCorrect: response === correctDirection,
          reactionTime
        };
        return [...prev, result];
      });

      // フィードバック
      if (response === null) {
        setFeedbackMessage('反応なし');
      } else if (response === correctDirection) {
        setFeedbackMessage('正解！');
      } else {
        setFeedbackMessage('不正解');
      }

      // 既存のフィードバックタイマーをクリア
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }

      // 次の試行または終了
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setCurrentTrial(trial => {
          if (trial + 1 >= TOTAL_TRIALS) {
            finishTask();
            return trial;
          } else {
            setTaskState('fixation');

            // 既存の注視点タイマーをクリア
            if (fixationTimeoutRef.current) {
              clearTimeout(fixationTimeoutRef.current);
            }

            fixationTimeoutRef.current = window.setTimeout(() => {
              startTrial();
            }, FIXATION_TIME);

            return trial + 1;
          }
        });
      }, FEEDBACK_TIME);

      return 'feedback';
    });
  }, [correctDirection, trialType, stimulusStartTime, stimulus, startTrial, finishTask]);

  // タスク開始
  const startTask = () => {
    clearAllTimers();
    setTaskState('fixation');
    setCurrentTrial(0);
    setTrialResults([]);
    fixationTimeoutRef.current = window.setTimeout(() => {
      startTrial();
    }, FIXATION_TIME);
  };

  // 結果を保存
  const saveResult = async () => {
    const totalCorrect = trialResults.filter(r => r.isCorrect).length;
    const congruent = trialResults.filter(r => r.type === 'congruent');
    const incongruent = trialResults.filter(r => r.type === 'incongruent');
    const congruentCorrect = congruent.filter(r => r.isCorrect).length;
    const incongruentCorrect = incongruent.filter(r => r.isCorrect).length;

    const resultData = {
      total_correct: totalCorrect,
      congruent_correct: congruentCorrect,
      incongruent_correct: incongruentCorrect,
      total_trials: TOTAL_TRIALS,
      trial_details: trialResults.map(trial => ({
        stimulus: trial.stimulus,
        correct: trial.isCorrect,
        reaction_time_ms: trial.reactionTime || 0,
        congruent: trial.type === 'congruent'
      }))
    };

    if (isFlowMode && onFlowComplete) {
      // フローモード：結果を親コンポーネントに渡して次のタスクへ
      onFlowComplete(resultData);
    } else {
      // 通常モード：DBに保存
      try {
        await flankerApi.create(resultData);
        alert('結果を保存しました！');
        clearAllTimers();
        setTaskState('ready');
        setCurrentTrial(0);
        setTrialResults([]);
      } catch (error) {
        console.error('結果の保存に失敗しました:', error);
        alert('結果の保存に失敗しました');
      }
    }
  };

  // キーボードイベント
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (taskState === 'stimulus' && !responded) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          handleResponse('left');
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          handleResponse('right');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [taskState, responded, handleResponse]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  // 統計計算
  const getStats = () => {
    const totalCorrect = trialResults.filter(r => r.isCorrect).length;
    const congruent = trialResults.filter(r => r.type === 'congruent');
    const incongruent = trialResults.filter(r => r.type === 'incongruent');
    const congruentCorrect = congruent.filter(r => r.isCorrect).length;
    const incongruentCorrect = incongruent.filter(r => r.isCorrect).length;
    const accuracy = trialResults.length > 0 ? (totalCorrect / trialResults.length * 100).toFixed(1) : '0';

    return {
      totalCorrect,
      congruentTotal: congruent.length,
      congruentCorrect,
      incongruentTotal: incongruent.length,
      incongruentCorrect,
      accuracy
    };
  };

  const stats = getStats();

  return (
    <div className="flanker-container">
      {taskState === 'ready' && (
        <div className="ready-screen">
          {!isFlowMode && (
            <button onClick={() => { clearAllTimers(); navigate('/'); }} className="back-button">
              ← ダッシュボードに戻る
            </button>
          )}
          <h1>Flanker タスク</h1>
          <p>画面中央に表示される5つの矢印のうち、<strong>中央の矢印</strong>の向きを答えてください。</p>
          <div className="instructions">
            <p>← キー: 左向き矢印</p>
            <p>→ キー: 右向き矢印</p>
          </div>
          <p>試行回数: {TOTAL_TRIALS}回（所要時間: 約2分）</p>
          <button onClick={startTask} className="start-button">
            開始
          </button>
        </div>
      )}

      {taskState === 'fixation' && (
        <div className="task-screen">
          <div className="progress">
            試行 {currentTrial + 1} / {TOTAL_TRIALS}
          </div>
          <div className="fixation-cross">+</div>
        </div>
      )}

      {taskState === 'stimulus' && (
        <div className="task-screen">
          <div className="progress">
            試行 {currentTrial + 1} / {TOTAL_TRIALS}
          </div>
          <div className="stimulus-display">{stimulus}</div>
          <div className="instructions-hint">
            ← または → キーを押してください
          </div>
        </div>
      )}

      {(taskState === 'fixation' || taskState === 'stimulus' || taskState === 'feedback') && (
        <div className="response-buttons-fixed">
          <button 
            onClick={() => taskState === 'stimulus' && !responded && handleResponse('left')} 
            className="response-button left-button"
            disabled={taskState !== 'stimulus' || responded}
          >
            &lt;
          </button>
          <button 
            onClick={() => taskState === 'stimulus' && !responded && handleResponse('right')} 
            className="response-button right-button"
            disabled={taskState !== 'stimulus' || responded}
          >
            &gt;
          </button>
        </div>
      )}

      {taskState === 'feedback' && (
        <div className="task-screen">
          <div className="progress">
            試行 {currentTrial + 1} / {TOTAL_TRIALS}
          </div>
          <div className={`feedback ${feedbackMessage === '正解！' ? 'correct' : 'incorrect'}`}>
            {feedbackMessage}
          </div>
        </div>
      )}

      {taskState === 'finished' && (
        <div className="result-screen">
          <h2>結果</h2>
          <div className="result-details">
            <p>総試行数: {TOTAL_TRIALS}回</p>
            <p>正解数: {stats.totalCorrect}回</p>
            <p>正答率: {stats.accuracy}%</p>
            <div className="result-breakdown">
              <h3>詳細</h3>
              <p>一致試行: {stats.congruentCorrect} / {stats.congruentTotal}回正解</p>
              <p>不一致試行: {stats.incongruentCorrect} / {stats.incongruentTotal}回正解</p>
            </div>
          </div>
          <div className="result-actions">
            <button onClick={saveResult} className="save-button">
              {isFlowMode ? '次のタスクへ' : '結果を保存'}
            </button>
            {!isFlowMode && (
              <>
                <button onClick={() => { clearAllTimers(); setTaskState('ready'); setCurrentTrial(0); setTrialResults([]); }} className="retry-button">
                  もう一度
                </button>
                <button onClick={() => { clearAllTimers(); navigate('/'); }} className="back-to-dashboard-button">
                  ダッシュボードに戻る
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

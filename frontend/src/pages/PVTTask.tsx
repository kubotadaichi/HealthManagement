import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pvtApi } from '../services/api';
import type { PVTResult } from '../types/tasks';
import './PVTTask.css';

const TASK_DURATION = 3 * 60 * 1000; // 3分（ミリ秒）
const MISS_THRESHOLD = 355; // 見逃し判定の閾値（ミリ秒）
const MIN_WAIT_TIME = 2000; // 最小待機時間（ミリ秒）
const MAX_WAIT_TIME = 10000; // 最大待機時間（ミリ秒）

type TaskState = 'ready' | 'waiting' | 'stimulus' | 'feedback' | 'finished';

interface PVTTaskProps {
  isFlowMode?: boolean;
  onFlowComplete?: (result: Omit<PVTResult, 'id' | 'completed_at'>) => void;
}

export default function PVTTask({ isFlowMode = false, onFlowComplete }: PVTTaskProps) {
  const navigate = useNavigate();
  const [taskState, setTaskState] = useState<TaskState>('ready');
  const [counter, setCounter] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [allReactionTimes, setAllReactionTimes] = useState<number[]>([]);
  const [missCount, setMissCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMissed, setIsMissed] = useState(false);

  const taskStartTimeRef = useRef<number>(0);
  const stimulusStartTimeRef = useRef<number>(0);
  const counterIntervalRef = useRef<number | null>(null);
  const waitTimeoutRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);

  // タスク開始
  const startTask = () => {
    setTaskState('waiting');
    setAllReactionTimes([]);
    setMissCount(0);
    setElapsedTime(0);
    taskStartTimeRef.current = Date.now();

    // 経過時間の表示
    elapsedTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - taskStartTimeRef.current;
      setElapsedTime(elapsed);

      // 3分経過したら終了
      if (elapsed >= TASK_DURATION) {
        finishTask();
      }
    }, 100);

    scheduleNextStimulus();
  };

  // 次の刺激をスケジュール
  const scheduleNextStimulus = () => {
    const waitTime = Math.random() * (MAX_WAIT_TIME - MIN_WAIT_TIME) + MIN_WAIT_TIME;

    waitTimeoutRef.current = window.setTimeout(() => {
      showStimulus();
    }, waitTime);
  };

  // 刺激表示
  const showStimulus = () => {
    setTaskState('stimulus');
    setCounter(0);
    setIsMissed(false);
    stimulusStartTimeRef.current = Date.now();

    // カウンター開始
    counterIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - stimulusStartTimeRef.current;
      setCounter(elapsed);

      // 355ms超えたら見逃しフラグを立てる（自動で次に進まない）
      if (elapsed > MISS_THRESHOLD && !isMissed) {
        setIsMissed(true);
      }
    }, 1);
  };

  // ボタン押下時の処理
  const handlePush = useCallback(() => {
    if (taskState !== 'stimulus') return;

    const rt = Date.now() - stimulusStartTimeRef.current;

    // カウンター停止
    if (counterIntervalRef.current) {
      clearInterval(counterIntervalRef.current);
      counterIntervalRef.current = null;
    }

    // 見逃し判定
    if (isMissed || rt > MISS_THRESHOLD) {
      // 見逃しとしてカウント
      setMissCount(prev => prev + 1);
      setReactionTime(rt);
      setTaskState('feedback');
    } else {
      // 正常な反応時間として記録
      setReactionTime(rt);
      setAllReactionTimes(prev => [...prev, rt]);
      setTaskState('feedback');
    }

    // 1秒後に次の試行
    setTimeout(() => {
      if (Date.now() - taskStartTimeRef.current < TASK_DURATION) {
        setTaskState('waiting');
        scheduleNextStimulus();
      } else {
        finishTask();
      }
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskState, isMissed]);

  // タスク終了
  const finishTask = () => {
    // 全てのタイマーをクリア
    if (counterIntervalRef.current) {
      clearInterval(counterIntervalRef.current);
    }
    if (waitTimeoutRef.current) {
      clearTimeout(waitTimeoutRef.current);
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
    }

    setTaskState('finished');
  };

  // 結果を保存
  const saveResult = async () => {
    const averageRT = allReactionTimes.length > 0
      ? allReactionTimes.reduce((a, b) => a + b, 0) / allReactionTimes.length
      : 0;

    const resultData = {
      miss_count: missCount,
      average_reaction_time: averageRT,
      all_reaction_times: allReactionTimes,
    };

    if (isFlowMode && onFlowComplete) {
      // フローモード：結果を親コンポーネントに渡して次のタスクへ
      onFlowComplete(resultData);
    } else {
      // 通常モード：DBに保存
      try {
        await pvtApi.create(resultData);
        alert('結果を保存しました！');
        setTaskState('ready');
      } catch (error) {
        console.error('結果の保存に失敗しました:', error);
        alert('結果の保存に失敗しました');
      }
    }
  };

  // スペースキーのイベントリスナー
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // スペースキーが押された場合
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault(); // ページスクロールを防ぐ
        if (taskState === 'stimulus') {
          handlePush();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [taskState, handlePush]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (counterIntervalRef.current) clearInterval(counterIntervalRef.current);
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

  return (
    <div className="pvt-container">
      {taskState === 'ready' && (
        <div className="ready-screen">
          {!isFlowMode && (
            <button onClick={() => navigate('/')} className="back-button">
              ← ダッシュボードに戻る
            </button>
          )}
          <h1>PVT 覚醒度検査</h1>
          <p>画面中央の枠内に数字が表示されたら、できるだけ早くPUSHボタンを押してください。</p>
          <p>所要時間: 3分</p>
          <button onClick={startTask} className="start-button">
            開始
          </button>
        </div>
      )}

      {(taskState === 'waiting' || taskState === 'stimulus' || taskState === 'feedback') && (
        <div className="task-screen">
          <div className="timer">
            経過時間: {Math.floor(elapsedTime / 1000)}秒 / 180秒
          </div>

          <div className="stimulus-box">
            {taskState === 'stimulus' && (
              <div className="counter">{counter}</div>
            )}
            {taskState === 'feedback' && (
              <div className="feedback">反応時間: {reactionTime}ms</div>
            )}
          </div>

          <button onClick={handlePush} className="push-button">
            PUSH
          </button>

          <div className="stats">
            <p>試行回数: {allReactionTimes.length}</p>
            <p>見逃し: {missCount}回</p>
          </div>
        </div>
      )}

      {taskState === 'finished' && (
        <div className="result-screen">
          <h2>結果</h2>
          <div className="result-details">
            <p>試行回数: {allReactionTimes.length}回</p>
            <p>見逃し回数: {missCount}回</p>
            <p>
              平均反応時間:{' '}
              {allReactionTimes.length > 0
                ? (allReactionTimes.reduce((a, b) => a + b, 0) / allReactionTimes.length).toFixed(2)
                : 0}
              ms
            </p>
          </div>
          <div className="result-actions">
            <button onClick={saveResult} className="save-button">
              {isFlowMode ? '次のタスクへ' : '結果を保存'}
            </button>
            {!isFlowMode && (
              <>
                <button onClick={() => setTaskState('ready')} className="retry-button">
                  もう一度
                </button>
                <button onClick={() => navigate('/')} className="back-to-dashboard-button">
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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vasApi } from '../services/api';
import type { VASResult } from '../types/tasks';
import './VASTask.css';

interface VASTaskProps {
  isFlowMode?: boolean;
  onFlowComplete?: (result: Omit<VASResult, 'id' | 'completed_at'>) => void;
  isSaving?: boolean;
}

export default function VASTask({ isFlowMode = false, onFlowComplete, isSaving = false }: VASTaskProps) {
  const navigate = useNavigate();
  const [sleepinessScore, setSleepinessScore] = useState(50);
  const [fatigueScore, setFatigueScore] = useState(50);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const getSleepinessLevel = (score: number) => {
    if (score < 20) return { level: 'とても目が覚めている', color: '#4CAF50' };
    if (score < 40) return { level: 'やや目が覚めている', color: '#8BC34A' };
    if (score < 60) return { level: '普通', color: '#FFC107' };
    if (score < 80) return { level: 'やや眠い', color: '#FF9800' };
    return { level: 'とても眠い', color: '#f44336' };
  };

  const getFatigueLevel = (score: number) => {
    if (score < 20) return { level: 'とても元気', color: '#4CAF50' };
    if (score < 40) return { level: 'やや元気', color: '#8BC34A' };
    if (score < 60) return { level: '普通', color: '#FFC107' };
    if (score < 80) return { level: 'やや疲れている', color: '#FF9800' };
    return { level: 'とても疲れている', color: '#f44336' };
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const saveResult = async () => {
    const resultData = {
      sleepiness_score: sleepinessScore,
      fatigue_score: fatigueScore
    };

    if (isFlowMode && onFlowComplete) {
      // フローモード：結果を親コンポーネントに渡して次のタスクへ
      onFlowComplete(resultData);
    } else {
      // 通常モード：DBに保存
      try {
        await vasApi.create(resultData);
        alert('結果を保存しました！');
        resetTask();
      } catch (error) {
        console.error('結果の保存に失敗しました:', error);
        alert('結果の保存に失敗しました');
      }
    }
  };

  const resetTask = () => {
    setSleepinessScore(50);
    setFatigueScore(50);
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    const sleepiness = getSleepinessLevel(sleepinessScore);
    const fatigue = getFatigueLevel(fatigueScore);

    return (
      <div className="vas-container">
        <div className="result-screen">
          <h2>結果</h2>
          <div className="result-details">
            <div className="score-card">
              <h3>眠気</h3>
              <div className="score-display">
                <div className="score-value" style={{ color: sleepiness.color }}>
                  {sleepinessScore}
                </div>
                <div className="score-label" style={{ color: sleepiness.color }}>
                  {sleepiness.level}
                </div>
              </div>
              <div className="score-bar-container">
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{
                      width: `${sleepinessScore}%`,
                      backgroundColor: sleepiness.color
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="score-card">
              <h3>疲労</h3>
              <div className="score-display">
                <div className="score-value" style={{ color: fatigue.color }}>
                  {fatigueScore}
                </div>
                <div className="score-label" style={{ color: fatigue.color }}>
                  {fatigue.level}
                </div>
              </div>
              <div className="score-bar-container">
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{
                      width: `${fatigueScore}%`,
                      backgroundColor: fatigue.color
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button onClick={saveResult} className="save-button" disabled={isSaving}>
              {isSaving ? '保存中...' : isFlowMode ? '全てのタスクを保存' : '結果を保存'}
            </button>
            {!isFlowMode && (
              <>
                <button onClick={resetTask} className="retry-button">
                  もう一度
                </button>
                <button onClick={() => navigate('/')} className="back-to-dashboard-button">
                  ダッシュボードに戻る
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentSleepiness = getSleepinessLevel(sleepinessScore);
  const currentFatigue = getFatigueLevel(fatigueScore);

  return (
    <div className="vas-container">
      <div className="assessment-screen">
        {!isFlowMode && (
          <button onClick={() => navigate('/')} className="back-button">
            ← ダッシュボードに戻る
          </button>
        )}

        <div className="header">
          <h1>VAS - 主観調査</h1>
          <p>現在の眠気と疲労の程度をスライダーで評価してください</p>
        </div>

        <div className="sliders-container">
          <div className="slider-block">
            <div className="slider-header">
              <h3>眠気</h3>
              <div className="current-value" style={{ color: currentSleepiness.color }}>
                {sleepinessScore}
              </div>
            </div>
            <div className="slider-labels">
              <span>全く眠くない</span>
              <span>非常に眠い</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sleepinessScore}
              onChange={(e) => setSleepinessScore(Number(e.target.value))}
              className="slider"
              style={{
                background: `linear-gradient(to right, #4CAF50 0%, #FFC107 50%, #f44336 100%)`
              }}
            />
            <div className="level-indicator" style={{ color: currentSleepiness.color }}>
              {currentSleepiness.level}
            </div>
          </div>

          <div className="slider-block">
            <div className="slider-header">
              <h3>疲労</h3>
              <div className="current-value" style={{ color: currentFatigue.color }}>
                {fatigueScore}
              </div>
            </div>
            <div className="slider-labels">
              <span>全く疲れていない</span>
              <span>非常に疲れている</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={fatigueScore}
              onChange={(e) => setFatigueScore(Number(e.target.value))}
              className="slider"
              style={{
                background: `linear-gradient(to right, #4CAF50 0%, #FFC107 50%, #f44336 100%)`
              }}
            />
            <div className="level-indicator" style={{ color: currentFatigue.color }}>
              {currentFatigue.level}
            </div>
          </div>
        </div>

        <div className="submit-section">
          <button onClick={handleSubmit} className="submit-button">
            評価を完了
          </button>
        </div>
      </div>
    </div>
  );
}

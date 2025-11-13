import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { efsiApi } from '../services/api';
import type { EFSIResult } from '../types/tasks';
import './EFSITask.css';

const QUESTIONS = [
  '1. 頭がすっきりしない',
  '2. 目が疲れる',
  '3. 頭が痛い',
  '4. めまいがする',
  '5. 立ちくらみがする',
  '6. 足がだるい',
  '7. 全身がだるい',
  '8. 手や足がふるえる',
  '9. ねむい',
  '10. 気分が悪い',
  '11. 息切れがする',
  '12. 動捨がする',
  '13. やる気がでない',
  '14. 口が渇く',
  '15. 声がかれる',
  '16. 食欲がない',
  '17. 気持ちが沈む',
  '18. いらいらする',
  '19. 不安な感じがする',
  '20. 根気がなくなる',
  '21. 物事に集中できない',
  '22. 考えがまとまらない',
  '23. 話をするのがいやになる',
  '24. ちょっとしたことが思い出せない',
  '25. することに間違いが多い',
  '26. 仕事中、ぼんやりしてしまう'
];

const SCALE_LABELS = [
  'まったくない',
  'ときどきある',
  'しばしばある',
  'いつもある'
];

interface EFSITaskProps {
  isFlowMode?: boolean;
  onFlowComplete?: (result: Omit<EFSIResult, 'id' | 'completed_at'>) => void;
}

export default function EFSITask({ isFlowMode = false, onFlowComplete }: EFSITaskProps) {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<number[]>(new Array(26).fill(-1));
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAnswerChange = (questionIndex: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  const isAllAnswered = () => {
    return answers.every(answer => answer >= 1 && answer <= 4);
  };

  const getTotalScore = () => {
    return answers.reduce((sum, answer) => sum + (answer >= 1 ? answer : 0), 0);
  };

  const getRiskLevel = (score: number) => {
    if (score <= 20) return { level: '低リスク', color: '#4CAF50', message: '過労の兆候は少ないです' };
    if (score <= 40) return { level: '中リスク', color: '#FF9800', message: '注意が必要です。休息を心がけてください' };
    return { level: '高リスク', color: '#f44336', message: '過労の可能性があります。休息と相談をお勧めします' };
  };

  const handleSubmit = () => {
    if (!isAllAnswered()) {
      alert('全ての質問に回答してください');
      return;
    }
    setIsSubmitted(true);
  };

  const saveResult = async () => {
    const totalScore = getTotalScore();

    const resultData = {
      total_score: totalScore,
      answers: answers
    };

    if (isFlowMode && onFlowComplete) {
      // フローモード：結果を親コンポーネントに渡して次のタスクへ
      onFlowComplete(resultData);
    } else {
      // 通常モード：DBに保存
      try {
        await efsiApi.create(resultData);
        alert('結果を保存しました！');
        resetTask();
      } catch (error) {
        console.error('結果の保存に失敗しました:', error);
        alert('結果の保存に失敗しました');
      }
    }
  };

  const resetTask = () => {
    setAnswers(new Array(26).fill(-1));
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    const totalScore = getTotalScore();
    const risk = getRiskLevel(totalScore);

    return (
      <div className="efsi-container">
        <div className="result-screen">
          <h2>結果</h2>
          <div className="result-details">
            <div className="total-score">
              <p>総合得点</p>
              <div className="score-value" style={{ color: risk.color }}>
                {totalScore} / 78
              </div>
            </div>
            <div className="risk-assessment" style={{ borderColor: risk.color }}>
              <h3 style={{ color: risk.color }}>{risk.level}</h3>
              <p>{risk.message}</p>
            </div>
            <div className="score-breakdown">
              <h4>得点分布</h4>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{
                    width: `${(totalScore / 78) * 100}%`,
                    backgroundColor: risk.color
                  }}
                />
              </div>
              <div className="score-legend">
                <span>0</span>
                <span>20</span>
                <span>40</span>
                <span>60</span>
                <span>78</span>
              </div>
            </div>
          </div>
          <div className="result-actions">
            <button onClick={saveResult} className="save-button">
              {isFlowMode ? '次のタスクへ' : '結果を保存'}
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

  return (
    <div className="efsi-container">
      <div className="questionnaire-screen">
        <button onClick={() => navigate('/')} className="back-button">
          ← ダッシュボードに戻る
        </button>

        <div className="header">
          <h1>EFSI - 過労徴候しらべ</h1>
          <p>ここ数日の状態について、最も当てはまるものを選んでください</p>
          <div className="progress-indicator">
            回答済み: {answers.filter(a => a >= 0).length} / {QUESTIONS.length}
          </div>
        </div>

        <div className="questions-container">
          {QUESTIONS.map((question, index) => (
            <div key={index} className="question-block">
              <p className="question-text">{question}</p>
              <div className="scale-options">
                {SCALE_LABELS.map((label, scaleIndex) => {
                  const value = scaleIndex + 1; // 1-4点に変換
                  return (
                    <label key={scaleIndex} className="scale-option">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={value}
                        checked={answers[index] === value}
                        onChange={() => handleAnswerChange(index, value)}
                      />
                      <span className="option-label">
                        <span className="option-value">{value}</span>
                        <span className="option-text">{label}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="submit-section">
          <button
            onClick={handleSubmit}
            className="submit-button"
            disabled={!isAllAnswered()}
          >
            {isAllAnswered() ? '結果を見る' : `残り ${26 - answers.filter(a => a >= 0).length} 問`}
          </button>
        </div>
      </div>
    </div>
  );
}

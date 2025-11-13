import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { allTasksApi } from '../services/api';
import type { PVTResult, FlankerResult, EFSIResult, VASResult } from '../types/tasks';
import './AllTasksFlow.css';

type TaskStep = 'intro' | 'pvt' | 'flanker' | 'efsi' | 'vas' | 'complete';

// PVTタスクのロジックをインポート
import PVTTask from './PVTTask';
import FlankerTask from './FlankerTask';
import EFSITask from './EFSITask';
import VASTask from './VASTask';

export default function AllTasksFlow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<TaskStep>('intro');
  const [isSaving, setIsSaving] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // 各タスクの結果を保持
  const resultsRef = useRef<{
    pvt?: Omit<PVTResult, 'id' | 'completed_at'>;
    flanker?: Omit<FlankerResult, 'id' | 'completed_at'>;
    efsi?: Omit<EFSIResult, 'id' | 'completed_at'>;
    vas?: Omit<VASResult, 'id' | 'completed_at'>;
  }>({});

  const handlePVTComplete = (result: Omit<PVTResult, 'id' | 'completed_at'>) => {
    resultsRef.current.pvt = result;
    setCurrentStep('flanker');
  };

  const skipPVT = () => {
    resultsRef.current.pvt = {
      miss_count: 0,
      average_reaction_time: 250,
      all_reaction_times: [230, 240, 250, 260, 270]
    };
    setCurrentStep('flanker');
  };

  const handleFlankerComplete = (result: Omit<FlankerResult, 'id' | 'completed_at'>) => {
    resultsRef.current.flanker = result;
    setCurrentStep('efsi');
  };

  const skipFlanker = () => {
    resultsRef.current.flanker = {
      total_correct: 85,
      congruent_correct: 45,
      incongruent_correct: 40,
      total_trials: 100,
      trial_details: []
    };
    setCurrentStep('efsi');
  };

  const handleEFSIComplete = (result: Omit<EFSIResult, 'id' | 'completed_at'>) => {
    resultsRef.current.efsi = result;
    setCurrentStep('vas');
  };

  const skipEFSI = () => {
    resultsRef.current.efsi = {
      total_score: 52,
      answers: Array(26).fill(0).map(() => Math.floor(Math.random() * 4) + 1)
    };
    setCurrentStep('vas');
  };

  const handleVASComplete = async (result: Omit<VASResult, 'id' | 'completed_at'>) => {
    resultsRef.current.vas = result;
    await saveAllResults();
  };

  const skipVAS = async () => {
    resultsRef.current.vas = {
      sleepiness_score: 50,
      fatigue_score: 60
    };
    await saveAllResults();
  };

  const saveAllResults = async () => {
    if (!resultsRef.current.pvt || !resultsRef.current.flanker || 
        !resultsRef.current.efsi || !resultsRef.current.vas) {
      alert('すべてのタスク結果が揃っていません');
      console.error('結果が揃っていません:', resultsRef.current);
      return;
    }

    setIsSaving(true);
    try {
      const dataToSend = {
        pvt: resultsRef.current.pvt,
        flanker: resultsRef.current.flanker,
        efsi: resultsRef.current.efsi,
        vas: resultsRef.current.vas,
      };
      
      console.log('送信データ:', dataToSend);
      const response = await allTasksApi.create(dataToSend);

      console.log('保存成功:', response);
      setCurrentStep('complete');
    } catch (error) {
      console.error('結果の保存に失敗しました:', error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      console.error('エラー詳細:', err.response?.data);
      alert(`結果の保存に失敗しました: ${err.response?.data?.detail || err.message || '不明なエラー'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveToNotion = async () => {
    if (!resultsRef.current.pvt || !resultsRef.current.flanker || 
        !resultsRef.current.efsi || !resultsRef.current.vas) {
      alert('すべてのタスク結果が揃っていません');
      return;
    }

    try {
      const dataToSend = {
        pvt: resultsRef.current.pvt,
        flanker: resultsRef.current.flanker,
        efsi: resultsRef.current.efsi,
        vas: resultsRef.current.vas,
      };

      console.log('Notionに送信中...');
      const response = await allTasksApi.saveToNotion(dataToSend);
      
      console.log('Notion保存成功:', response);
      alert(`Notionに保存しました！\n\nページURL: ${response.notion_url}`);
      
      // Notionページを新しいタブで開く
      if (response.notion_url) {
        window.open(response.notion_url, '_blank');
      }
    } catch (error) {
      console.error('Notionへの保存に失敗しました:', error);
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      alert(`Notionへの保存に失敗しました: ${err.response?.data?.detail || err.message || '不明なエラー'}`);
    }
  };

  const startAllTasks = () => {
    setCurrentStep('pvt');
  };

  const goToDashboard = () => {
    navigate('/');
  };

  if (currentStep === 'intro') {
    return (
      <div className="all-tasks-container">
        <div className="intro-screen">
          <div className="debug-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={debugMode} 
                onChange={(e) => setDebugMode(e.target.checked)}
              />
              <span>デバッグモード（スキップボタン表示）</span>
            </label>
          </div>
          <h1>全タスク実行</h1>
          <p className="description">
            これから4つのタスクを順番に実行します。<br />
            各タスクが完了すると自動的に次のタスクに進みます。<br />
            すべてのタスクが完了すると、結果が自動的に保存されます。
          </p>
          
          <div className="task-list">
            <h2>実施内容</h2>
            <ol>
              <li>
                <strong>PVT（覚醒度検査）</strong>
                <p>持続的な注意力を測定します（所要時間：3分）</p>
              </li>
              <li>
                <strong>Flanker Task（実行機能検査）</strong>
                <p>注意の選択性と抑制機能を測定します（所要時間：2分）</p>
              </li>
              <li>
                <strong>EFSI（過労徴候しらべ）</strong>
                <p>26問の質問で過労リスクを評価します</p>
              </li>
              <li>
                <strong>VAS（主観調査）</strong>
                <p>眠気と疲労の程度を評価します</p>
              </li>
            </ol>
          </div>

          <div className="button-group">
            <button className="btn-secondary" onClick={goToDashboard}>
              🏠 ホームに戻る
            </button>
            <button className="btn-primary" onClick={startAllTasks}>
              全タスクを開始 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'pvt') {
    return (
      <PVTTaskWrapper onComplete={handlePVTComplete} onSkip={skipPVT} showSkip={debugMode} />
    );
  }

  if (currentStep === 'flanker') {
    return (
      <FlankerTaskWrapper onComplete={handleFlankerComplete} onSkip={skipFlanker} showSkip={debugMode} />
    );
  }

  if (currentStep === 'efsi') {
    return (
      <EFSITaskWrapper onComplete={handleEFSIComplete} onSkip={skipEFSI} showSkip={debugMode} />
    );
  }

  if (currentStep === 'vas') {
    return (
      <VASTaskWrapper onComplete={handleVASComplete} onSkip={skipVAS} showSkip={debugMode} isSaving={isSaving} />
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="all-tasks-container">
        <div className="complete-screen">
          <div className="success-icon">✓</div>
          <h1>すべてのタスクが完了しました！</h1>
          <p className="completion-message">
            お疲れ様でした。<br />
            すべてのタスク結果が正常に保存されました。
          </p>
          
          <div className="results-summary">
            <h2>実施したタスク</h2>
            <ul>
              <li>✓ PVT（覚醒度検査）</li>
              <li>✓ Flanker Task（実行機能検査）</li>
              <li>✓ EFSI（過労徴候しらべ）</li>
              <li>✓ VAS（主観調査）</li>
            </ul>
          </div>

          <div className="completion-actions">
            <button className="btn-secondary" onClick={goToDashboard}>
              🏠 ホームに戻る
            </button>
            <button 
              className="btn-notion" 
              onClick={saveToNotion}
              title="結果をNotionに送信"
            >
              📝 Notionに保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// 各タスクをラップするコンポーネント
function PVTTaskWrapper({ onComplete, onSkip, showSkip }: { 
  onComplete: (result: Omit<PVTResult, 'id' | 'completed_at'>) => void;
  onSkip: () => void;
  showSkip: boolean;
}) {
  return (
    <div className="task-wrapper">
      <div className="task-progress">
        タスク 1/4: PVT（覚醒度検査）
        {showSkip && (
          <button className="skip-button" onClick={onSkip}>
            ⏭ スキップ（デバッグ）
          </button>
        )}
      </div>
      <PVTTask isFlowMode onFlowComplete={onComplete} />
    </div>
  );
}

function FlankerTaskWrapper({ onComplete, onSkip, showSkip }: { 
  onComplete: (result: Omit<FlankerResult, 'id' | 'completed_at'>) => void;
  onSkip: () => void;
  showSkip: boolean;
}) {
  return (
    <div className="task-wrapper">
      <div className="task-progress">
        タスク 2/4: Flanker Task（実行機能検査）
        {showSkip && (
          <button className="skip-button" onClick={onSkip}>
            ⏭ スキップ（デバッグ）
          </button>
        )}
      </div>
      <FlankerTask isFlowMode onFlowComplete={onComplete} />
    </div>
  );
}

function EFSITaskWrapper({ onComplete, onSkip, showSkip }: { 
  onComplete: (result: Omit<EFSIResult, 'id' | 'completed_at'>) => void;
  onSkip: () => void;
  showSkip: boolean;
}) {
  return (
    <div className="task-wrapper">
      <div className="task-progress">
        タスク 3/4: EFSI（過労徴候しらべ）
        {showSkip && (
          <button className="skip-button" onClick={onSkip}>
            ⏭ スキップ（デバッグ）
          </button>
        )}
      </div>
      <EFSITask isFlowMode onFlowComplete={onComplete} />
    </div>
  );
}

function VASTaskWrapper({ onComplete, onSkip, showSkip, isSaving }: { 
  onComplete: (result: Omit<VASResult, 'id' | 'completed_at'>) => void;
  onSkip: () => void;
  showSkip: boolean;
  isSaving: boolean;
}) {
  return (
    <div className="task-wrapper">
      <div className="task-progress">
        タスク 4/4: VAS（主観調査）
        {showSkip && (
          <button className="skip-button" onClick={onSkip}>
            ⏭ スキップ（デバッグ）
          </button>
        )}
      </div>
      <VASTask isFlowMode onFlowComplete={onComplete} isSaving={isSaving} />
    </div>
  );
}

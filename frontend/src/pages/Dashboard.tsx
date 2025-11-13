import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { pvtApi, flankerApi, efsiApi, vasApi } from '../services/api';
import type { PVTResult, FlankerResult, EFSIResult, VASResult } from '../types/tasks';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

export default function Dashboard() {
  const [pvtResults, setPvtResults] = useState<PVTResult[]>([]);
  const [flankerResults, setFlankerResults] = useState<FlankerResult[]>([]);
  const [efsiResults, setEfsiResults] = useState<EFSIResult[]>([]);
  const [vasResults, setVasResults] = useState<VASResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllResults = async () => {
      try {
        const [pvt, flanker, efsi, vas] = await Promise.all([
          pvtApi.getAll(),
          flankerApi.getAll(),
          efsiApi.getAll(),
          vasApi.getAll(),
        ]);
        setPvtResults(pvt);
        setFlankerResults(flanker);
        setEfsiResults(efsi);
        setVasResults(vas);
      } catch (error) {
        console.error('結果の取得に失敗しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllResults();
  }, []);

  const tasks = [
    {
      id: 'pvt',
      title: 'PVT',
      subtitle: '覚醒度検査',
      description: '持続的な注意力を測定します（所要時間：3分）',
      path: '/tasks/pvt',
      color: '#4CAF50',
    },
    {
      id: 'flanker',
      title: 'Flanker',
      subtitle: '実行機能検査',
      description: '注意の選択性と抑制機能を測定します（所要時間：2分）',
      path: '/tasks/flanker',
      color: '#2196F3',
    },
    {
      id: 'efsi',
      title: 'EFSI',
      subtitle: '過労徴候しらべ',
      description: '26問の質問で過労リスクを評価します',
      path: '/tasks/efsi',
      color: '#FF9800',
    },
    {
      id: 'vas',
      title: 'VAS',
      subtitle: '主観調査',
      description: '眠気と疲労の程度を評価します',
      path: '/tasks/vas',
      color: '#9C27B0',
    },
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // グラフ用のデータを準備
  const preparePVTChartData = () => {
    return pvtResults.slice().reverse().map((result, index) => ({
      name: `${index + 1}回目`,
      date: formatDate(result.completed_at),
      平均反応時間: Math.round(result.average_reaction_time),
      見逃し回数: result.miss_count,
    }));
  };

  const prepareFlankerChartData = () => {
    return flankerResults.slice().reverse().map((result, index) => ({
      name: `${index + 1}回目`,
      date: formatDate(result.completed_at),
      正答率: Number(((result.total_correct / result.total_trials) * 100).toFixed(1)),
    }));
  };

  const prepareEFSIChartData = () => {
    return efsiResults.slice().reverse().map((result, index) => ({
      name: `${index + 1}回目`,
      date: formatDate(result.completed_at),
      過労スコア: result.total_score,
    }));
  };

  const prepareVASChartData = () => {
    return vasResults.slice().reverse().map((result, index) => ({
      name: `${index + 1}回目`,
      date: formatDate(result.completed_at),
      眠気: result.sleepiness_score,
      疲労: result.fatigue_score,
    }));
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>疲労チェッカー</h1>
        <p>体調管理のための4つのタスク</p>
        <Link to="/tasks/all" className="all-tasks-button">
          🎯 全てのタスクを実行
        </Link>
      </header>

      <div className="task-grid">{tasks.map((task) => (
          <Link
            key={task.id}
            to={task.path}
            className="task-card"
            style={{ borderColor: task.color }}
          >
            <div className="task-card-header" style={{ backgroundColor: task.color }}>
              <h2>{task.title}</h2>
              <p className="task-subtitle">{task.subtitle}</p>
            </div>
            <div className="task-card-body">
              <p className="task-description">{task.description}</p>
              <button className="task-button" style={{ backgroundColor: task.color }}>
                開始する →
              </button>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && (pvtResults.length > 0 || flankerResults.length > 0 || efsiResults.length > 0 || vasResults.length > 0) && (
        <div className="statistics-section">
          <h2>統計情報</h2>

          {pvtResults.length > 0 && (
            <div className="chart-card">
              <div className="chart-header" style={{ backgroundColor: '#4CAF50' }}>
                <h3>PVT - 覚醒度検査</h3>
                <span className="chart-count">{pvtResults.length}回実施</span>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={preparePVTChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" label={{ value: '平均反応時間 (ms)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: '見逃し回数', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="平均反応時間" stroke="#4CAF50" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="見逃し回数" stroke="#f44336" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {flankerResults.length > 0 && (
            <div className="chart-card">
              <div className="chart-header" style={{ backgroundColor: '#2196F3' }}>
                <h3>Flanker - 実行機能検査</h3>
                <span className="chart-count">{flankerResults.length}回実施</span>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareFlankerChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} label={{ value: '正答率 (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="正答率" stroke="#2196F3" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {efsiResults.length > 0 && (
            <div className="chart-card">
              <div className="chart-header" style={{ backgroundColor: '#FF9800' }}>
                <h3>EFSI - 過労徴候しらべ</h3>
                <span className="chart-count">{efsiResults.length}回実施</span>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareEFSIChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 78]} label={{ value: '過労スコア', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="過労スコア" stroke="#FF9800" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {vasResults.length > 0 && (
            <div className="chart-card">
              <div className="chart-header" style={{ backgroundColor: '#9C27B0' }}>
                <h3>VAS - 主観調査</h3>
                <span className="chart-count">{vasResults.length}回実施</span>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareVASChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} label={{ value: 'スコア', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="眠気" stroke="#9C27B0" strokeWidth={2} />
                    <Line type="monotone" dataKey="疲労" stroke="#E91E63" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="dashboard-footer">
        <p>各タスクの結果は自動的に保存されます</p>
      </div>
    </div>
  );
}

import os
import httpx
from datetime import datetime
from typing import Dict, Any


class NotionService:
    """Notion APIとの連携を管理するサービス"""

    def __init__(self):
        self.api_key = os.getenv("NOTION_API_KEY")
        self.database_id = os.getenv("NOTION_DATABASE_ID")
        self.base_url = "https://api.notion.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        }

    async def create_page(self, task_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Notionデータベースに新しいページを作成
        
        Args:
            task_results: 全タスク結果を含む辞書
                - pvt: PVT結果
                - flanker: Flanker結果
                - efsi: EFSI結果
                - vas: VAS結果
        
        Returns:
            作成されたページのレスポンス
        """
        if not self.api_key or not self.database_id:
            raise ValueError("Notion API key or Database ID is not configured")

        # タイトルを生成（実行日時）
        now = datetime.now()
        title = now.strftime("%Y年%m月%d日 %H:%M")

        # PVT結果の処理
        pvt = task_results.get("pvt", {})
        pvt_avg_reaction = pvt.get("average_reaction_time", 0)
        pvt_miss_count = pvt.get("miss_count", 0)
        pvt_total_trials = len(pvt.get("all_reaction_times", []))
        pvt_accuracy = ((pvt_total_trials - pvt_miss_count) / pvt_total_trials * 100) if pvt_total_trials > 0 else 0

        # Flanker結果の処理
        flanker = task_results.get("flanker", {})
        flanker_accuracy = (flanker.get("total_correct", 0) / flanker.get("total_trials", 100) * 100)
        flanker_avg_rt = 0  # 反応時間の平均（trial_detailsから計算可能）
        if flanker.get("trial_details"):
            reaction_times = [t.get("reaction_time_ms", 0) for t in flanker["trial_details"] if t.get("reaction_time_ms")]
            if reaction_times:
                flanker_avg_rt = sum(reaction_times) / len(reaction_times)

        # EFSI結果の処理
        efsi = task_results.get("efsi", {})
        efsi_score = efsi.get("total_score", 0)

        # VAS結果の処理
        vas = task_results.get("vas", {})
        vas_sleepiness = vas.get("sleepiness_score", 0)
        vas_fatigue = vas.get("fatigue_score", 0)

        # Notionページのプロパティを構築
        properties = {
            "Name": {
                "title": [
                    {
                        "text": {
                            "content": title
                        }
                    }
                ]
            },
            "PVT-平均速度": {
                "number": round(pvt_avg_reaction, 2)
            },
            "PVT-正解率": {
                "number": round(pvt_accuracy, 2)
            },
            "Flanker-平均速度": {
                "number": round(flanker_avg_rt, 2)
            },
            "Flanker-正解率": {
                "number": round(flanker_accuracy, 2)
            },
            "EFSI-過労スコア": {
                "number": efsi_score
            },
            "VANS-眠気": {
                "number": vas_sleepiness
            },
            "VANS-疲労": {
                "number": vas_fatigue
            }
        }

        # Notion APIにリクエスト
        payload = {
            "parent": {"database_id": self.database_id},
            "properties": properties
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/pages",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()


# シングルトンインスタンス
notion_service = NotionService()

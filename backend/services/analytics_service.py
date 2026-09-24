import json
import os
from datetime import date, timedelta

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunRealtimeReportRequest,
    RunReportRequest,
)


GA4_PROPERTY_ID = "555611486"


def _get_client() -> BetaAnalyticsDataClient:
    credentials_json = os.getenv("GOOGLE_ANALYTICS_CREDENTIALS")

    if not credentials_json:
        raise RuntimeError("GOOGLE_ANALYTICS_CREDENTIALS is not configured.")

    credentials_info = json.loads(credentials_json)

    return BetaAnalyticsDataClient.from_service_account_info(
        credentials_info
    )


def get_analytics_summary() -> dict:
    client = _get_client()

    end_date = date.today()
    start_date = end_date - timedelta(days=30)

    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[
            DateRange(
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat(),
            )
        ],
        dimensions=[
            Dimension(name="date"),
        ],
        metrics=[
            Metric(name="activeUsers"),
            Metric(name="screenPageViews"),
            Metric(name="sessions"),
        ],
    )

    response = client.run_report(request)

    daily = []

    for row in response.rows:
        values = row.metric_values
        date_value = row.dimension_values[0].value

        visitors = int(values[0].value)
        page_views = int(values[1].value)
        traffic = int(values[2].value)

        daily.append(
            {
                "date": date_value,
                "visitors": visitors,
                "page_views": page_views,
                "traffic": traffic,
            }
        )

    total_visitors = sum(item["visitors"] for item in daily)
    total_page_views = sum(item["page_views"] for item in daily)
    total_traffic = sum(item["traffic"] for item in daily)

    days = len(daily) or 1

    return {
        "success": True,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
        },
        "daily": daily,
        "summary": {
            "visitors": {
                "monthly_average": round(total_visitors / days, 2),
                "daily_average": round(total_visitors / days, 2),
                "total": total_visitors,
            },
            "page_views": {
                "monthly_average": round(total_page_views / days, 2),
                "daily_average": round(total_page_views / days, 2),
                "total": total_page_views,
            },
            "traffic": {
                "monthly_average": round(total_traffic / days, 2),
                "daily_average": round(total_traffic / days, 2),
                "total": total_traffic,
            },
        },
    }


def get_realtime_analytics() -> dict:
    client = _get_client()

    request = RunRealtimeReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        metrics=[
            Metric(name="activeUsers"),
            Metric(name="screenPageViews"),
        ],
    )

    response = client.run_realtime_report(request)

    values = response.rows[0].metric_values if response.rows else []

    active_users = int(values[0].value) if len(values) > 0 else 0
    page_views = int(values[1].value) if len(values) > 1 else 0

    return {
        "success": True,
        "active_users": active_users,
        "page_views": page_views,
    }

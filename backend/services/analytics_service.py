import json
import os
from datetime import date, timedelta

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Metric, RunReportRequest


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
        metrics=[
            Metric(name="activeUsers"),
            Metric(name="screenPageViews"),
        ],
    )

    response = client.run_report(request)

    values = response.rows[0].metric_values if response.rows else []

    visitors = int(values[0].value) if len(values) > 0 else 0
    page_views = int(values[1].value) if len(values) > 1 else 0

    return {
        "success": True,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
        },
        "visitors": visitors,
        "page_views": page_views,
        "traffic": page_views,
    }

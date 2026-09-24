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


def _validate_date_range(
    start_date: date | None,
    end_date: date | None,
) -> tuple[date, date]:
    today = date.today()

    if start_date is None:
        end_date = end_date or today
        start_date = end_date - timedelta(days=30)

    if end_date is None:
        end_date = today

    if start_date > end_date:
        raise ValueError("Start date cannot be after end date.")

    if (end_date - start_date).days > 365:
        raise ValueError("Analytics date range cannot exceed 365 days.")

    return start_date, end_date


def _count_calendar_months(start_date: date, end_date: date) -> int:
    return (
        (end_date.year - start_date.year) * 12
        + (end_date.month - start_date.month)
        + 1
    )


def get_analytics_summary(
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict:
    client = _get_client()

    start_date, end_date = _validate_date_range(
        start_date,
        end_date,
    )

    date_range = DateRange(
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
    )

    # Daily data for the chart.
    daily_request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[date_range],
        dimensions=[
            Dimension(name="date"),
        ],
        metrics=[
            Metric(name="activeUsers"),
            Metric(name="screenPageViews"),
            Metric(name="sessions"),
        ],
    )

    # Aggregate data for accurate totals.
    total_request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[date_range],
        metrics=[
            Metric(name="activeUsers"),
            Metric(name="screenPageViews"),
            Metric(name="sessions"),
        ],
    )

    daily_response = client.run_report(daily_request)
    total_response = client.run_report(total_request)

    daily = []

    for row in daily_response.rows:
        values = row.metric_values
        date_value = row.dimension_values[0].value

        daily.append(
            {
                "date": date_value,
                "visitors": int(values[0].value),
                "page_views": int(values[1].value),
                "traffic": int(values[2].value),
            }
        )

    total_values = (
        total_response.rows[0].metric_values
        if total_response.rows
        else []
    )

    total_visitors = (
        int(total_values[0].value)
        if len(total_values) > 0
        else 0
    )

    total_page_views = (
        int(total_values[1].value)
        if len(total_values) > 1
        else 0
    )

    total_traffic = (
        int(total_values[2].value)
        if len(total_values) > 2
        else 0
    )

    number_of_days = (end_date - start_date).days + 1
    number_of_months = _count_calendar_months(
        start_date,
        end_date,
    )

    return {
        "success": True,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
        },
        "daily": daily,
        "summary": {
            "visitors": {
                "monthly_average": round(
                    total_visitors / number_of_months,
                    2,
                ),
                "daily_average": round(
                    total_visitors / number_of_days,
                    2,
                ),
                "total": total_visitors,
            },
            "page_views": {
                "monthly_average": round(
                    total_page_views / number_of_months,
                    2,
                ),
                "daily_average": round(
                    total_page_views / number_of_days,
                    2,
                ),
                "total": total_page_views,
            },
            "traffic": {
                "monthly_average": round(
                    total_traffic / number_of_months,
                    2,
                ),
                "daily_average": round(
                    total_traffic / number_of_days,
                    2,
                ),
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

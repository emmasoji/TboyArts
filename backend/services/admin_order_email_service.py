import html
from datetime import datetime, timezone
import os
from typing import Any

import resend

from utils.supabase import select, insert


RESEND_API_KEY = os.getenv("RESEND_API_KEY")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

ADMIN_ORDER_EMAIL_FROM = os.getenv(
    "ADMIN_ORDER_EMAIL_FROM",
    "TboyArts <hello@tboyarts.shop>",
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://www.tboyarts.shop",
).rstrip("/")

TBOYARTS_LOGO_URL = os.getenv(
    "TBOYARTS_LOGO_URL",
    "https://qmnamuyhuenialuhbycf.supabase.co/storage/v1/object/public/Logo/logo.png",
)


class AdminOrderEmailError(RuntimeError):
    pass


def _configure_resend() -> None:
    if not RESEND_API_KEY:
        raise AdminOrderEmailError(
            "RESEND_API_KEY is not configured."
        )

    if not ADMIN_EMAIL:
        raise AdminOrderEmailError(
            "ADMIN_EMAIL is not configured."
        )

    resend.api_key = RESEND_API_KEY


def _money(value: Any, currency: str = "NGN") -> str:
    try:
        amount = float(value or 0)
    except (TypeError, ValueError):
        amount = 0

    currency = str(currency or "NGN").upper()

    if currency == "USD":
        return f"${amount:,.2f}"

    return f"₦{amount:,.0f}"


async def _get_order(order_id: str) -> dict[str, Any]:
    rows = await select(
        "orders",
        columns=(
            "id,"
            "order_number,"
            "customer_name,"
            "email,"
            "phone,"
            "total,"
            "currency,"
            "payment_status,"
            "status,"
            "created_at"
        ),
        filters={"id": order_id},
    )

    if not rows:
        raise AdminOrderEmailError(
            "Order not found."
        )

    return rows[0]


async def _get_order_items(
    order_id: str,
) -> list[dict[str, Any]]:
    return await select(
        "order_items",
        columns="title,price,quantity",
        filters={"order_id": order_id},
    )


async def _notification_exists(
    order_id: str,
) -> bool:
    rows = await select(
        "admin_order_email_notifications",
        columns="id,status,sent_at",
        filters={"order_id": order_id},
    )

    return bool(rows)


async def _record_notification(
    order_id: str,
) -> None:
    await insert(
        "admin_order_email_notifications",
        {
            "order_id": order_id,
            "status": "sent",
            "sent_at": datetime.now(timezone.utc).isoformat(),
        },
    )


def _admin_order_url(order_id: str) -> str:
    return (
        f"{FRONTEND_URL}/admin?order={order_id}"
    )


def _email_html(
    order: dict[str, Any],
    items: list[dict[str, Any]],
) -> str:
    order_id = str(order.get("id") or "")
    order_number = html.escape(
        str(
            order.get("order_number")
            or order_id
        )
    )

    customer_name = html.escape(
        str(order.get("customer_name") or "Customer")
    )

    customer_email = html.escape(
        str(order.get("email") or "—")
    )

    customer_phone = html.escape(
        str(order.get("phone") or "—")
    )

    payment_status = html.escape(
        str(order.get("payment_status") or "—")
    )

    order_status = html.escape(
        str(order.get("status") or "completed")
    )

    created_at = html.escape(
        str(order.get("created_at") or "—")
    )

    currency = str(order.get("currency") or "NGN").upper()
    total = _money(order.get("total"), currency)

    rows = ""

    for item in items:
        title = html.escape(
            str(item.get("title") or "Artwork")
        )

        quantity = int(
            item.get("quantity") or 1
        )

        price = _money(item.get("price"), currency)

        subtotal = _money(
            float(item.get("price") or 0)
            * quantity,
            currency,
        )

        rows += f"""
          <tr>
            <td style="
              padding:12px 0;
              border-bottom:1px solid #e5e5e5;
              font-size:14px;
            ">
              {title}
            </td>
            <td style="
              padding:12px 0;
              border-bottom:1px solid #e5e5e5;
              font-size:14px;
              text-align:center;
            ">
              {quantity}
            </td>
            <td style="
              padding:12px 0;
              border-bottom:1px solid #e5e5e5;
              font-size:14px;
              text-align:right;
            ">
              {price}
            </td>
            <td style="
              padding:12px 0;
              border-bottom:1px solid #e5e5e5;
              font-size:14px;
              text-align:right;
            ">
              {subtotal}
            </td>
          </tr>
        """

    view_url = html.escape(
        _admin_order_url(order_id),
        quote=True,
    )

    logo_url = html.escape(
        TBOYARTS_LOGO_URL,
        quote=True,
    )

    return f"""
<!doctype html>
<html>
  <body style="
    margin:0;
    padding:0;
    background:#f5f5f3;
    color:#171717;
    font-family:Arial,Helvetica,sans-serif;
  ">
    <div style="
      max-width:680px;
      margin:0 auto;
      padding:40px 20px;
    ">

      <div style="
        background:#ffffff;
        padding:32px;
        border:1px solid #e5e5e5;
      ">

        <div style="
          display:flex;
          align-items:center;
          gap:8px;
          margin:0 0 28px;
        ">
          <img
            src="{logo_url}"
            alt=""
            width="20"
            height="20"
            style="
              display:block;
              width:20px;
              height:20px;
              object-fit:contain;
              border:0;
            "
          />
          <span style="
            font-size:18px;
            font-weight:600;
            line-height:20px;
          ">
            TboyArts
          </span>
        </div>

        <h1 style="
          margin:0 0 10px;
          font-family:Georgia,'Times New Roman',serif;
          font-size:28px;
          font-weight:400;
        ">
          New paid order
        </h1>

        <p style="
          margin:0 0 28px;
          color:#666666;
          font-size:15px;
          line-height:1.6;
        ">
          Order <strong>{order_number}</strong>
          has been paid successfully.
        </p>

        <div style="
          background:#f7f7f5;
          padding:18px;
          margin-bottom:24px;
        ">
          <p style="margin:0 0 8px;font-size:14px;">
            <strong>Customer:</strong>
            {customer_name}
          </p>

          <p style="margin:0 0 8px;font-size:14px;">
            <strong>Email:</strong>
            {customer_email}
          </p>

          <p style="margin:0 0 8px;font-size:14px;">
            <strong>Phone:</strong>
            {customer_phone}
          </p>

          <p style="margin:0 0 8px;font-size:14px;">
            <strong>Payment:</strong>
            {payment_status}
          </p>

          <p style="margin:0 0 8px;font-size:14px;">
            <strong>Status:</strong>
            {order_status}
          </p>

          <p style="margin:0;font-size:14px;">
            <strong>Date:</strong>
            {created_at}
          </p>
        </div>

        <h2 style="
          margin:0 0 12px;
          font-size:17px;
          font-weight:600;
        ">
          Order items
        </h2>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="border-collapse:collapse;"
        >
          <thead>
            <tr>
              <th style="
                padding:10px 0;
                border-bottom:1px solid #cccccc;
                text-align:left;
                font-size:12px;
                color:#666666;
              ">
                ITEM
              </th>

              <th style="
                padding:10px 0;
                border-bottom:1px solid #cccccc;
                text-align:center;
                font-size:12px;
                color:#666666;
              ">
                QTY
              </th>

              <th style="
                padding:10px 0;
                border-bottom:1px solid #cccccc;
                text-align:right;
                font-size:12px;
                color:#666666;
              ">
                PRICE
              </th>

              <th style="
                padding:10px 0;
                border-bottom:1px solid #cccccc;
                text-align:right;
                font-size:12px;
                color:#666666;
              ">
                SUBTOTAL
              </th>
            </tr>
          </thead>

          <tbody>
            {rows}
          </tbody>
        </table>

        <div style="
          margin-top:20px;
          padding-top:18px;
          border-top:1px solid #cccccc;
          text-align:right;
        ">
          <span style="
            font-size:14px;
            color:#666666;
          ">
            Total
          </span>

          <strong style="
            display:block;
            margin-top:4px;
            font-size:22px;
          ">
            {total}
          </strong>
        </div>

        <div style="margin-top:30px;">
          <a
            href="{view_url}"
            style="
              display:inline-block;
              background:#171717;
              color:#ffffff;
              text-decoration:none;
              padding:13px 22px;
              font-size:14px;
              font-weight:600;
            "
          >
            View Order
          </a>
        </div>

      </div>

      <p style="
        margin:18px 0 0;
        text-align:center;
        color:#999999;
        font-size:12px;
      ">
        Automated TboyArts order notification.
      </p>

    </div>
  </body>
</html>
"""


async def send_paid_order_admin_email(
    order_id: str,
) -> bool:
    _configure_resend()

    order = await _get_order(order_id)

    if (
        str(order.get("payment_status") or "").lower()
        != "paid"
    ):
        raise AdminOrderEmailError(
            "Order payment is not completed."
        )

    if await _notification_exists(order_id):
        print(
            f"[ADMIN ORDER EMAIL] "
            f"Notification already sent for {order_id}"
        )
        return False

    items = await _get_order_items(order_id)

    order_number = (
        str(order.get("order_number"))
        if order.get("order_number")
        else order_id
    )

    response = resend.Emails.send(
        {
            "from": ADMIN_ORDER_EMAIL_FROM,
            "to": [ADMIN_EMAIL],
            "subject": (
                f"TboyArts payment completed — "
                f"order {order_number}"
            ),
            "html": _email_html(order, items),
        }
    )

    if not response:
        raise AdminOrderEmailError(
            "Resend did not return an email response."
        )

    await _record_notification(order_id)

    print(
        f"[ADMIN ORDER EMAIL] Sent notification "
        f"for {order_id}"
    )

    return True

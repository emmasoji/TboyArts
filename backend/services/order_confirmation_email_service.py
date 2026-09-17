import html
import os
from typing import Any
from urllib.parse import quote

import resend

from utils.supabase import select, update


RESEND_API_KEY = os.getenv("RESEND_API_KEY")

ORDER_CONFIRMATION_FROM_EMAIL = os.getenv(
    "ORDER_CONFIRMATION_FROM_EMAIL",
    "TboyArts <onboarding@resend.dev>",
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
).rstrip("/")

TBOYARTS_LOGO_URL = os.getenv(
    "TBOYARTS_LOGO_URL",
    "https://qmnamuyhuenialuhbycf.supabase.co/storage/v1/object/public/Logo/logo.png",
)


class OrderConfirmationEmailError(RuntimeError):
    pass


def _configure_resend() -> None:
    if not RESEND_API_KEY:
        raise OrderConfirmationEmailError(
            "RESEND_API_KEY is not configured on the backend."
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


def _safe_image_url(value: Any) -> str:
    image = str(value or "").strip()

    if image.startswith("https://"):
        return image

    return ""


def _track_order_url(order_number: str) -> str:
    encoded_order = quote(order_number, safe="")
    return (
        f"{FRONTEND_URL}/"
        f"?trackOrder=1&order={encoded_order}"
    )


async def _get_order(order_id: str) -> dict[str, Any]:
    rows = await select(
        "orders",
        columns=(
            "id,"
            "order_number,"
            "customer_name,"
            "email,"
            "phone,"
            "address,"
            "state,"
            "country,"
            "subtotal,"
            "shipping,"
            "tax,"
            "total,"
            "currency,"
            "payment_status,"
            "status,"
            "created_at,"
            "order_confirmation_email_sent_at"
        ),
        filters={"id": order_id},
    )

    if not rows:
        raise OrderConfirmationEmailError(
            "Order could not be found."
        )

    return rows[0]


async def _get_order_items(order_id: str) -> list[dict[str, Any]]:
    return await select(
        "order_items",
        columns="title,price,quantity,image",
        filters={"order_id": order_id},
    )


def _order_items_html(items: list[dict[str, Any]], currency: str = "NGN") -> str:
    cards: list[str] = []

    for item in items:
        title = html.escape(
            str(item.get("title") or "Artwork")
        )

        quantity = int(item.get("quantity") or 1)

        price = _money(item.get("price"), currency)

        image_url = _safe_image_url(item.get("image"))

        image_html = ""

        if image_url:
            safe_image = html.escape(
                image_url,
                quote=True,
            )

            image_html = f"""
              <img
                src="{safe_image}"
                alt="{title}"
                width="80"
                height="80"
                style="
                  display:block;
                  width:80px;
                  height:80px;
                  object-fit:cover;
                  border-radius:8px;
                  background:#f2f2f2;
                "
              />
            """
        else:
            image_html = """
              <div style="
                width:80px;
                height:80px;
                border-radius:8px;
                background:#f2f2f2;
                text-align:center;
                line-height:80px;
                color:#999;
                font-size:12px;
              ">
                TboyArts
              </div>
            """

        cards.append(
            f"""
            <tr>
              <td style="
                padding:14px 0;
                border-bottom:1px solid #eeeeee;
              ">
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                >
                  <tr>
                    <td width="80" valign="top">
                      {image_html}
                    </td>

                    <td
                      valign="middle"
                      style="
                        padding-left:14px;
                        font-family:Arial,Helvetica,sans-serif;
                      "
                    >
                      <div style="
                        font-size:14px;
                        font-weight:600;
                        color:#111111;
                        margin-bottom:6px;
                      ">
                        {title}
                      </div>

                      <div style="
                        font-size:12px;
                        color:#777777;
                      ">
                        Quantity: {quantity}
                      </div>
                    </td>

                    <td
                      width="100"
                      valign="middle"
                      align="right"
                      style="
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:14px;
                        font-weight:600;
                        color:#111111;
                      "
                    >
                      {price}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            """
        )

    return "".join(cards)


def _summary_row(
    label: str,
    value: str,
    *,
    total: bool = False,
) -> str:
    label_weight = "700" if total else "400"
    value_weight = "700" if total else "400"

    border = (
        "border-top:1px solid #dddddd;"
        if total
        else ""
    )

    font_size = "16px" if total else "14px"

    return f"""
      <tr>
        <td style="
          padding:8px 0;
          {border}
          font-family:Arial,Helvetica,sans-serif;
          font-size:{font_size};
          font-weight:{label_weight};
          color:#111111;
        ">
          {html.escape(label)}
        </td>

        <td
          align="right"
          style="
            padding:8px 0;
            {border}
            font-family:Arial,Helvetica,sans-serif;
            font-size:{font_size};
            font-weight:{value_weight};
            color:#111111;
          "
        >
          {html.escape(value)}
        </td>
      </tr>
    """


def _email_html(
    order: dict[str, Any],
    items: list[dict[str, Any]],
) -> str:
    order_number = html.escape(
        str(order.get("order_number") or "")
    )

    customer_name = html.escape(
        str(order.get("customer_name") or "Customer")
    )

    track_url = html.escape(
        _track_order_url(
            str(order.get("order_number") or "")
        ),
        quote=True,
    )

    logo_url = html.escape(
        TBOYARTS_LOGO_URL,
        quote=True,
    )

    currency = str(order.get("currency") or "NGN").upper()
    items_html = _order_items_html(items, currency)

    shipping_lines = []

    for field in (
        "address",
        "state",
        "country",
    ):
        value = str(order.get(field) or "").strip()

        if value:
            shipping_lines.append(
                html.escape(value)
            )

    shipping_html = "<br>".join(shipping_lines)

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width,initial-scale=1.0"
  />
  <title>TboyArts Order Confirmation</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f3f3f3;
  font-family:Arial,Helvetica,sans-serif;
  color:#111111;
">

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f3f3f3;"
  >
    <tr>
      <td align="center" style="padding:30px 12px;">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:620px;
            background:#ffffff;
            border:1px solid #e6e6e6;
          "
        >

          <!-- Header -->

          <tr>
            <td
              style="
                padding:32px 32px 28px;
                border-bottom:1px solid #eeeeee;
              "
            >
              <table
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td valign="middle">
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
                  </td>

                  <td
                    valign="middle"
                    style="
                      padding-left:8px;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:18px;
                      line-height:20px;
                      font-weight:600;
                      color:#171717;
                    "
                  >
                    TboyArts
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- Success -->

          <tr>
            <td
              align="center"
              style="padding:38px 32px 12px;"
            >

              <!-- Static checkmark aura -->

              <div style="
                width:96px;
                height:96px;
                margin:0 auto 20px;
                border-radius:50%;
                background:#f0f0ee;
                text-align:center;
              ">
                <div style="
                  display:inline-block;
                  margin-top:10px;
                  width:76px;
                  height:76px;
                  border-radius:50%;
                  background:#e7e7e4;
                  text-align:center;
                ">
                  <div style="
                    display:inline-block;
                    margin-top:10px;
                    width:56px;
                    height:56px;
                    border-radius:50%;
                    background:#171717;
                    color:#ffffff;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:30px;
                    line-height:56px;
                    font-weight:700;
                    text-align:center;
                  ">
                    ✓
                  </div>
                </div>
              </div>

              <h1 style="
                margin:0;
                font-family:Georgia,'Times New Roman',serif;
                font-size:28px;
                line-height:1.25;
                font-weight:600;
                color:#111111;
              ">
                Order Confirmed
              </h1>

              <p style="
                margin:14px auto 0;
                max-width:470px;
                font-family:Arial,Helvetica,sans-serif;
                font-size:15px;
                line-height:1.7;
                color:#555555;
              ">
                Thank you, {customer_name}.
                Your order has successfully been placed.
              </p>

            </td>
          </tr>


          <!-- CTA -->

          <tr>
            <td align="center" style="padding:18px 24px 30px;">

              <a
                href="{track_url}"
                style="
                  display:inline-block;
                  padding:14px 24px;
                  background:#111111;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:5px;
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:13px;
                  font-weight:600;
                  letter-spacing:.2px;
                "
              >
                View Order Status
              </a>

            </td>
          </tr>


          <!-- Order Number -->

          <tr>
            <td style="
              padding:0 24px 28px;
            ">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background:#f7f7f5;
                  border:1px solid #e5e5e5;
                "
              >
                <tr>
                  <td style="padding:15px 16px;">

                    <div style="
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:11px;
                      color:#777777;
                      text-transform:uppercase;
                      letter-spacing:1px;
                    ">
                      Order Number
                    </div>

                    <div style="
                      margin-top:5px;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:15px;
                      font-weight:700;
                      color:#111111;
                    ">
                      {order_number}
                    </div>

                  </td>
                </tr>
              </table>

            </td>
          </tr>


          <!-- Items -->

          <tr>
            <td style="padding:0 24px 30px;">

              <h2 style="
                margin:0 0 12px;
                font-family:Georgia,'Times New Roman',serif;
                font-size:20px;
                font-weight:600;
                color:#111111;
              ">
                Your Artwork
              </h2>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                {items_html}
              </table>

            </td>
          </tr>


          <!-- Summary -->

          <tr>
            <td style="padding:0 24px 30px;">

              <h2 style="
                margin:0 0 12px;
                font-family:Georgia,'Times New Roman',serif;
                font-size:20px;
                font-weight:600;
                color:#111111;
              ">
                Order Summary
              </h2>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >

                {_summary_row(
                    "Subtotal",
                    _money(order.get("subtotal"), currency),
                )}

                {_summary_row(
                    "Shipping",
                    _money(order.get("shipping"), currency),
                )}

                {_summary_row(
                    "Tax",
                    _money(order.get("tax"), currency),
                )}

                {_summary_row(
                    "Total",
                    _money(order.get("total"), currency),
                    total=True,
                )}

              </table>

            </td>
          </tr>


          <!-- Delivery -->

          <tr>
            <td style="
              padding:0 24px 30px;
            ">

              <h2 style="
                margin:0 0 12px;
                font-family:Georgia,'Times New Roman',serif;
                font-size:20px;
                font-weight:600;
                color:#111111;
              ">
                Delivery Information
              </h2>

              <div style="
                padding:16px;
                background:#fafafa;
                border:1px solid #eeeeee;
                font-family:Arial,Helvetica,sans-serif;
                font-size:13px;
                line-height:1.8;
                color:#444444;
              ">
                {shipping_html}
              </div>

            </td>
          </tr>


          <!-- Footer -->

          <tr>
            <td
              align="center"
              style="
                padding:20px 24px 8px;
                background:#ffffff;
              "
            >

              <p style="
                margin:0;
                font-family:Arial,Helvetica,sans-serif;
                font-size:12px;
                line-height:1.6;
                color:#999999;
              ">
                Thank you for choosing TboyArts.
              </p>


            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
"""


async def send_order_confirmation_email(
    order_id: str,
) -> dict[str, Any]:
    _configure_resend()

    order = await _get_order(order_id)

    email = str(
        order.get("email") or ""
    ).strip()

    if not email:
        raise OrderConfirmationEmailError(
            "Order does not have a valid email address."
        )

    if str(order.get("payment_status") or "").lower() != "paid":
        raise OrderConfirmationEmailError(
            "Order payment has not been confirmed."
        )

    if order.get("order_confirmation_email_sent_at"):
        print(
            f"[ORDER EMAIL] Confirmation already sent "
            f"for order {order.get('order_number')}."
        )

        return {
            "success": True,
            "already_sent": True,
            "email": email,
            "order_number": order.get("order_number"),
        }

    items = await _get_order_items(order_id)

    html_body = _email_html(
        order=order,
        items=items,
    )

    order_number = str(
        order.get("order_number") or order_id
    )

    subject = (
        f"Your TboyArts order {order_number} "
        f"has been confirmed"
    )

    print(
        f"[ORDER EMAIL] Sending confirmation "
        f"for {order_number} to {email}..."
    )

    try:
        response = resend.Emails.send(
            {
                "from": ORDER_CONFIRMATION_FROM_EMAIL,
                "to": [email],
                "subject": subject,
                "html": html_body,
            }
        )

        print(
            f"[ORDER EMAIL] Resend response "
            f"for {order_number}: {response}"
        )

        if isinstance(response, dict) and response.get("error"):
            raise OrderConfirmationEmailError(
                str(response["error"])
            )

        await update(
            "orders",
            {"id": order_id},
            {
                "order_confirmation_email_sent_at": (
                    __import__("datetime")
                    .datetime.now(
                        __import__("datetime").timezone.utc
                    ).isoformat()
                )
            },
        )

        return {
            "success": True,
            "already_sent": False,
            "email": email,
            "order_number": order_number,
            "response": response,
        }

    except OrderConfirmationEmailError:
        raise

    except Exception as exc:
        print(
            f"[ORDER EMAIL] Failed for "
            f"{order_number}: {exc}"
        )

        raise OrderConfirmationEmailError(
            f"Failed to send order confirmation email: {exc}"
        ) from exc

# Order Confirmation Webhook → Make.com

How a confirmed order flows from the Halaliy app into the Make.com automation
(Telegram alert + Data Store record).

```
App (order confirmed)
   │  POST application/json
   ▼
Make Custom Webhook  ──►  Router  ──►  Telegram Bot (send message)
                                  └──►  Data Store (add/replace record)
```

---

## 1. When the webhook fires

The app calls `notifyOrderConfirmed(order)` ([App.tsx](../App.tsx)) **every time an order
reaches `CONFIRMED` status**, which happens on all of these paths:

| Trigger | Where |
|---|---|
| Card payment succeeds (order created already confirmed) | order-create handler |
| Admin advances an order to **Confirmed** in the dashboard | admin status update |
| A split order's **last share is paid** (auto-confirm) | PayMyShare / share-payment handlers |

It is **fire-and-forget**: failures are swallowed (`.catch`) so a webhook problem never
blocks the order. It uses `keepalive: true` so the request survives the redirect to `/track`.

---

## 2. Transport

```js
fetch(ORDER_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body,            // JSON string (see schema below)
  keepalive: true,
});
```

- Sent as **`application/json`** so Make (and any other tool) **auto-parses** the body into
  fields — no "Parse JSON" module needed.
- Make's custom webhook supports browser CORS (`OPTIONS` → 200, `Access-Control-Allow-Origin: *`),
  so the cross-origin POST from the browser works directly.

> Historical note: this used to send `text/plain` + `mode: 'no-cors'`, which Make could **not**
> auto-parse — that required a separate Parse JSON module and was the source of the
> "json came through empty" errors. Switched to `application/json` on 2026-06-07.

---

## 3. Payload schema

```json
{
  "event": "order.confirmed",
  "orderId": "HLY-XXXXXX",
  "timestamp": 1749312345678,
  "order": {
    "id": "HLY-XXXXXX",
    "animalType": "Goat | Cow | Chicken | Goat Meat | Cow Skin",
    "quantity": 1,
    "skinOption": "BURNT | NOT_BURNT",
    "shares": 1,
    "pricing": {
      "animalSubtotal": 479,
      "slaughterFee": 0,
      "deliveryCharge": 35,
      "totalPrice": 514,
      "perShareAmount": 514
    },
    "deliveryAddress": "123 Test St, Houston, TX 77001",
    "deliveryDate": "2026-06-14",
    "deliveryWindow": "Afternoon (12-4 PM)",
    "paymentMethod": "CARD | ZELLE",
    "portionOwners": [
      { "id": "p1", "name": "Test Customer", "phone": "+1...", "isPaid": true, "amount": 514, "isPrimary": true }
    ],
    "status": "Confirmed"
  }
}
```

---

## 4. Make scenario layout

**Custom Webhook → Router → { Telegram Bot, Data Store }**

- The **Webhook** module is module `1`; auto-parsed fields are addressed as `{{1.…}}`.
- The **Router** fans out to the Telegram and Data Store branches (add filters here if you only
  want some orders to alert).
- There is **no** Parse JSON module — Make parses the `application/json` body itself.

### Field mapping reference (`{{1.…}}`)
| Use | Token |
|---|---|
| Order ID | `{{1.orderId}}` |
| Product | `{{1.order.animalType}}` |
| Quantity | `{{1.order.quantity}}` |
| Total ($) | `{{1.order.pricing.totalPrice}}` |
| Per-share ($) | `{{1.order.pricing.perShareAmount}}` |
| Address | `{{1.order.deliveryAddress}}` |
| Date / window | `{{1.order.deliveryDate}}` / `{{1.order.deliveryWindow}}` |
| Payment method | `{{1.order.paymentMethod}}` |
| Primary customer name | `{{1.order.portionOwners[1].name}}` (arrays are 1-indexed) |
| Primary customer phone | `{{1.order.portionOwners[1].phone}}` |

### Example Telegram message
```
🛒 New Halaliy Order Confirmed!

Order: {{1.orderId}}
Item: {{1.order.animalType}} (x{{1.order.quantity}})
Total: ${{1.order.pricing.totalPrice}}
Customer: {{1.order.portionOwners[1].name}}
Phone: {{1.order.portionOwners[1].phone}}
Deliver to: {{1.order.deliveryAddress}}
Date: {{1.order.deliveryDate}} — {{1.order.deliveryWindow}}
Payment: {{1.order.paymentMethod}}
```

---

## 5. Configuration

The destination URL is the env var **`VITE_ORDER_WEBHOOK_URL`**.

- It is a **build-time** variable (Vite inlines `VITE_*` at build). Changing it requires a
  **redeploy**, not just an env edit.
- Set in two places:
  - **Local dev:** `.env`
  - **Production:** Vercel project env vars (the live site uses these, not `.env`).

### Pointing at a different Make scenario
1. In Make, open the **Custom Webhook** module → **Copy address**.
2. Update `VITE_ORDER_WEBHOOK_URL` to that URL in **Vercel** (and `.env` for local).
3. **Redeploy** so the new URL is baked into the build.
4. Turn the scenario's **scheduling ON** so it listens for live traffic.

---

## 6. Testing the webhook

Send a sample confirmed-order payload (matches what the app sends):

```bash
curl -X POST "$VITE_ORDER_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  --data '{
    "event":"order.confirmed",
    "orderId":"HLY-TEST-001",
    "order":{"id":"HLY-TEST-001","animalType":"Goat","quantity":1,
      "pricing":{"totalPrice":514},
      "deliveryAddress":"123 Test St, Houston, TX",
      "paymentMethod":"CARD",
      "portionOwners":[{"name":"Test Customer","phone":"+1...","isPrimary":true}],
      "status":"Confirmed"}}'
```

A healthy Make webhook responds with `Accepted` / HTTP 200.

To capture/refresh the field structure in Make: open the Webhook module →
**Redetermine data structure** → send a test → **OK**.

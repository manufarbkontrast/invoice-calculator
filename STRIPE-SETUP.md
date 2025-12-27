# Stripe Integration Setup

Diese Anleitung beschreibt die Einrichtung der Stripe-Integration für die Abo-Verwaltung.

## Umgebungsvariablen

Fügen Sie folgende Umgebungsvariablen zu Ihrer `.env` Datei und Vercel hinzu:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_...  # oder sk_test_... für Test-Modus
STRIPE_PUBLISHABLE_KEY=pk_live_...  # oder pk_test_... für Test-Modus

# Stripe Price IDs (aus Stripe Dashboard > Products)
STRIPE_PRICE_ID_PRO=price_...  # Price ID für Pro-Plan
STRIPE_PRICE_ID_BUSINESS=price_...  # Price ID für Business-Plan

# Stripe Webhook Secret (nach Webhook-Erstellung)
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL für Redirects
BASE_URL=https://your-domain.vercel.app  # oder http://localhost:3000 für Development
```

## Stripe Dashboard Setup

### 1. Products & Prices erstellen

1. Gehen Sie zu [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Erstellen Sie zwei Products:
   - **Pro Plan**: 12€/Monat (oder 115€/Jahr)
   - **Business Plan**: 29€/Monat (oder 278€/Jahr)
3. Kopieren Sie die **Price IDs** (beginnen mit `price_...`) und fügen Sie sie in die Umgebungsvariablen ein

### 2. Webhook konfigurieren

1. Gehen Sie zu [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Klicken Sie auf "Add endpoint"
3. Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Wählen Sie folgende Events aus:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Klicken Sie auf "Add endpoint"
6. Kopieren Sie den **Signing secret** (beginnt mit `whsec_...`) und fügen Sie ihn in `STRIPE_WEBHOOK_SECRET` ein

### 3. Customer Portal konfigurieren

1. Gehen Sie zu [Stripe Dashboard > Settings > Billing > Customer portal](https://dashboard.stripe.com/settings/billing/portal)
2. Aktivieren Sie den Customer Portal
3. Konfigurieren Sie die erlaubten Aktionen:
   - ✅ Cancel subscription
   - ✅ Update payment method
   - ✅ Update billing information
   - ✅ View invoices

## API Endpoints

### POST /api/stripe/checkout

Erstellt eine Stripe Checkout Session.

**Request Body:**
```json
{
  "planType": "pro" | "business",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/stripe/webhook

Webhook-Endpoint für Stripe Events. Wird automatisch von Stripe aufgerufen.

**Headers:**
- `stripe-signature`: Wird von Stripe gesendet

**Verarbeitete Events:**
- `checkout.session.completed`: Aktiviert Subscription nach erfolgreicher Zahlung
- `customer.subscription.updated`: Aktualisiert Subscription-Status
- `customer.subscription.deleted`: Setzt User auf Free-Plan zurück
- `invoice.payment_failed`: Setzt Subscription-Status auf `past_due`

### POST /api/stripe/portal

Erstellt einen Link zum Stripe Customer Portal.

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

## Frontend Integration

### Checkout Session erstellen

```typescript
const response = await fetch("/api/stripe/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    planType: "pro",
    userId: user.id,
  }),
});

const { url } = await response.json();
window.location.href = url; // Weiterleitung zu Stripe Checkout
```

### Customer Portal öffnen

```typescript
const response = await fetch("/api/stripe/portal", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: user.id,
  }),
});

const { url } = await response.json();
window.location.href = url; // Weiterleitung zum Customer Portal
```

## Test-Modus

Für Tests verwenden Sie:
- Test API Keys (beginnen mit `sk_test_` und `pk_test_`)
- Test Price IDs aus dem Test-Modus
- Stripe Test Cards: `4242 4242 4242 4242` (gültig bis 12/34, CVC: 123)

## Sicherheit

- ✅ Webhook-Signatur wird verifiziert
- ✅ User-Authentifizierung sollte in den Frontend-Calls implementiert werden
- ✅ Sensitive Daten werden nur serverseitig verarbeitet
- ✅ Umgebungsvariablen werden nicht im Client-Code exponiert


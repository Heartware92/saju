# Database Schema

> Supabase (PostgreSQL) — Project: `saju` / Region: Asia-Pacific
> Last updated: 2026-04-04

---

## Tables

### 1. `user_credits`

Stores per-user credit balances (Sun/Moon dual system).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `user_id` | `uuid` (PK, FK → `auth.users`) | NO | — | User identifier |
| `sun_balance` | `int` | NO | `0` | Current Sun credit balance |
| `moon_balance` | `int` | NO | `0` | Current Moon credit balance |
| `total_sun_purchased` | `int` | NO | `0` | Lifetime Sun credits purchased |
| `total_moon_purchased` | `int` | NO | `0` | Lifetime Moon credits purchased |
| `total_sun_consumed` | `int` | NO | `0` | Lifetime Sun credits consumed |
| `total_moon_consumed` | `int` | NO | `0` | Lifetime Moon credits consumed |
| `created_at` | `timestamptz` | NO | `now()` | Row creation time |
| `updated_at` | `timestamptz` | NO | `now()` | Last update time (auto-trigger) |

**RLS Policies:**
- `Users can view own credits` — SELECT where `auth.uid() = user_id`
- `Service can insert user credits` — INSERT with check `true` (for trigger)

**Triggers:**
- `user_credits_updated_at` — BEFORE UPDATE → sets `updated_at = now()`

---

### 2. `credit_transactions`

Ledger of all credit movements (purchase, consume, bonus, refund).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` (PK) | NO | `gen_random_uuid()` | Transaction ID |
| `user_id` | `uuid` (FK → `auth.users`) | NO | — | User identifier |
| `credit_type` | `text` | NO | — | `'sun'` or `'moon'` |
| `type` | `text` | NO | — | `'purchase'`, `'consume'`, `'bonus'`, `'refund'` |
| `amount` | `int` | NO | — | Signed amount (+purchase, -consume) |
| `balance_after` | `int` | NO | — | Balance after this transaction |
| `reason` | `text` | YES | — | Human-readable reason |
| `order_id` | `uuid` | YES | — | Related order (if purchase) |
| `created_at` | `timestamptz` | NO | `now()` | Transaction time |

**Constraints:**
- `credit_type` CHECK: `('sun', 'moon')`
- `type` CHECK: `('purchase', 'consume', 'bonus', 'refund')`

**Indexes:**
- `idx_credit_transactions_user_id` on `user_id`
- `idx_credit_transactions_created_at` on `created_at DESC`

**RLS Policies:**
- `Users can view own transactions` — SELECT where `auth.uid() = user_id`
- `Service can insert transactions` — INSERT with check `true` (for trigger)

---

### 3. `orders`

Payment orders via PortOne.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` (PK) | NO | `gen_random_uuid()` | Order ID |
| `user_id` | `uuid` (FK → `auth.users`) | NO | — | Buyer |
| `package_id` | `text` | NO | — | Pricing package identifier |
| `package_name` | `text` | NO | — | Display name of package |
| `amount` | `int` | NO | — | Payment amount in KRW |
| `sun_credit_amount` | `int` | NO | `0` | Sun credits in this package |
| `moon_credit_amount` | `int` | NO | `0` | Moon credits in this package |
| `status` | `text` | NO | `'pending'` | Order status |
| `payment_method` | `text` | YES | — | e.g. `'CARD'` |
| `payment_key` | `text` | YES | — | PortOne payment key |
| `portone_payment_id` | `text` | YES | — | PortOne payment ID |
| `created_at` | `timestamptz` | NO | `now()` | Order creation time |
| `completed_at` | `timestamptz` | YES | — | Payment completion time |

**Constraints:**
- `status` CHECK: `('pending', 'completed', 'failed', 'refunded')`

**Indexes:**
- `idx_orders_user_id` on `user_id`
- `idx_orders_status` on `status`

**RLS Policies:**
- `Users can view own orders` — SELECT where `auth.uid() = user_id`
- `Users can create own orders` — INSERT with check `auth.uid() = user_id`

---

### 4. `saju_records`

Saju (Four Pillars) analysis history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` (PK) | NO | `gen_random_uuid()` | Record ID |
| `user_id` | `uuid` (FK → `auth.users`) | NO | — | User who requested |
| `birth_date` | `text` | NO | — | Birth date (ISO string) |
| `birth_time` | `text` | YES | — | Birth time (HH:mm) |
| `birth_place` | `text` | YES | — | Birth location |
| `gender` | `text` | NO | — | `'male'` or `'female'` |
| `calendar_type` | `text` | NO | `'solar'` | `'solar'` or `'lunar'` |
| `category` | `text` | NO | `'traditional'` | Analysis type (traditional, today, love, wealth, etc.) |
| `result_data` | `jsonb` | NO | — | Raw saju calculation result |
| `engine_result` | `jsonb` | YES | — | Engine-specific result data |
| `interpretation_basic` | `text` | YES | — | Basic AI interpretation |
| `interpretation_detailed` | `text` | YES | — | Detailed AI interpretation |
| `credit_type` | `text` | YES | — | `'sun'` or `'moon'` |
| `credit_used` | `int` | NO | `0` | Credits consumed |
| `is_detailed` | `boolean` | NO | `false` | Whether detailed analysis |
| `created_at` | `timestamptz` | NO | `now()` | Record creation time |

**Constraints:**
- `gender` CHECK: `('male', 'female')`
- `calendar_type` CHECK: `('solar', 'lunar')`
- `credit_type` CHECK: `('sun', 'moon')`

**Indexes:**
- `idx_saju_records_user_id` on `user_id`
- `idx_saju_records_created_at` on `created_at DESC`

**RLS Policies:**
- `Users can view own saju records` — SELECT where `auth.uid() = user_id`
- `Users can create own saju records` — INSERT with check `auth.uid() = user_id`

---

### 5. `tarot_records`

Tarot reading history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` (PK) | NO | `gen_random_uuid()` | Record ID |
| `user_id` | `uuid` (FK → `auth.users`) | NO | — | User who requested |
| `spread_type` | `text` | NO | — | Tarot spread layout type |
| `cards` | `jsonb` | NO | — | Drawn cards data |
| `question` | `text` | YES | — | User's question |
| `interpretation` | `text` | YES | — | AI interpretation |
| `credit_type` | `text` | YES | — | `'sun'` or `'moon'` |
| `credit_used` | `int` | NO | `0` | Credits consumed |
| `created_at` | `timestamptz` | NO | `now()` | Record creation time |

**Constraints:**
- `credit_type` CHECK: `('sun', 'moon')`

**Indexes:**
- `idx_tarot_records_user_id` on `user_id`

**RLS Policies:**
- `Users can view own tarot records` — SELECT where `auth.uid() = user_id`
- `Users can create own tarot records` — INSERT with check `auth.uid() = user_id`

---

## Triggers

### `on_auth_user_created`
- **Table:** `auth.users` (AFTER INSERT)
- **Function:** `handle_new_user()`
- **Action:** Creates `user_credits` row with `moon_balance = 1` (welcome bonus) and logs a `credit_transactions` bonus entry
- **Security:** `SECURITY DEFINER`, `search_path = public`

### `user_credits_updated_at`
- **Table:** `user_credits` (BEFORE UPDATE)
- **Function:** `update_updated_at()`
- **Action:** Sets `updated_at = now()`

---

### 6. `birth_profiles`

Saved birth info profiles (self, family, friends, etc.). One user can have multiple profiles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` (PK) | NO | `gen_random_uuid()` | Profile ID |
| `user_id` | `uuid` (FK → `auth.users`) | NO | — | Owner |
| `name` | `text` | NO | — | Profile display name |
| `relation` | `text` | YES | — | Relationship (unused, reserved) |
| `birth_date` | `text` | NO | — | Birth date (YYYY-MM-DD) |
| `birth_time` | `text` | YES | — | Birth time (HH:mm), null = unknown |
| `birth_place` | `text` | YES | `'seoul'` | Birth location key |
| `gender` | `text` | NO | — | `'male'` or `'female'` |
| `calendar_type` | `text` | NO | `'solar'` | `'solar'` or `'lunar'` |
| `is_primary` | `boolean` | NO | `false` | Whether this is the user's own profile |
| `memo` | `text` | YES | — | User memo |
| `created_at` | `timestamptz` | NO | `now()` | Created time |
| `updated_at` | `timestamptz` | NO | `now()` | Last updated (auto-trigger) |

**Constraints:**
- `gender` CHECK: `('male', 'female')`
- `calendar_type` CHECK: `('solar', 'lunar')`

**Indexes:**
- `idx_birth_profiles_user_id` on `user_id`

**RLS Policies:**
- SELECT, INSERT, UPDATE, DELETE — all restricted to `auth.uid() = user_id`

**Triggers:**
- `birth_profiles_updated_at` — BEFORE UPDATE → sets `updated_at = now()`

---

## Migration History

| File | Date | Description |
|------|------|-------------|
| `001_initial_schema.sql` | 2026-04-04 | Initial 5 tables, RLS, triggers, indexes |
| `002_birth_profiles.sql` | 2026-04-04 | Birth profiles table for multi-person saju |

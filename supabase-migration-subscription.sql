-- Migration: Add subscription fields to users table
-- This migration adds subscription management fields to the users table

-- Create subscription status enum
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'canceled', 'past_due');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create plan type enum
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'pro', 'business');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add subscription columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan_type plan_type DEFAULT 'free' NOT NULL,
  ADD COLUMN IF NOT EXISTS invoice_count_month INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMP DEFAULT NOW() NOT NULL;

-- Set default values for existing users
UPDATE users
SET 
  subscription_status = 'active',
  plan_type = 'free',
  invoice_count_month = 0,
  last_reset_date = COALESCE(created_at, NOW())
WHERE 
  subscription_status IS NULL 
  OR plan_type IS NULL 
  OR invoice_count_month IS NULL 
  OR last_reset_date IS NULL;

-- Add index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Add index on subscription_status for filtering
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Add index on plan_type for filtering
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);

-- Add comment to columns for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for subscription management';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status: active, trialing, canceled, or past_due';
COMMENT ON COLUMN users.plan_type IS 'Subscription plan type: free (5 invoices/month), pro (unlimited), or business (unlimited + teams)';
COMMENT ON COLUMN users.invoice_count_month IS 'Number of invoices uploaded in the current month';
COMMENT ON COLUMN users.last_reset_date IS 'Date when invoice_count_month was last reset (monthly reset)';


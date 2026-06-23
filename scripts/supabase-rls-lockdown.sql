-- URGENT: Run in Supabase SQL Editor
-- Blocks public REST/GraphQL access via the anon key.
-- Prisma (server) uses the postgres role and is NOT affected.

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'User', 'AiConversation', 'AiMessage', 'PasswordResetToken', 'PendingClientSignup',
    'FeedbackTicket', 'Client', 'Lead', 'TeamChannel', 'TeamChannelMember',
    'TeamChannelMessage', 'DmThread', 'DmMessage', 'ClientContact', 'ClientAsset',
    'ServiceProduct', 'ServiceProductDeliverableTemplate', 'Brief', 'BriefAssignment',
    'Deliverable', 'BriefUpdate', 'InternalNote', 'MessageThread', 'Message',
    'CalendarBooking', 'TimeLog', 'Notification', 'ActivityLog',
    'DashboardFeedDismissal', 'PortalNotificationDismissal'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    -- Revoke direct API access from anon/authenticated (belt and braces)
    EXECUTE format('REVOKE ALL ON TABLE %I FROM anon, authenticated', tbl);
  END LOOP;
END $$;

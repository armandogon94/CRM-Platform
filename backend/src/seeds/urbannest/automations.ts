import Automation from '../../models/Automation';
import { UrbanNestContext } from './workspace';
import { UrbanNestBoards } from './boards';

export async function seedUrbanNestAutomations(
  ctx: UrbanNestContext,
  boards: UrbanNestBoards
): Promise<void> {
  console.log('[UrbanNest] Seeding automation rules...');

  // ─── 1. New Lead Welcome ──────────────────────────────────────────────
  // When a lead is created with status "New", send a welcome email with property matches
  await Automation.create({
    boardId: boards.leadPipeline.boardId,
    name: 'New Lead Welcome Email',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: boards.leadPipeline.columns['Status'],
      triggerValue: 'New',
      description: 'Fires when a new lead enters the pipeline with status "New"',
    },
    actionType: 'send_email',
    actionConfig: {
      recipientField: 'Contact Email',
      emailTemplate: 'lead_welcome',
      subject: 'Welcome to UrbanNest — We Found Properties You\'ll Love!',
      body: 'Hi {{lead_name}},\n\nThank you for your interest in UrbanNest Realty! Based on your preferences, we\'ve curated a list of properties that match your criteria.\n\nYour assigned agent, {{agent_name}}, will be reaching out shortly to schedule a consultation.\n\nBest regards,\nUrbanNest Realty',
      includePropertyMatches: true,
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 2. Showing Confirmation ──────────────────────────────────────────
  // When a showing is scheduled, send calendar invite to agent + prospect
  await Automation.create({
    boardId: boards.showingScheduler.boardId,
    name: 'Showing Confirmation & Calendar Invite',
    triggerType: 'on_item_created',
    triggerConfig: {
      description: 'Fires when a new showing is created on the Showing Scheduler board',
    },
    actionType: 'send_email',
    actionConfig: {
      recipientField: 'Agent',
      ccField: 'Prospect',
      emailTemplate: 'showing_confirmation',
      subject: 'Showing Confirmed: {{property_address}} on {{showing_date}}',
      body: 'A property showing has been scheduled:\n\nProperty: {{property_address}}\nDate/Time: {{showing_date}}\nProspect: {{prospect_name}}\nAgent: {{agent_name}}\n\nA calendar invite has been sent to all parties. Please confirm your attendance.\n\nUrbanNest Realty',
      sendCalendarInvite: true,
      calendarDuration: 30,
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 3. Offer Notification ────────────────────────────────────────────
  // When lead status changes to "Offer", notify assigned agent + broker
  await Automation.create({
    boardId: boards.leadPipeline.boardId,
    name: 'Offer Stage Notification',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: boards.leadPipeline.columns['Status'],
      triggerValue: 'Offer',
      description: 'Fires when a lead\'s status changes to "Offer"',
    },
    actionType: 'send_notification',
    actionConfig: {
      notifyUsers: [ctx.brokerId],
      notifyField: 'Agent',
      title: 'Offer Submitted: {{lead_name}}',
      message: '{{lead_name}} has moved to Offer stage for {{property_interest}}.\n\nBudget: ${{budget}}\nAgent: {{agent_name}}\n\nPlease review the offer details and coordinate next steps.',
      type: 'success',
      linkToItem: true,
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  // ─── 4. Closed Deal Archive & Stats Update ────────────────────────────
  // When lead status changes to "Closed", create activity log and update agent stats
  await Automation.create({
    boardId: boards.leadPipeline.boardId,
    name: 'Closed Deal — Archive & Agent Stats',
    triggerType: 'on_status_changed',
    triggerConfig: {
      columnId: boards.leadPipeline.columns['Status'],
      triggerValue: 'Closed',
      description: 'Fires when a lead\'s status changes to "Closed"',
    },
    actionType: 'create_activity',
    actionConfig: {
      activityType: 'deal_closed',
      description: 'Deal closed for {{lead_name}} — {{property_interest}} at ${{budget}}',
      archiveToBoard: 'historical',
      updateAgentStats: true,
      statsFields: {
        increment: 'deals_closed',
        addToTotal: 'total_volume',
        valueField: 'Budget',
      },
      sendNotification: true,
      notifyUsers: [ctx.brokerId, ctx.coordinatorId],
      celebrationMessage: 'Congratulations! {{agent_name}} just closed a deal on {{property_interest}}!',
    },
    isActive: true,
    createdBy: ctx.adminId,
  });

  console.log('[UrbanNest] Created 4 automation rules');
}

import { Zap, Play, Clock, Mail, Bell, ArrowRight } from 'lucide-react';
import type { Automation } from '../types';

interface AutomationsPanelProps {
  automations: Automation[];
  onTrigger: (id: number) => void;
}

const triggerIcons: Record<string, typeof Clock> = {
  on_date_reached: Clock,
  on_status_changed: ArrowRight,
  on_recurring: Clock,
  on_item_created: Zap,
  on_item_updated: Zap,
};

const actionIcons: Record<string, typeof Mail> = {
  send_email: Mail,
  send_notification: Bell,
  update_status: ArrowRight,
  set_column_value: ArrowRight,
};

export function AutomationsPanel({ automations, onTrigger }: AutomationsPanelProps) {
  if (automations.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Zap size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Automations</h3>
        <p className="text-gray-500 text-sm">Automations will appear here once configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {automations.map((auto) => {
        const TriggerIcon = triggerIcons[auto.triggerType] || Zap;
        const ActionIcon = actionIcons[auto.actionType] || Zap;

        return (
          <div key={auto.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${auto.isActive ? 'bg-brand-500' : 'bg-gray-300'}`} />
                  <h4 className="font-semibold text-sm">{auto.name}</h4>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <TriggerIcon size={14} />
                    <span>When: {auto.triggerType.replace(/_/g, ' ')}</span>
                  </div>
                  <ArrowRight size={12} className="text-gray-300" />
                  <div className="flex items-center gap-1.5">
                    <ActionIcon size={14} />
                    <span>Then: {auto.actionType.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onTrigger(auto.id)}
                className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
                title="Manually trigger"
              >
                <Play size={12} />
                Test
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

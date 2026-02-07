/**
 * Feature Settings Page
 *
 * Admin UI for enabling/disabling optional studio features.
 * Settings are preserved when features are disabled (shown grayed out).
 */

import { useState, useMemo } from 'react';
import {
  FEATURE_DEFINITIONS,
  FEATURE_CATEGORY_INFO,
  getFeaturesByCategory,
  getOptionalFeatures,
  canEnableFeature,
  getDependentFeatures,
  type FeatureId,
  type FeatureCategory,
  type FeatureDefinition,
} from '@/lib/feature-toggles';

// ============================================================================
// MOCK DATA - Replace with real API calls
// ============================================================================

const mockEnabledFeatures = new Set<FeatureId>([
  // Core (always on)
  'scheduling',
  'bookings',
  'members',
  'payments',
  // Optional enabled
  'waitlist',
  'notifications_email',
  'analytics',
  'import_export',
  'intro_offers',
  'payroll',
]);

// ============================================================================
// ICONS
// ============================================================================

const CategoryIcons: Record<string, React.FC<{ className?: string }>> = {
  calendar: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  users: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  'credit-card': ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  ),
  megaphone: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
  ),
  briefcase: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  ),
  'bar-chart': ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  plug: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  ),
  settings: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

// ============================================================================
// TIER BADGE COMPONENT
// ============================================================================

function TierBadge({ tier }: { tier?: 'free' | 'pro' | 'enterprise' }) {
  if (!tier || tier === 'free') return null;

  const colors = {
    pro: 'bg-amber-100 text-amber-800 border-amber-200',
    enterprise: 'bg-violet-100 text-violet-800 border-violet-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[tier]}`}>
      {tier === 'pro' ? 'Pro' : 'Enterprise'}
    </span>
  );
}

// ============================================================================
// TOGGLE SWITCH COMPONENT
// ============================================================================

interface ToggleSwitchProps {
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}

function ToggleSwitch({ enabled, disabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${enabled ? 'bg-stone-800' : 'bg-stone-300'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
          transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

// ============================================================================
// FEATURE CARD COMPONENT
// ============================================================================

interface FeatureCardProps {
  feature: FeatureDefinition;
  isEnabled: boolean;
  enabledFeatures: Set<FeatureId>;
  onToggle: (featureId: FeatureId, enabled: boolean) => void;
  onShowDependencyWarning: (feature: FeatureDefinition, dependents: FeatureDefinition[]) => void;
}

function FeatureCard({
  feature,
  isEnabled,
  enabledFeatures,
  onToggle,
  onShowDependencyWarning,
}: FeatureCardProps) {
  const { canEnable, missingDependencies } = canEnableFeature(feature.id, enabledFeatures);
  const dependentFeatures = getDependentFeatures(feature.id);
  const hasEnabledDependents = dependentFeatures.some(f => enabledFeatures.has(f.id));

  const handleToggle = (enabled: boolean) => {
    // If disabling, check for dependent features
    if (!enabled && hasEnabledDependents) {
      const enabledDependents = dependentFeatures.filter(f => enabledFeatures.has(f.id));
      onShowDependencyWarning(feature, enabledDependents);
      return;
    }

    onToggle(feature.id, enabled);
  };

  return (
    <div
      className={`
        relative p-4 rounded-lg border transition-all duration-200
        ${feature.isCore
          ? 'bg-stone-50 border-stone-200'
          : isEnabled
            ? 'bg-white border-stone-200 shadow-sm'
            : 'bg-stone-50/50 border-stone-100'
        }
      `}
    >
      {/* Core badge */}
      {feature.isCore && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-stone-200 text-stone-600">
            <LockIcon className="w-3 h-3" />
            Core
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium ${isEnabled ? 'text-stone-900' : 'text-stone-500'}`}>
              {feature.name}
            </h4>
            <TierBadge tier={feature.tier} />
          </div>

          <p className={`text-sm ${isEnabled ? 'text-stone-600' : 'text-stone-400'}`}>
            {feature.description}
          </p>

          {/* Dependencies warning */}
          {!canEnable && !feature.isCore && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-600">
              <AlertIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Requires: {missingDependencies.map(d => FEATURE_DEFINITIONS[d].name).join(', ')}
              </span>
            </div>
          )}

          {/* Show what depends on this */}
          {dependentFeatures.length > 0 && isEnabled && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-stone-500">
              <InfoIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Used by: {dependentFeatures.map(d => d.name).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Toggle */}
        {!feature.isCore && (
          <div className="flex-shrink-0 pt-0.5">
            <ToggleSwitch
              enabled={isEnabled}
              disabled={!canEnable && !isEnabled}
              onChange={handleToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CATEGORY SECTION COMPONENT
// ============================================================================

interface CategorySectionProps {
  category: FeatureCategory;
  features: FeatureDefinition[];
  enabledFeatures: Set<FeatureId>;
  onToggle: (featureId: FeatureId, enabled: boolean) => void;
  onShowDependencyWarning: (feature: FeatureDefinition, dependents: FeatureDefinition[]) => void;
}

function CategorySection({
  category,
  features,
  enabledFeatures,
  onToggle,
  onShowDependencyWarning,
}: CategorySectionProps) {
  const info = FEATURE_CATEGORY_INFO[category];
  const IconComponent = CategoryIcons[info.icon] || CategoryIcons.settings;
  const enabledCount = features.filter(f => enabledFeatures.has(f.id)).length;

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
      {/* Category header */}
      <div className="px-5 py-4 bg-stone-50 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-stone-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-900">{info.name}</h3>
            <p className="text-sm text-stone-500">{info.description}</p>
          </div>
          <div className="text-sm text-stone-500">
            {enabledCount} / {features.length} enabled
          </div>
        </div>
      </div>

      {/* Features list */}
      <div className="p-4 space-y-3">
        {features.map(feature => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            isEnabled={enabledFeatures.has(feature.id)}
            enabledFeatures={enabledFeatures}
            onToggle={onToggle}
            onShowDependencyWarning={onShowDependencyWarning}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// DEPENDENCY WARNING MODAL
// ============================================================================

interface DependencyWarningModalProps {
  isOpen: boolean;
  feature: FeatureDefinition | null;
  dependents: FeatureDefinition[];
  onConfirm: () => void;
  onCancel: () => void;
}

function DependencyWarningModal({
  isOpen,
  feature,
  dependents,
  onConfirm,
  onCancel,
}: DependencyWarningModalProps) {
  if (!isOpen || !feature) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertIcon className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">
              Disable {feature.name}?
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              The following features depend on <strong>{feature.name}</strong> and will also be disabled:
            </p>
            <ul className="mt-3 space-y-1">
              {dependents.map(d => (
                <li key={d.id} className="text-sm text-stone-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  {d.name}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-stone-500">
              Settings for these features will be preserved and can be re-enabled later.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            Keep Enabled
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            Disable All
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STATS OVERVIEW
// ============================================================================

interface StatsOverviewProps {
  enabledFeatures: Set<FeatureId>;
}

function StatsOverview({ enabledFeatures }: StatsOverviewProps) {
  const optionalFeatures = getOptionalFeatures();
  const enabledOptional = optionalFeatures.filter(f => enabledFeatures.has(f.id)).length;

  const proFeatures = optionalFeatures.filter(f => f.tier === 'pro');
  const enterpriseFeatures = optionalFeatures.filter(f => f.tier === 'enterprise');

  const stats = [
    {
      label: 'Features Enabled',
      value: enabledOptional,
      total: optionalFeatures.length,
      color: 'text-stone-900',
    },
    {
      label: 'Pro Features',
      value: proFeatures.filter(f => enabledFeatures.has(f.id)).length,
      total: proFeatures.length,
      color: 'text-amber-600',
    },
    {
      label: 'Enterprise Features',
      value: enterpriseFeatures.filter(f => enabledFeatures.has(f.id)).length,
      total: enterpriseFeatures.length,
      color: 'text-violet-600',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(stat => (
        <div key={stat.label} className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-sm text-stone-500">{stat.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${stat.color}`}>
            {stat.value}
            <span className="text-base font-normal text-stone-400"> / {stat.total}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeatureSettings() {
  const [enabledFeatures, setEnabledFeatures] = useState<Set<FeatureId>>(mockEnabledFeatures);
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    feature: FeatureDefinition | null;
    dependents: FeatureDefinition[];
  }>({ isOpen: false, feature: null, dependents: [] });
  const [hasChanges, setHasChanges] = useState(false);

  // Group features by category
  const featuresByCategory = useMemo(() => {
    const categories: FeatureCategory[] = [
      'scheduling',
      'members',
      'payments',
      'marketing',
      'staff',
      'analytics',
      'integrations',
      'operations',
    ];

    return categories.map(category => ({
      category,
      features: getFeaturesByCategory(category),
    })).filter(g => g.features.length > 0);
  }, []);

  const handleToggle = (featureId: FeatureId, enabled: boolean) => {
    setEnabledFeatures(prev => {
      const next = new Set(prev);
      if (enabled) {
        next.add(featureId);
      } else {
        next.delete(featureId);
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleShowDependencyWarning = (feature: FeatureDefinition, dependents: FeatureDefinition[]) => {
    setWarningModal({ isOpen: true, feature, dependents });
  };

  const handleConfirmDisable = () => {
    if (!warningModal.feature) return;

    setEnabledFeatures(prev => {
      const next = new Set(prev);
      // Disable the feature and all dependents
      next.delete(warningModal.feature!.id);
      warningModal.dependents.forEach(d => next.delete(d.id));
      return next;
    });
    setHasChanges(true);
    setWarningModal({ isOpen: false, feature: null, dependents: [] });
  };

  const handleSave = () => {
    // TODO: Save to API
    console.log('Saving features:', Array.from(enabledFeatures));
    setHasChanges(false);
  };

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <SparkleIcon className="w-5 h-5" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Feature Settings</h1>
              </div>
              <p className="text-stone-300 max-w-xl">
                Enable or disable optional features for your studio. Core features are always available.
                Settings are preserved when features are disabled.
              </p>
            </div>

            {/* Save button */}
            {hasChanges && (
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-white text-stone-900 font-medium rounded-lg hover:bg-stone-100 transition-colors flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stats overview */}
        <StatsOverview enabledFeatures={enabledFeatures} />

        {/* Info banner */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-start gap-3">
          <InfoIcon className="w-5 h-5 text-stone-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-stone-600">
            <p className="font-medium text-stone-700">How feature toggles work</p>
            <p className="mt-1">
              When you disable a feature, all its settings and data are preserved.
              The feature will appear grayed out in your navigation, and you can
              re-enable it anytime to restore full access.
            </p>
          </div>
        </div>

        {/* Feature categories */}
        <div className="space-y-6">
          {featuresByCategory.map(({ category, features }) => (
            <CategorySection
              key={category}
              category={category}
              features={features}
              enabledFeatures={enabledFeatures}
              onToggle={handleToggle}
              onShowDependencyWarning={handleShowDependencyWarning}
            />
          ))}
        </div>
      </div>

      {/* Dependency warning modal */}
      <DependencyWarningModal
        isOpen={warningModal.isOpen}
        feature={warningModal.feature}
        dependents={warningModal.dependents}
        onConfirm={handleConfirmDisable}
        onCancel={() => setWarningModal({ isOpen: false, feature: null, dependents: [] })}
      />
    </div>
  );
}

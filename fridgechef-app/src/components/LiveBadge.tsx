import { Badge, type BadgeProps } from '@/components/Badge';

export type LiveBadgeProps = Omit<BadgeProps, 'dot' | 'variant'>;

/** Lime pill with the pulsing red "live" dot ("Ready", "Scanning", "3 matches", the cook timer). */
export function LiveBadge(props: LiveBadgeProps) {
  return <Badge {...props} dot="live" variant="lime" />;
}

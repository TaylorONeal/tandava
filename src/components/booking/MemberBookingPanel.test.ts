import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactNode } from 'react';

const state = vi.hoisted(() => ({
  effect: null as null | (() => (() => void) | void),
  setState: vi.fn(), setError: vi.fn(), capture: vi.fn(), free: vi.fn(), covered: vi.fn(), invoke: vi.fn(), invalidate: vi.fn(),
}));
vi.mock('react', async () => ({
  ...await vi.importActual<typeof import('react')>('react'),
  useEffect: (effect: () => (() => void) | void) => { state.effect = effect; },
  useRef: (value: unknown) => ({ current: value }),
  useState: (value: unknown) => [value, value === null ? state.setError : state.setState],
}));
vi.mock('react-router-dom', () => ({ Link: 'a' }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: state.invalidate }) }));
vi.mock('@/components/legal/CheckoutTermsNote', () => ({ CheckoutTermsNote: 'span' }));
vi.mock('@/components/calendar/AddToCalendar', () => ({ AddToCalendar: 'span' }));
vi.mock('@/components/ui/button', () => ({ Button: 'button' }));
vi.mock('@/components/ui/card', () => ({ Card: 'div', CardContent: 'div' }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'member-a' }, profile: { first_name: 'Test' }, signOut: vi.fn() }) }));
vi.mock('@/hooks/useBooking', () => ({
  useMemberEntitlements: () => ({ data: { memberships: [], packs: [] }, isLoading: false, refetch: vi.fn() }),
  useBookingSources: () => [{ id: 'pack-a', name: 'Test pass', type: 'CLASS_PACK', covers: true }, { type: 'DROP_IN' }],
  useBookClass: () => ({ mutateAsync: state.covered }),
}));
vi.mock('@/lib/backend', () => ({ data: { bookFreeClass: state.free }, api: { invoke: state.invoke } }));
vi.mock('@/lib/analytics/session', () => ({ captureSettled: state.capture, currentSessionId: () => undefined, checkoutAttribution: () => ({}) }));

import { MemberBookingPanel } from './MemberBookingPanel';

type Click = () => void | Promise<void>;
function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return text(node.props.children);
  return '';
}
function button(node: ReactNode, label: string): Click | undefined {
  if (Array.isArray(node)) return node.map(child => button(child, label)).find(Boolean);
  if (!isValidElement<{ children?: ReactNode; onClick?: Click }>(node)) return undefined;
  if (node.props.onClick && text(node.props.children).includes(label)) return node.props.onClick;
  return button(node.props.children, label);
}
function mount() {
  const tree = MemberBookingPanel({
    row: { studio_id: 'studio-a', offering_id: 'offering-a', studio_slug: 'test-studio', drop_in_price_cents: 0 } as Parameters<typeof MemberBookingPanel>[0]['row'],
    occurrenceId: 'class-a', returnPath: '/s/test-studio/book/class-a', priceLabel: null,
    calendarEvent: {} as Parameters<typeof MemberBookingPanel>[0]['calendarEvent'],
  });
  const cleanup = state.effect?.();
  return { click: (label: string) => { const click = button(tree, label); if (!click) throw new Error(`No button ${label}`); return click(); },
    unmount: () => { if (typeof cleanup === 'function') cleanup(); } };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}
async function flush() { await Promise.resolve(); await Promise.resolve(); }

describe('member booking action lifetime', () => {
  beforeEach(() => {
    vi.clearAllMocks(); state.effect = null;
    state.capture.mockResolvedValue(undefined);
    state.free.mockResolvedValue({ data: { id: 'booking-a', status: 'confirmed' }, error: null });
    state.covered.mockResolvedValue({ id: 'booking-a', status: 'confirmed' });
  });
  for (const label of ['Book this free class', 'Book with Test pass']) {
    it(`does not submit ${label} after the account/route boundary unmounts during attribution`, async () => {
      const capture = deferred<void>(); state.capture.mockReturnValue(capture.promise);
      const view = mount(); void view.click(label); view.unmount();
      capture.resolve(); await flush();
      expect(state.free).not.toHaveBeenCalled(); expect(state.covered).not.toHaveBeenCalled();
    });
  }
  it('does not apply a response after its account/route boundary unmounts', async () => {
    const result = deferred<{ data: { id: string; status: string }; error: null }>();
    state.free.mockReturnValue(result.promise);
    const view = mount(); void view.click('Book this free class'); await flush(); view.unmount();
    result.resolve({ data: { id: 'booking-a', status: 'confirmed' }, error: null }); await flush();
    expect(state.setState).not.toHaveBeenCalledWith('booked'); expect(state.invalidate).not.toHaveBeenCalled();
  });
  it('ignores a duplicate tap while attribution is pending', async () => {
    const capture = deferred<void>(); state.capture.mockReturnValue(capture.promise);
    const view = mount(); void view.click('Book this free class'); void view.click('Book this free class');
    capture.resolve(); await flush(); await flush();
    expect(state.free).toHaveBeenCalledTimes(1);
  });
});

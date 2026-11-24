export type Language = 'ru' | 'az' | 'en';

export type Role = 'PLAYER' | 'VENUE_ADMIN' | 'OPERATOR';

export type WorkspaceSection = 'sandbox' | 'qa' | 'ledger' | 'policy';

export enum SlotStatus {
  FREE = 'FREE',
  PAYMENT_LOCK = 'PAYMENT_LOCK',
  SOFT_RESERVED = 'SOFT_RESERVED',
  HARD_RESERVED = 'HARD_RESERVED',
  BLOCKED_EXTERNAL = 'BLOCKED_EXTERNAL',
  UNAVAILABLE = 'UNAVAILABLE',
  COMPLETED = 'COMPLETED',
}

export enum MatchStatus {
  OPEN = 'OPEN',
  FULL_PENDING = 'FULL_PENDING',
  TOPUP_OFFER = 'TOPUP_OFFER',
  CONFIRMING = 'CONFIRMING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED_UNDERFILLED = 'CANCELLED_UNDERFILLED',
  CANCELLED_VENUE = 'CANCELLED_VENUE',
  CANCELLED_ADMIN = 'CANCELLED_ADMIN',
}

export enum SeatStatus {
  FREE = 'FREE',
  HOLD = 'HOLD',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum CheckinStatus {
  PENDING = 'PENDING',
  CHECKED_IN = 'CHECKED_IN',
  NO_SHOW = 'NO_SHOW',
  DISPUTED = 'DISPUTED',
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING_PROVIDER = 'PENDING_PROVIDER',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUNDED = 'PARTIAL_REFUNDED',
  DISPUTED = 'DISPUTED',
}

export type TopUpDecision = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface SimUser {
  id: string;
  name: string;
  district: string;
  reliabilityScore: number; // 0..100
  skillLevel: number; // 1.0..5.0
}

export interface PolicyConfig {
  cutoffHours: number; // D01: default 4
  topUpOfferHours: number; // default 6
  holdTtlMinutes: number; // default 10
  waitlistTtlMinutes: number; // default 15
  minPlayers: number; // D02: default 8
  capacity: number; // 5x5 = 10
  requireAllTopUpConsents: boolean; // D03: true
  forbidEmptyMatches: boolean; // D04: true
  protectSoftReserve: boolean; // D05: true
  platformFeePct: number; // D06: 10%
  providerFeePct: number; // D06: 2%
  playerServiceFeeMinor: number; // D06: transparent fee per seat in qepik (default 50 = 0.50 AZN or 0)
  replacementDeadlineMinutes: number; // D08: 30
  enableV15Features: boolean; // D09: Waitlist, QR, Chat
}

export interface SlotRecord {
  id: string;
  venueName: string;
  fieldName: string;
  district: 'Gənclik' | 'Yasamal' | 'Nərimanov';
  format: '5×5';
  capacity: number;
  startAtUtcMs: number;
  endAtUtcMs: number;
  rentMinor: number; // 10000 = 100.00 AZN
  currency: 'AZN';
  status: SlotStatus;
  version: number;
  blockReason?: string;
}

export interface PricingSnapshot {
  rentMinor: number;
  seatPriceMinor: number;
  capacity: number;
  minPlayers: number;
  platformFeePct: number;
  providerFeePct: number;
  playerServiceFeeMinor: number;
  ruleVersion: string;
  capturedAtUtcMs: number;
}

export interface SeatRecord {
  seatId: number; // 1..10
  matchId: string;
  payerId: string | null;
  payerName: string | null;
  attendeeName: string | null;
  isGuest: boolean;
  inviteToken: string | null;
  seatStatus: SeatStatus;
  holdExpiresAtUtcMs: number | null;
  paymentId: string | null;
  paidBaseMinor: number;
  paidTopUpMinor: number;
  checkinStatus: CheckinStatus;
  checkedInAtUtcMs: number | null;
  checkinMethod: 'QR_SCAN' | 'MANUAL_ADMIN' | null;
  qrToken: string | null;
  qrUsed: boolean;
  disputeNote?: string;
  replacementOpen: boolean; // true if player cancelled after T-4 and awaiting replacement until T-30m
}

export interface TopUpConsentRecord {
  id: string;
  matchId: string;
  payerId: string;
  payerName: string;
  seatIds: number[];
  maxAmountMinor: number; // total max across their seats
  perSeatMaxMinor: number;
  decision: TopUpDecision;
  decidedAtUtcMs: number | null;
  ruleVersion: string;
}

export interface PaymentRecord {
  id: string;
  matchId: string;
  slotId: string;
  payerId: string;
  payerName: string;
  seatIds: number[];
  amountMinor: number;
  serviceFeeMinor: number;
  kind: 'BASE' | 'TOPUP' | 'REPLACEMENT';
  status: PaymentStatus;
  idempotencyKey: string;
  providerEventIds: string[];
  createdAtUtcMs: number;
  updatedAtUtcMs: number;
  refundedMinor: number;
  refundReason?: string;
  stuckRefund?: boolean;
}

export interface WaitlistEntry {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  joinedAtUtcMs: number;
  status: 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'EXPIRED';
  offerExpiresAtUtcMs: number | null;
  offeredSeatId: number | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  sentAtUtcMs: number;
  isSystem?: boolean;
}

export interface RatingRecord {
  id: string;
  matchId: string;
  raterName: string;
  venueRating: number;
  matchQualityRating: number;
  createdAtUtcMs: number;
}

export interface PayoutRecord {
  id: string;
  venueName: string;
  matchId: string;
  slotId: string;
  grossRentMinor: number;
  platformFeeMinor: number;
  providerFeeMinor: number;
  payableMinor: number;
  status: 'PENDING' | 'SCHEDULED' | 'PAID' | 'CANCELLED';
  createdAtUtcMs: number;
}

export interface AuditEvent {
  id: string;
  timestampUtcMs: number;
  actorRole: Role | 'SYSTEM' | 'WEBHOOK';
  actorName: string;
  action: string;
  entityType: 'SLOT' | 'MATCH' | 'SEAT' | 'PAYMENT' | 'WAITLIST' | 'PAYOUT' | 'POLICY';
  entityId: string;
  beforeState: string;
  afterState: string;
  detail: string;
  idempotencyKey?: string;
}

export interface MatchRecord {
  id: string;
  slotId: string;
  initiatorId: string;
  initiatorName: string;
  minPlayers: number;
  capacity: number;
  cutoffAtUtcMs: number;
  topUpOfferAtUtcMs: number;
  replacementDeadlineUtcMs: number;
  chatArchiveAtUtcMs: number;
  status: MatchStatus;
  pricingSnapshot: PricingSnapshot;
  venueDiscountMinor: number;
  initiatorExtraMinor: number;
  seats: SeatRecord[];
  topUpConsents: TopUpConsentRecord[];
  waitlist: WaitlistEntry[];
  chatMessages: ChatMessage[];
  ratings: RatingRecord[];
  cancellationReason?: string;
}

export interface InvariantCheck {
  id: string;
  passed: boolean;
  labelKey: string;
  detail: string;
}

export interface FeedbackNotice {
  id: string;
  tone: 'success' | 'warning' | 'error' | 'info';
  text: string;
}

export interface SimulatorState {
  clockUtcMs: number;
  policy: PolicyConfig;
  slots: SlotRecord[];
  activeSlotId: string;
  matches: Record<string, MatchRecord>;
  payments: PaymentRecord[];
  payouts: PayoutRecord[];
  auditEvents: AuditEvent[];
  processedProviderEvents: string[];
  usedIdempotencyKeys: string[];
  activePlayerId: string;
  lastNotice: FeedbackNotice | null;
  activeQaTestId: string | null;
  qaAssertionResult: {
    testId: string;
    passed: boolean;
    message: string;
  } | null;
}

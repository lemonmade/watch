export enum SearchParam {
  PaymentStatus = 'payment',
}

export enum PaymentStatus {
  Failed = 'failed',
  Success = 'success',
  Pending = 'pending',
}

export enum SubscriptionLevel {
  Member = 'MEMBER',
  Patron = 'PATRON',
}

export const SUBSCRIPTION_LEVELS = {
  [SubscriptionLevel.Member]: {
    id: SubscriptionLevel.Member,
    stripePriceId: 'price_1KXyqpC454ZxGf19zRKbeNOV',
  },
  [SubscriptionLevel.Patron]: {
    id: SubscriptionLevel.Patron,
    stripePriceId: 'price_1KXysNC454ZxGf19EGVPKvV4',
  },
};

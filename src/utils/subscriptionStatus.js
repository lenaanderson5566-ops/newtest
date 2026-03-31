export const SUBSCRIPTION_STATUS = Object.freeze({
  NEW: 'new',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  BANNED: 'banned',
});

const resolvePlanId = (userLike) =>
  userLike?.plan_id ?? userLike?.planId ?? userLike?.plan?.id ?? null;

const resolveExpiredAt = (userLike) =>
  userLike?.expired_at ?? userLike?.expiredAt ?? null;

export const resolveSubscriptionStatus = (userLike, now = Math.floor(Date.now() / 1000)) => {
  const banned = Boolean(userLike?.banned);
  if (banned) return SUBSCRIPTION_STATUS.BANNED;

  const planId = resolvePlanId(userLike);
  if (planId === null || planId === undefined || planId === '') {
    return SUBSCRIPTION_STATUS.NEW;
  }

  const expiredAtRaw = resolveExpiredAt(userLike);
  if (expiredAtRaw === null || expiredAtRaw === undefined || expiredAtRaw === '') {
    return SUBSCRIPTION_STATUS.ACTIVE;
  }

  const expiredAt = Number(expiredAtRaw);
  if (!Number.isFinite(expiredAt)) {
    return SUBSCRIPTION_STATUS.ACTIVE;
  }

  return expiredAt > now ? SUBSCRIPTION_STATUS.ACTIVE : SUBSCRIPTION_STATUS.EXPIRED;
};

export const hasActiveSubscription = (userLike, now = Math.floor(Date.now() / 1000)) =>
  resolveSubscriptionStatus(userLike, now) === SUBSCRIPTION_STATUS.ACTIVE;

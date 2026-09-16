/**
 * How long a deletion request sits before the purge job acts on it.
 *
 * Lives here rather than in the purge job because the account module needs to
 * tell the user how long they have to change their mind, and the two must never
 * disagree.
 */
export const DELETION_GRACE_DAYS = 30;

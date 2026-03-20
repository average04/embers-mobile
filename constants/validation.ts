// Validation limits mirrored from the web app
export const MAX_EMBER_CONTENT_LENGTH = 3000; // EMBER_THOUGHT_LENGTH_LIMIT
export const MAX_COMMENT_LENGTH = 200; // COMMENT_LENGTH_LIMIT
export const MAX_USERNAME_LENGTH = 30;
export const MIN_USERNAME_LENGTH = 3;

// Username regex: letters, numbers, underscores, and periods (but not at start/end or consecutive)
export const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;

// Additional constraints for username validation (enforced separately):
// - Cannot start or end with a period
// - Cannot contain consecutive periods (..)

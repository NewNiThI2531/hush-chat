/**
 * Utility functions for conversation and message handling
 */
export function getConversationId(userAId: string, userBId: string): string {
  const [first, second] = [userAId, userBId].sort();
  return `${first}_${second}`;
}

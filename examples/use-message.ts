import type { Operation } from "effection";

/**
 * This is an interface
 * 
 * ```ts
 * interface Message {
 *  text?: string;
 * }
 * ```
 */
export interface Message {
  text?: string;
}

/**
 * This is useMessage function
 * 
 * ```ts
 * function useMessage(text?: string): Operation<Message[]>
 * ```
 * @param text 
 * @returns 
 */
export function* useMessages(text?: string): Operation<Message[]> {
  return [{ text }]
}
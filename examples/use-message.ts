import type { Operation } from "effection";

/**
 * This is an interface
 *
 * ```ts
 * interface Message {
 *  text?: string;
 *  code: number | undefined;
 * }
 * ```
 */
export interface Message {
  text?: string;
  code: number | undefined;
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
  return [{ text, code: undefined }];
}
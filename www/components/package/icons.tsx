// @ts-nocheck Property 'svg' does not exist on type 'JSX.IntrinsicElements'.

export function Check() {
  return (
    <svg
      class="h-6 stroke-green-500 stroke-2 -mt-px"
      aria-hidden="true"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M5 12l5 5l10 -10"></path>
    </svg>
  );
}

export function Cross() {
  return (
    <svg
      class="h-6 stroke-red-500 stroke-2 -mt-px"
      aria-hidden="true"
      stroke="currentColor"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M6 18L18 6M6 6l12 12"
      ></path>
    </svg>
  );
}
// Deep equality check using JSON.stringify (sufficient for form data)
export function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

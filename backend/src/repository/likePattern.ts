// Use an explicit escape character so % and _ in user input stay literal.
export function containsPattern(text: string): string {
  return `%${text.replace(/[!%_]/g, '!$&')}%`;
}

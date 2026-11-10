export function env(name: string) {
  return (import.meta.env[name] as string | undefined) || process.env[name];
}

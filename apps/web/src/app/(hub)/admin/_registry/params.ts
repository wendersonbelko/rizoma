/** Um parâmetro de URL como texto: o primeiro valor, ou undefined quando falta ou vem vazio. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v ? v : undefined;
}

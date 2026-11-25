/** Formatea una fecha ISO o Date a dd/mm/aaaa (Perú). */
export function formatFechaPe(value: string | Date | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = typeof value === 'string' ? parseIsoDateOnly(value) : value;
  if (!date || Number.isNaN(date.getTime())) {
    return String(value);
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function parseIsoDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }
  return new Date(value);
}

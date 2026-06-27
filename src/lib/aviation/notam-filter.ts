/**
 * Filtro compartido para NOTAMs "no expirados".
 *
 * Incluye:
 *   - NOTAMs activos (effectiveFrom <= now <= effectiveTo)
 *   - NOTAMs próximos/upcoming (effectiveFrom > now, effectiveTo > now)
 *   - NOTAMs permanentes (isPermanent = true)
 *   - NOTAMs sin fecha de fin (effectiveTo IS NULL — caso ambiguo, tratado como vigente)
 *
 * Excluye:
 *   - NOTAMs expirados (effectiveTo < now)
 *
 * Uso:
 *   const where = { fir: 'SPIM', AND: [notExpiredFilter(now)] }
 *   const where = { AND: [searchFilter, notExpiredFilter(now)] }
 *
 * Esto resuelve la inconsistencia donde el badge del dashboard (stats) mostraba
 * un número distinto al del detalle de la estación. Ambos endpoints ahora usan
 * el mismo filtro "no expirado".
 */
export function notExpiredFilter(now: Date = new Date()) {
  return {
    OR: [
      { effectiveTo: { gte: now } },
      { isPermanent: true },
      { effectiveTo: null },
    ],
  }
}

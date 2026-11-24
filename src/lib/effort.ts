export const EFFORTS = [
  { points: 1, label: "Liviana", hint: "Sacar la basura, tender ropa" },
  { points: 3, label: "Media", hint: "Barrer, lavar la loza" },
  { points: 5, label: "Pesada", hint: "Baño, cocina a fondo" },
] as const;

export const EFFORT_POINTS = EFFORTS.map((e) => e.points) as number[];

export function effortLabel(points: number): string {
  if (points <= 1) return "Liviana";
  if (points <= 3) return "Media";
  return "Pesada";
}

// Una tarea con un solo participante es personal: no rota y no suma RoomiCoins.
export function isPersonal(participantCount: number): boolean {
  return participantCount === 1;
}

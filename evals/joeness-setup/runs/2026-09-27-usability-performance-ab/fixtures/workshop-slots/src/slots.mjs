export function reserveSlot(existing, request) {
  if (!request.id || !request.slot) throw new Error('id and slot required');
  return [...existing, {id: request.id, slot: request.slot, status: 'reserved'}];
}

export function cancelSlot(existing, id) {
  return existing.filter((item) => item.id !== id);
}

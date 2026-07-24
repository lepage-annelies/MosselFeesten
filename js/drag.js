/**
 * Chair drag-and-drop functionality
 */
import { CONFIG } from './config.js';
import { DOM } from './ui.js';

/**
 * Start dragging a chair in admin mode
 */
export function startDrag(event, chairId, button, workingLayout, onDragUpdate) {
  event.preventDefault();
  button.setPointerCapture(event.pointerId);

  const drag = { id: chairId, button, moved: false };
  const chair = workingLayout.find((c) => c.id === chairId);

  if (!chair) return null;

  const onPointermove = (e) => {
    const rect = DOM.plan.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    chair.x = Number((Math.round(x * CONFIG.POSITION_PRECISION) / CONFIG.POSITION_PRECISION).toFixed(1));
    chair.y = Number((Math.round(y * CONFIG.POSITION_PRECISION) / CONFIG.POSITION_PRECISION).toFixed(1));

    button.style.left = chair.x + '%';
    button.style.top = chair.y + '%';
    drag.moved = true;
  };

  const onPointerend = () => {
    button.removeEventListener('pointermove', onPointermove);
    button.removeEventListener('pointerup', onPointerend);
    button.removeEventListener('pointercancel', onPointerend);
  };

  button.addEventListener('pointermove', onPointermove);
  button.addEventListener('pointerup', onPointerend);
  button.addEventListener('pointercancel', onPointerend);

  return drag;
}
/**
 * 为指定的 DOM 元素添加四周 resize 的功能，并限制最小和最大尺寸。
 * @param element 目标元素（需要设置 position 为 absolute 或 relative）
 */
export function makeDraggable(element: HTMLDivElement) {
  // 为目标元素添加 handle 节点
  let currentDragger: HTMLDivElement | null = null;
  let transition:[number, number] = [0, 0];
  let cursor: string = '';
  let originalMouseX: number = 0;
  let originalMouseY: number = 0;


  const getTranslate = (element:HTMLElement):[number, number] => {
    const transformMatrix = (element.style as any)['WebkitTransform'] || getComputedStyle(element, '').getPropertyValue('-webkit-transform') || (element.style as any)['transform'] ||  getComputedStyle(element, '').getPropertyValue('transform');
    const matrix = transformMatrix.match(/-?[0-9]+\.?[0-9]*/g);
    const x = matrix && parseInt(matrix[0]) || 0; //translate x
    const y = matrix && parseInt(matrix[1]) || 0; //translate y
    return [x, y];
  };

  const drag = (e: PointerEvent) => {
    if (!currentDragger) return;
    const dragX = e.pageX - originalMouseX;
    const dragY = e.pageY - originalMouseY;
    element.style.transform = `translate(${transition[0] + dragX}px, ${transition[1] + dragY}px)`;
  };

  element.addEventListener('pointerdown', bindDrag);
  function bindDrag(e: PointerEvent) {
    currentDragger = e.target as HTMLDivElement;
    originalMouseX = e.pageX;
    originalMouseY = e.pageY;
    element.addEventListener('pointermove', drag);
    element.addEventListener('pointerup', stopDrag);
    document.body.addEventListener('pointerup', stopDrag);
    element.setPointerCapture(e.pointerId);
    transition = getTranslate(element);
    cursor = element.style.cursor;
    element.style.cursor = 'move';
    e.stopPropagation();
  }
  function removeEventListener() {
    currentDragger = null;
    element.removeEventListener('pointermove', drag);
    element.removeEventListener('pointerup', stopDrag);
    document.body.removeEventListener('pointerup', stopDrag);
    element.style.cursor = cursor ;
  }
  function stopDrag(e: PointerEvent): void {
    if (!currentDragger) return; // 如果已经停止，直接返回
    drag(e);
    removeEventListener();
    e.stopPropagation();
  }
  function destroy() {
    stop();
    element.removeEventListener('pointerdown', bindDrag);
  }
  function stop(): void {
    removeEventListener();
  }
  return { destroy };
}
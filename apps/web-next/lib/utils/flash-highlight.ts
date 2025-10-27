export function flashHighlight(element: HTMLElement, duration: number = 1000): void {
  element.style.transition = 'background-color 0.3s ease';
  element.style.backgroundColor = '#fef3c7'; // yellow-100
  
  setTimeout(() => {
    element.style.backgroundColor = '';
    setTimeout(() => {
      element.style.transition = '';
    }, 300);
  }, duration);
}

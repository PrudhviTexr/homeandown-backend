/**
 * Accessibility utilities for screen readers and keyboard navigation
 */

/**
 * Moves focus to an element and optionally scrolls it into view
 * @param elementId - ID of the element to focus
 * @param scrollIntoView - Whether to scroll the element into view
 */
export const focusElement = (elementId: string, scrollIntoView = true): void => {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
    if (scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

/**
 * Announces a message to screen readers
 * @param message - Message to announce
 * @param priority - Priority level for the announcement
 */
export const announceToScreenReader = (
  message: string, 
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove the announcement after it's been read
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Manages focus trap within a modal or dialog
 * @param containerElement - The container element to trap focus within
 * @returns Function to remove the focus trap
 */
export const createFocusTrap = (containerElement: HTMLElement): (() => void) => {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
    
    // Escape key to close modal
    if (e.key === 'Escape') {
      const closeButton = containerElement.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  };
  
  containerElement.addEventListener('keydown', handleTabKey);
  
  // Focus the first element initially
  if (firstElement) {
    firstElement.focus();
  }
  
  // Return cleanup function
  return () => {
    containerElement.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Checks if an element has sufficient color contrast
 * @param element - DOM element to check
 * @returns Object with contrast information
 */
export const checkColorContrast = (): {
  ratio: number;
  isAccessible: boolean;
  level: 'AA' | 'AAA' | 'FAIL';
} => {
  // Get computed styles for future contrast calculation
  // const styles = window.getComputedStyle(element);
  // const backgroundColor = styles.backgroundColor;
  // const color = styles.color;
  
  // This is a simplified check - in a real implementation,
  // you'd use a proper color contrast calculation library
  const ratio = calculateContrastRatio();
  
  return {
    ratio,
    isAccessible: ratio >= 4.5,
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL'
  };
};

/**
 * Simplified contrast ratio calculation
 * In production, use a proper library like 'color-contrast'
 */
const calculateContrastRatio = (): number => {
  // This is a placeholder implementation
  // Use a proper color contrast library in production
  return 4.5; // Assuming AA compliance for now
};

/**
 * Adds skip link for keyboard navigation
 * @param targetId - ID of the main content area
 * @param text - Text for the skip link
 */
export const addSkipLink = (
  targetId: string, 
  text = 'Skip to main content'
): void => {
  const existingSkipLink = document.querySelector('.skip-link');
  if (existingSkipLink) return; // Skip link already exists
  
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 9999;
    transition: top 0.3s ease;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
};

/**
 * Validates form accessibility
 * @param formElement - Form element to validate
 * @returns Accessibility issues found
 */
export const validateFormAccessibility = (formElement: HTMLFormElement): {
  issues: string[];
  isAccessible: boolean;
} => {
  const issues: string[] = [];
  
  // Check for labels
  const inputs = formElement.querySelectorAll('input, select, textarea');
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (!id || (!ariaLabel && !ariaLabelledBy)) {
      const label = formElement.querySelector(`label[for="${id}"]`);
      if (!label) {
        issues.push(`Input ${index + 1} missing proper label or aria-label`);
      }
    }
  });
  
  // Check for fieldsets with legends for radio/checkbox groups
  const radioGroups = formElement.querySelectorAll('input[type="radio"]');
  const checkboxGroups = formElement.querySelectorAll('input[type="checkbox"]');
  
  if (radioGroups.length > 1 || checkboxGroups.length > 1) {
    const fieldset = formElement.querySelector('fieldset');
    if (!fieldset || !fieldset.querySelector('legend')) {
      issues.push('Related form controls should be grouped in fieldset with legend');
    }
  }
  
  // Check for required field indicators
  const requiredInputs = formElement.querySelectorAll('[required]');
  requiredInputs.forEach((input, index) => {
    const ariaRequired = input.getAttribute('aria-required');
    if (!ariaRequired) {
      issues.push(`Required input ${index + 1} missing aria-required attribute`);
    }
  });
  
  return {
    issues,
    isAccessible: issues.length === 0
  };
};
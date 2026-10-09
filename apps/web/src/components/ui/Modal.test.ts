import { describe, it, expect, vi } from 'vitest';
import { trapFocusKeydown } from './Modal';

describe('Modal Accessibility & Focus Trap Contracts', () => {
  it('ignores non-Tab keydown events', () => {
    const preventDefault = vi.fn();
    const btn1 = { focus: vi.fn() };
    const btn2 = { focus: vi.fn() };

    const handled = trapFocusKeydown(
      { key: 'Escape', shiftKey: false, preventDefault },
      [btn1, btn2],
      btn1
    );

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(btn1.focus).not.toHaveBeenCalled();
    expect(btn2.focus).not.toHaveBeenCalled();
  });

  it('prevents default if no focusable elements are present', () => {
    const preventDefault = vi.fn();

    const handled = trapFocusKeydown(
      { key: 'Tab', shiftKey: false, preventDefault },
      [],
      null
    );

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('wraps focus from last element to first element on forward Tab', () => {
    const preventDefault = vi.fn();
    const btn1 = { focus: vi.fn() };
    const btn2 = { focus: vi.fn() };
    const btn3 = { focus: vi.fn() };

    // When focused on last element (btn3) and Tab is pressed:
    const handled = trapFocusKeydown(
      { key: 'Tab', shiftKey: false, preventDefault },
      [btn1, btn2, btn3],
      btn3
    );

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(btn1.focus).toHaveBeenCalled();
    expect(btn2.focus).not.toHaveBeenCalled();
  });

  it('wraps focus from first element to last element on Shift+Tab', () => {
    const preventDefault = vi.fn();
    const btn1 = { focus: vi.fn() };
    const btn2 = { focus: vi.fn() };
    const btn3 = { focus: vi.fn() };

    // When focused on first element (btn1) and Shift+Tab is pressed:
    const handled = trapFocusKeydown(
      { key: 'Tab', shiftKey: true, preventDefault },
      [btn1, btn2, btn3],
      btn1
    );

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(btn3.focus).toHaveBeenCalled();
    expect(btn2.focus).not.toHaveBeenCalled();
  });

  it('allows natural browser Tab navigation when not at boundaries', () => {
    const preventDefault = vi.fn();
    const btn1 = { focus: vi.fn() };
    const btn2 = { focus: vi.fn() };
    const btn3 = { focus: vi.fn() };

    // When focused on middle element (btn2) and Tab is pressed:
    const handled = trapFocusKeydown(
      { key: 'Tab', shiftKey: false, preventDefault },
      [btn1, btn2, btn3],
      btn2
    );

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(btn1.focus).not.toHaveBeenCalled();
    expect(btn3.focus).not.toHaveBeenCalled();
  });
});

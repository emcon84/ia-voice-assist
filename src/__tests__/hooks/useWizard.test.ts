import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWizard } from '@/hooks/useWizard';

describe('useWizard - Simple Tests', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useWizard());

    expect(result.current.step).toBe(0);
    expect(result.current.answers).toEqual({});
    expect(result.current.direction).toBe(1);
    expect(result.current.currentQuestion).toBeDefined();
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.isLastStep).toBe(false);
  });

  it('should update answers when selecting option', async () => {
    const { result } = renderHook(() => useWizard());
    const mockOnSelect = vi.fn();

    act(() => {
      result.current.selectOption('losa', mockOnSelect);
    });

    // Wait for the setTimeout to complete
    await waitFor(() => {
      expect(result.current.step).toBe(1);
      expect(result.current.answers).toEqual({ tipo: 'losa' });
      expect(result.current.canGoBack).toBe(true);
    });

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('should call onSelect when reaching last step', async () => {
    const { result } = renderHook(() => useWizard());
    const mockOnSelect = vi.fn();

    // Navigate through all steps
    act(() => {
      result.current.selectOption('losa', mockOnSelect);
    });

    await waitFor(() => {
      expect(result.current.step).toBe(1);
    });

    act(() => {
      result.current.selectOption('no', mockOnSelect);
    });

    await waitFor(() => {
      expect(result.current.step).toBe(2);
    });

    act(() => {
      result.current.selectOption('media', mockOnSelect);
    });

    await waitFor(() => {
      expect(result.current.step).toBe(3);
    });

    // Last step should call onSelect
    act(() => {
      result.current.selectOption('normal', mockOnSelect);
    });

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.arrayContaining(['estructural', 'autocompactante'])
    );
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useWizard());
    const mockOnSelect = vi.fn();

    act(() => {
      result.current.selectOption('losa', mockOnSelect);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.step).toBe(0);
    expect(result.current.answers).toEqual({});
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.isLastStep).toBe(false);
  });

  it('should calculate progress correctly', () => {
    const { result } = renderHook(() => useWizard());

    // Step 1 (index 0) -> 25%
    expect(result.current.progress).toBe(25);
  });
});

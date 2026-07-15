import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VolumeCalculator } from "@/components/chat/VolumeCalculator";

describe("VolumeCalculator - Simple Tests", () => {
  const mockOnResult = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render calculator form", () => {
    render(<VolumeCalculator onResult={mockOnResult} onClose={mockOnClose} />);

    expect(screen.getByText("Calculadora de volumen")).toBeInTheDocument();
    expect(screen.getByText("Largo (m)")).toBeInTheDocument();
    expect(screen.getByText("Ancho (m)")).toBeInTheDocument();
    expect(screen.getByText("Alto (m)")).toBeInTheDocument();
    expect(screen.getByText("Calcular")).toBeInTheDocument();
  });

  it("should render with initial empty values", () => {
    render(<VolumeCalculator onResult={mockOnResult} onClose={mockOnClose} />);

    const numberInputs = screen.getAllByRole("spinbutton");
    expect(numberInputs.length).toBeGreaterThanOrEqual(3);
  });

  it("should calculate volume correctly", () => {
    render(<VolumeCalculator onResult={mockOnResult} onClose={mockOnClose} />);

    // Find all number inputs
    const numberInputs = screen.getAllByRole("spinbutton");

    // Set dimensions
    fireEvent.change(numberInputs[0], { target: { value: "2" } }); // Largo
    fireEvent.change(numberInputs[1], { target: { value: "3" } }); // Ancho
    fireEvent.change(numberInputs[2], { target: { value: "1" } }); // Alto

    // Calculate
    const calculateButton = screen.getByText("Calcular");
    fireEvent.click(calculateButton);

    expect(mockOnResult).toHaveBeenCalledWith(6, "estructural");
  });

  it("should handle decimal values", () => {
    render(<VolumeCalculator onResult={mockOnResult} onClose={mockOnClose} />);

    const numberInputs = screen.getAllByRole("spinbutton");

    // Set dimensions with decimals
    fireEvent.change(numberInputs[0], { target: { value: "2.5" } });
    fireEvent.change(numberInputs[1], { target: { value: "3.2" } });
    fireEvent.change(numberInputs[2], { target: { value: "0.5" } });

    const calculateButton = screen.getByText("Calcular");
    fireEvent.click(calculateButton);

    expect(mockOnResult).toHaveBeenCalledWith(4, "estructural");
  });

  it("should call onClose when close button is clicked", () => {
    render(<VolumeCalculator onResult={mockOnResult} onClose={mockOnClose} />);

    const closeButton = screen.getByText("✕");

    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should handle different concrete types", () => {
    render(<VolumeCalculator onResult={mockOnResult} onClose={mockOnClose} />);

    const numberInputs = screen.getAllByRole("spinbutton");
    const selectElement = screen.getByDisplayValue("Estructural (20-35 MPa)");

    // Change concrete type
    fireEvent.change(selectElement, { target: { value: "impermeable" } });

    // Set dimensions
    fireEvent.change(numberInputs[0], { target: { value: "2" } });
    fireEvent.change(numberInputs[1], { target: { value: "3" } });
    fireEvent.change(numberInputs[2], { target: { value: "1" } });

    const calculateButton = screen.getByText("Calcular");
    fireEvent.click(calculateButton);

    expect(mockOnResult).toHaveBeenCalledWith(6, "impermeable");
  });

  it("should not call onResult for zero volume", () => {
    render(<VolumeCalculator onResult={mockOnResult} onClose={mockOnClose} />);

    const calculateButton = screen.getByText("Calcular");

    fireEvent.click(calculateButton);

    expect(mockOnResult).not.toHaveBeenCalled();
  });

  it("should have proper accessibility attributes", () => {
    render(<VolumeCalculator onResult={mockOnResult} onClose={mockOnClose} />);

    const numberInputs = screen.getAllByRole("spinbutton");
    const calculateButton = screen.getByText("Calcular");

    expect(numberInputs[0]).toHaveAttribute("type", "number");
    expect(calculateButton).toBeInTheDocument();
  });

  it("should handle keyboard input correctly", () => {
    render(<VolumeCalculator onResult={mockOnResult} onClose={mockOnClose} />);

    const numberInputs = screen.getAllByRole("spinbutton");

    fireEvent.change(numberInputs[0], { target: { value: "10" } });

    expect(numberInputs[0]).toHaveValue(10);
  });

  it("should prevent calculation with empty inputs", () => {
    render(<VolumeCalculator onResult={mockOnResult} onClose={mockOnClose} />);

    const calculateButton = screen.getByText("Calcular");

    fireEvent.click(calculateButton);

    expect(mockOnResult).not.toHaveBeenCalled();
  });
});

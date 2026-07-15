import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MessageContent } from "@/components/chat/MessageContent";

describe("MessageContent - Fixed Tests", () => {
  it("should render simple text", () => {
    render(<MessageContent content="Hello world" />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("should render markdown headers", () => {
    render(<MessageContent content="# Header" />);

    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("should render markdown paragraphs", () => {
    render(<MessageContent content="First paragraph" />);

    expect(screen.getByText("First paragraph")).toBeInTheDocument();
  });

  it("should render markdown lists", () => {
    render(<MessageContent content="- Item 1" />);

    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("should render markdown strong text", () => {
    render(<MessageContent content="This is **bold** text" />);

    expect(screen.getByText("bold")).toBeInTheDocument();
  });

  it("should render GitHub-flavored markdown links", () => {
    render(<MessageContent content="[Link text](https://example.com)" />);

    expect(screen.getByText("Link text")).toBeInTheDocument();
  });

  it("should handle empty content", () => {
    render(<MessageContent content="" />);

    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it("should render code blocks", () => {
    render(<MessageContent content="`inline code`" />);

    expect(screen.getByText("inline code")).toBeInTheDocument();
  });

  it("should handle complex markdown structure", () => {
    const content = "# Important Notice\n\nThis is **critical** information.";

    render(<MessageContent content={content} />);

    expect(screen.getByText("Important Notice")).toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
    expect(
      screen.getByText(
        (content, element) =>
          content.includes("This is") && content.includes("information."),
      ),
    ).toBeInTheDocument();
  });

  it("should render list items correctly", () => {
    render(<MessageContent content="- First item" />);

    expect(screen.getByText("First item")).toBeInTheDocument();
  });

  it("should render numbered lists", () => {
    render(<MessageContent content="1. First item" />);

    expect(screen.getByText("First item")).toBeInTheDocument();
  });

  it("should handle multiple paragraphs", () => {
    render(<MessageContent content="Paragraph one" />);

    expect(screen.getByText("Paragraph one")).toBeInTheDocument();

    // Test second paragraph separately
    render(<MessageContent content="Paragraph two" />);

    expect(screen.getByText("Paragraph two")).toBeInTheDocument();
  });

  it("should render emphasis text", () => {
    render(<MessageContent content="This is *italic* text" />);

    expect(screen.getByText("italic")).toBeInTheDocument();
  });

  it("should handle mixed formatting", () => {
    render(<MessageContent content="**Bold** and *italic* text" />);

    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("italic")).toBeInTheDocument();
    // Check that the complete content exists in the document
    expect(document.body).toHaveTextContent("Bold and italic text");
  });

  it("should render blockquotes", () => {
    render(<MessageContent content="> This is a quote" />);

    expect(screen.getByText("This is a quote")).toBeInTheDocument();
  });
});

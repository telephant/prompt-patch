import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PatchTooltip } from '@/components/editor/PatchTooltip'
import { Selection } from '@/lib/types'

const mockSelection: Selection = {
  text: 'This is sample text to be patched',
  range: new Range(),
  position: {
    top: 100,
    left: 200,
    width: 300,
    height: 40,
    cursorX: 500,
    cursorY: 140,
  },
}

describe('PatchTooltip', () => {
  it('should render with selected text', () => {
    const mockOnClose = vi.fn()
    const mockOnGeneratePatch = vi.fn()

    render(
      <PatchTooltip
        selection={mockSelection}
        onClose={mockOnClose}
        onGeneratePatch={mockOnGeneratePatch}
      />
    )

    expect(screen.getByText('Edit Selected Text')).toBeInTheDocument()
    expect(screen.getByText('This is sample text to be patched')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe how you want to modify this text...')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn()
    const mockOnGeneratePatch = vi.fn()

    render(
      <PatchTooltip
        selection={mockSelection}
        onClose={mockOnClose}
        onGeneratePatch={mockOnGeneratePatch}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close patch tooltip/i })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when cancel button is clicked', () => {
    const mockOnClose = vi.fn()
    const mockOnGeneratePatch = vi.fn()

    render(
      <PatchTooltip
        selection={mockSelection}
        onClose={mockOnClose}
        onGeneratePatch={mockOnGeneratePatch}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onGeneratePatch when form is submitted', async () => {
    const mockOnClose = vi.fn()
    const mockOnGeneratePatch = vi.fn().mockResolvedValue(undefined)

    render(
      <PatchTooltip
        selection={mockSelection}
        onClose={mockOnClose}
        onGeneratePatch={mockOnGeneratePatch}
      />
    )

    const textarea = screen.getByPlaceholderText('Describe how you want to modify this text...')
    const submitButton = screen.getByRole('button', { name: /generate patch/i })

    fireEvent.change(textarea, { target: { value: 'Make this text more concise' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnGeneratePatch).toHaveBeenCalledWith(
        'This is sample text to be patched',
        'Make this text more concise'
      )
    })

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should disable submit button when textarea is empty', () => {
    const mockOnClose = vi.fn()
    const mockOnGeneratePatch = vi.fn()

    render(
      <PatchTooltip
        selection={mockSelection}
        onClose={mockOnClose}
        onGeneratePatch={mockOnGeneratePatch}
      />
    )

    const submitButton = screen.getByRole('button', { name: /generate patch/i })
    expect(submitButton).toBeDisabled()
  })

  it('should show loading state when generating', () => {
    const mockOnClose = vi.fn()
    const mockOnGeneratePatch = vi.fn()

    render(
      <PatchTooltip
        selection={mockSelection}
        onClose={mockOnClose}
        onGeneratePatch={mockOnGeneratePatch}
        isGenerating={true}
      />
    )

    expect(screen.getByText('Generating...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled()
  })

  it('should prevent form submission with empty prompt', async () => {
    const mockOnClose = vi.fn()
    const mockOnGeneratePatch = vi.fn()

    render(
      <PatchTooltip
        selection={mockSelection}
        onClose={mockOnClose}
        onGeneratePatch={mockOnGeneratePatch}
      />
    )

    const form = screen.getByRole('form')
    fireEvent.submit(form)

    expect(mockOnGeneratePatch).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})
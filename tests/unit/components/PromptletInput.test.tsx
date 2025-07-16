import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptletInput } from '@/components/prompts/PromptletInput'

describe('PromptletInput', () => {
  it('renders input field and submit button', () => {
    render(<PromptletInput />)
    
    expect(screen.getByTestId('promptlet-input')).toBeInTheDocument()
    expect(screen.getByTestId('generate-button')).toBeInTheDocument()
    expect(screen.getByText('Generate Document')).toBeInTheDocument()
  })

  it('disables submit button when input is empty', () => {
    render(<PromptletInput />)
    
    const button = screen.getByTestId('generate-button')
    expect(button).toBeDisabled()
  })

  it('enables submit button when input has text', async () => {
    const user = userEvent.setup()
    render(<PromptletInput />)
    
    const input = screen.getByTestId('promptlet-input')
    const button = screen.getByTestId('generate-button')
    
    await user.type(input, 'Write a story about cats')
    
    expect(button).not.toBeDisabled()
  })

  it('calls onSubmit when form is submitted', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PromptletInput onSubmit={onSubmit} />)
    
    const input = screen.getByTestId('promptlet-input')
    const button = screen.getByTestId('generate-button')
    
    await user.type(input, 'Test promptlet')
    await user.click(button)
    
    expect(onSubmit).toHaveBeenCalledWith('Test promptlet')
  })

  it('shows loading state when isLoading is true', () => {
    render(<PromptletInput isLoading={true} />)
    
    expect(screen.getByText('Generating...')).toBeInTheDocument()
    expect(screen.getByTestId('generate-button')).toBeDisabled()
    expect(screen.getByText('This may take a few seconds...')).toBeInTheDocument()
  })

  it('disables input and button during loading', () => {
    render(<PromptletInput isLoading={true} />)
    
    const input = screen.getByTestId('promptlet-input')
    const button = screen.getByTestId('generate-button')
    
    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('submits on Enter key press', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PromptletInput onSubmit={onSubmit} />)
    
    const input = screen.getByTestId('promptlet-input')
    
    await user.type(input, 'Test promptlet')
    await user.keyboard('{Enter}')
    
    expect(onSubmit).toHaveBeenCalledWith('Test promptlet')
  })

  it('trims whitespace from input before submitting', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PromptletInput onSubmit={onSubmit} />)
    
    const input = screen.getByTestId('promptlet-input')
    const button = screen.getByTestId('generate-button')
    
    await user.type(input, '  Test promptlet  ')
    await user.click(button)
    
    expect(onSubmit).toHaveBeenCalledWith('Test promptlet')
  })
})
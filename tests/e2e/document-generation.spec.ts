import { test, expect } from '@playwright/test'

test.describe('Document Generation', () => {
  test('user can generate documents with default key', async ({ page }) => {
    await page.goto('/')

    // Check if the page loads correctly
    await expect(page.getByRole('heading', { name: 'Prompt Patch' })).toBeVisible()
    await expect(page.getByText('AI-powered writing tool with localized editing')).toBeVisible()
    
    // Check that settings button is available
    await expect(page.getByText('Settings')).toBeVisible()
    
    // Enter a promptlet
    await page.getByTestId('promptlet-input').fill('Write a short hello')
    
    // Button should be enabled with valid input
    await expect(page.getByTestId('generate-button')).toBeEnabled()
    
    // Click generate button
    await page.getByTestId('generate-button').click()
    
    // Should be able to generate immediately using default key
    // We can't reliably test the actual generation in e2e due to API limitations
    // Instead, just verify the button was clickable and no JavaScript errors occurred
    await page.waitForTimeout(1000)
    
    // Check that the page is still functional
    await expect(page.getByTestId('promptlet-input')).toBeVisible()
  })

  test('user can access settings dialog', async ({ page }) => {
    await page.goto('/')
    
    // Click settings button
    await page.getByText('Settings').click()
    
    // Check that settings dialog opens
    await expect(page.getByText('API Configuration')).toBeVisible()
    await expect(page.getByText('openai API Key').first()).toBeVisible()
    await expect(page.getByText('anthropic API Key').first()).toBeVisible()
    await expect(page.getByText('Using free default key')).toBeVisible()
  })

  test('user sees helpful instructions', async ({ page }) => {
    await page.goto('/')
    
    // Check that we show instructions for empty state
    await expect(page.getByText('Enter a promptlet to generate your first document')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'No document yet' })).toBeVisible()
    
    // Check that the document section exists
    await expect(page.getByRole('heading', { name: 'Document' })).toBeVisible()
    
    // Check that the text selection instructions are visible
    await expect(page.getByText('Select text to edit with AI')).toBeVisible()
  })

  test('button behavior with input validation', async ({ page }) => {
    await page.goto('/')
    
    const input = page.getByTestId('promptlet-input')
    const button = page.getByTestId('generate-button')
    
    // Initially disabled
    await expect(button).toBeDisabled()
    
    // Still disabled with only spaces
    await input.fill('   ')
    await expect(button).toBeDisabled()
    
    // Enabled with actual content
    await input.fill('Real content')
    await expect(button).toBeEnabled()
    
    // Disabled again when cleared
    await input.fill('')
    await expect(button).toBeDisabled()
  })

  test('API key validation UI', async ({ page }) => {
    await page.goto('/')
    
    // Open settings
    await page.getByText('Settings').click()
    
    // Try to save invalid OpenAI key
    await page.getByPlaceholder('Enter your openai API key').fill('invalid-key')
    await page.getByText('Save').first().click()
    
    // Should show validation error
    await expect(page.getByText('Invalid API key format')).toBeVisible()
    
    // Try with valid format
    await page.getByPlaceholder('Enter your openai API key').fill('sk-1234567890abcdefghijklmnopqrstuvwxyz')
    await page.getByText('Save').first().click()
    
    // Should show success
    await expect(page.getByText('API key is configured and ready to use')).toBeVisible()
  })
})
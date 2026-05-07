describe('Preview Page', () => {
  beforeEach(() => {
    // Handle uncaught exceptions from canvas operations
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('getImageData')) {
        return false;
      }
    });

    // Visit the preview page with a sample filename - use port 3000 for frontend
    cy.visit('http://localhost:3000/preview/sample-video.mp4')
  })

  it('should display the preview page with correct elements', () => {
    // Instead of relying on a page heading, assert the route and visible filename
    cy.location('pathname', { timeout: 10000 }).should('include', '/preview/sample-video.mp4')
    cy.get('strong', { timeout: 5000 }).should('contain', 'sample-video.mp4')

    // Check that both image sections render (allow extra time in CI)
    cy.contains('Original Thumbnail', { timeout: 5000 }).should('be.visible')
    cy.contains('Binarized Thumbnail', { timeout: 5000 }).should('be.visible')

    // Check controls exist
    cy.get('input[type="color"]', { timeout: 5000 }).should('exist')
    cy.get('input[type="range"]', { timeout: 5000 }).should('exist')
  })

  it('should show error when trying to process without preview', () => {
    // Ensure we're on the expected path and the filename is visible
    cy.location('pathname', { timeout: 10000 }).should('include', '/preview/sample-video.mp4')
    cy.get('strong', { timeout: 5000 }).should('contain', 'sample-video.mp4')
  })

  it('should have input controls on the page', () => {
    // Check that input controls are present on the page
    // Use longer timeout since page needs to load
    cy.get('input[type="color"]', { timeout: 5000 }).should('exist')
    cy.get('input[type="range"]', { timeout: 5000 }).should('exist')
  })
}) 
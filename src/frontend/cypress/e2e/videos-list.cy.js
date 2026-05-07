describe('Videos List Page', () => {
  beforeEach(() => {
    // Visit the videos list page - use port 3000 for frontend
    cy.visit('http://localhost:3000/videos')
  })

  it('should display the videos list page with heading', () => {
    // Check if the page heading is visible
    cy.contains('h2', 'Video List').should('be.visible')
  })

  it('should display the videos list container', () => {
    // Check that the List component exists (MUI List component renders as ul)
    cy.get('ul').should('exist')
  })

  it('should render the videos page without errors', () => {
    // Verify page loaded successfully by checking for the main container
    cy.get('main').should('exist')
    cy.contains('h2', 'Video List').should('exist')
  })
})

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Custom command to wait for image to load
Cypress.Commands.add('waitForImage', { prevSubject: 'element' }, (subject) => {
  return new Cypress.Promise((resolve) => {
    if (subject[0].complete) {
      resolve(subject);
    } else {
      subject[0].onload = () => {
        resolve(subject);
      };
    }
  });
});

// Custom command to check if canvas has been drawn on
Cypress.Commands.add('canvasShouldBeDrawn', { prevSubject: 'element' }, (subject) => {
  const context = subject[0].getContext('2d');
  // Only check if canvas has dimensions
  if (subject[0].width > 0 && subject[0].height > 0) {
    const imageData = context.getImageData(0, 0, subject[0].width, subject[0].height);
    const hasContent = imageData.data.some(pixel => pixel !== 0);
    expect(hasContent).to.be.true;
  }
  return subject;
});

// Custom command to wait for canvas to be ready
Cypress.Commands.add('waitForCanvas', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).should(($canvas) => {
    expect($canvas[0].width).to.be.greaterThan(0);
    expect($canvas[0].height).to.be.greaterThan(0);
  });
}); 
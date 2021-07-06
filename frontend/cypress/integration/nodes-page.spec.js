/// <reference types="Cypress" />

context("Nodes", () => {
  beforeEach(() => {
    cy.visit("/nodes/validators");
  });

  // https://on.cypress.io/interacting-with-elements

  it("Check for node page", () => {
    cy.url().should("include", "/nodes/validators");
    cy.get(".content-title h1").contains("Nodes");
    // cy.get("#online-node").contains("Online-nodes");
  });

  it("Check validators list", () => {
    cy.url().should("include", "/nodes/validators");
    cy.get(".validator-nodes-row td", { timeout: 20000 }).should("exist");
  });

  // it("Check online nodes tab", () => {
  //   cy.get("#online-node").click();
  //   cy.get(".node-selector").should("have.class", "node-selected");
  //   cy.wait(3000)
  //     .get(".node-row .node-row-title")
  //     .within(($el) => cy.get($el).should("exist", $el.text()));
  //   cy.get(".node-row .node-row-txid").within(($el) =>
  //     cy.get($el).should("exist", $el.text())
  //   );
  // });

  // it("Check nodes map tab", () => {
  //   cy.get("#node-map").click();
  //   cy.wait(10000).get(".mapBackground").should("exist");
  // });
});

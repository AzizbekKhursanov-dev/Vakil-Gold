import { cy } from "cypress"

describe("Offline Functionality", () => {
  beforeEach(() => {
    cy.visit("/")
    cy.login() // Custom command for authentication
  })

  it("should work offline and sync when back online", () => {
    // Load items while online
    cy.get('[data-testid="items-table"]').should("be.visible")
    cy.get('[data-testid="item-row"]').should("have.length.greaterThan", 0)

    // Go offline
    cy.window().then((win) => {
      cy.wrap(win.navigator).invoke("setOnLine", false)
      cy.window().trigger("offline")
    })

    // Verify offline notification
    cy.get('[data-testid="offline-toast"]').should("contain", "Oflayn rejim")

    // Test offline functionality
    cy.get('[data-testid="add-item-button"]').click()
    cy.get('[data-testid="item-form"]').within(() => {
      cy.get('input[name="model"]').type("Test Item Offline")
      cy.get('input[name="category"]').type("Test Category")
      cy.get('input[name="weight"]').type("10")
      cy.get('input[name="lomNarxi"]').type("100")
      cy.get('input[name="laborCost"]').type("20")
      cy.get('button[type="submit"]').click()
    })

    // Verify item appears in local cache
    cy.get('[data-testid="items-table"]').should("contain", "Test Item Offline")

    // Go back online
    cy.window().then((win) => {
      cy.wrap(win.navigator).invoke("setOnLine", true)
      cy.window().trigger("online")
    })

    // Verify online notification and sync
    cy.get('[data-testid="online-toast"]').should("contain", "Internetga ulanish tiklandi")

    // Wait for sync to complete
    cy.wait(2000)

    // Verify item is still there after sync
    cy.get('[data-testid="items-table"]').should("contain", "Test Item Offline")
  })

  it("should show cached data when offline", () => {
    // Ensure we have data cached
    cy.get('[data-testid="items-table"]').should("be.visible")

    // Go offline
    cy.window().then((win) => {
      cy.wrap(win.navigator).invoke("setOnLine", false)
      cy.window().trigger("offline")
    })

    // Refresh page
    cy.reload()

    // Verify cached data is still available
    cy.get('[data-testid="items-table"]').should("be.visible")
    cy.get('[data-testid="item-row"]').should("have.length.greaterThan", 0)
  })

  it("should handle search and filtering offline", () => {
    // Go offline
    cy.window().then((win) => {
      cy.wrap(win.navigator).invoke("setOnLine", false)
      cy.window().trigger("offline")
    })

    // Test search functionality
    cy.get('[data-testid="search-input"]').type("ring")
    cy.get('[data-testid="items-table"]').should("be.visible")

    // Test filtering
    cy.get('[data-testid="category-filter"]').select("rings")
    cy.get('[data-testid="items-table"]').should("be.visible")
  })
})

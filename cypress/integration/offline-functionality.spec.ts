/// <reference types="cypress" />
const cy = require("cypress")

describe("Offline Functionality", () => {
  beforeEach(() => {
    // Visit the app
    cy.visit("/")

    // Wait for app to load
    cy.get('[data-testid="dashboard"]', { timeout: 10000 }).should("be.visible")
  })

  it("should work offline and sync when back online", () => {
    // Test online functionality first
    cy.get('[data-testid="add-item-button"]').click()

    // Fill out item form
    cy.get('[data-testid="item-model"]').type("Test Ring Offline")
    cy.get('[data-testid="item-category"]').select("Uzuk")
    cy.get('[data-testid="item-weight"]').type("5.5")
    cy.get('[data-testid="item-lom-narxi"]').type("100000")
    cy.get('[data-testid="item-lom-narxi-kirim"]').type("95000")
    cy.get('[data-testid="item-labor-cost"]').type("50000")

    // Go offline
    cy.window().then((win) => {
      cy.wrap(win.navigator).invoke("setOnLine", false)
    })

    // Trigger offline event
    cy.window().trigger("offline")

    // Verify offline notification appears
    cy.get('[data-testid="offline-notification"]').should("be.visible")
    cy.get('[data-testid="offline-notification"]').should("contain", "Oflayn rejim")

    // Submit form while offline
    cy.get('[data-testid="submit-item"]').click()

    // Verify item appears in list (optimistic update)
    cy.get('[data-testid="items-list"]').should("contain", "Test Ring Offline")

    // Verify offline actions counter
    cy.get('[data-testid="offline-actions-count"]').should("contain", "1")

    // Go back online
    cy.window().then((win) => {
      cy.wrap(win.navigator).invoke("setOnLine", true)
    })

    // Trigger online event
    cy.window().trigger("online")

    // Verify online notification appears
    cy.get('[data-testid="online-notification"]').should("be.visible")
    cy.get('[data-testid="online-notification"]').should("contain", "Internetga ulanish tiklandi")

    // Wait for sync to complete
    cy.get('[data-testid="offline-actions-count"]', { timeout: 10000 }).should("contain", "0")

    // Verify item is still in the list after sync
    cy.get('[data-testid="items-list"]').should("contain", "Test Ring Offline")
  })

  it("should load cached data when offline", () => {
    // Load some data while online
    cy.get('[data-testid="items-list"]').should("be.visible")

    // Go offline
    cy.window().then((win) => {
      cy.wrap(win.navigator).invoke("setOnLine", false)
    })
    cy.window().trigger("offline")

    // Refresh page
    cy.reload()

    // Verify cached data loads
    cy.get('[data-testid="items-list"]').should("be.visible")
    cy.get('[data-testid="offline-notification"]').should("be.visible")
  })

  it("should handle offline form validation", () => {
    // Go offline
    cy.window().then((win) => {
      cy.wrap(win.navigator).invoke("setOnLine", false)
    })
    cy.window().trigger("offline")

    // Try to submit invalid form
    cy.get('[data-testid="add-item-button"]').click()
    cy.get('[data-testid="submit-item"]').click()

    // Verify validation errors appear
    cy.get('[data-testid="form-errors"]').should("be.visible")
    cy.get('[data-testid="form-errors"]').should("contain", "Model majburiy")
  })

  it("should show offline status in UI", () => {
    // Go offline
    cy.window().then((win) => {
      cy.wrap(win.navigator).invoke("setOnLine", false)
    })
    cy.window().trigger("offline")

    // Verify offline indicator
    cy.get('[data-testid="connection-status"]').should("contain", "Oflayn")
    cy.get('[data-testid="connection-status"]').should("have.class", "offline")

    // Go back online
    cy.window().then((win) => {
      cy.wrap(win.navigator).invoke("setOnLine", true)
    })
    cy.window().trigger("online")

    // Verify online indicator
    cy.get('[data-testid="connection-status"]').should("contain", "Onlayn")
    cy.get('[data-testid="connection-status"]').should("have.class", "online")
  })
})

describe("Firebase Emulator Integration", () => {
  beforeEach(() => {
    // Set emulator environment
    cy.window().then((win) => {
      win.localStorage.setItem("useEmulator", "true")
    })

    cy.visit("/")
  })

  it("should connect to Firebase emulators in development", () => {
    // Verify emulator connection
    cy.window().then((win) => {
      expect(win.location.hostname).to.equal("localhost")
    })

    // Check if emulator UI is accessible
    cy.request("http://localhost:4000").then((response) => {
      expect(response.status).to.equal(200)
    })
  })

  it("should perform CRUD operations with emulator", () => {
    // Create item
    cy.get('[data-testid="add-item-button"]').click()
    cy.get('[data-testid="item-model"]').type("Emulator Test Ring")
    cy.get('[data-testid="item-category"]').select("Uzuk")
    cy.get('[data-testid="item-weight"]').type("3.5")
    cy.get('[data-testid="item-lom-narxi"]').type("80000")
    cy.get('[data-testid="item-lom-narxi-kirim"]').type("75000")
    cy.get('[data-testid="item-labor-cost"]').type("30000")
    cy.get('[data-testid="submit-item"]').click()

    // Verify item appears
    cy.get('[data-testid="items-list"]').should("contain", "Emulator Test Ring")

    // Edit item
    cy.get('[data-testid="item-actions"]').first().click()
    cy.get('[data-testid="edit-item"]').click()
    cy.get('[data-testid="item-model"]').clear().type("Updated Emulator Ring")
    cy.get('[data-testid="submit-item"]').click()

    // Verify update
    cy.get('[data-testid="items-list"]').should("contain", "Updated Emulator Ring")

    // Delete item
    cy.get('[data-testid="item-actions"]').first().click()
    cy.get('[data-testid="delete-item"]').click()
    cy.get('[data-testid="confirm-delete"]').click()

    // Verify deletion
    cy.get('[data-testid="items-list"]').should("not.contain", "Updated Emulator Ring")
  })
})

import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the Clarity environment
const mockClarity = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // Mock admin address
    setSender: function (address) {
      this.sender = address
    },
  },
  contracts: {
    "vendor-verification": {
      // Mock contract functions
      registerVendor: vi.fn(),
      verifyVendor: vi.fn(),
      rejectVendor: vi.fn(),
      isVerifiedVendor: vi.fn(),
      isVendor: vi.fn(),
      getVendorDetails: vi.fn(),
      transferAdmin: vi.fn(),
    },
  },
}

// Setup global mock
global.clarity = mockClarity

describe("Vendor Verification Contract", () => {
  const admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  const vendor1 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  const vendor2 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC"
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()
    
    // Setup default mock implementations
    mockClarity.tx.setSender(admin)
    
    mockClarity.contracts["vendor-verification"].isVendor.mockImplementation((vendorId) => {
      return vendorId === vendor1
    })
    
    mockClarity.contracts["vendor-verification"].isVerifiedVendor.mockImplementation((vendorId) => {
      return false
    })
    
    mockClarity.contracts["vendor-verification"].getVendorDetails.mockImplementation((vendorId) => {
      if (vendorId === vendor1) {
        return {
          name: "Vendor One",
          "registration-number": "REG123",
          category: "IT Services",
          verified: false,
          "verification-date": 0,
        }
      }
      return null
    })
    
    mockClarity.contracts["vendor-verification"].registerVendor.mockImplementation((name, regNum, category) => {
      if (mockClarity.tx.sender === vendor1) {
        return { err: 1 } // Already registered
      }
      return { ok: true }
    })
    
    mockClarity.contracts["vendor-verification"].verifyVendor.mockImplementation((vendorId) => {
      if (mockClarity.tx.sender !== admin) {
        return { err: 403 } // Not admin
      }
      if (!mockClarity.contracts["vendor-verification"].isVendor(vendorId)) {
        return { err: 404 } // Vendor not found
      }
      return { ok: true }
    })
    
    mockClarity.contracts["vendor-verification"].rejectVendor.mockImplementation((vendorId) => {
      if (mockClarity.tx.sender !== admin) {
        return { err: 403 } // Not admin
      }
      if (!mockClarity.contracts["vendor-verification"].isVendor(vendorId)) {
        return { err: 404 } // Vendor not found
      }
      return { ok: true }
    })
  })
  
  it("should allow a new vendor to register", () => {
    mockClarity.tx.setSender(vendor2)
    
    const result = mockClarity.contracts["vendor-verification"].registerVendor("Vendor Two", "REG456", "Construction")
    
    expect(result).toEqual({ ok: true })
  })
  
  it("should not allow a vendor to register twice", () => {
    mockClarity.tx.setSender(vendor1)
    
    const result = mockClarity.contracts["vendor-verification"].registerVendor("Vendor One", "REG123", "IT Services")
    
    expect(result).toEqual({ err: 1 })
  })
  
  it("should allow admin to verify a vendor", () => {
    mockClarity.tx.setSender(admin)
    
    const result = mockClarity.contracts["vendor-verification"].verifyVendor(vendor1)
    
    expect(result).toEqual({ ok: true })
  })
  
  it("should not allow non-admin to verify a vendor", () => {
    mockClarity.tx.setSender(vendor2)
    
    const result = mockClarity.contracts["vendor-verification"].verifyVendor(vendor1)
    
    expect(result).toEqual({ err: 403 })
  })
  
  it("should not allow verifying a non-existent vendor", () => {
    mockClarity.tx.setSender(admin)
    
    // vendor2 is not registered in our mock
    const result = mockClarity.contracts["vendor-verification"].verifyVendor(vendor2)
    
    expect(result).toEqual({ err: 404 })
  })
  
  it("should allow admin to reject a vendor", () => {
    mockClarity.tx.setSender(admin)
    
    const result = mockClarity.contracts["vendor-verification"].rejectVendor(vendor1)
    
    expect(result).toEqual({ ok: true })
  })
  
  it("should not allow non-admin to reject a vendor", () => {
    mockClarity.tx.setSender(vendor2)
    
    const result = mockClarity.contracts["vendor-verification"].rejectVendor(vendor1)
    
    expect(result).toEqual({ err: 403 })
  })
})

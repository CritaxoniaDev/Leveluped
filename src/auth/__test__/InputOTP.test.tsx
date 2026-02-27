import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import InputOTP from "../InputOTP"
import { MemoryRouter } from "react-router-dom"

describe("InputOTP", () => {
  it("renders verification code input", () => {
    render(
      <MemoryRouter>
        <InputOTP />
      </MemoryRouter>
    )
    expect(screen.getByText(/Enter Verification Code/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/12345678/i)).toBeInTheDocument()
  })
})
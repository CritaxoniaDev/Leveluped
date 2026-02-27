import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Signup from "../Signup"
import { MemoryRouter } from "react-router-dom"

describe("Signup", () => {
  it("renders signup form", () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )
    expect(screen.getByText(/Register to/i)).toBeInTheDocument()
    expect(screen.getByText(/LevelUpED/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Send Verification Code/i })).toBeInTheDocument()
  })
})
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Login from "../Login"
import { MemoryRouter } from "react-router-dom"

describe("Login", () => {
  it("renders login form", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    expect(screen.getByText(/Welcome Back!/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument()
  })
})
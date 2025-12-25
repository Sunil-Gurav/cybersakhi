import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import "../styles/Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Awareness", path: "/awareness" },
    { name: "Legal", path: "/legal-guidance" },
    { name: "Login", path: "/login" },
    { name: "Register", path: "/register" },
  ];

  return (
    <nav className="navbar">
      {/* Brand Section */}
      <div className="nav-brand">
        <Link to="/" className="nav-logo">
          Cyber<span>Sathi 💜</span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="menu-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Nav Links */}
      <ul className={`nav-links ${isOpen ? "open" : ""}`}>
        {navLinks.map((link, index) => (
          <li key={index}>
            <Link
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={
                location.pathname === link.path ? "active-link" : ""
              }
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;

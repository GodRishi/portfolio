# Portfolio Website PRD

## Overview
A fast, beautiful, and interactive portfolio website for Rishi Saha, web developer for brands and businesses. It showcase projects, client testimonials, a contact form, currency/pricing customization, and visual effects like theme toggling and a custom cursor.

## Core Features

### 1. Country & Currency Selector
- **User Story**: As a visitor, I want to select my country/currency so that I can see pricing options relevant to my region.
- **Requirements**:
  - A dropdown list in the header showing flags and country/currency options (India, USA, UK, Europe, Australia, Canada, UAE, Singapore).
  - Selecting a country updates the starting price hint in the hero section and the options in the budget dropdown of the contact form.

### 2. Brutalist Theme Toggle
- **User Story**: As a visitor, I want to switch between dark and light themes.
- **Requirements**:
  - A theme toggle switch in the header that toggles between Obsidian Dark and Blinding Light themes.
  - Toggling updates the background WebGL canvas theme and document styling.

### 3. Lead Contact Form
- **User Story**: As a potential client, I want to send a business inquiry directly from the website.
- **Requirements**:
  - Form fields: Name, Email, Budget Tier (updates with selected currency), and Message.
  - Submits to Web3Forms API.
  - Displays a success overlay on successful submission.
  - If the Web3Forms access key is not set or fails, falls back to a mailto link.

### 4. Visual Effects & Metrics
- **User Story**: As a visitor, I want an engaging experience while navigating the portfolio.
- **Requirements**:
  - Full-screen WebGL canvas showing active Python-like codestream animation.
  - Custom mouse cursor that follows pointer and scales/glows on clickable elements.
  - Footer shows dynamic, changing ping metric and coordinate tracker updated by mouse movement.

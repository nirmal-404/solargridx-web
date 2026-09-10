# SolarGridX web starter

React 19, TypeScript, Vite 7, React Router 7, Axios, Tailwind CSS 4 and shadcn/ui (Radix Nova, neutral theme). The start page is a static placeholder, not an assignment interface.

## Verify the scaffold

Node 20.19+ or a supported newer Node release is required. Run `npm ci`, `npm run dev`, `npm run build`, and `npm run lint` from this directory. The development server uses http://localhost:5173. Students should write final setup instructions after implementing and verifying the application.

Copy .env.example to .env.local when implementing the Axios client. VITE_API_BASE_URL is a reserved public configuration value, not consumed yet. The intended local API is https://localhost:7019/api. No database credentials belong in browser configuration.

## Structure

- components/ui: CLI-generated shadcn components.
- lib/utils: shadcn styling helper.
- pages, layouts, features: future student-written UI and feature organization.
- services: future API transport; never connect directly to MongoDB.
- hooks, types, utils: reusable client support.

BrowserRouter is mounted, but no feature routes, authentication, API calls or domain validation have been implemented. All authoritative business logic belongs to API services.

Installed shadcn primitives: button, card, input, label, badge, table, dialog and select. Add further components through the official CLI when required. The package lock records resolved dependencies.

For IIS/static hosting later, configure SPA fallback to index.html when adding browser routes. Host the API separately and set its allowed web origins. No web deployment is performed here.

This starter was AI-assisted at the user's request. Students must author assignment features and retain an accurate disclosure.

Reference: https://ui.shadcn.com/docs/installation/vite

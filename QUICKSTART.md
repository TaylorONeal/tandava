# Quickstart

Get Tandava running locally in under 2 minutes.

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Steps

```bash
# 1. Clone
git clone https://github.com/TaylorONeal/tandava.git
cd tandava

# 2. Install
npm install

# 3. Enable demo mode
echo "VITE_DEMO_MODE=true" > .env.local

# 4. Run
npm run dev
```

Open http://localhost:8080

---

## What You'll See

Demo mode loads a complete fictional studio (Oxatl Yoga) with:
- 3 locations
- 18 teachers
- 500 members
- Full 2018 calendar with bookings

Use the demo panel to switch personas (Owner, Front Desk, Teacher, Student).

---

## Next Steps

| Goal | Action |
|------|--------|
| Explore the UI | Browse schedule, members, reports |
| Understand the domain | Read [docs/developer/01-domain-model.md](docs/developer/01-domain-model.md) |
| Connect real database | See [Full Setup](#full-setup-with-database) |
| Contribute | Read [CONTRIBUTING.md](CONTRIBUTING.md) |

---

## Full Setup (With Database)

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Start local Supabase (requires Docker)
supabase start

# 3. Apply migrations
supabase db reset

# 4. Configure environment
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
EOF

# 5. Run
npm run dev
```

The Supabase CLI outputs credentials when it starts. Copy the `anon key` into `.env.local`.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8080 in use | Set `VITE_PORT=3000` in .env.local |
| Node version error | Use nvm: `nvm use 18` |
| Supabase won't start | Ensure Docker is running |

---

*For complete documentation, see [README.md](README.md)*

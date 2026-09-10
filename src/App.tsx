import { Button } from '@/components/ui/button'

function App() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-8 text-foreground">
      <section className="w-full max-w-lg space-y-5 rounded-xl border p-8">
        <h1 className="text-3xl font-semibold tracking-tight">SolarGridX</h1>
        <p className="text-muted-foreground">Smart Solar Microgrid Trading System</p>
        <Button disabled>Coming soon</Button>
      </section>
    </main>
  )
}

export default App

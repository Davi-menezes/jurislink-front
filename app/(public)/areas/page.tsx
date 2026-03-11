import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildApiUrl } from "@/lib/api"

export const metadata = {
  title: "Áreas do Direito | JurisLink",
  description: "Explore as principais áreas do direito e encontre advogados especialistas.",
}

export default async function AreasPage() {
  const response = await fetch(buildApiUrl("/api/public/legal-areas"), { cache: "no-store" })
  const payload = response.ok ? await response.json() : null
  const areas = Array.isArray(payload?.areas) ? payload.areas : []

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-serif text-3xl">Áreas do Direito</h1>
      <p className="mt-2 text-muted-foreground">
        Selecione uma área para buscar especialistas.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(areas || []).map((area) => (
          <Link key={area.id} href={`/buscar?area=${area.slug}`}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg">{area.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {area.description || "Veja advogados especializados nesta área."}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

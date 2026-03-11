import { getCurrentUser } from "@/lib/auth/server"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()
  const profile = currentUser?.profile ? (currentUser.profile as any) : null

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={profile} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}

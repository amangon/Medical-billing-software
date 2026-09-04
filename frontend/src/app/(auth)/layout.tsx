export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F1E7] p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[440px]">
        {children}
      </div>
    </div>
  )
}

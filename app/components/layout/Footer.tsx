export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white border-t py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500 text-sm">&copy; {year} ScanCore CMS. All rights reserved.</p>
      </div>
    </footer>
  )
}

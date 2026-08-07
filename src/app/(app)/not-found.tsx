import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="flex min-h-[52svh] items-center bg-[#f5f1e8] text-[#24231f]">
      <div className="container py-20 text-center md:py-28">
        <p className="text-[10px] tracking-[0.24em] text-[#8a6718] uppercase">Error 404</p>
        <h1 className="mt-5 font-editorial text-[clamp(5rem,18vw,11rem)] leading-[0.75] tracking-[-0.07em]">
          Lost in the weave.
        </h1>
        <p className="mx-auto mt-10 max-w-sm text-sm leading-relaxed text-[#24231f]/65 md:text-base">
          The page you are looking for is not here, or may have moved.
        </p>
        <div className="mt-9 flex items-center justify-center gap-5 text-[10px] tracking-[0.18em] uppercase">
          <Link className="border-b border-[#24231f] pb-1 transition-opacity hover:opacity-55" href="/">
            Home
          </Link>
          <Link
            className="border-b border-[#24231f]/30 pb-1 transition-colors hover:border-[#24231f]"
            href="/shop"
          >
            Shop
          </Link>
        </div>
      </div>
    </section>
  )
}

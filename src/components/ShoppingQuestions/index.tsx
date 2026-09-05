import { ArrowUpRight, Plus } from 'lucide-react'
import Link from 'next/link'

const questions = [
  {
    question: 'How do I choose my size?',
    answer:
      'Compare your measurements with our size guide before choosing a size. Switch between centimetres and inches to find your fit. If you need a hand, email contact@honeylooms.in before ordering.',
    href: '/sizing',
    label: 'Find your size',
  },
  {
    question: 'What does delivery cost?',
    answer:
      'Prepaid orders ship FREE across India. Cash on Delivery has a ₹25 handling charge, shown in your order total at checkout.',
    href: '/deliveries-and-returns',
    label: 'Delivery details',
  },
  {
    question: 'When will my order be dispatched?',
    answer:
      'Orders are usually handed to our delivery partner within 1–2 business days. Dispatch time is separate from transit time.',
    href: '/find-order',
    label: 'Track an order',
  },
  {
    question: 'Can I exchange a size?',
    answer:
      'Report size issues within 48 hours of receiving your order. Eligible items must be unworn, unwashed and undamaged, with their tags attached. Return courier charges apply for size exchanges. Please read the full policy before buying.',
    href: '/deliveries-and-returns',
    label: 'Read the exchange and return policy',
  },
]

export function ShoppingQuestions() {
  return (
    <section
      aria-labelledby="shopping-questions"
      className="border-y border-[#24231f]/15 bg-[#f6f3ed] px-5 py-14 md:px-10 md:py-20 lg:px-14"
    >
      <div className="mx-auto grid max-w-[1500px] gap-8 md:grid-cols-[1fr_1.4fr] md:gap-16">
        <div>
          {/*<p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#6d685f]">Before you order</p>*/}
          <h2
            id="shopping-questions"
            className="font-dream-orphanage text-4xl leading-tight md:text-5xl"
          >
            Before You Order
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#6d685f]">
            From choosing a size to receiving your parcel, here are the details that make shopping
            easier.
          </p>
          <a
            href="mailto:contact@honeylooms.in"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4"
          >
            Ask us a question <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
        <div className="border-t border-[#24231f]/20">
          {questions.map(({ question, answer, href, label }) => (
            <details className="group border-b border-[#24231f]/20 py-1" key={question}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {question}
                <Plus
                  aria-hidden="true"
                  className="size-4 shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none"
                />
              </summary>
              <div className="pb-5 text-sm leading-relaxed text-[#6d685f]">
                <p>{answer}</p>
                <Link
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-[#24231f] underline underline-offset-4"
                  href={href}
                >
                  {label}
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

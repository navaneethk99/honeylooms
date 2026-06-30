'use client'

import React, { useState } from 'react'

interface SizeRow {
  size: string
  chest: number // cm
  waist: number // cm
  hips: number // cm
  sleeve: number // cm
  shoulder: number // cm
  length: number // cm
  collar: number // cm
}

const sizeData: SizeRow[] = [
  {
    size: 'XXS',
    chest: 81.3,
    waist: 81.3,
    hips: 71.1,
    sleeve: 71.1,
    shoulder: 63.5,
    length: 86.4,
    collar: 33.0,
  },
  {
    size: 'XS',
    chest: 86.4,
    waist: 86.4,
    hips: 76.2,
    sleeve: 76.2,
    shoulder: 63.5,
    length: 91.4,
    collar: 34.3,
  },
  { size: 'S', chest: 100, waist: 86, hips: 102, sleeve: 63, shoulder: 46, length: 72, collar: 40 },
  { size: 'M', chest: 106, waist: 92, hips: 108, sleeve: 64, shoulder: 48, length: 74, collar: 42 },
  {
    size: 'L',
    chest: 112,
    waist: 98,
    hips: 114,
    sleeve: 65,
    shoulder: 50,
    length: 76,
    collar: 44,
  },
  {
    size: 'XL',
    chest: 118,
    waist: 104,
    hips: 120,
    sleeve: 66,
    shoulder: 52,
    length: 78,
    collar: 46,
  },
  {
    size: 'XXL',
    chest: 124,
    waist: 110,
    hips: 126,
    sleeve: 67,
    shoulder: 54,
    length: 80,
    collar: 48,
  },
]

export function SizingClient() {
  const [unit, setUnit] = useState<'cm' | 'in'>('cm')

  const formatValue = (cmVal: number) => {
    if (unit === 'cm') {
      return cmVal.toString()
    }
    return (cmVal / 2.54).toFixed(1)
  }

  return (
    <div className="w-full">
      {/* Title & Toggle Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-neutral-100 dark:border-neutral-900 pb-5 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold font-sans tracking-tight text-neutral-900 dark:text-neutral-100 uppercase">
            Size Guide
          </h1>
        </div>

        {/* Minimalist Switcher */}
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest select-none">
          <button
            onClick={() => setUnit('cm')}
            className={`pb-0.5 border-b-2 transition-all duration-200 cursor-pointer ${
              unit === 'cm'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            cm
          </button>
          <span className="text-neutral-300 dark:text-neutral-800">|</span>
          <button
            onClick={() => setUnit('in')}
            className={`pb-0.5 border-b-2 transition-all duration-200 cursor-pointer ${
              unit === 'in'
                ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            in
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="pb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 font-medium w-16">
                Size
              </th>
              <th className="pb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 font-medium">
                Bust
              </th>
              <th className="pb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 font-medium">
                To Fit Bust
              </th>
              <th className="pb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 font-medium">
                To Fit Waist
              </th>
              <th className="pb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 font-medium">
                Waist
              </th>
              <th className="pb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 font-medium">
                Front Length
              </th>
              <th className="pb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 font-medium">
                Hips
              </th>
              <th className="pb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500 font-medium">
                Across Shoulder
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {sizeData.map((row) => (
              <tr
                key={row.size}
                className="hover:bg-neutral-50/30 dark:hover:bg-neutral-900/5 transition-colors"
              >
                <td className="py-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {row.size}
                </td>
                <td className="py-4 font-mono text-neutral-600 dark:text-neutral-400">
                  {formatValue(row.chest)}
                </td>
                <td className="py-4 font-mono text-neutral-600 dark:text-neutral-400">
                  {formatValue(row.waist)}
                </td>
                <td className="py-4 font-mono text-neutral-600 dark:text-neutral-400">
                  {formatValue(row.hips)}
                </td>
                <td className="py-4 font-mono text-neutral-600 dark:text-neutral-400">
                  {formatValue(row.sleeve)}
                </td>
                <td className="py-4 font-mono text-neutral-600 dark:text-neutral-400">
                  {formatValue(row.shoulder)}
                </td>
                <td className="py-4 font-mono text-neutral-600 dark:text-neutral-400">
                  {formatValue(row.length)}
                </td>
                <td className="py-4 font-mono text-neutral-600 dark:text-neutral-400">
                  {formatValue(row.collar)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { SelectedSegment } from '../types'

type Props = {
    selectedSegment: SelectedSegment | null
    onClose: () => void
    onSubmit: (length: number) => void
}

export function SegmentLengthModal({ selectedSegment, onClose, onSubmit }: Props) {

    const [value, setValue] = useState(() => selectedSegment?.length.toFixed(2) ?? '')

    if (!selectedSegment) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const parsed = Number(value)
        if (!Number.isFinite(parsed) || parsed <= 0) return
        onSubmit(parsed)
        onClose()
    }

    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <form
                className="flex flex-col gap-4 rounded bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <h2 className="text-lg font-semibold text-gray-800">Segment length</h2>

                <label className="flex items-center gap-2 text-sm text-gray-800">
                    Length (m)
                    <input
                        type="number"
                        step="any"
                        min="0"
                        className="w-32 rounded border border-gray-400 px-2 py-1"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        autoFocus
                    />
                </label>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-800"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
                    >
                        Submit
                    </button>
                </div>
            </form>
        </div>
    )
}

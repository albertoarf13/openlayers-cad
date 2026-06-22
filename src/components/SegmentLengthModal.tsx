import type { SelectedSegment } from '../types'

type Props = {
    selectedSegment: SelectedSegment | null
    onClose: () => void
}

export function SegmentLengthModal({ selectedSegment, onClose }: Props) {

    if (!selectedSegment) return null

    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="flex flex-col gap-4 rounded bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-gray-800">Segment length</h2>

                <p className="text-gray-800">
                    {selectedSegment.length.toFixed(2)} m
                </p>

                <button
                    className="self-end rounded bg-blue-600 px-3 py-2 text-sm text-white"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    )
}

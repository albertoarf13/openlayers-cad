import type { SnapOptions } from '../types'

type Props = {
    snapOptions: SnapOptions
    onChange: (next: SnapOptions) => void
    onClose: () => void
}

export function SnapOptionsModal({ snapOptions, onChange, onClose }: Props) {

    const options: { key: keyof SnapOptions; label: string }[] = [
        { key: 'midpoints', label: 'Center of segments' },
        { key: 'vertices', label: 'Vertices' },
        { key: 'lines', label: 'Lines' },
    ]

    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="flex flex-col gap-4 rounded bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-gray-800">Snap options</h2>

                <div className="flex flex-col gap-2">
                    {options.map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 text-sm text-gray-800">
                            <input
                                type="checkbox"
                                checked={snapOptions[key]}
                                onChange={(e) => onChange({ ...snapOptions, [key]: e.target.checked })}
                            />
                            {label}
                        </label>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-800"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

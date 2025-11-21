// components/layout/guru/DeleteModal.tsx
import { AlertTriangle } from 'lucide-react';

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    loading?: boolean;
}

export function DeleteModal({ isOpen, onClose, onConfirm, itemName, loading = false }: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/30 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="h-10 w-10 bg-red-100/70 rounded-full flex items-center justify-center backdrop-blur-md">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Hapus Data</h3>
                            <p className="text-sm text-gray-700">Konfirmasi penghapusan data</p>
                        </div>
                    </div>

                    <p className="text-gray-900 mb-6">
                        Apakah Anda yakin ingin menghapus <span className="font-semibold">{itemName}</span>?
                        Data yang sudah dihapus tidak dapat dikembalikan.
                    </p>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-200/40 disabled:opacity-50 transition-colors backdrop-blur-md"
                        >
                            Batal
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600/90 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors backdrop-blur-md"
                        >
                            {loading ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


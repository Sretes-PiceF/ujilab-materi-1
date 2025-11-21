import { useState, useEffect } from 'react';
import { X, User, Building2, Calendar, FileText } from 'lucide-react';

interface Siswa {
    id: string;
    name: string;
    nis: string;
    email: string;
    kelas: string;
    jurusan: string;
    telepon: string;
}

interface Dudi {
    id: string;
    nama_perusahaan: string;
    alamat: string;
    telepon: string;
    email: string;
    penanggung_jawab: string;
}

interface Magang {
    id?: string;
    siswa_id: string;
    dudi_id: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: 'pending' | 'diterima' | 'ditolak' | 'berlangsung' | 'selesai' | 'dibatalkan';
    nilai_akhir?: number | null;
    catatan?: string;
    siswa?: Siswa;
    dudi?: Dudi;
}

interface MagangFormData {
    siswa_id: string;
    dudi_id: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: 'pending' | 'diterima' | 'ditolak' | 'berlangsung' | 'selesai' | 'dibatalkan';
    nilai_akhir?: number | null;
    catatan?: string;
}

interface MagangModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: MagangFormData) => Promise<boolean>;
    magang?: Magang | null;
    title: string;
    siswaList?: Siswa[];
    dudiList?: Dudi[];
}

export function MagangModal({ 
    isOpen, 
    onClose, 
    onSave, 
    magang, 
    title,
    siswaList = [],
    dudiList = []
}: MagangModalProps) {
    const [formData, setFormData] = useState<MagangFormData>({
        siswa_id: '',
        dudi_id: '',
        tanggal_mulai: '',
        tanggal_selesai: '',
        status: 'pending',
        nilai_akhir: null,
        catatan: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Reset form ketika modal dibuka/tutup
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setFieldErrors({});
            
            if (magang) {
                // Mode edit - isi form dengan data existing
                setFormData({
                    siswa_id: magang.siswa_id || '',
                    dudi_id: magang.dudi_id || '',
                    tanggal_mulai: magang.tanggal_mulai || '',
                    tanggal_selesai: magang.tanggal_selesai || '',
                    status: magang.status || 'pending',
                    nilai_akhir: magang.nilai_akhir || null,
                    catatan: magang.catatan || '',
                });
            } else {
                // Mode create - reset form
                setFormData({
                    siswa_id: '',
                    dudi_id: '',
                    tanggal_mulai: '',
                    tanggal_selesai: '',
                    status: 'pending',
                    nilai_akhir: null,
                    catatan: '',
                });
            }
        }
    }, [isOpen, magang]);

    const handleSubmit = () => {
        setLoading(true);
        setError(null);
        setFieldErrors({});

        // Validasi client-side
        const errors: Record<string, string> = {};

        if (!formData.siswa_id) {
            errors.siswa_id = 'Siswa wajib dipilih';
        }
        if (!formData.dudi_id) {
            errors.dudi_id = 'DUDI wajib dipilih';
        }
        if (!formData.tanggal_mulai) {
            errors.tanggal_mulai = 'Tanggal mulai wajib diisi';
        }
        if (!formData.tanggal_selesai) {
            errors.tanggal_selesai = 'Tanggal selesai wajib diisi';
        }

        // Validasi tanggal selesai harus lebih besar dari tanggal mulai
        if (formData.tanggal_mulai && formData.tanggal_selesai) {
            const mulai = new Date(formData.tanggal_mulai);
            const selesai = new Date(formData.tanggal_selesai);
            if (selesai <= mulai) {
                errors.tanggal_selesai = 'Tanggal selesai harus lebih besar dari tanggal mulai';
            }
        }

        // Validasi nilai akhir
        if (formData.nilai_akhir !== null && formData.nilai_akhir !== undefined) {
            const nilai = Number(formData.nilai_akhir);
            if (isNaN(nilai) || nilai < 0 || nilai > 100) {
                errors.nilai_akhir = 'Nilai harus antara 0-100';
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setLoading(false);
            return;
        }

        onSave(formData)
            .then(success => {
                if (success) {
                    onClose();
                }
            })
            .catch(err => {
                console.error('Error in modal:', err);
                setError('Terjadi kesalahan saat menyimpan data');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        let processedValue: string | number | null = value;
        
        // Handle nilai_akhir khusus
        if (name === 'nilai_akhir') {
            processedValue = value === '' ? null : Number(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue,
        }));

        // Clear field error ketika user mulai mengetik
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        if (error) {
            setError(null);
        }
    };

    const handleReset = () => {
        setFormData({
            siswa_id: '',
            dudi_id: '',
            tanggal_mulai: '',
            tanggal_selesai: '',
            status: 'pending',
            nilai_akhir: null,
            catatan: ''
        });
        setError(null);
        setFieldErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[#0097BB]" />
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        type="button"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Siswa */}
                        <div className="space-y-2">
                            <label 
                                htmlFor="siswa_id" 
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <User className="h-4 w-4 text-gray-500" />
                                Siswa
                            </label>
                            <select
                                id="siswa_id"
                                name="siswa_id"
                                value={formData.siswa_id}
                                onChange={handleChange}
                                disabled={loading || !!magang}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
                            >
                                <option value="">Pilih Siswa</option>
                                {siswaList.map((siswa) => (
                                    <option key={siswa.id} value={siswa.id}>
                                        {siswa.name} - {siswa.nis}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.siswa_id && (
                                <p className="text-red-500 text-xs">{fieldErrors.siswa_id}</p>
                            )}
                            {magang && (
                                <p className="text-gray-500 text-xs">
                                    Siswa tidak dapat diubah setelah magang dibuat
                                </p>
                            )}
                        </div>

                        {/* DUDI */}
                        <div className="space-y-2">
                            <label 
                                htmlFor="dudi_id" 
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <Building2 className="h-4 w-4 text-gray-500" />
                                DUDI
                            </label>
                            <select
                                id="dudi_id"
                                name="dudi_id"
                                value={formData.dudi_id}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
                            >
                                <option value="">Pilih DUDI</option>
                                {dudiList.map((dudi) => (
                                    <option key={dudi.id} value={dudi.id}>
                                        {dudi.nama_perusahaan}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.dudi_id && (
                                <p className="text-red-500 text-xs">{fieldErrors.dudi_id}</p>
                            )}
                        </div>

                        {/* Tanggal Mulai */}
                        <div className="space-y-2">
                            <label 
                                htmlFor="tanggal_mulai" 
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <Calendar className="h-4 w-4 text-gray-500" />
                                Tanggal Mulai
                            </label>
                            <input
                                id="tanggal_mulai"
                                type="date"
                                name="tanggal_mulai"
                                value={formData.tanggal_mulai}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
                            />
                            {fieldErrors.tanggal_mulai && (
                                <p className="text-red-500 text-xs">{fieldErrors.tanggal_mulai}</p>
                            )}
                        </div>

                        {/* Tanggal Selesai */}
                        <div className="space-y-2">
                            <label 
                                htmlFor="tanggal_selesai" 
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <Calendar className="h-4 w-4 text-gray-500" />
                                Tanggal Selesai
                            </label>
                            <input
                                id="tanggal_selesai"
                                type="date"
                                name="tanggal_selesai"
                                value={formData.tanggal_selesai}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
                            />
                            {fieldErrors.tanggal_selesai && (
                                <p className="text-red-500 text-xs">{fieldErrors.tanggal_selesai}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label 
                                htmlFor="status" 
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
                            >
                                <option value="pending">Pending</option>
                                <option value="diterima">Diterima</option>
                                <option value="ditolak">Ditolak</option>
                                <option value="berlangsung">Berlangsung</option>
                                <option value="selesai">Selesai</option>
                                <option value="dibatalkan">Dibatalkan</option>
                            </select>
                            {fieldErrors.status && (
                                <p className="text-red-500 text-xs">{fieldErrors.status}</p>
                            )}
                        </div>

                        {/* Nilai Akhir */}
                        <div className="space-y-2">
                            <label 
                                htmlFor="nilai_akhir" 
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                <FileText className="h-4 w-4 text-gray-500" />
                                Nilai Akhir (Opsional)
                            </label>
                            <input
                                id="nilai_akhir"
                                type="number"
                                name="nilai_akhir"
                                value={formData.nilai_akhir ?? ''}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                step="0.01"
                                disabled={loading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
                                placeholder="0 - 100"
                            />
                            {fieldErrors.nilai_akhir && (
                                <p className="text-red-500 text-xs">{fieldErrors.nilai_akhir}</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={loading}
                            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-[#0097BB] text-white rounded-lg hover:bg-[#007b9e] disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
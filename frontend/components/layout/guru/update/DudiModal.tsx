import { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Mail, User } from 'lucide-react';

interface Dudi {
    id?: string;
    nama_perusahaan: string;
    alamat: string;
    telepon: string;
    email: string;
    penanggung_jawab: string;
    status: 'aktif' | 'nonaktif' | 'pending';
}

interface DudiFormData {
    nama_perusahaan: string;
    alamat: string;
    telepon: string;
    email: string;
    penanggung_jawab: string;
    status: 'aktif' | 'nonaktif' | 'pending';
}

interface DudiModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: DudiFormData) => Promise<boolean>;
    dudi?: Dudi | any;
    title: string;
}

export function DudiModal({ isOpen, onClose, onSave, dudi, title }: DudiModalProps) {
    const [formData, setFormData] = useState<DudiFormData>({
        nama_perusahaan: '',
        alamat: '',
        telepon: '',
        email: '',
        penanggung_jawab: '',
        status: 'aktif',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Reset form ketika modal dibuka/tutup
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setFieldErrors({});
            
            if (dudi) {
                // Mode edit - isi form dengan data existing
                setFormData({
                    nama_perusahaan: dudi.nama_perusahaan || '',
                    alamat: dudi.alamat || '',
                    telepon: dudi.telepon || '',
                    email: dudi.email || '',
                    penanggung_jawab: dudi.penanggung_jawab || '',
                    status: dudi.status || 'aktif',
                });
            } else {
                // Mode create - reset form
                setFormData({
                    nama_perusahaan: '',
                    alamat: '',
                    telepon: '',
                    email: '',
                    penanggung_jawab: '',
                    status: 'aktif',
                });
            }
        }
    }, [isOpen, dudi]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        // Validasi client-side sederhana
        if (!formData.nama_perusahaan.trim() || 
            !formData.alamat.trim() || 
            !formData.telepon.trim() || 
            !formData.email.trim() || 
            !formData.penanggung_jawab.trim()) {
            setError('Semua field wajib diisi!');
            setLoading(false);
            return;
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setFieldErrors({ email: 'Format email tidak valid' });
            setLoading(false);
            return;
        }

        try {
            const success = await onSave(formData);
            if (success) {
                onClose();
            }
        } catch (err) {
            console.error('Error in modal:', err);
            setError('Terjadi kesalahan saat menyimpan data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
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
            nama_perusahaan: '',
            alamat: '',
            telepon: '',
            email: '',
            penanggung_jawab: '',
            status: 'aktif'
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
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-0">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#0097BB]" />
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
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && !Object.keys(fieldErrors).length && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Nama Perusahaan */}
                    <div className="space-y-2">
                        <label 
                            htmlFor="nama_perusahaan" 
                            className="flex items-center gap-2 text-sm font-medium text-gray-700"
                        >
                            <Building2 className="h-4 w-4 text-gray-500" />
                            Nama Perusahaan
                        </label>
                        <input
                            id="nama_perusahaan"
                            type="text"
                            name="nama_perusahaan"
                            value={formData.nama_perusahaan}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
                            placeholder="Masukkan nama perusahaan"
                        />
                        {fieldErrors.nama_perusahaan && (
                            <p className="text-red-500 text-xs">{fieldErrors.nama_perusahaan}</p>
                        )}
                    </div>

                    {/* Alamat */}
                    <div className="space-y-2">
                        <label 
                            htmlFor="alamat" 
                            className="flex items-center gap-2 text-sm font-medium text-gray-700"
                        >
                            <MapPin className="h-4 w-4 text-gray-500" />
                            Alamat
                        </label>
                        <textarea
                            id="alamat"
                            name="alamat"
                            value={formData.alamat}
                            onChange={handleChange}
                            required
                            rows={3}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent resize-none disabled:opacity-50 bg-white"
                            placeholder="Masukkan alamat lengkap"
                        />
                        {fieldErrors.alamat && (
                            <p className="text-red-500 text-xs">{fieldErrors.alamat}</p>
                        )}
                    </div>

                    {/* Telepon */}
                    <div className="space-y-2">
                        <label 
                            htmlFor="telepon" 
                            className="flex items-center gap-2 text-sm font-medium text-gray-700"
                        >
                            <Phone className="h-4 w-4 text-gray-500" />
                            Telepon
                        </label>
                        <input
                            id="telepon"
                            type="tel"
                            name="telepon"
                            value={formData.telepon}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
                            placeholder="Contoh: 021-12345678 atau 081234567890"
                        />
                        {fieldErrors.telepon && (
                            <p className="text-red-500 text-xs">{fieldErrors.telepon}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label 
                            htmlFor="email" 
                            className="flex items-center gap-2 text-sm font-medium text-gray-700"
                        >
                            <Mail className="h-4 w-4 text-gray-500" />
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading || !!dudi}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
                            placeholder="Contoh: info@perusahaan.com"
                        />
                        {fieldErrors.email && (
                            <p className="text-red-500 text-xs">{fieldErrors.email}</p>
                        )}
                        {dudi && (
                            <p className="text-gray-500 text-xs">
                                Email tidak dapat diubah untuk menjaga konsistensi data
                            </p>
                        )}
                    </div>

                    {/* Penanggung Jawab */}
                    <div className="space-y-2">
                        <label 
                            htmlFor="penanggung_jawab" 
                            className="flex items-center gap-2 text-sm font-medium text-gray-700"
                        >
                            <User className="h-4 w-4 text-gray-500" />
                            Penanggung Jawab
                        </label>
                        <input
                            id="penanggung_jawab"
                            type="text"
                            name="penanggung_jawab"
                            value={formData.penanggung_jawab}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white"
                            placeholder="Nama penanggung jawab"
                        />
                        {fieldErrors.penanggung_jawab && (
                            <p className="text-red-500 text-xs">{fieldErrors.penanggung_jawab}</p>
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
                            <option value="aktif">Aktif</option>
                            <option value="nonaktif">Nonaktif</option>
                            <option value="pending">Pending</option>
                        </select>
                        {fieldErrors.status && (
                            <p className="text-red-500 text-xs">{fieldErrors.status}</p>
                        )}
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
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-[#0097BB] text-white rounded-lg hover:bg-[#007b9e] disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
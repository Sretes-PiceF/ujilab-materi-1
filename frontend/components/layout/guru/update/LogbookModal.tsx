import { useState, useEffect } from 'react';
import { X, Calendar, FileText, Upload, User, Building2, CheckCircle, XCircle, Clock } from 'lucide-react';
import Image from 'next/image';

interface Siswa {
    id: string;
    nama: string;
    nis: string;
    kelas: string;
    jurusan: string;
}

interface Dudi {
    id: string;
    nama_perusahaan: string;
    penanggung_jawab: string;
}

interface LogbookEntry {
    id: number;
    magang_id: number;
    tanggal: string;
    tanggal_formatted: string;
    kegiatan: string;
    kendala: string;
    file: string | null;
    file_url: string | null;
    status_verifikasi: 'pending' | 'disetujui' | 'ditolak';
    catatan_guru: string | null;
    catatan_dudi: string | null;
    siswa: Siswa;
    dudi?: Dudi;
    created_at: string;
    updated_at: string;
}

interface LogbookUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: UpdateFormData) => Promise<boolean>;
    logbook: LogbookEntry | null;
    title: string;
    showStatusUpdate?: boolean;
}

interface UpdateFormData {
    kegiatan: string;
    kendala: string;
    file?: File | null;
    removeFile?: boolean;
    status_verifikasi?: 'pending' | 'disetujui' | 'ditolak';
    catatan_guru?: string;
}

export function LogbookUpdateModal({ 
    isOpen, 
    onClose, 
    onSave, 
    logbook, 
    title,
    showStatusUpdate = false 
}: LogbookUpdateModalProps) {
    const [formData, setFormData] = useState<UpdateFormData>({
        kegiatan: '',
        kendala: '',
        file: null,
        status_verifikasi: 'pending',
        catatan_guru: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const [removeFile, setRemoveFile] = useState(false);

    // Reset form ketika modal dibuka/tutup atau logbook berubah
    useEffect(() => {
        if (isOpen && logbook) {
            setError(null);
            setFieldErrors({});
            setRemoveFile(false);
            
            // Set form data dengan data existing
            setFormData({
                kegiatan: logbook.kegiatan || '',
                kendala: logbook.kendala || '',
                file: null,
                status_verifikasi: logbook.status_verifikasi || 'pending',
                catatan_guru: logbook.catatan_guru || '',
            });

            // Set preview file jika ada
            if (logbook.file_url) {
                setPreviewFile(logbook.file_url);
            } else {
                setPreviewFile(null);
            }
        }
    }, [isOpen, logbook]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setFieldErrors({});

        // Validasi client-side
        const errors: Record<string, string> = {};

        if (!formData.kegiatan.trim()) {
            errors.kegiatan = 'Kegiatan wajib diisi';
        } else if (formData.kegiatan.trim().length < 10) {
            errors.kegiatan = 'Kegiatan minimal 10 karakter';
        }

        if (!formData.kendala.trim()) {
            errors.kendala = 'Kendala wajib diisi';
        } else if (formData.kendala.trim().length < 5) {
            errors.kendala = 'Kendala minimal 5 karakter';
        }

        // Validasi status jika showStatusUpdate aktif
        if (showStatusUpdate) {
            if (!formData.status_verifikasi) {
                errors.status_verifikasi = 'Status verifikasi wajib dipilih';
            }

            // Jika status ditolak, catatan wajib diisi
            if (formData.status_verifikasi === 'ditolak' && !formData.catatan_guru?.trim()) {
                errors.catatan_guru = 'Catatan wajib diisi ketika menolak logbook';
            }
        }

        // Validasi file jika ada
        if (formData.file) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            
            if (formData.file.size > maxSize) {
                errors.file = 'Ukuran file maksimal 5MB';
            }
            
            if (!allowedTypes.includes(formData.file.type)) {
                errors.file = 'Format file harus JPG, PNG, atau PDF';
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setLoading(false);
            return;
        }

        try {
            const success = await onSave({
                ...formData,
                removeFile: removeFile,
            });
            
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

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    const handleStatusChange = (status: 'pending' | 'disetujui' | 'ditolak') => {
        setFormData(prev => ({
            ...prev,
            status_verifikasi: status,
        }));

        // Clear field error
        if (fieldErrors.status_verifikasi) {
            setFieldErrors(prev => ({
                ...prev,
                status_verifikasi: ''
            }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        
        if (file) {
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewFile(reader.result as string);
            };
            reader.readAsDataURL(file);

            setFormData(prev => ({
                ...prev,
                file: file,
            }));

            setRemoveFile(false);

            // Clear file error
            if (fieldErrors.file) {
                setFieldErrors(prev => ({
                    ...prev,
                    file: ''
                }));
            }
        }
    };

    const handleRemoveFile = () => {
        setFormData(prev => ({
            ...prev,
            file: null,
        }));
        setPreviewFile(null);
        setRemoveFile(true);
        
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleReset = () => {
        setFormData({
            kegiatan: '',
            kendala: '',
            file: null,
            status_verifikasi: 'pending',
            catatan_guru: '',
        });
        setError(null);
        setFieldErrors({});
        setPreviewFile(null);
        setRemoveFile(false);
        onClose();
    };

    if (!isOpen || !logbook) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-0">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[#0097BB]" />
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
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Informasi Logbook */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Informasi Logbook
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Informasi Siswa */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">Siswa:</span>
                                </div>
                                <p className="text-sm text-gray-900 ml-6">
                                    {logbook.siswa?.nama || 'N/A'} - {logbook.siswa?.nis || 'N/A'}
                                </p>
                                {logbook.siswa?.kelas && (
                                    <p className="text-xs text-gray-600 ml-6">
                                        {logbook.siswa.kelas} {logbook.siswa.jurusan || ''}
                                    </p>
                                )}
                            </div>

                            {/* Informasi DUDI */}
                            {logbook.dudi && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">DUDI:</span>
                                    </div>
                                    <p className="text-sm text-gray-900 ml-6">
                                        {logbook.dudi.nama_perusahaan}
                                    </p>
                                    {logbook.dudi.penanggung_jawab && (
                                        <p className="text-xs text-gray-600 ml-6">
                                            {logbook.dudi.penanggung_jawab}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Tanggal */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">Tanggal:</span>
                                </div>
                                <p className="text-sm text-gray-900 ml-6">
                                    {logbook.tanggal_formatted}
                                </p>
                            </div>

                            {/* Status Saat Ini */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">Status Saat Ini:</span>
                                </div>
                                <div className="ml-6">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                        logbook.status_verifikasi === 'disetujui' 
                                            ? 'bg-green-100 text-green-700'
                                            : logbook.status_verifikasi === 'ditolak'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {logbook.status_verifikasi === 'disetujui' ? (
                                            <>
                                                <CheckCircle className="h-3 w-3" />
                                                Disetujui
                                            </>
                                        ) : logbook.status_verifikasi === 'ditolak' ? (
                                            <>
                                                <XCircle className="h-3 w-3" />
                                                Ditolak
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-3 w-3" />
                                                Belum Diverifikasi
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Update Logbook */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Edit Konten Logbook</h3>
                        
                        {/* Kegiatan */}
                        <div className="space-y-2">
                            <label htmlFor="kegiatan" className="text-sm font-medium text-gray-700">
                                Kegiatan Harian <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="kegiatan"
                                name="kegiatan"
                                value={formData.kegiatan}
                                onChange={handleChange}
                                disabled={loading}
                                rows={5}
                                placeholder="Jelaskan kegiatan yang dilakukan hari ini..."
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white resize-none ${
                                    fieldErrors.kegiatan ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {fieldErrors.kegiatan && (
                                <p className="text-red-500 text-xs">{fieldErrors.kegiatan}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                {formData.kegiatan.length} karakter (minimal 10)
                            </p>
                        </div>

                        {/* Kendala */}
                        <div className="space-y-2">
                            <label htmlFor="kendala" className="text-sm font-medium text-gray-700">
                                Kendala <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="kendala"
                                name="kendala"
                                value={formData.kendala}
                                onChange={handleChange}
                                disabled={loading}
                                rows={4}
                                placeholder="Jelaskan kendala yang dihadapi (jika ada)..."
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white resize-none ${
                                    fieldErrors.kendala ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {fieldErrors.kendala && (
                                <p className="text-red-500 text-xs">{fieldErrors.kendala}</p>
                            )}
                            <p className="text-xs text-gray-500">
                                {formData.kendala.length} karakter (minimal 5)
                            </p>
                        </div>

                        {/* File Upload */}
                        <div className="space-y-2">
                            <label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
                                Dokumentasi (Opsional)
                            </label>
                            
                            {/* Preview existing file or new file */}
                            {previewFile && !removeFile && (
                                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                                    {previewFile.endsWith('.pdf') ? (
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-red-500" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">File PDF</p>
                                                <p className="text-xs text-gray-500">
                                                    {formData.file ? formData.file.name : 'File saat ini'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <Image
                                            src={previewFile} 
                                            alt="Preview" 
                                            className="max-h-48 mx-auto rounded-lg"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            {/* Upload button */}
                            {(!previewFile || removeFile) && (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0097BB] transition-colors">
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <span className="text-sm text-[#0097BB] hover:underline">
                                            Klik untuk upload file
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            JPG, PNG, atau PDF (Maks. 5MB)
                                        </p>
                                    </label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                                        onChange={handleFileChange}
                                        disabled={loading}
                                        className="hidden"
                                    />
                                </div>
                            )}

                            {previewFile && !removeFile && (
                                <label htmlFor="file-upload-change" className="block">
                                    <div className="cursor-pointer text-center text-sm text-[#0097BB] hover:underline">
                                        Ganti file dokumentasi
                                    </div>
                                    <input
                                        id="file-upload-change"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                                        onChange={handleFileChange}
                                        disabled={loading}
                                        className="hidden"
                                    />
                                </label>
                            )}
                            
                            {fieldErrors.file && (
                                <p className="text-red-500 text-xs">{fieldErrors.file}</p>
                            )}
                        </div>
                    </div>

                    {/* SECTION STATUS VERIFIKASI - Tampil jika showStatusUpdate = true */}
                    {showStatusUpdate && (
                        <div className="border-t-2 border-gray-200 pt-6 mt-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Mode Update Status:</strong> Anda dapat mengubah status verifikasi dan menambahkan catatan untuk logbook ini.
                                </p>
                            </div>

                            <h3 className="font-semibold text-gray-800 mb-4 text-lg">Update Status Verifikasi</h3>
                            
                            {/* Status Buttons */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700">
                                    Pilih Status Verifikasi <span className="text-red-500">*</span>
                                </label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Approved Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange('disetujui')}
                                        disabled={loading}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                                            formData.status_verifikasi === 'disetujui'
                                                ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5" />
                                            <span className="font-semibold">Setujui</span>
                                        </div>
                                        <p className="text-xs mt-1.5">
                                            Logbook disetujui dan diverifikasi
                                        </p>
                                    </button>

                                    {/* Rejected Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange('ditolak')}
                                        disabled={loading}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                                            formData.status_verifikasi === 'ditolak'
                                                ? 'border-red-500 bg-red-50 text-red-700 shadow-md'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-5 w-5" />
                                            <span className="font-semibold">Tolak</span>
                                        </div>
                                        <p className="text-xs mt-1.5">
                                            Logbook ditolak dengan catatan
                                        </p>
                                    </button>

                                    {/* Pending Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange('pending')}
                                        disabled={loading}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                                            formData.status_verifikasi === 'pending'
                                                ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-md'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-300 hover:bg-yellow-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            <span className="font-semibold">Pending</span>
                                        </div>
                                        <p className="text-xs mt-1.5">
                                            Belum diverifikasi
                                        </p>
                                    </button>
                                </div>
                                
                                {fieldErrors.status_verifikasi && (
                                    <p className="text-red-500 text-xs mt-2">{fieldErrors.status_verifikasi}</p>
                                )}
                            </div>

                            {/* Catatan Guru */}
                            <div className="space-y-2 mt-4">
                                <label htmlFor="catatan_guru" className="text-sm font-medium text-gray-700">
                                    Catatan Guru {formData.status_verifikasi === 'ditolak' && <span className="text-red-500">*</span>}
                                    <span className="text-gray-500 text-xs font-normal ml-1">
                                        {formData.status_verifikasi === 'ditolak' 
                                            ? '(Wajib diisi ketika menolak)' 
                                            : '(Opsional)'
                                        }
                                    </span>
                                </label>
                                <textarea
                                    id="catatan_guru"
                                    name="catatan_guru"
                                    value={formData.catatan_guru}
                                    onChange={handleChange}
                                    disabled={loading}
                                    rows={4}
                                    placeholder={
                                        formData.status_verifikasi === 'ditolak'
                                            ? 'Berikan alasan penolakan logbook...'
                                            : 'Berikan catatan atau saran untuk siswa...'
                                    }
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0097BB] focus:border-transparent disabled:opacity-50 bg-white resize-none ${
                                        fieldErrors.catatan_guru ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                />
                                {fieldErrors.catatan_guru && (
                                    <p className="text-red-500 text-xs">{fieldErrors.catatan_guru}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-[#0097BB] text-white rounded-lg hover:bg-[#007b9e] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    {showStatusUpdate ? 'Simpan Perubahan & Status' : 'Simpan Perubahan'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
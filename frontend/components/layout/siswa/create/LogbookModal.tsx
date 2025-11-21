'use client';

import { useState } from 'react';
import { Calendar, FileText, AlertCircle, Upload } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TambahLogbookModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface LogbookFormData {
    tanggal: string;
    kegiatan: string;
    kendala: string;
    file: File | null;
}

export function TambahLogbookModal({ open, onOpenChange, onSuccess }: TambahLogbookModalProps) {
    const [formData, setFormData] = useState<LogbookFormData>({
        tanggal: new Date().toISOString().split('T')[0], // Default hari ini
        kegiatan: '',
        kendala: '',
        file: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        
        if (file) {
            // Validasi tipe file
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                setFieldErrors(prev => ({
                    ...prev,
                    file: 'File harus berformat JPEG, JPG, atau PNG'
                }));
                return;
            }

            // Validasi ukuran file (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                setFieldErrors(prev => ({
                    ...prev,
                    file: 'Ukuran file maksimal 2MB'
                }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                file
            }));

            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            // Clear file error
            if (fieldErrors.file) {
                setFieldErrors(prev => ({
                    ...prev,
                    file: ''
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            const token = localStorage.getItem('access_token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            
            // Create FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('tanggal', formData.tanggal);
            formDataToSend.append('kegiatan', formData.kegiatan);
            formDataToSend.append('kendala', formData.kendala);
            
            if (formData.file) {
                formDataToSend.append('file', formData.file);
            }

            const response = await fetch(`${API_URL}/siswa/logbook/create`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            const result = await response.json();
            console.log('API Response:', result); // Debug

            if (response.status === 422) {
                // Handle validation errors
                if (result.errors) {
                    const errors: Record<string, string> = {};
                    Object.keys(result.errors).forEach(key => {
                        errors[key] = result.errors[key][0]; // Ambil error pertama
                    });
                    setFieldErrors(errors);
                    setError('Terdapat kesalahan dalam pengisian form');
                    return;
                }
            }

            if (response.status === 403) {
                setError(result.message || 'Anda tidak memiliki magang aktif');
                return;
            }

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            if (result.success) {
                // Reset form
                setFormData({
                    tanggal: new Date().toISOString().split('T')[0],
                    kegiatan: '',
                    kendala: '',
                    file: null
                });
                setPreviewUrl(null);

                // Close modal
                onOpenChange(false);

                // Callback success
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setError(result.message || 'Gagal menambahkan logbook');
            }
        } catch (err) {
            console.error('Error adding logbook:', err);
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            tanggal: new Date().toISOString().split('T')[0],
            kegiatan: '',
            kendala: '',
            file: null
        });
        setPreviewUrl(null);
        setError(null);
        setFieldErrors({});
        onOpenChange(false);
    };

    // Cleanup preview URL
    const cleanupPreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-white border-0 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5 text-[#0097BB]" />
                        Tambah Logbook Harian
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && !Object.keys(fieldErrors).length && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Tanggal */}
                        <div className="space-y-2">
                            <Label htmlFor="tanggal" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                Tanggal Kegiatan
                            </Label>
                            <Input
                                id="tanggal"
                                name="tanggal"
                                type="date"
                                value={formData.tanggal}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="bg-white"
                                max={new Date().toISOString().split('T')[0]} // Tidak boleh lebih dari hari ini
                            />
                            {fieldErrors.tanggal && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {fieldErrors.tanggal}
                                </p>
                            )}
                        </div>

                        {/* Kegiatan */}
                        <div className="space-y-2">
                            <Label htmlFor="kegiatan" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText className="h-4 w-4 text-gray-500" />
                                Kegiatan Hari Ini
                            </Label>
                            <Textarea
                                id="kegiatan"
                                name="kegiatan"
                                value={formData.kegiatan}
                                onChange={handleChange}
                                placeholder="Deskripsikan kegiatan yang dilakukan hari ini (minimal 10 karakter)"
                                rows={4}
                                required
                                disabled={loading}
                                className="resize-none bg-white"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Minimal 10 karakter</span>
                                <span>{formData.kegiatan.length}/10</span>
                            </div>
                            {fieldErrors.kegiatan && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {fieldErrors.kegiatan}
                                </p>
                            )}
                        </div>

                        {/* Kendala */}
                        <div className="space-y-2">
                            <Label htmlFor="kendala" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <AlertCircle className="h-4 w-4 text-gray-500" />
                                Kendala yang Dihadapi
                            </Label>
                            <Textarea
                                id="kendala"
                                name="kendala"
                                value={formData.kendala}
                                onChange={handleChange}
                                placeholder="Deskripsikan kendala atau hambatan yang dihadapi (minimal 5 karakter)"
                                rows={3}
                                required
                                disabled={loading}
                                className="resize-none bg-white"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Minimal 5 karakter</span>
                                <span>{formData.kendala.length}/5</span>
                            </div>
                            {fieldErrors.kendala && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {fieldErrors.kendala}
                                </p>
                            )}
                        </div>

                        {/* Upload Foto */}
                        <div className="space-y-2">
                            <Label htmlFor="file" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Upload className="h-4 w-4 text-gray-500" />
                                Upload Foto Dokumentasi (Opsional)
                            </Label>
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                accept="image/jpeg, image/jpg, image/png"
                                onChange={handleFileChange}
                                disabled={loading}
                                className="bg-white"
                            />
                            <div className="text-xs text-gray-500">
                                Format: JPEG, JPG, PNG | Maksimal: 2MB
                            </div>
                            {fieldErrors.file && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {fieldErrors.file}
                                </p>
                            )}

                            {/* Preview Image */}
                            {previewUrl && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-600 mb-2">Preview:</p>
                                    <img 
                                        src={previewUrl} 
                                        alt="Preview" 
                                        className="max-w-full h-32 object-cover rounded-lg border"
                                        onLoad={cleanupPreview}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Informasi */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-700">
                                <strong>Catatan:</strong> Logbook akan diverifikasi oleh guru pembimbing dan pembimbing DUDI. Pastikan data yang diisi sesuai dengan kegiatan yang dilakukan.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                                disabled={loading}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-[#0097BB] hover:bg-[#007b9e]"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan Logbook'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
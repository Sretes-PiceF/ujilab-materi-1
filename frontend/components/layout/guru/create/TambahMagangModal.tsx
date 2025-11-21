"use client";

import { useState, useEffect } from "react";
import { Calendar, User, Building2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface TambahMagangModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface MagangFormData {
  siswa_id: string;
  dudi_id: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: 'pending' | 'diterima' | 'ditolak' | 'berlangsung' | 'selesai' | 'dibatalkan';
  nilai_akhir: string;
}

interface Siswa {
  id: number;
  nama: string;
  nis: string;
  kelas: string;
  jurusan: string;
  telepon: string;
  alamat: string;
  email: string;
}

interface Dudi {
  id: number;
  nama_perusahaan: string;
  alamat: string;
  telepon: string;
}

export function TambahMagangModal({
  open,
  onOpenChange,
  onSuccess,
}: TambahMagangModalProps) {
  const [formData, setFormData] = useState<MagangFormData>({
    siswa_id: "",
    dudi_id: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    status: "pending",
    nilai_akhir: "",
  });

  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([]);
  const [searchSiswa, setSearchSiswa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);

  // Fetch data saat modal dibuka
  useEffect(() => {
    if (open) {
      fetchSiswaList();
      fetchDudiAktif();
      resetForm();
    }
  }, [open]);

  // Filter siswa berdasarkan pencarian
  useEffect(() => {
    if (searchSiswa) {
      const filtered = siswaList.filter(siswa =>
        siswa.nama.toLowerCase().includes(searchSiswa.toLowerCase()) ||
        siswa.nis.includes(searchSiswa)
      );
      setFilteredSiswa(filtered);
    } else {
      setFilteredSiswa(siswaList);
    }
  }, [searchSiswa, siswaList]);

  const fetchSiswaList = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/guru/siswa/list`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSiswaList(result.data);
          setFilteredSiswa(result.data);
        }
      } else if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/";
      }
    } catch (err) {
      console.error('Error fetching siswa:', err);
    }
  };

  const fetchDudiAktif = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/guru/dudi/list`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDudiList(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching DUDI:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      siswa_id: "",
      dudi_id: "",
      tanggal_mulai: "",
      tanggal_selesai: "",
      status: "pending",
      nilai_akhir: "",
    });
    setSelectedSiswa(null);
    setSearchSiswa("");
    setError(null);
    setFieldErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError(null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Jika memilih siswa, simpan data siswa yang dipilih
    if (name === 'siswa_id') {
      const siswa = siswaList.find(s => s.id.toString() === value);
      setSelectedSiswa(siswa || null);
    }
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Validasi
    if (!formData.siswa_id || !formData.dudi_id || !formData.tanggal_mulai || !formData.tanggal_selesai) {
      setError("Data siswa, DUDI, dan periode magang wajib diisi!");
      setLoading(false);
      return;
    }

    if (new Date(formData.tanggal_selesai) <= new Date(formData.tanggal_mulai)) {
      setError("Tanggal selesai harus setelah tanggal mulai");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const requestData = {
        siswa_id: parseInt(formData.siswa_id),
        dudi_id: parseInt(formData.dudi_id),
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai,
        status: formData.status,
        nilai_akhir: formData.nilai_akhir ? parseFloat(formData.nilai_akhir) : null,
      };

      console.log('Data yang dikirim:', requestData);

      const response = await fetch(`${API_URL}/guru/magang/create`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/";
        return;
      }

      if (response.status === 422) {
        if (result.errors) {
          const errors: Record<string, string> = {};
          Object.keys(result.errors).forEach(key => {
            errors[key] = result.errors[key][0];
          });
          setFieldErrors(errors);
          setError("Terdapat kesalahan dalam pengisian form");
          return;
        }
      }

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        resetForm();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(result.message || "Gagal menambahkan magang");
      }
    } catch (err) {
      console.error('Error creating magang:', err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-[#0097BB]" />
            Tambah Data Magang
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && !Object.keys(fieldErrors).length && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* SECTION: PILIH SISWA */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
              Pilih Siswa
            </h3>
            
            {/* Search Siswa */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari siswa berdasarkan nama atau NIS..."
                  value={searchSiswa}
                  onChange={(e) => setSearchSiswa(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>

            {/* Select Siswa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pilih Siswa *</label>
              <Select
                value={formData.siswa_id}
                onValueChange={(value) => handleSelectChange("siswa_id", value)}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Pilih siswa..." />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-60">
                  {filteredSiswa.map((siswa) => (
                    <SelectItem
                      key={siswa.id}
                      value={siswa.id.toString()}
                      className="bg-white data-[highlighted]:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{siswa.nama}</span>
                        <span className="text-sm text-gray-500">
                          NIS: {siswa.nis} | {siswa.kelas} - {siswa.jurusan}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.siswa_id && (
                <p className="text-red-500 text-xs">{fieldErrors.siswa_id}</p>
              )}
            </div>

            {/* Info Siswa Terpilih */}
            {selectedSiswa && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Data Siswa Terpilih:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Nama:</span> {selectedSiswa.nama}</div>
                  <div><span className="font-medium">NIS:</span> {selectedSiswa.nis}</div>
                  <div><span className="font-medium">Kelas:</span> {selectedSiswa.kelas}</div>
                  <div><span className="font-medium">Jurusan:</span> {selectedSiswa.jurusan}</div>
                  <div><span className="font-medium">Telepon:</span> {selectedSiswa.telepon}</div>
                  <div><span className="font-medium">Email:</span> {selectedSiswa.email}</div>
                  <div className="col-span-2">
                    <span className="font-medium">Alamat:</span> {selectedSiswa.alamat}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: DATA MAGANG */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
              Data Magang
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Pilih DUDI */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Pilih DUDI *</label>
                <Select
                  value={formData.dudi_id}
                  onValueChange={(value) => handleSelectChange("dudi_id", value)}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Pilih DUDI..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-60">
                    {dudiList.map((dudi) => (
                      <SelectItem
                        key={dudi.id}
                        value={dudi.id.toString()}
                        className="bg-white data-[highlighted]:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{dudi.nama_perusahaan}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.dudi_id && (
                  <p className="text-red-500 text-xs">{fieldErrors.dudi_id}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status Magang</label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="diterima">Diterima</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                    <SelectItem value="berlangsung">Berlangsung</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                    <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.status && (
                  <p className="text-red-500 text-xs">{fieldErrors.status}</p>
                )}
              </div>

              {/* Tanggal Mulai */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Mulai *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    name="tanggal_mulai"
                    value={formData.tanggal_mulai}
                    onChange={handleChange}
                    className="pl-10 bg-white"
                  />
                </div>
                {fieldErrors.tanggal_mulai && (
                  <p className="text-red-500 text-xs">{fieldErrors.tanggal_mulai}</p>
                )}
              </div>

              {/* Tanggal Selesai */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Selesai *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    name="tanggal_selesai"
                    value={formData.tanggal_selesai}
                    onChange={handleChange}
                    className="pl-10 bg-white"
                  />
                </div>
                {fieldErrors.tanggal_selesai && (
                  <p className="text-red-500 text-xs">{fieldErrors.tanggal_selesai}</p>
                )}
              </div>

              {/* Nilai Akhir */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nilai Akhir</label>
                <Input
                  type="number"
                  name="nilai_akhir"
                  value={formData.nilai_akhir}
                  onChange={handleChange}
                  placeholder="0-100"
                  min="0"
                  max="100"
                  step="0.1"
                  className="bg-white"
                />
                {fieldErrors.nilai_akhir && (
                  <p className="text-red-500 text-xs">{fieldErrors.nilai_akhir}</p>
                )}
              </div>
            </div>
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
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 bg-[#0097BB] hover:bg-[#007b9e]"
            >
              {loading ? "Menyimpan..." : "Tambah Data Magang"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
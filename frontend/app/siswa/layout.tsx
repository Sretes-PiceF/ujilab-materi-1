// app/siswa/layout.tsx
import { AppSidebarSiswa } from "@/components/layout/siswa/App-sidebar";

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen">
            <AppSidebarSiswa />
            <div className="flex flex-col flex-1">
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}

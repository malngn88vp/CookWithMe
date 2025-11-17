import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar cố định bên trái */}
      <AdminSidebar />

      {/* Khu vực nội dung bên phải */}
      <div className="flex-1 flex flex-col">
        {/* Topbar cố định trên cùng */}
        <AdminTopbar />

        {/* Nội dung chính */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet /> {/* 👈 để Router render nội dung động */}
          </div>
        </main>
      </div>
    </div>
  );
};

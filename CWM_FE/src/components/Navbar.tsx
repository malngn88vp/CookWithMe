import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChefHat, Heart, User, LogOut, LayoutDashboard, Search, KeyRound } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  // 🔍 Khi nhấn Enter trong thanh tìm kiếm
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      navigate(`/recipes?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(''); // reset ô input
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <span className="hidden sm:inline">CookWithMe</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/recipes" className="text-sm font-medium transition-colors hover:text-primary">
            Công thức
          </Link>
          <Link to="/meal-plans" className="text-sm font-medium transition-colors hover:text-primary">
            Kế hoạch món ăn
          </Link>
        </div>

        {/* 🔍 Search Bar */}
        <div className="hidden flex-1 max-w-md lg:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm công thức..."
              className="h-9 w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
            />
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
                <Link to="/favorites">
                  <Heart className="mr-2 h-4 w-4" />
                  Yêu thích
                </Link>
              </Button>

              <Button variant="default" size="sm" asChild>
                <Link to="/recipes/new">Thêm công thức</Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">

                  {/* Hồ sơ */}
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Hồ sơ
                    </Link>
                  </DropdownMenuItem>

                  {/* ⭐ Đổi mật khẩu */}
                  <DropdownMenuItem asChild>
                    <Link to="/change-password">
                      <KeyRound className="mr-2 h-4 w-4" />
                      Đổi mật khẩu
                    </Link>
                  </DropdownMenuItem>

                  {/* Yêu thích (mobile) */}
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/favorites">
                      <Heart className="mr-2 h-4 w-4" />
                      Yêu thích
                    </Link>
                  </DropdownMenuItem>

                  {/* Admin */}
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Quản trị
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  {/* Logout */}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>

            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth/login">Đăng nhập</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth/register">Đăng ký</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import { Link } from 'react-router-dom';
import { ChefHat, Mail, Facebook, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2 text-xl font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <span>CookWithMe</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Chia sẻ và khám phá những công thức nấu ăn tuyệt vời từ cộng đồng
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold">Liên kết</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground transition-colors hover:text-primary">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/recipes" className="text-muted-foreground transition-colors hover:text-primary">
                  Công thức
                </Link>
              </li>
              <li>
                <Link to="/meal-plans" className="text-muted-foreground transition-colors hover:text-primary">
                  Kế hoạch món ăn
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="text-muted-foreground transition-colors hover:text-primary">
                  Yêu thích
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 font-semibold">Cộng đồng</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/recipes/new" className="text-muted-foreground transition-colors hover:text-primary">
                  Chia sẻ công thức
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-muted-foreground transition-colors hover:text-primary">
                  Hồ sơ của tôi
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold">Liên hệ</h3>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href="mailto:hello@cookwithme.com" className="transition-colors hover:text-primary">
                hello@cookwithme.com
              </a>
            </div>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-white"
                aria-label="Youtube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CookWithMe. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

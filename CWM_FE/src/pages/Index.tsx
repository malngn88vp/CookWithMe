import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { recipeAPI } from "@/services/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Search, Clock, Star, ChefHat, Calendar, ShoppingCart } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

import heroImage from "@/assets/hero-2.jpg";

/* Swiper */
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const Index = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await recipeAPI.getAll();
      setRecipes(response.data.recipes || []);
    } catch (error) {
      toast.error("Không thể tải công thức");
    } finally {
      setLoading(false);
    }
  };

  // Công thức nổi bật — top 8 recipe theo average_rating
  const featuredRecipes = [...recipes]
    .filter((r) => r.status === "Approved")
    .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 🔥 Hero Section */}
      <section className="relative h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        </div>

        <div className="relative z-10 flex h-full items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <h1 className="mb-4 text-5xl font-bold leading-tight text-white md:text-6xl">
                Khám phá hàng ngàn công thức nấu ăn
              </h1>

              <p className="mb-8 text-lg text-white/90">
                Chia sẻ và khám phá những công thức tuyệt vời từ cộng đồng đầu bếp
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild className="shadow-lg">
                  <Link to="/recipes">
                    <Search className="mr-2 h-5 w-5" />
                    Khám phá công thức
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-white bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <Link to="/recipes/new">
                    <ChefHat className="mr-2 h-5 w-5" />
                    Chia sẻ công thức
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ⭐ Công thức nổi bật + Carousel */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold">Công thức nổi bật</h2>
          <p className="text-muted-foreground">
            Những món ăn được yêu thích nhất từ cộng đồng
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 animate-pulse bg-muted" />
                <CardContent className="p-4">
                  <div className="h-6 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredRecipes.length > 0 ? (
          <>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 4 },
              }}
            >
              {featuredRecipes.map((recipe) => (
                <SwiperSlide key={recipe.recipe_id}>
                  <Link to={`/recipes/${recipe.recipe_id}`}>
                    <Card className="group overflow-hidden transition-all hover:shadow-lg">
                      <div className="relative h-48 overflow-hidden bg-muted">
                        {recipe.images ? (
                          <img
                            src={recipe.images}
                            alt={recipe.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ChefHat className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <h3 className="mb-2 line-clamp-2 font-semibold">
                          {recipe.title}
                        </h3>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {recipe.cooking_time
                                ? `${recipe.cooking_time} phút`
                                : "Không rõ"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="font-medium">
                              {recipe.average_rating != null
                                ? Number(recipe.average_rating).toFixed(1)
                                : "Chưa có"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="mt-8 text-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/recipes">Xem tất cả công thức</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-lg border-2 border-dashed py-16 text-center">
            <ChefHat className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">
              Chưa có công thức nổi bật
            </h3>
            <p className="mb-4 text-muted-foreground">Hãy là người đầu tiên chia sẻ!</p>
            <Button asChild>
              <Link to="/recipes/new">Tạo công thức đầu tiên</Link>
            </Button>
          </div>
        )}
      </section>

      {/* ✨ Tính năng nổi bật */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-bold">Tính năng nổi bật</h2>
          <p className="text-muted-foreground">
            Những công cụ hữu ích để quản lý việc nấu ăn của bạn
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="group overflow-hidden transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Kế hoạch món ăn</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Lập kế hoạch bữa ăn cho cả tuần một cách thông minh và tiện lợi
              </p>

              <Button asChild>
                <Link to="/meal-plans">Lập kế hoạch ngay</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-accent">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Danh sách mua sắm</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Tự động tạo danh sách mua sắm từ kế hoạch món ăn của bạn
              </p>

              <Button variant="secondary" asChild>
                <Link to="/meal-plans">Xem danh sách</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

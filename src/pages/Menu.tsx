
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import MenuCategory from "@/components/MenuCategory";
import SearchBar from "@/components/SearchBar";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import MenuItem from "@/components/MenuItem";
import { trackUserInteraction } from "@/utils/analytics";
import { useCart } from "@/context/CartContext";
import { useMenuCategories, useMenuSearch } from "@/hooks/useMenu";
import { MenuCategoryWithItems } from "@/models/types";
import { MenuCategory as FrontendMenuCategory } from "@/data/menuData";

const Menu = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [showCartTooltip, setShowCartTooltip] = useState(false);
  const { itemCount } = useCart();
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Fetch menu categories from database
  const { categories, loading: categoriesLoading, error: categoriesError } = useMenuCategories();
  const { items: searchItems, loading: searchLoading } = useMenuSearch(currentQuery);

  // Set initial active category once categories are loaded
  useEffect(() => {
    if (categories.length > 0 && activeCategory === "") {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // Track page view
    trackUserInteraction('page_view', { page: 'menu' });

    return () => clearTimeout(timer);
  }, []);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handle search results
  const handleSearchResults = (results: any) => {
    // Store the current search query from the title
    const queryMatch = results.title.match(/Search Results for "(.+?)"|(.+)/);
    if (queryMatch) {
      // Get the matched group that contains our query
      const extractedQuery = queryMatch[1] || queryMatch[2] || "";
      setCurrentQuery(extractedQuery);
    }
    
    setSearchResults(results);
    
    // Track search results
    trackUserInteraction('search_results', { 
      title: results.title,
      count: results.items.length
    });
  };

  // Clear search results
  const clearSearchResults = () => {
    setSearchResults(null);
    setCurrentQuery('');
    
    // Track clearing search
    trackUserInteraction('clear_search', {});
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    
    // Track category selection
    trackUserInteraction('category_select', { category: categoryId });
  };

  // Handle logo click
  const handleLogoClick = () => {
    navigate("/about");
    trackUserInteraction('navigate_to_about', { from: 'menu' });
  };

  // Convert database category to frontend format
  const convertCategoryToFrontendFormat = (dbCategory: MenuCategoryWithItems): FrontendMenuCategory => {
    return {
      id: dbCategory.slug,
      name: dbCategory.name,
      description: dbCategory.description || undefined,
      image: dbCategory.image_url,
      items: dbCategory.items.map(item => ({
        id: item.slug,
        name: item.name,
        description: item.description || "",
        price: Number(item.price),
        image: item.image_url,
        popular: item.is_popular,
        spicy: item.is_spicy,
        vegetarian: item.is_vegetarian,
        glutenFree: item.is_gluten_free,
        protein: item.protein ? Number(item.protein) : undefined,
        calories: item.calories,
        allergens: item.allergens?.map(a => a.name),
        sourcing: item.sourcing,
      }))
    };
  };

  // Get the current selected category
  const selectedCategory = categories.find(cat => cat.slug === activeCategory);
  const frontendSelectedCategory = selectedCategory ? convertCategoryToFrontendFormat(selectedCategory) : undefined;

  if (categoriesLoading && !isLoaded) {
    return (
      <Layout title="" showHeader={false}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CA3F3F]"></div>
        </div>
      </Layout>
    );
  }

  if (categoriesError) {
    return (
      <Layout title="" showHeader={false}>
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <div className="text-red-500 mb-4">Failed to load menu data</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#CA3F3F] text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="" showHeader={false}>
      <div className={`space-y-4 ${isLoaded ? "animate-fade-in" : "opacity-0"}`} style={{ backgroundColor: "#000000", color: "#FFFFFF", minHeight: "100vh" }}>
        {/* Header with cart button */}
        <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md py-3 px-4 flex justify-between items-center shadow-lg">
          <div className="w-10"></div> {/* Empty div for centering */}
          
          <button 
            onClick={handleLogoClick}
            className="flex items-center justify-center"
          >
            <img 
              src="/lovable-uploads/a8416d4e-080d-42c1-b165-a5aa2b783dee.png" 
              alt="Thai Cookery Logo" 
              className="h-11 w-11 rounded-full shadow-md"
            />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => navigate('/cart')}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors relative"
              aria-label="Shopping cart"
              onMouseEnter={() => setShowCartTooltip(true)}
              onMouseLeave={() => setShowCartTooltip(false)}
            >
              <div className={`absolute inset-0 rounded-full ${showCartTooltip ? 'border-2 border-[#CA3F3F] animate-pulse' : 'border-0'}`}></div>
              <ShoppingBag size={22} className="text-white" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#CA3F3F] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-fade-in">
                  {itemCount}
                </span>
              )}
            </button>
            
            {showCartTooltip && (
              <div className="absolute -bottom-8 right-0 bg-[#CA3F3F] text-white text-xs py-1 px-2 rounded whitespace-nowrap animate-fade-in">
                Your Cart
              </div>
            )}
          </div>
        </div>
        
        {/* Brand Title */}
        <h1 className="text-2xl font-bold text-center text-white animate-fade-in tracking-wider pt-2" style={{ animationDelay: "100ms" }}>Thai Cookery</h1>
        
        {/* Search Bar */}
        <div className="px-4 mb-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <SearchBar 
            onSearchResults={handleSearchResults} 
            onClear={clearSearchResults} 
            currentSearchQuery={currentQuery}
            isSearchActive={searchResults !== null}
          />
        </div>
        
        {/* Display Search Results or Normal Categories */}
        {searchResults ? (
          <div className="px-4 space-y-4 animate-fade-in">
            <div className="bg-[#CA3F3F] py-4 px-4 rounded-t-xl shadow-md backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white">{searchResults.title || "Search Results"}</h2>
            </div>
            <div className="space-y-4">
              {searchItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className="animate-fade-in" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <MenuItem item={item} />
                </div>
              ))}
              {searchItems.length === 0 && (
                <p className="text-center text-gray-400 py-4">No items found matching your search.</p>
              )}
              
              <button 
                onClick={clearSearchResults}
                className="w-full text-white bg-[#CA3F3F] py-3 rounded-lg font-medium hover:opacity-90 transition-colors shadow-md my-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Back to Menu
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Categories Scroll */}
            <div className="relative px-2 animate-fade-in" style={{ animationDelay: "300ms" }}>
              <button 
                onClick={() => scrollCategories('left')} 
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/80 rounded-full p-1.5 shadow-lg hover:bg-black/90 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              
              <div 
                ref={categoryScrollRef}
                className="flex overflow-x-auto py-2 hide-scrollbar snap-x snap-mandatory scroll-smooth px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((category, index) => (
                  <div 
                    key={category.id}
                    className={`flex-shrink-0 w-28 mx-1.5 snap-center cursor-pointer transition-all duration-300 ${
                      activeCategory === category.slug ? "scale-105" : "opacity-70 hover:opacity-100"
                    }`}
                    onClick={() => handleCategoryChange(category.slug)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`aspect-square rounded-lg overflow-hidden mb-2 border-2 shadow-md transform transition-all duration-300 ${
                      activeCategory === category.slug 
                        ? "border-[#CA3F3F] shadow-[0_0_10px_rgba(202,63,63,0.3)]" 
                        : "border-transparent hover:border-white/50"
                    }`}>
                      <div className="w-full h-full flex items-center justify-center bg-[#CA3F3F] text-white overflow-hidden">
                        {category.image_url ? (
                          <img 
                            src={category.image_url} 
                            alt={category.name} 
                            className={`w-full h-full object-cover transition-all duration-500 ${
                              activeCategory === category.slug ? "scale-110" : "scale-100"
                            }`} 
                          />
                        ) : (
                          <span className="text-lg font-medium">{category.name.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-center text-white font-medium truncate">{category.name}</p>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => scrollCategories('right')} 
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/80 rounded-full p-1.5 shadow-lg hover:bg-black/90 transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            </div>

            {/* Active Category Header */}
            {frontendSelectedCategory && (
              <div className="bg-[#CA3F3F] py-4 px-4 rounded-t-xl shadow-lg backdrop-blur-sm animate-fade-in" style={{ animationDelay: "400ms" }}>
                <h2 className="text-xl font-bold text-white tracking-wide">{frontendSelectedCategory.name}</h2>
                {frontendSelectedCategory.description && (
                  <p className="text-white/90 text-sm">{frontendSelectedCategory.description}</p>
                )}
              </div>
            )}

            {/* Menu Items for Selected Category */}
            {frontendSelectedCategory && (
              <div className="space-y-3 px-2 pb-10 animate-fade-in" style={{ animationDelay: "500ms" }}>
                <MenuCategory
                  key={frontendSelectedCategory.id}
                  category={frontendSelectedCategory}
                  expanded={true}
                  showViewAll={false}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Menu;

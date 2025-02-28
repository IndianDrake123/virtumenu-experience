
import React, { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle, Award, Zap, Clock, UserCheck, MessageCircle } from 'lucide-react';
import { menuCategories } from '@/data/menuData';
import { trackUserInteraction } from '@/utils/analytics';

interface SearchBarProps {
  onSearchResults: (results: any) => void;
  onClear: () => void;
  currentSearchQuery?: string;
  isSearchActive?: boolean;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'faq' | 'query';
  icon?: React.ReactNode;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearchResults, 
  onClear, 
  currentSearchQuery = '',
  isSearchActive = false
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const faqs: SearchSuggestion[] = [
    { id: 'popular', text: 'What is the most popular dish?', type: 'faq', icon: <Award size={16} className="text-amber-400" /> },
    { id: 'spicy', text: 'Show me spicy dishes', type: 'faq', icon: <Zap size={16} className="text-red-500" /> },
    { id: 'vegetarian', text: 'I am vegetarian', type: 'faq', icon: <UserCheck size={16} className="text-green-500" /> },
    { id: 'protein', text: 'Which dish has the highest protein?', type: 'faq', icon: <Award size={16} className="text-blue-500" /> },
    { id: 'gluten', text: 'Show gluten-free options', type: 'faq', icon: <AlertTriangle size={16} className="text-yellow-500" /> },
    { id: 'quick', text: 'Quick lunch options', type: 'faq', icon: <Clock size={16} className="text-cyan-500" /> },
  ];

  // Rotate through placeholder suggestions when not in search mode
  useEffect(() => {
    if (!isSearchActive && !isExpanded) {
      const interval = setInterval(() => {
        // Start fade out animation
        setIsAnimating(true);
        setPlaceholderVisible(false);
        
        // After fade out, change the text and fade in
        setTimeout(() => {
          setPlaceholderIndex(prev => (prev + 1) % faqs.length);
          setPlaceholderVisible(true);
          
          // Reset animation state after completing the transition
          setTimeout(() => {
            setIsAnimating(false);
          }, 300);
        }, 300);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isSearchActive, isExpanded, faqs.length]);

  // Close expanded search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (searchText: string = query) => {
    if (!searchText.trim()) return;

    // Track search interaction
    trackUserInteraction('search', { query: searchText });
    
    // Process search text
    const searchLower = searchText.toLowerCase();
    let results;

    if (searchLower.includes('popular') || searchLower.includes('best seller')) {
      results = handlePopularQuery();
    } else if (searchLower.includes('spicy') || searchLower.includes('spiciest')) {
      results = handleSpicyQuery();
    } else if (searchLower.includes('vegetarian') || searchLower.includes('vegan')) {
      results = handleVegetarianQuery();
    } else if (searchLower.includes('gluten')) {
      results = handleGlutenFreeQuery();
    } else if (searchLower.includes('protein') || searchLower.includes('highest protein')) {
      results = handleProteinQuery();
    } else if (searchLower.includes('quick') || searchLower.includes('fast') || searchLower.includes('lunch')) {
      results = handleQuickOptions();
    } else if (searchLower.includes('spanish') || searchLower === 'spanish') {
      handleSpanishQuery();
      return;
    } else {
      // General text search
      results = textSearch(searchLower);
    }

    // Pass results up to parent component
    onSearchResults(results);
    
    // Clear search field
    setQuery('');
    setIsExpanded(false);
  };

  const handleFaqClick = (faq: SearchSuggestion) => {
    // Track FAQ click
    trackUserInteraction('faq_click', { faq: faq.text });
    
    setQuery(faq.text);
    handleSearch(faq.text);
  };

  const handleProteinQuery = () => {
    // Sort all menu items by protein content
    const allItems = menuCategories.flatMap(category => category.items);
    const sortedByProtein = [...allItems]
      .filter(item => item.protein !== undefined)
      .sort((a, b) => (b.protein || 0) - (a.protein || 0))
      .slice(0, 5);

    return {
      title: "Highest Protein Dishes",
      items: sortedByProtein
    };
  };

  const handleSpicyQuery = () => {
    const spicyItems = menuCategories
      .flatMap(category => category.items)
      .filter(item => item.spicy);

    return {
      title: "Spicy Dishes",
      items: spicyItems
    };
  };

  const handleVegetarianQuery = () => {
    const vegItems = menuCategories
      .flatMap(category => category.items)
      .filter(item => item.vegetarian);

    return {
      title: "Vegetarian Options",
      items: vegItems
    };
  };

  const handleGlutenFreeQuery = () => {
    const gfItems = menuCategories
      .flatMap(category => category.items)
      .filter(item => item.glutenFree);

    return {
      title: "Gluten-Free Options",
      items: gfItems
    };
  };

  const handlePopularQuery = () => {
    const popularItems = menuCategories
      .flatMap(category => category.items)
      .filter(item => item.popular);

    return {
      title: "Most Popular Dishes",
      items: popularItems
    };
  };

  const handleQuickOptions = () => {
    // Filter for items that would be quick to prepare
    const quickItems = menuCategories
      .flatMap(category => category.items)
      .filter(item => {
        const categoryId = menuCategories.find(cat => 
          cat.items.some(i => i.id === item.id)
        )?.id;
        
        return categoryId === 'starters' || 
               categoryId === 'soups' || 
               item.name.toLowerCase().includes('fried rice');
      });

    return {
      title: "Quick Lunch Options",
      items: quickItems
    };
  };

  const handleSpanishQuery = () => {
    const translations = {
      "Starters": "Entrantes",
      "Soups": "Sopas",
      "Curries": "Curry",
      "Noodles": "Fideos",
      "Rice Dishes": "Platos de Arroz",
      "Signature Specials": "Especialidades",
      "Desserts": "Postres",
      "Drinks": "Bebidas"
    };

    const spanishResponse = "¡Aquí está nuestro menú en español!\n\n" + 
      Object.entries(translations).map(([eng, spa]) => `${eng} → ${spa}`).join('\n');

    // Return empty results to show the conversation
    return {
      title: "Spanish Menu",
      items: []
    };
  };

  const textSearch = (searchText: string) => {
    const allItems = menuCategories.flatMap(category => category.items);
    const matchedItems = allItems.filter(item => 
      item.name.toLowerCase().includes(searchText) || 
      item.description.toLowerCase().includes(searchText)
    );

    return {
      title: `Search Results for "${searchText}"`,
      items: matchedItems
    };
  };

  const clearSearch = () => {
    setQuery('');
    onClear();
  };

  return (
    <div ref={searchRef} className="relative animate-fade-in">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MessageCircle size={20} className="text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={isSearchActive ? currentSearchQuery : query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={
            isSearchActive 
              ? '' 
              : faqs[placeholderIndex]?.text
          }
          className="block w-full pl-10 pr-12 py-3.5 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CA3F3F] focus:border-transparent transition-all shadow-lg"
        />
        
        {/* Animated placeholder text that transitions between suggestions */}
        {!isSearchActive && !query && (
          <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none overflow-hidden">
            <span 
              className={`text-gray-400 transition-all duration-300 ease-in-out ${
                placeholderVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
              }`}
            >
              {faqs[placeholderIndex]?.text}
            </span>
          </div>
        )}
        
        {(query || isSearchActive) && (
          <button 
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Expanded Search with FAQs */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700/50 z-40 max-h-96 overflow-y-auto animate-fade-in">
          {/* FAQ suggestions */}
          <div className="px-4 py-2">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Suggested searches</h3>
            <div className="grid grid-cols-1 gap-2">
              {faqs.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => handleFaqClick(faq)}
                  className="text-left p-2.5 rounded-md hover:bg-gray-700 transition-colors text-gray-300 hover:text-white flex items-center"
                >
                  {faq.icon && <span className="mr-2">{faq.icon}</span>}
                  <span>{faq.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

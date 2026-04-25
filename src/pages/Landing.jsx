import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import './Landing.css';
import { ShoppingBag, MessageCircle, Menu, X } from 'lucide-react';

export default function Landing() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
      
      // Extract unique categories
      const uniqueCategories = ['All', ...new Set((data || []).map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    }
    setLoading(false);
  };

  const handleWhatsAppClick = (product) => {
    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '';
    if (!phoneNumber) {
      alert("Configurar el número de WhatsApp en .env.local");
      return;
    }
    
    // Default country code could be hardcoded in the env or added here
    const message = `¡Hola! Vengo de Lily's Store y estoy interesado/a en el producto: *${product.name}* (Precio: $${product.price}). ¿Me pueden dar más información?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="logo">
            <ShoppingBag className="icon" />
            <h1>Lily's Store</h1>
          </div>
          
          <div className="desktop-menu">
            <a href="/">Catálogo</a>
            <a href="/login" className="admin-link">Admin</a>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="mobile-menu">
            <a href="/">Catálogo</a>
            <a href="/login">Ingreso Admin</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="container">
          <h2>Descubre nuestra colección</h2>
          <p>Encuentra tus favoritos y pide directo por WhatsApp</p>
        </div>
      </header>

      {/* Content */}
      <main className="container main-content">
        {/* Categories Bar */}
        <div className="categories-wrapper">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="loading-state">Cargando catálogo...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">No hay productos disponibles por ahora.</div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="product-image" loading="lazy" />
                  ) : (
                    <div className="product-image-placeholder">Sin imagen</div>
                  )}
                  {product.category && <span className="product-badge">{product.category}</span>}
                </div>
                
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-footer">
                    <span className="price">${product.price}</span>
                    <button 
                      onClick={() => handleWhatsAppClick(product)}
                      className="btn btn-primary ws-btn"
                    >
                      <MessageCircle size={18} /> Preguntar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Lily's Store. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
